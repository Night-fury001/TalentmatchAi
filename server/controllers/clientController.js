const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../utils/prismaClient');
const { deleteFileIfExists, extractResumeText } = require('../utils/fileUtils');
const { logActivity } = require('../utils/activityLogger');
const { calculateProfileCompleteness } = require('../utils/profileCompleteness');
const aiAnalysisService = require('../utils/aiAnalysisService');

const PROFILE_INCLUDE = {
  location: true,
  skills: { include: { skill: true }, orderBy: { createdAt: 'asc' } },
  educations: { orderBy: { startDate: 'desc' } },
  experiences: { orderBy: { startDate: 'desc' } },
  projects: { orderBy: { createdAt: 'desc' } },
  certifications: { orderBy: { issueDate: 'desc' } },
};

/**
 * Loads the JobSeekerProfile owned by the current user, or throws 404.
 * Every CLIENT-role user has exactly one profile created at registration,
 * so a miss here indicates a data integrity problem worth surfacing loudly.
 */
async function getOwnProfileOrThrow(userId, include = undefined) {
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    include,
  });
  if (!profile) {
    throw ApiError.notFound('Job seeker profile not found for this account.');
  }
  return profile;
}

/**
 * Ensures a sub-entity (education/experience/project/certification/skill)
 * both exists AND belongs to the given profile before it can be mutated.
 */
async function assertOwnedEntity(model, id, profileId, label) {
  const entity = await model.findUnique({ where: { id } });
  if (!entity || entity.profileId !== profileId) {
    throw ApiError.notFound(`${label} not found.`);
  }
  return entity;
}

// ============================================================================
// PROFILE
// ============================================================================

// GET /api/client/profile
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id, PROFILE_INCLUDE);
  return new ApiResponse(200, { profile }, 'Profile retrieved successfully.').send(res);
});

// PUT /api/client/profile
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  if (req.body.locationId) {
    const location = await prisma.location.findUnique({ where: { id: req.body.locationId } });
    if (!location) {
      throw ApiError.badRequest('Selected location does not exist.');
    }
  }

  const updated = await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: req.body,
    include: PROFILE_INCLUDE,
  });

  return new ApiResponse(200, { profile: updated }, 'Profile updated successfully.').send(res);
});

// ============================================================================
// RESUME UPLOAD
// ============================================================================

// POST /api/client/profile/resume  (multipart: field "resume")
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No resume file was uploaded. Attach a PDF or DOCX file.');
  }

  const profile = await getOwnProfileOrThrow(req.user.id);
  const relativeUrl = `/uploads/resumes/${req.file.filename}`;
  const absolutePath = path.join(__dirname, '..', 'uploads', 'resumes', req.file.filename);

  const resumeText = await extractResumeText(absolutePath, req.file.mimetype);

  // Clean up the previous resume file, if any, after the new one is safely stored.
  if (profile.resumeUrl) {
    await deleteFileIfExists(profile.resumeUrl);
  }

  const updated = await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { resumeUrl: relativeUrl, resumeText },
  });

  return new ApiResponse(
    200,
    { resumeUrl: updated.resumeUrl, textExtracted: Boolean(resumeText) },
    'Resume uploaded successfully.'
  ).send(res);
});

// DELETE /api/client/profile/resume
const deleteResume = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  if (!profile.resumeUrl) {
    throw ApiError.badRequest('No resume is currently on file.');
  }

  await deleteFileIfExists(profile.resumeUrl);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { resumeUrl: null, resumeText: null },
  });

  return new ApiResponse(200, null, 'Resume removed.').send(res);
});

// ============================================================================
// AVATAR UPLOAD
// ============================================================================

// POST /api/client/profile/avatar  (multipart: field "avatar")
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file was uploaded. Attach a JPG, PNG, or WEBP file.');
  }

  const profile = await getOwnProfileOrThrow(req.user.id);
  const relativeUrl = `/uploads/profiles/${req.file.filename}`;

  if (profile.avatarUrl) {
    await deleteFileIfExists(profile.avatarUrl);
  }

  const updated = await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { avatarUrl: relativeUrl },
  });

  return new ApiResponse(200, { avatarUrl: updated.avatarUrl }, 'Profile photo updated.').send(res);
});

// DELETE /api/client/profile/avatar
const deleteAvatar = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  if (!profile.avatarUrl) {
    throw ApiError.badRequest('No profile photo is currently on file.');
  }

  await deleteFileIfExists(profile.avatarUrl);
  await prisma.jobSeekerProfile.update({
    where: { id: profile.id },
    data: { avatarUrl: null },
  });

  return new ApiResponse(200, null, 'Profile photo removed.').send(res);
});

