const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../utils/prismaClient');
const { generateUniqueSlug } = require('../utils/slugify');
const { deleteFileIfExists } = require('../utils/fileUtils');
const { logActivity } = require('../utils/activityLogger');
const aiAnalysisService = require('../utils/aiAnalysisService');

const COMPANY_INCLUDE = {
  headquarters: true,
  _count: { select: { jobs: true } },
};

const JOB_DETAIL_INCLUDE = {
  company: { select: { id: true, name: true, slug: true, logo: true, verifiedByAdmin: true } },
  category: true,
  location: true,
  requiredSkills: { include: { skill: true } },
  _count: { select: { applications: true } },
};

/**
 * Resolves the RecruiterProfile owned by the current user, or throws 404.
 */
async function getRecruiterProfileOrThrow(userId) {
  const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw ApiError.notFound('Recruiter profile not found for this account.');
  }
  return profile;
}

/**
 * Loads a company and verifies it belongs to the given recruiter profile.
 */
async function getOwnedCompanyOrThrow(companyId, recruiterId) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.recruiterId !== recruiterId) {
    throw ApiError.notFound('Company not found.');
  }
  return company;
}

/**
 * Loads a job together with its owning company and verifies the company
 * belongs to the given recruiter profile.
 */
async function getOwnedJobOrThrow(jobId, recruiterId, include = undefined) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true, ...(include || {}) },
  });
  if (!job || job.company.recruiterId !== recruiterId) {
    throw ApiError.notFound('Job posting not found.');
  }
  return job;
}

// ============================================================================
// COMPANIES
// ============================================================================

// GET /api/recruiter/companies
const getMyCompanies = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const companies = await prisma.company.findMany({
    where: { recruiterId: recruiterProfile.id },
    include: COMPANY_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return new ApiResponse(200, { companies }, 'Companies retrieved.').send(res);
});

// GET /api/recruiter/companies/:id
const getCompanyById = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: COMPANY_INCLUDE,
  });
  if (!company || company.recruiterId !== recruiterProfile.id) {
    throw ApiError.notFound('Company not found.');
  }
  return new ApiResponse(200, { company }, 'Company retrieved.').send(res);
});

// POST /api/recruiter/companies
const createCompany = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);

  if (req.body.headquartersId) {
    const location = await prisma.location.findUnique({ where: { id: req.body.headquartersId } });
    if (!location) throw ApiError.badRequest('Selected headquarters location does not exist.');
  }

  const slug = await generateUniqueSlug(prisma.company, req.body.name);

  const company = await prisma.company.create({
    data: { ...req.body, slug, recruiterId: recruiterProfile.id },
    include: COMPANY_INCLUDE,
  });

  await logActivity({
    userId: req.user.id,
    action: 'COMPANY_CREATED',
    entityType: 'Company',
    entityId: company.id,
    description: `Company "${company.name}" created by ${req.user.email}. Pending admin verification.`,
    req,
  });

  return new ApiResponse(
    201,
    { company },
    'Company created. It will appear to job seekers once verified by our team.'
  ).send(res);
});

// PUT /api/recruiter/companies/:id
const updateCompany = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const company = await getOwnedCompanyOrThrow(req.params.id, recruiterProfile.id);

  if (req.body.headquartersId) {
    const location = await prisma.location.findUnique({ where: { id: req.body.headquartersId } });
    if (!location) throw ApiError.badRequest('Selected headquarters location does not exist.');
  }

  const data = { ...req.body };
  if (data.name && data.name !== company.name) {
    data.slug = await generateUniqueSlug(prisma.company, data.name, company.id);
    // Material profile changes should be re-reviewed before re-appearing publicly.
    data.verifiedByAdmin = false;
  }

  const updated = await prisma.company.update({
    where: { id: company.id },
    data,
    include: COMPANY_INCLUDE,
  });

  return new ApiResponse(200, { company: updated }, 'Company updated.').send(res);
});

