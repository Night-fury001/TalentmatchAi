const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../utils/prismaClient');
const { generateUniqueSlug } = require('../utils/slugify');
const { logActivity } = require('../utils/activityLogger');

// ============================================================================
// TAXONOMY — CATEGORIES
// ============================================================================

const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { jobs: true } } },
    orderBy: { name: 'asc' },
  });
  return new ApiResponse(200, { categories }, 'Categories retrieved.').send(res);
});

const createCategory = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { name: req.body.name } });
  if (existing) throw ApiError.conflict('A category with this name already exists.');

  const slug = await generateUniqueSlug(prisma.category, req.body.name);
  const category = await prisma.category.create({ data: { ...req.body, slug } });

  await logActivity({
    userId: req.user.id,
    action: 'TAXONOMY_UPDATED',
    entityType: 'Category',
    entityId: category.id,
    description: `Category "${category.name}" created by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(201, { category }, 'Category created.').send(res);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw ApiError.notFound('Category not found.');

  const data = { ...req.body };
  if (data.name && data.name !== category.name) {
    const nameTaken = await prisma.category.findFirst({
      where: { name: data.name, NOT: { id: category.id } },
    });
    if (nameTaken) throw ApiError.conflict('A category with this name already exists.');
    data.slug = await generateUniqueSlug(prisma.category, data.name, category.id);
  }

  const updated = await prisma.category.update({ where: { id: category.id }, data });

  await logActivity({
    userId: req.user.id,
    action: 'TAXONOMY_UPDATED',
    entityType: 'Category',
    entityId: category.id,
    description: `Category "${category.name}" updated by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { category: updated }, 'Category updated.').send(res);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { jobs: true } } },
  });
  if (!category) throw ApiError.notFound('Category not found.');

  if (category._count.jobs > 0) {
    throw ApiError.conflict(
      `This category is used by ${category._count.jobs} job(s) and cannot be deleted. Deactivate it instead.`
    );
  }

  await prisma.category.delete({ where: { id: category.id } });
  return new ApiResponse(200, null, 'Category deleted.').send(res);
});

// ============================================================================
// TAXONOMY — LOCATIONS
// ============================================================================

const listLocations = asyncHandler(async (req, res) => {
  const locations = await prisma.location.findMany({
    include: { _count: { select: { jobs: true, companies: true } } },
    orderBy: [{ country: 'asc' }, { city: 'asc' }],
  });
  return new ApiResponse(200, { locations }, 'Locations retrieved.').send(res);
});

const createLocation = asyncHandler(async (req, res) => {
  const { city, state, country } = req.body;
  const existing = await prisma.location.findFirst({ where: { city, state: state || null, country } });
  if (existing) throw ApiError.conflict('This location already exists.');

  const location = await prisma.location.create({ data: { city, state, country } });

  await logActivity({
    userId: req.user.id,
    action: 'TAXONOMY_UPDATED',
    entityType: 'Location',
    entityId: location.id,
    description: `Location "${location.city}, ${location.country}" created by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(201, { location }, 'Location created.').send(res);
});

const updateLocation = asyncHandler(async (req, res) => {
  const location = await prisma.location.findUnique({ where: { id: req.params.id } });
  if (!location) throw ApiError.notFound('Location not found.');

  const updated = await prisma.location.update({ where: { id: location.id }, data: req.body });

  await logActivity({
    userId: req.user.id,
    action: 'TAXONOMY_UPDATED',
    entityType: 'Location',
    entityId: location.id,
    description: `Location "${location.city}, ${location.country}" updated by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { location: updated }, 'Location updated.').send(res);
});

const deleteLocation = asyncHandler(async (req, res) => {
  const location = await prisma.location.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { jobs: true, companies: true, jobSeekerProfiles: true } } },
  });
  if (!location) throw ApiError.notFound('Location not found.');

  const inUse =
    location._count.jobs > 0 || location._count.companies > 0 || location._count.jobSeekerProfiles > 0;
  if (inUse) {
    throw ApiError.conflict('This location is in use and cannot be deleted. Deactivate it instead.');
  }

  await prisma.location.delete({ where: { id: location.id } });
  return new ApiResponse(200, null, 'Location deleted.').send(res);
});

// ============================================================================
// TAXONOMY — SKILLS
// ============================================================================

const listSkills = asyncHandler(async (req, res) => {
  const skills = await prisma.skill.findMany({
    include: { _count: { select: { users: true, jobs: true } } },
    orderBy: { name: 'asc' },
  });
  return new ApiResponse(200, { skills }, 'Skills retrieved.').send(res);
});

