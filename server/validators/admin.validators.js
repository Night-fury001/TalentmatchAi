const { z } = require('zod');

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

// ============================================================================
// TAXONOMY — CATEGORY
// ============================================================================
const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: optionalText(500),
  icon: optionalText(50),
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: optionalText(500),
    icon: optionalText(50),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// TAXONOMY — LOCATION
// ============================================================================
const locationSchema = z.object({
  city: z.string().trim().min(1).max(100),
  state: optionalText(100),
  country: z.string().trim().min(2).max(100),
});

const updateLocationSchema = z
  .object({
    city: z.string().trim().min(1).max(100).optional(),
    state: optionalText(100),
    country: z.string().trim().min(2).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// TAXONOMY — SKILL
// ============================================================================
const skillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: optionalText(100),
});

const updateSkillSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    category: optionalText(100),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// USER GOVERNANCE
// ============================================================================
const listUsersQuerySchema = z.object({
  role: z.enum(['ADMIN', 'RECRUITER', 'CLIENT']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const toggleUserActiveSchema = z.object({
  isActive: z.boolean(),
});

// ============================================================================
// COMPANY VERIFICATION
// ============================================================================
const listCompaniesQuerySchema = z.object({
  verified: z.coerce.boolean().optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const rejectCompanySchema = z.object({
  verificationNote: z.string().trim().min(5).max(500),
});

// ============================================================================
// JOB MODERATION
// ============================================================================
const flagJobSchema = z.object({
  flagReason: z.string().trim().min(5).max(500),
});

const resolveJobFlagSchema = z.object({
  action: z.enum(['APPROVE', 'REMOVE'], {
    errorMap: () => ({ message: 'Action must be APPROVE or REMOVE' }),
  }),
});

const listJobsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'FLAG_REVIEW']).optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================================
// ACTIVITY LOG
// ============================================================================
const listActivityLogsQuerySchema = z.object({
  action: z
    .enum([
      'USER_REGISTERED',
      'USER_LOGIN',
      'USER_ACTIVATED',
      'USER_DEACTIVATED',
      'USER_DELETED',
      'COMPANY_CREATED',
      'COMPANY_VERIFIED',
      'COMPANY_REJECTED',
      'JOB_CREATED',
      'JOB_UPDATED',
      'JOB_CLOSED',
      'JOB_FLAGGED',
      'JOB_REMOVED',
      'APPLICATION_SUBMITTED',
      'APPLICATION_STATUS_CHANGED',
      'INTERVIEW_SCHEDULED',
      'TAXONOMY_UPDATED',
      'AI_ANALYSIS_RUN',
    ])
    .optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

module.exports = {
  categorySchema,
  updateCategorySchema,
  locationSchema,
  updateLocationSchema,
  skillSchema,
  updateSkillSchema,
  listUsersQuerySchema,
  toggleUserActiveSchema,
  listCompaniesQuerySchema,
  rejectCompanySchema,
  flagJobSchema,
  resolveJobFlagSchema,
  listJobsQuerySchema,
  listActivityLogsQuerySchema,
};