// POST /api/recruiter/companies/:id/logo  (multipart: field "logo")
const uploadCompanyLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file was uploaded. Attach a JPG, PNG, or WEBP file.');
  }
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const company = await getOwnedCompanyOrThrow(req.params.id, recruiterProfile.id);

  const relativeUrl = `/uploads/profiles/${req.file.filename}`;
  if (company.logo) await deleteFileIfExists(company.logo);

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: { logo: relativeUrl },
  });

  return new ApiResponse(200, { logo: updated.logo }, 'Company logo updated.').send(res);
});

// ============================================================================
// JOBS
// ============================================================================

// GET /api/recruiter/jobs
const getMyJobs = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const { companyId, status, keyword, page, limit } = req.query;

  const where = { company: { recruiterId: recruiterProfile.id } };
  if (companyId) where.companyId = companyId;
  if (status) where.status = status;
  if (keyword) where.title = { contains: keyword };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: JOB_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return new ApiResponse(
    200,
    { jobs, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
    'Jobs retrieved.'
  ).send(res);
});

// GET /api/recruiter/jobs/:id
const getJobById = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const job = await getOwnedJobOrThrow(req.params.id, recruiterProfile.id, JOB_DETAIL_INCLUDE);
  return new ApiResponse(200, { job }, 'Job retrieved.').send(res);
});

// POST /api/recruiter/jobs
const createJob = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const { skillIds, ...jobData } = req.body;

  await getOwnedCompanyOrThrow(jobData.companyId, recruiterProfile.id);

  const [category, location] = await Promise.all([
    prisma.category.findUnique({ where: { id: jobData.categoryId } }),
    prisma.location.findUnique({ where: { id: jobData.locationId } }),
  ]);
  if (!category) throw ApiError.badRequest('Selected category does not exist.');
  if (!location) throw ApiError.badRequest('Selected location does not exist.');

  if (skillIds.length > 0) {
    const foundCount = await prisma.skill.count({ where: { id: { in: skillIds } } });
    if (foundCount !== skillIds.length) {
      throw ApiError.badRequest('One or more selected skills do not exist.');
    }
  }

  const slug = await generateUniqueSlug(prisma.job, `${jobData.title} ${Date.now()}`);

  const job = await prisma.job.create({
    data: {
      ...jobData,
      slug,
      requiredSkills: {
        create: skillIds.map((skillId) => ({ skillId, isRequired: true, weight: 1.0 })),
      },
    },
    include: JOB_DETAIL_INCLUDE,
  });

  await logActivity({
    userId: req.user.id,
    action: 'JOB_CREATED',
    entityType: 'Job',
    entityId: job.id,
    description: `Job "${job.title}" created by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(201, { job }, 'Job posting created.').send(res);
});

// PUT /api/recruiter/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const job = await getOwnedJobOrThrow(req.params.id, recruiterProfile.id);

  if (job.status === 'FLAG_REVIEW') {
    throw ApiError.forbidden('This job is under admin review and cannot be edited right now.');
  }

  const { skillIds, ...jobData } = req.body;

  if (jobData.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: jobData.categoryId } });
    if (!category) throw ApiError.badRequest('Selected category does not exist.');
  }
  if (jobData.locationId) {
    const location = await prisma.location.findUnique({ where: { id: jobData.locationId } });
    if (!location) throw ApiError.badRequest('Selected location does not exist.');
  }
  if (skillIds && skillIds.length > 0) {
    const foundCount = await prisma.skill.count({ where: { id: { in: skillIds } } });
    if (foundCount !== skillIds.length) {
      throw ApiError.badRequest('One or more selected skills do not exist.');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (skillIds) {
      await tx.jobSkill.deleteMany({ where: { jobId: job.id } });
      if (skillIds.length > 0) {
        await tx.jobSkill.createMany({
          data: skillIds.map((skillId) => ({ jobId: job.id, skillId, isRequired: true, weight: 1.0 })),
        });
      }
    }
    return tx.job.update({
      where: { id: job.id },
      data: jobData,
      include: JOB_DETAIL_INCLUDE,
    });
  });

  await logActivity({
    userId: req.user.id,
    action: 'JOB_UPDATED',
    entityType: 'Job',
    entityId: job.id,
    description: `Job "${job.title}" updated by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { job: updated }, 'Job posting updated.').send(res);
});