const createSkill = asyncHandler(async (req, res) => {
  const existing = await prisma.skill.findUnique({ where: { name: req.body.name } });
  if (existing) throw ApiError.conflict('A skill with this name already exists.');

  const slug = await generateUniqueSlug(prisma.skill, req.body.name);
  const skill = await prisma.skill.create({ data: { ...req.body, slug } });

  await logActivity({
    userId: req.user.id,
    action: 'TAXONOMY_UPDATED',
    entityType: 'Skill',
    entityId: skill.id,
    description: `Skill "${skill.name}" created by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(201, { skill }, 'Skill created.').send(res);
});

const updateSkill = asyncHandler(async (req, res) => {
  const skill = await prisma.skill.findUnique({ where: { id: req.params.id } });
  if (!skill) throw ApiError.notFound('Skill not found.');

  const data = { ...req.body };
  if (data.name && data.name !== skill.name) {
    const nameTaken = await prisma.skill.findFirst({ where: { name: data.name, NOT: { id: skill.id } } });
    if (nameTaken) throw ApiError.conflict('A skill with this name already exists.');
    data.slug = await generateUniqueSlug(prisma.skill, data.name, skill.id);
  }

  const updated = await prisma.skill.update({ where: { id: skill.id }, data });

  await logActivity({
    userId: req.user.id,
    action: 'TAXONOMY_UPDATED',
    entityType: 'Skill',
    entityId: skill.id,
    description: `Skill "${skill.name}" updated by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { skill: updated }, 'Skill updated.').send(res);
});

const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await prisma.skill.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { users: true, jobs: true } } },
  });
  if (!skill) throw ApiError.notFound('Skill not found.');

  const inUse = skill._count.users > 0 || skill._count.jobs > 0;
  if (inUse) {
    throw ApiError.conflict('This skill is in use and cannot be deleted. Deactivate it instead.');
  }

  await prisma.skill.delete({ where: { id: skill.id } });
  return new ApiResponse(200, null, 'Skill deleted.').send(res);
});

// ============================================================================
// USER GOVERNANCE
// ============================================================================

const listUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search, page, limit } = req.query;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) where.email = { contains: search };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        jobSeekerProfile: { select: { fullName: true } },
        recruiterProfile: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return new ApiResponse(
    200,
    { users, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
    'Users retrieved.'
  ).send(res);
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!targetUser) throw ApiError.notFound('User not found.');

  if (targetUser.id === req.user.id) {
    throw ApiError.badRequest('You cannot change the active status of your own account.');
  }
  if (targetUser.role === 'ADMIN') {
    throw ApiError.forbidden('Admin accounts cannot be deactivated from this panel.');
  }

  const { isActive } = req.body;
  const updated = await prisma.user.update({
    where: { id: targetUser.id },
    data: { isActive, refreshTokenHash: isActive ? undefined : null },
  });

  await prisma.notification.create({
    data: {
      userId: targetUser.id,
      type: 'SYSTEM_ALERT',
      title: isActive ? 'Your account has been reactivated' : 'Your account has been deactivated',
      message: isActive
        ? 'An administrator has reactivated your account. You can now log in normally.'
        : 'An administrator has deactivated your account. Contact support if you believe this is a mistake.',
    },
  });

  await logActivity({
    userId: req.user.id,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: targetUser.id,
    description: `User ${targetUser.email} ${isActive ? 'activated' : 'deactivated'} by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(
    200,
    { user: { id: updated.id, isActive: updated.isActive } },
    `User ${isActive ? 'activated' : 'deactivated'}.`
  ).send(res);
});

const deleteUser = asyncHandler(async (req, res) => {
  const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!targetUser) throw ApiError.notFound('User not found.');

  if (targetUser.id === req.user.id) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }
  if (targetUser.role === 'ADMIN') {
    throw ApiError.forbidden('Admin accounts cannot be deleted from this panel.');
  }

  await prisma.user.delete({ where: { id: targetUser.id } });

  await logActivity({
    userId: req.user.id,
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: targetUser.id,
    description: `User ${targetUser.email} deleted by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, null, 'User deleted.').send(res);
});

// ============================================================================
// COMPANY VERIFICATION
// ============================================================================