// ============================================================================
// EDUCATION
// ============================================================================

const addEducation = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const education = await prisma.education.create({
    data: { ...req.body, profileId: profile.id },
  });
  return new ApiResponse(201, { education }, 'Education added.').send(res);
});

const updateEducation = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.education, req.params.id, profile.id, 'Education entry');

  const education = await prisma.education.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return new ApiResponse(200, { education }, 'Education updated.').send(res);
});

const deleteEducation = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.education, req.params.id, profile.id, 'Education entry');

  await prisma.education.delete({ where: { id: req.params.id } });
  return new ApiResponse(200, null, 'Education removed.').send(res);
});

// ============================================================================
// EXPERIENCE
// ============================================================================

const addExperience = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const experience = await prisma.experience.create({
    data: { ...req.body, profileId: profile.id },
  });
  return new ApiResponse(201, { experience }, 'Experience added.').send(res);
});

const updateExperience = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.experience, req.params.id, profile.id, 'Experience entry');

  const experience = await prisma.experience.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return new ApiResponse(200, { experience }, 'Experience updated.').send(res);
});

const deleteExperience = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.experience, req.params.id, profile.id, 'Experience entry');

  await prisma.experience.delete({ where: { id: req.params.id } });
  return new ApiResponse(200, null, 'Experience removed.').send(res);
});

// ============================================================================
// PROJECTS
// ============================================================================

const addProject = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const project = await prisma.project.create({
    data: { ...req.body, profileId: profile.id },
  });
  return new ApiResponse(201, { project }, 'Project added.').send(res);
});

const updateProject = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.project, req.params.id, profile.id, 'Project');

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return new ApiResponse(200, { project }, 'Project updated.').send(res);
});

const deleteProject = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.project, req.params.id, profile.id, 'Project');

  await prisma.project.delete({ where: { id: req.params.id } });
  return new ApiResponse(200, null, 'Project removed.').send(res);
});

// ============================================================================
// CERTIFICATIONS
// ============================================================================

const addCertification = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const certification = await prisma.certification.create({
    data: { ...req.body, profileId: profile.id },
  });
  return new ApiResponse(201, { certification }, 'Certification added.').send(res);
});

const updateCertification = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.certification, req.params.id, profile.id, 'Certification');

  const certification = await prisma.certification.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return new ApiResponse(200, { certification }, 'Certification updated.').send(res);
});

const deleteCertification = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.certification, req.params.id, profile.id, 'Certification');

  await prisma.certification.delete({ where: { id: req.params.id } });
  return new ApiResponse(200, null, 'Certification removed.').send(res);
});

// ============================================================================
// SKILLS
// ============================================================================

const addSkill = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const { skillId, level, yearsUsed } = req.body;

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill || !skill.isActive) {
    throw ApiError.badRequest('Selected skill does not exist.');
  }

  const existing = await prisma.userSkill.findUnique({
    where: { profileId_skillId: { profileId: profile.id, skillId } },
  });
  if (existing) {
    throw ApiError.conflict('This skill is already on your profile.');
  }

  const userSkill = await prisma.userSkill.create({
    data: { profileId: profile.id, skillId, level, yearsUsed },
    include: { skill: true },
  });

  return new ApiResponse(201, { skill: userSkill }, 'Skill added to your profile.').send(res);
});

const updateSkill = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.userSkill, req.params.id, profile.id, 'Skill');

  const userSkill = await prisma.userSkill.update({
    where: { id: req.params.id },
    data: req.body,
    include: { skill: true },
  });

  return new ApiResponse(200, { skill: userSkill }, 'Skill updated.').send(res);
});

const removeSkill = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  await assertOwnedEntity(prisma.userSkill, req.params.id, profile.id, 'Skill');

  await prisma.userSkill.delete({ where: { id: req.params.id } });
  return new ApiResponse(200, null, 'Skill removed from your profile.').send(res);
});

// Note: category/location/skill catalog lookups for profile-builder and job
// search dropdowns are served by the shared public /api/taxonomy/* endpoints
// (see routes/taxonomy.routes.js) rather than duplicated here — one source of
// truth for both anonymous visitors and every authenticated role.

// ============================================================================
// APPLICATIONS
// ============================================================================

const APPLICATION_LIST_INCLUDE = {
  job: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      jobType: true,
      workMode: true,
      company: { select: { id: true, name: true, slug: true, logo: true } },
    },
  },
};

