const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../utils/prismaClient');

const JOB_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  jobType: true,
  workMode: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  status: true,
  vacancies: true,
  applicationDeadline: true,
  createdAt: true,
  company: {
    select: { id: true, name: true, slug: true, logo: true, verifiedByAdmin: true },
  },
  category: { select: { id: true, name: true, slug: true } },
  location: { select: { id: true, city: true, state: true, country: true } },
  requiredSkills: {
    select: { isRequired: true, skill: { select: { id: true, name: true } } },
  },
  _count: { select: { applications: true } },
};

/**
 * Attaches an `isSaved` boolean to each job for the current CLIENT user, if
 * any. No-op for anonymous visitors or non-CLIENT roles.
 */
async function annotateSavedState(jobs, user) {
  if (!user || user.role !== 'CLIENT' || jobs.length === 0) {
    return jobs.map((job) => ({ ...job, isSaved: false }));
  }

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return jobs.map((job) => ({ ...job, isSaved: false }));

  const saved = await prisma.savedJob.findMany({
    where: { profileId: profile.id, jobId: { in: jobs.map((j) => j.id) } },
    select: { jobId: true },
  });
  const savedIds = new Set(saved.map((s) => s.jobId));

  return jobs.map((job) => ({ ...job, isSaved: savedIds.has(job.id) }));
}

/**
 * Builds the sort order for job search results based on the requested key.
 */
function buildOrderBy(sortBy) {
  switch (sortBy) {
    case 'salary_high':
      return [{ salaryMax: 'desc' }, { createdAt: 'desc' }];
    case 'salary_low':
      return [{ salaryMin: 'asc' }, { createdAt: 'desc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }];
  }
}

// ============================================================================
// GET /api/client/jobs  (public — optionalAuth)
// ============================================================================
const searchJobs = asyncHandler(async (req, res) => {
  const {
    keyword,
    categoryId,
    locationId,
    jobType,
    workMode,
    experienceLevel,
    salaryMin,
    skillIds,
    sortBy,
    page,
    limit,
  } = req.query;

  const where = {
    status: 'OPEN',
    company: { verifiedByAdmin: true },
  };

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } },
      { company: { name: { contains: keyword } } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (locationId) where.locationId = locationId;
  if (jobType) where.jobType = jobType;
  if (workMode) where.workMode = workMode;
  if (experienceLevel) where.experienceLevel = experienceLevel;
  if (salaryMin) where.salaryMax = { gte: salaryMin };
  if (skillIds && skillIds.length > 0) {
    where.requiredSkills = { some: { skillId: { in: skillIds } } };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: JOB_CARD_SELECT,
      orderBy: buildOrderBy(sortBy),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  const annotated = await annotateSavedState(jobs, req.user);

  return new ApiResponse(
    200,
    {
      jobs: annotated,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
    'Jobs retrieved successfully.'
  ).send(res);
});

// ============================================================================
// GET /api/client/jobs/:slug  (public — optionalAuth)
// ============================================================================
const getJobBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const job = await prisma.job.findUnique({
    where: { slug },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          website: true,
          description: true,
          industry: true,
          size: true,
          verifiedByAdmin: true,
          headquarters: { select: { city: true, state: true, country: true } },
          recruiter: { select: { userId: true } },
        },
      },
      category: true,
      location: true,
      requiredSkills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) {
    throw ApiError.notFound('Job posting not found.');
  }

  const isOwnerOrAdmin =
    req.user &&
    (req.user.role === 'ADMIN' ||
      (req.user.role === 'RECRUITER' && job.company.recruiter.userId === req.user.id));

  if (job.status !== 'OPEN' && !isOwnerOrAdmin) {
    throw ApiError.notFound('Job posting not found.');
  }

  if (job.status === 'OPEN' && !isOwnerOrAdmin) {
    await prisma.job.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } });
  }

  const [annotated] = await annotateSavedState([job], req.user);

  return new ApiResponse(200, { job: annotated }, 'Job details retrieved.').send(res);
});

module.exports = { searchJobs, getJobBySlug };