const listCompanies = asyncHandler(async (req, res) => {
  const { verified, search, page, limit } = req.query;

  const where = {};
  if (verified !== undefined) where.verifiedByAdmin = verified;
  if (search) where.name = { contains: search };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        headquarters: true,
        recruiter: { select: { fullName: true, user: { select: { email: true } } } },
        _count: { select: { jobs: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return new ApiResponse(
    200,
    { companies, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
    'Companies retrieved.'
  ).send(res);
});

const verifyCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: { recruiter: true },
  });
  if (!company) throw ApiError.notFound('Company not found.');

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: { verifiedByAdmin: true, verificationNote: null },
  });

  await prisma.notification.create({
    data: {
      userId: company.recruiter.userId,
      type: 'COMPANY_VERIFIED',
      title: 'Company verified!',
      message: `"${company.name}" has been verified. Your open job postings are now visible to job seekers.`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'COMPANY_VERIFIED',
    entityType: 'Company',
    entityId: company.id,
    description: `Company "${company.name}" verified by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { company: updated }, 'Company verified.').send(res);
});

const rejectCompany = asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    include: { recruiter: true },
  });
  if (!company) throw ApiError.notFound('Company not found.');

  const { verificationNote } = req.body;
  const updated = await prisma.company.update({
    where: { id: company.id },
    data: { verifiedByAdmin: false, verificationNote },
  });

  await prisma.notification.create({
    data: {
      userId: company.recruiter.userId,
      type: 'SYSTEM_ALERT',
      title: 'Company verification declined',
      message: `"${company.name}" was not approved: ${verificationNote}`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'COMPANY_REJECTED',
    entityType: 'Company',
    entityId: company.id,
    description: `Company "${company.name}" verification rejected by ${req.user.email}: ${verificationNote}`,
    req,
  });

  return new ApiResponse(200, { company: updated }, 'Company verification declined.').send(res);
});

// ============================================================================
// JOB MODERATION
// ============================================================================

const listJobs = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;

  const where = {};
  if (status) where.status = status;
  if (search) where.title = { contains: search };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, verifiedByAdmin: true } },
        category: { select: { name: true } },
        location: { select: { city: true, country: true } },
        _count: { select: { applications: true } },
      },
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

const flagJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { company: { include: { recruiter: true } } },
  });
  if (!job) throw ApiError.notFound('Job not found.');

  const { flagReason } = req.body;
  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: 'FLAG_REVIEW', flagReason },
  });

  await prisma.notification.create({
    data: {
      userId: job.company.recruiter.userId,
      type: 'JOB_FLAGGED',
      title: 'One of your job postings was flagged',
      message: `"${job.title}" has been flagged for review: ${flagReason}`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: 'JOB_FLAGGED',
    entityType: 'Job',
    entityId: job.id,
    description: `Job "${job.title}" flagged by ${req.user.email}: ${flagReason}`,
    req,
  });

  return new ApiResponse(200, { job: updated }, 'Job flagged for review.').send(res);
});

const resolveJobFlag = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { company: { include: { recruiter: true } } },
  });
  if (!job) throw ApiError.notFound('Job not found.');
  if (job.status !== 'FLAG_REVIEW') {
    throw ApiError.badRequest('This job is not currently flagged for review.');
  }

  const { action } = req.body;
  const newStatus = action === 'APPROVE' ? 'OPEN' : 'CLOSED';

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: newStatus, flagReason: action === 'APPROVE' ? null : job.flagReason },
  });

  await prisma.notification.create({
    data: {
      userId: job.company.recruiter.userId,
      type: 'SYSTEM_ALERT',
      title: action === 'APPROVE' ? 'Job posting restored' : 'Job posting removed',
      message:
        action === 'APPROVE'
          ? `"${job.title}" passed review and is live again.`
          : `"${job.title}" was removed after review and is no longer visible to job seekers.`,
    },
  });

  await logActivity({
    userId: req.user.id,
    action: action === 'APPROVE' ? 'JOB_UPDATED' : 'JOB_REMOVED',
    entityType: 'Job',
    entityId: job.id,
    description: `Job "${job.title}" flag resolved (${action}) by ${req.user.email}.`,
    req,
  });

  return new ApiResponse(200, { job: updated }, `Job ${action === 'APPROVE' ? 'restored' : 'removed'}.`).send(res);
});

// ============================================================================
// ACTIVITY LOG
// ============================================================================

const listActivityLogs = asyncHandler(async (req, res) => {
  const { action, userId, page, limit } = req.query;

  const where = {};
  if (action) where.action = action;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return new ApiResponse(
    200,
    { logs, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
    'Activity logs retrieved.'
  ).send(res);
});

// ============================================================================
// DASHBOARD
// ============================================================================

// GET /api/admin/dashboard
const getAdminDashboard = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    usersByRole,
    totalActiveUsers,
    newUsersLast7Days,
    totalCompanies,
    verifiedCompanies,
    pendingCompanies,
    jobsByStatus,
    flaggedJobsCount,
    applicationStatusCounts,
    recentActivity,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.company.count(),
    prisma.company.count({ where: { verifiedByAdmin: true } }),
    prisma.company.count({ where: { verifiedByAdmin: false } }),
    prisma.job.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.job.count({ where: { status: 'FLAG_REVIEW' } }),
    prisma.application.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.activityLog.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const toCountMap = (rows, key) =>
    rows.reduce((acc, row) => {
      acc[row[key]] = row._count[key];
      return acc;
    }, {});

  const totalApplications = applicationStatusCounts.reduce((sum, row) => sum + row._count.status, 0);

  return new ApiResponse(
    200,
    {
      users: {
        byRole: toCountMap(usersByRole, 'role'),
        totalActive: totalActiveUsers,
        newLast7Days: newUsersLast7Days,
      },
      companies: {
        total: totalCompanies,
        verified: verifiedCompanies,
        pending: pendingCompanies,
      },
      jobs: {
        byStatus: toCountMap(jobsByStatus, 'status'),
        flagged: flaggedJobsCount,
      },
      applications: {
        total: totalApplications,
        byStatus: toCountMap(applicationStatusCounts, 'status'),
      },
      recentActivity,
    },
    'Admin dashboard data retrieved.'
  ).send(res);
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  listUsers,
  toggleUserActive,
  deleteUser,
  listCompanies,
  verifyCompany,
  rejectCompany,
  listJobs,
  flagJob,
  resolveJobFlag,
  listActivityLogs,
  getAdminDashboard,
};