/**
 * Loads an application owned by the current job seeker's profile, or
 * throws 404. Mirrors the ownership pattern used for profile sub-entities.
 */
async function getOwnApplicationOrThrow(profileId, applicationId, include = undefined) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include,
  });
  if (!application || application.applicantId !== profileId) {
    throw ApiError.notFound('Application not found.');
  }
  return application;
}

// POST /api/client/jobs/:jobId/apply
const applyToJob = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  if (!profile.resumeUrl) {
    throw ApiError.badRequest('Please upload a resume before applying to jobs.');
  }

  const job = await prisma.job.findUnique({
    where: { id: req.params.jobId },
    include: { company: { include: { recruiter: true } } },
  });

  if (!job || job.status !== 'OPEN' || !job.company.verifiedByAdmin) {
    throw ApiError.notFound('Job posting not found or no longer accepting applications.');
  }

  if (job.applicationDeadline && job.applicationDeadline.getTime() < Date.now()) {
    throw ApiError.badRequest('The application deadline for this job has passed.');
  }

  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId: job.id, applicantId: profile.id } },
  });
  if (existing) {
    throw ApiError.conflict('You have already applied to this job.');
  }

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      applicantId: profile.id,
      resumeUrl: profile.resumeUrl,
      coverLetter: req.body.coverLetter,
    },
    include: APPLICATION_LIST_INCLUDE,
  });

  // Best-effort AI scoring — a slow/unavailable model must never block
  // submission, but when it succeeds the recruiter's pipeline is
  // immediately AI-ranked without a separate step.
  try {
    const analysis = await aiAnalysisService.getOrComputeAnalysis({
      jobId: job.id,
      profileId: profile.id,
      applicationId: application.id,
    });
    application.matchScore = analysis.matchScore;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[applyToJob] AI analysis failed:', err.message);
  }

  await prisma.notification.create({
    data: {
      userId: job.company.recruiter.userId,
      type: 'APPLICATION_STATUS',
      title: 'New application received',
      message: `${profile.fullName} applied for "${job.title}".`,
      link: `/recruiter/jobs/${job.id}/applications`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'APPLICATION_SUBMITTED',
    entityType: 'Application',
    entityId: application.id,
    description: `${req.user.email} applied to "${job.title}".`,
    req,
  });

  return new ApiResponse(201, { application }, 'Application submitted successfully.').send(res);
});

// GET /api/client/applications
const getMyApplications = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const { status, page, limit } = req.query;

  const where = { applicantId: profile.id };
  if (status) where.status = status;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: APPLICATION_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return new ApiResponse(
    200,
    {
      applications,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
    'Applications retrieved.'
  ).send(res);
});

// GET /api/client/applications/:id
const getApplicationById = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const application = await getOwnApplicationOrThrow(profile.id, req.params.id, {
    ...APPLICATION_LIST_INCLUDE,
    interviews: { orderBy: { scheduledAt: 'asc' } },
  });
  return new ApiResponse(200, { application }, 'Application retrieved.').send(res);
});

// PATCH /api/client/applications/:id/withdraw
const withdrawApplication = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const application = await getOwnApplicationOrThrow(profile.id, req.params.id, {
    job: { select: { title: true, company: { select: { recruiter: { select: { userId: true } } } } } },
  });

  if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
    throw ApiError.badRequest('This application can no longer be withdrawn.');
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { status: 'WITHDRAWN' },
  });

  await prisma.notification.create({
    data: {
      userId: application.job.company.recruiter.userId,
      type: 'APPLICATION_STATUS',
      title: 'Candidate withdrew their application',
      message: `An applicant withdrew from "${application.job.title}".`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'APPLICATION_STATUS_CHANGED',
    entityType: 'Application',
    entityId: application.id,
    description: `${req.user.email} withdrew their application to "${application.job.title}".`,
    req,
  });

  return new ApiResponse(200, { application: updated }, 'Application withdrawn.').send(res);
});

// ============================================================================
// SAVED JOBS
// ============================================================================

// POST /api/client/jobs/:jobId/save
const saveJob = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job) {
    throw ApiError.notFound('Job posting not found.');
  }

  const existing = await prisma.savedJob.findUnique({
    where: { profileId_jobId: { profileId: profile.id, jobId: job.id } },
  });
  if (existing) {
    throw ApiError.conflict('This job is already saved.');
  }

  await prisma.savedJob.create({ data: { profileId: profile.id, jobId: job.id } });
  return new ApiResponse(201, null, 'Job saved.').send(res);
});