// PATCH /api/recruiter/jobs/:id/status
const updateJobStatus = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const job = await getOwnedJobOrThrow(req.params.id, recruiterProfile.id);
  const { status } = req.body;

  if (job.status === 'FLAG_REVIEW') {
    throw ApiError.forbidden('This job is under admin review. Its status cannot be changed until resolved.');
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status },
    include: JOB_DETAIL_INCLUDE,
  });

  await logActivity({
    userId: req.user.id,
    action: status === 'CLOSED' ? 'JOB_CLOSED' : 'JOB_UPDATED',
    entityType: 'Job',
    entityId: job.id,
    description: `Job "${job.title}" status changed to ${status} by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { job: updated }, `Job status updated to ${status}.`).send(res);
});

// DELETE /api/recruiter/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const job = await getOwnedJobOrThrow(req.params.id, recruiterProfile.id, {
    _count: { select: { applications: true } },
  });

  if (job._count.applications > 0) {
    throw ApiError.conflict(
      'This job has received applications and cannot be deleted. Close it instead to stop accepting new applicants.'
    );
  }

  await prisma.job.delete({ where: { id: job.id } });

  return new ApiResponse(200, null, 'Job posting deleted.').send(res);
});

// ============================================================================
// APPLICATIONS
// ============================================================================

const APPLICANT_SUMMARY_SELECT = {
  id: true,
  fullName: true,
  headline: true,
  avatarUrl: true,
  resumeUrl: true,
  yearsExperience: true,
  location: { select: { city: true, country: true } },
  skills: { select: { level: true, skill: { select: { id: true, name: true } } } },
};

/**
 * Loads an application together with its owning job/company and verifies
 * the company belongs to the given recruiter profile.
 */
async function getOwnedApplicationOrThrow(applicationId, recruiterId, include = undefined) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { include: { company: true } }, ...(include || {}) },
  });
  if (!application || application.job.company.recruiterId !== recruiterId) {
    throw ApiError.notFound('Application not found.');
  }
  return application;
}

function buildApplicationOrderBy(sortBy) {
  switch (sortBy) {
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'oldest':
      return [{ createdAt: 'asc' }];
    case 'match_score':
    default:
      return [{ matchScore: 'desc' }, { createdAt: 'desc' }];
  }
}

// GET /api/recruiter/jobs/:jobId/applications  (AI-ranked candidate pipeline)
const getJobApplications = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  await getOwnedJobOrThrow(req.params.jobId, recruiterProfile.id);

  const { status, sortBy, page, limit } = req.query;
  const where = { jobId: req.params.jobId };
  if (status) where.status = status;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { applicant: { select: APPLICANT_SUMMARY_SELECT } },
      orderBy: buildApplicationOrderBy(sortBy),
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

// GET /api/recruiter/applications  (across every owned company/job)
const getAllApplications = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const { companyId, jobId, status, page, limit } = req.query;

  const where = { job: { company: { recruiterId: recruiterProfile.id } } };
  if (companyId) where.job.company.id = companyId;
  if (jobId) where.jobId = jobId;
  if (status) where.status = status;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        applicant: { select: { id: true, fullName: true, avatarUrl: true } },
        job: { select: { id: true, title: true, company: { select: { id: true, name: true } } } },
      },
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

// GET /api/recruiter/applications/:id
const getApplicationDetail = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const application = await getOwnedApplicationOrThrow(req.params.id, recruiterProfile.id, {
    applicant: {
      include: {
        skills: { include: { skill: true } },
        educations: { orderBy: { startDate: 'desc' } },
        experiences: { orderBy: { startDate: 'desc' } },
        projects: { orderBy: { createdAt: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
      },
    },
    interviews: { orderBy: { scheduledAt: 'asc' } },
    aiAnalysis: true,
  });
  return new ApiResponse(200, { application }, 'Application retrieved.').send(res);
});

// PATCH /api/recruiter/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const application = await getOwnedApplicationOrThrow(req.params.id, recruiterProfile.id, {
    applicant: { select: { userId: true, fullName: true } },
  });

  if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
    throw ApiError.badRequest('This application has already reached a final status.');
  }

  const { status, recruiterNote } = req.body;
  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { status, recruiterNote },
  });

  const statusMessages = {
    SHORTLISTED: 'Your application has been shortlisted!',
    INTERVIEWING: 'You have moved to the interview stage.',
    OFFERED: 'Congratulations — you have received an offer!',
    ACCEPTED: 'Your offer has been confirmed. Welcome aboard!',
    REJECTED: 'This employer has decided not to move forward with your application.',
  };

  await prisma.notification.create({
    data: {
      userId: application.applicant.userId,
      type: 'APPLICATION_STATUS',
      title: `Application update: ${application.job.title}`,
      message: statusMessages[status] || `Your application status changed to ${status}.`,
      link: `/client/applications/${application.id}`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'APPLICATION_STATUS_CHANGED',
    entityType: 'Application',
    entityId: application.id,
    description: `Application for "${application.job.title}" moved to ${status} by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { application: updated }, `Application status updated to ${status}.`).send(res);
});

