const { getEmbedding, isConfigured: hfConfigured, HF_MODEL } = require('./huggingfaceClient');
const { cosineSimilarity } = require('./vectorMath');
const { extractSkillsFromText } = require('./resumeParser');

const MAX_TEXT_CHARS = 3000;
const SEMANTIC_WEIGHT = 0.6;
const SKILL_WEIGHT = 0.4;
const MAX_GAPS_RETURNED = 10;
const MAX_STRENGTHS_RETURNED = 10;
const MAX_GAP_RECOMMENDATIONS = 5;

function buildCandidateText(profile) {
  const parts = [
    profile.headline,
    profile.bio,
    profile.resumeText,
    ...(profile.experiences || []).map((exp) => `${exp.title} at ${exp.company}. ${exp.description || ''}`),
    ...(profile.projects || []).map((proj) => `${proj.title}. ${proj.description || ''}`),
  ];
  return parts.filter(Boolean).join('\n').slice(0, MAX_TEXT_CHARS);
}

function buildJobText(job) {
  const parts = [job.title, job.description, job.requirements, job.responsibilities];
  return parts.filter(Boolean).join('\n').slice(0, MAX_TEXT_CHARS);
}

/**
 * Computes an AI-assisted match between a job seeker profile and a job.
 *
 * The final score blends two independent signals:
 *  1. Skill overlap (deterministic, always available) — the fraction of
 *     the job's required skills the candidate has declared on their
 *     profile.
 *  2. Semantic similarity (Hugging Face sentence embeddings) — cosine
 *     similarity between embeddings of the candidate's combined
 *     profile/resume text and the job's description/requirements text.
 *
 * If the Hugging Face API is unconfigured or the request fails for any
 * reason, the function degrades gracefully to skill-overlap-only scoring
 * rather than throwing — callers always get a usable score.
 *
 * @param {object} params
 * @param {object} params.profile - JobSeekerProfile with `skills` (incl.
 *   skill), `experiences`, `projects`, `resumeText`, `headline`, `bio`.
 * @param {object} params.job - Job with `requiredSkills` (incl. skill),
 *   `title`, `description`, `requirements`, `responsibilities`.
 */
async function computeJobMatch({ profile, job }) {
  const candidateSkillNames = (profile.skills || []).map((userSkill) => userSkill.skill.name);
  const candidateSkillNamesLower = candidateSkillNames.map((name) => name.toLowerCase());
  const jobSkillNames = (job.requiredSkills || []).map((jobSkill) => jobSkill.skill.name);

  const matchedSkills = jobSkillNames.filter((name) => candidateSkillNamesLower.includes(name.toLowerCase()));
  const skillGapNames = jobSkillNames.filter((name) => !candidateSkillNamesLower.includes(name.toLowerCase()));
  const skillScore = jobSkillNames.length > 0 ? matchedSkills.length / jobSkillNames.length : 1;

  // Evidence of gap skills mentioned in the resume text, even if not
  // formally added to the structured skills list — still useful context.
  const resumeEvidencedSkills = extractSkillsFromText(profile.resumeText, jobSkillNames);

  let semanticScore = null;
  let semanticError = null;

  if (hfConfigured) {
    try {
      const candidateText = buildCandidateText(profile);
      const jobText = buildJobText(job);
      const [candidateEmbedding, jobEmbedding] = await Promise.all([
        getEmbedding(candidateText || job.title),
        getEmbedding(jobText),
      ]);
      semanticScore = cosineSimilarity(candidateEmbedding, jobEmbedding);
    } catch (err) {
      semanticError = err.message;
    }
  }

  const finalScore =
    semanticScore !== null
      ? Math.round((SEMANTIC_WEIGHT * semanticScore + SKILL_WEIGHT * skillScore) * 100)
      : Math.round(skillScore * 100);

  const strengths = Array.from(new Set([...matchedSkills, ...resumeEvidencedSkills])).slice(
    0,
    MAX_STRENGTHS_RETURNED
  );

  const recommendations = [];
  skillGapNames.slice(0, MAX_GAP_RECOMMENDATIONS).forEach((skillName) => {
    recommendations.push(
      `Consider building or highlighting experience with ${skillName} — it's a required skill for this role.`
    );
  });
  if (!profile.resumeUrl) {
    recommendations.push(
      'Upload a resume so recruiters and our AI matching engine can evaluate your full background.'
    );
  }
  if (semanticScore === null) {
    recommendations.push(
      hfConfigured
        ? 'Full semantic analysis was temporarily unavailable — this score currently reflects skill-list overlap only.'
        : 'Semantic analysis is not configured on this server — this score currently reflects skill-list overlap only.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Your profile is well aligned with this role. Consider applying soon!');
  }

  return {
    matchScore: Math.max(0, Math.min(100, finalScore)),
    skillGaps: skillGapNames.slice(0, MAX_GAPS_RETURNED),
    strengths,
    recommendations,
    rawModelOutput: {
      semanticScore,
      skillScore,
      semanticAvailable: semanticScore !== null,
      semanticError,
      model: HF_MODEL,
    },
  };
}

module.exports = { computeJobMatch };