// DELETE /api/client/jobs/:jobId/save
const unsaveJob = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  const result = await prisma.savedJob.deleteMany({
    where: { profileId: profile.id, jobId: req.params.jobId },
  });

  if (result.count === 0) {
    throw ApiError.notFound('This job is not in your saved list.');
  }

  return new ApiResponse(200, null, 'Job removed from saved list.').send(res);
});

// GET /api/client/saved-jobs
const getSavedJobs = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const { page, limit } = req.query;

  const [savedJobs, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { profileId: profile.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            jobType: true,
            workMode: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            company: { select: { id: true, name: true, slug: true, logo: true } },
            category: { select: { name: true } },
            location: { select: { city: true, country: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.savedJob.count({ where: { profileId: profile.id } }),
  ]);

  return new ApiResponse(
    200,
    { savedJobs, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
    'Saved jobs retrieved.'
  ).send(res);
});

// ============================================================================
// DASHBOARD
// ============================================================================

// GET /api/client/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id, PROFILE_INCLUDE);

  const [statusCounts, savedJobsCount, recentApplications, unreadNotifications] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { applicantId: profile.id },
      _count: { status: true },
    }),
    prisma.savedJob.count({ where: { profileId: profile.id } }),
    prisma.application.findMany({
      where: { applicantId: profile.id },
      include: APPLICATION_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  const applicationsByStatus = statusCounts.reduce((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, {});
  const totalApplications = statusCounts.reduce((sum, row) => sum + row._count.status, 0);

  return new ApiResponse(
    200,
    {
      profileCompleteness: calculateProfileCompleteness(profile),
      totalApplications,
      applicationsByStatus,
      savedJobsCount,
      unreadNotifications,
      recentApplications,
    },
    'Dashboard data retrieved.'
  ).send(res);
});

// ============================================================================
// AI MATCHING
// ============================================================================

// GET /api/client/jobs/:jobId/match
const getJobMatch = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);

  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job) {
    throw ApiError.notFound('Job posting not found.');
  }

  const analysis = await aiAnalysisService.getOrComputeAnalysis({
    jobId: job.id,
    profileId: profile.id,
  });

  return new ApiResponse(200, { analysis }, 'Match analysis retrieved.').send(res);
});

// GET /api/client/recommendations
const getRecommendedJobs = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const { limit } = req.query;

  // Cap the scored pool — each unscored job costs up to two Hugging Face
  // calls, so this keeps worst-case latency and free-tier usage bounded.
  const POOL_SIZE = 15;

  const candidateJobs = await prisma.job.findMany({
    where: { status: 'OPEN', company: { verifiedByAdmin: true } },
    orderBy: { createdAt: 'desc' },
    take: POOL_SIZE,
    include: {
      company: { select: { id: true, name: true, logo: true, slug: true } },
      category: { select: { name: true } },
      location: { select: { city: true, country: true } },
    },
  });

  const scored = await Promise.all(
    candidateJobs.map(async (job) => {
      try {
        const analysis = await aiAnalysisService.getOrComputeAnalysis({ jobId: job.id, profileId: profile.id });
        return { job, matchScore: analysis.matchScore, skillGaps: analysis.skillGaps };
      } catch (err) {
        // A single job's scoring failure shouldn't drop it from the feed —
        // just rank it last rather than excluding it entirely.
        return { job, matchScore: 0, skillGaps: [] };
      }
    })
  );

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return new ApiResponse(200, { recommendations: scored.slice(0, limit) }, 'Recommended jobs retrieved.').send(
    res
  );
});

// GET /api/client/applications/:id/analysis
const getApplicationAnalysis = asyncHandler(async (req, res) => {
  const profile = await getOwnProfileOrThrow(req.user.id);
  const application = await getOwnApplicationOrThrow(profile.id, req.params.id);

  const analysis = await aiAnalysisService.getOrComputeAnalysis({
    jobId: application.jobId,
    profileId: profile.id,
    applicationId: application.id,
  });

  return new ApiResponse(200, { analysis }, 'Application analysis retrieved.').send(res);
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  deleteResume,
  uploadAvatar,
  deleteAvatar,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addProject,
  updateProject,
  deleteProject,
  addCertification,
  updateCertification,
  deleteCertification,
  addSkill,
  updateSkill,
  removeSkill,
  applyToJob,
  getMyApplications,
  getApplicationById,
  withdrawApplication,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getDashboard,
  getJobMatch,
  getRecommendedJobs,
  getApplicationAnalysis,
};