// ============================================================================
// INTERVIEWS
// ============================================================================

/**
 * Loads an interview together with its application/job/company chain and
 * verifies ownership by the given recruiter profile.
 */
async function getOwnedInterviewOrThrow(interviewId, recruiterId) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { job: { include: { company: true } }, applicant: true } } },
  });
  if (!interview || interview.application.job.company.recruiterId !== recruiterId) {
    throw ApiError.notFound('Interview not found.');
  }
  return interview;
}

// POST /api/recruiter/applications/:applicationId/interviews
const scheduleInterview = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const application = await getOwnedApplicationOrThrow(req.params.applicationId, recruiterProfile.id, {
    applicant: { select: { userId: true } },
  });

  if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
    throw ApiError.badRequest('Cannot schedule an interview for an application in its final status.');
  }

  const interview = await prisma.$transaction(async (tx) => {
    const created = await tx.interview.create({
      data: { applicationId: application.id, ...req.body },
    });

    // Advance the pipeline stage automatically when scheduling the first interview.
    if (['PENDING', 'SHORTLISTED'].includes(application.status)) {
      await tx.application.update({
        where: { id: application.id },
        data: { status: 'INTERVIEWING' },
      });
    }

    return created;
  });

  await prisma.notification.create({
    data: {
      userId: application.applicant.userId,
      type: 'INTERVIEW_SCHEDULED',
      title: `Interview scheduled: ${application.job.title}`,
      message: `An interview has been scheduled for ${new Date(interview.scheduledAt).toLocaleString()}.`,
      link: `/client/applications/${application.id}`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'INTERVIEW_SCHEDULED',
    entityType: 'Interview',
    entityId: interview.id,
    description: `Interview scheduled for application to "${application.job.title}" by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(201, { interview }, 'Interview scheduled.').send(res);
});

// GET /api/recruiter/applications/:applicationId/interviews
const getApplicationInterviews = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const application = await getOwnedApplicationOrThrow(req.params.applicationId, recruiterProfile.id);

  const interviews = await prisma.interview.findMany({
    where: { applicationId: application.id },
    orderBy: { scheduledAt: 'asc' },
  });

  return new ApiResponse(200, { interviews }, 'Interviews retrieved.').send(res);
});

// PUT /api/recruiter/interviews/:id
const updateInterview = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const interview = await getOwnedInterviewOrThrow(req.params.id, recruiterProfile.id);

  const updated = await prisma.interview.update({
    where: { id: interview.id },
    data: req.body,
  });

  await prisma.notification.create({
    data: {
      userId: interview.application.applicant.userId,
      type: 'INTERVIEW_SCHEDULED',
      title: 'Interview details updated',
      message: `Your interview details for "${interview.application.job.title}" have been updated.`,
    },
  });

  return new ApiResponse(200, { interview: updated }, 'Interview updated.').send(res);
});

// PATCH /api/recruiter/interviews/:id/status
const updateInterviewStatus = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const interview = await getOwnedInterviewOrThrow(req.params.id, recruiterProfile.id);

  const { status } = req.body;
  const updated = await prisma.interview.update({
    where: { id: interview.id },
    data: { status },
  });

  if (status === 'CANCELLED') {
    await prisma.notification.create({
      data: {
        userId: interview.application.applicant.userId,
        type: 'INTERVIEW_SCHEDULED',
        title: 'Interview cancelled',
        message: `Your interview for "${interview.application.job.title}" has been cancelled.`,
      },
    });
  }

  return new ApiResponse(200, { interview: updated }, `Interview status updated to ${status}.`).send(res);
});

// ============================================================================
// DASHBOARD
// ============================================================================

// GET /api/recruiter/dashboard
const getRecruiterDashboard = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);

  const companyWhere = { recruiterId: recruiterProfile.id };
  const jobWhere = { company: { recruiterId: recruiterProfile.id } };
  const applicationWhere = { job: { company: { recruiterId: recruiterProfile.id } } };

  const [
    totalCompanies,
    verifiedCompanies,
    jobStatusCounts,
    applicationStatusCounts,
    upcomingInterviews,
    recentApplications,
  ] = await Promise.all([
    prisma.company.count({ where: companyWhere }),
    prisma.company.count({ where: { ...companyWhere, verifiedByAdmin: true } }),
    prisma.job.groupBy({ by: ['status'], where: jobWhere, _count: { status: true } }),
    prisma.application.groupBy({ by: ['status'], where: applicationWhere, _count: { status: true } }),
    prisma.interview.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
        application: applicationWhere,
      },
      include: {
        application: {
          select: {
            id: true,
            applicant: { select: { fullName: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.application.findMany({
      where: applicationWhere,
      include: {
        applicant: { select: { fullName: true, avatarUrl: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const jobsByStatus = jobStatusCounts.reduce((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, {});
  const applicationsByStatus = applicationStatusCounts.reduce((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, {});
  const totalApplications = applicationStatusCounts.reduce((sum, row) => sum + row._count.status, 0);

  return new ApiResponse(
    200,
    {
      totalCompanies,
      verifiedCompanies,
      jobsByStatus,
      totalApplications,
      applicationsByStatus,
      upcomingInterviews,
      recentApplications,
    },
    'Dashboard data retrieved.'
  ).send(res);
});

// ============================================================================
// AI MATCHING
// ============================================================================

// GET /api/recruiter/applications/:id/analysis
const getApplicationAnalysis = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const application = await getOwnedApplicationOrThrow(req.params.id, recruiterProfile.id);

  const analysis = await aiAnalysisService.getOrComputeAnalysis({
    jobId: application.jobId,
    profileId: application.applicantId,
    applicationId: application.id,
  });

  return new ApiResponse(200, { analysis }, 'Application analysis retrieved.').send(res);
});

// POST /api/recruiter/applications/:id/analysis/refresh
const refreshApplicationAnalysis = asyncHandler(async (req, res) => {
  const recruiterProfile = await getRecruiterProfileOrThrow(req.user.id);
  const application = await getOwnedApplicationOrThrow(req.params.id, recruiterProfile.id);

  const analysis = await aiAnalysisService.getOrComputeAnalysis({
    jobId: application.jobId,
    profileId: application.applicantId,
    applicationId: application.id,
    forceRefresh: true,
  });

  await logActivity({
    userId: req.user.id,
    action: 'AI_ANALYSIS_RUN',
    entityType: 'Application',
    entityId: application.id,
    description: `AI analysis refreshed for an application by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { analysis }, 'Application analysis refreshed.').send(res);
});

module.exports = {
  getMyCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  uploadCompanyLogo,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  getJobApplications,
  getAllApplications,
  getApplicationDetail,
  updateApplicationStatus,
  scheduleInterview,
  getApplicationInterviews,
  updateInterview,
  updateInterviewStatus,
  getRecruiterDashboard,
  getApplicationAnalysis,
  refreshApplicationAnalysis,
};
