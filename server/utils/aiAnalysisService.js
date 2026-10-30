const { prisma } = require('./prismaClient');
const { computeJobMatch } = require('./matchingEngine');

const FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24 hours

const JOB_INCLUDE = {
  requiredSkills: { include: { skill: true } },
};

const PROFILE_INCLUDE = {
  skills: { include: { skill: true } },
  experiences: true,
  projects: true,
};

/**
 * Converts a stored AIAnalysis row (with JSON-string columns) into a
 * plain object with real arrays, ready to serialize in an API response.
 */
function parseAnalysis(record) {
  return {
    id: record.id,
    matchScore: record.matchScore,
    skillGaps: JSON.parse(record.skillGaps),
    strengths: JSON.parse(record.strengths),
    recommendations: JSON.parse(record.recommendations),
    createdAt: record.createdAt,
  };
}

/**
 * Returns a cached AIAnalysis for the given job/profile pair (or
 * job/profile/application triple) if one exists within the freshness
 * window, otherwise computes a fresh match and persists it.
 *
 * When `applicationId` is provided the row is looked up/created via the
 * unique `applicationId` column (clean upsert), and the linked
 * Application.matchScore is kept in sync so recruiter pipeline sorting
 * always reflects the latest score. Without an `applicationId` (used for
 * job-detail "your match" previews and the recommendations feed), the
 * lookup is by jobId + profileId with applicationId null, since that
 * combination has no unique DB constraint.
 *
 * @param {object} params
 * @param {string} params.jobId
 * @param {string} params.profileId
 * @param {string|null} [params.applicationId]
 * @param {boolean} [params.forceRefresh]
 */
async function getOrComputeAnalysis({ jobId, profileId, applicationId = null, forceRefresh = false }) {
  const existing = applicationId
    ? await prisma.aIAnalysis.findUnique({ where: { applicationId } })
    : await prisma.aIAnalysis.findFirst({
        where: { jobId, profileId, applicationId: null },
        orderBy: { createdAt: 'desc' },
      });

  const isFresh = Boolean(existing) && Date.now() - new Date(existing.createdAt).getTime() < FRESHNESS_MS;
  if (existing && isFresh && !forceRefresh) {
    return parseAnalysis(existing);
  }

  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, include: JOB_INCLUDE }),
    prisma.jobSeekerProfile.findUnique({ where: { id: profileId }, include: PROFILE_INCLUDE }),
  ]);

  if (!job) throw new Error('Job not found for AI analysis.');
  if (!profile) throw new Error('Profile not found for AI analysis.');

  const result = await computeJobMatch({ profile, job });

  const data = {
    jobId,
    profileId,
    applicationId,
    matchScore: result.matchScore,
    skillGaps: JSON.stringify(result.skillGaps),
    strengths: JSON.stringify(result.strengths),
    recommendations: JSON.stringify(result.recommendations),
    rawModelOutput: JSON.stringify(result.rawModelOutput),
  };

  let saved;
  if (applicationId) {
    saved = await prisma.aIAnalysis.upsert({
      where: { applicationId },
      update: data,
      create: data,
    });
    await prisma.application.update({
      where: { id: applicationId },
      data: { matchScore: result.matchScore },
    });
  } else {
    if (existing) {
      await prisma.aIAnalysis.delete({ where: { id: existing.id } });
    }
    saved = await prisma.aIAnalysis.create({ data });
  }

  return parseAnalysis(saved);
}

module.exports = { getOrComputeAnalysis };
