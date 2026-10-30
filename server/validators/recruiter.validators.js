const { z } = require('zod');

const optionalUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .max(300)
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

// ============================================================================
// COMPANY
// ============================================================================
const companySchema = z.object({
  name: z.string().trim().min(2).max(150),
  website: optionalUrl,
  description: optionalText(3000),
  industry: optionalText(100),
  size: optionalText(20),
  foundedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  headquartersId: z.string().uuid().optional().nullable(),
});

const updateCompanySchema = companySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// JOB
// ============================================================================
const jobCreateSchema = z
  .object({
    companyId: z.string().uuid('Select a company for this posting'),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(20).max(10000),
    requirements: z.string().trim().min(10).max(5000),
    responsibilities: optionalText(5000),
    benefits: optionalText(3000),
    categoryId: z.string().uuid('Select a job category'),
    locationId: z.string().uuid('Select a job location'),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).default('FULL_TIME'),
    workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']).default('ONSITE'),
    experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).default('MID'),
    salaryMin: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
    salaryMax: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
    currency: z.string().trim().length(3).default('USD'),
    vacancies: z.coerce.number().int().min(1).max(1000).default(1),
    applicationDeadline: z.coerce.date().optional().nullable(),
    status: z.enum(['DRAFT', 'OPEN']).default('DRAFT'),
    skillIds: z.array(z.string().uuid()).max(30).default([]),
  })
  .refine(
    (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
    { message: 'Maximum salary must be greater than or equal to minimum salary', path: ['salaryMax'] }
  );

const jobUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(20).max(10000).optional(),
    requirements: z.string().trim().min(10).max(5000).optional(),
    responsibilities: optionalText(5000),
    benefits: optionalText(3000),
    categoryId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).optional(),
    workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']).optional(),
    experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
    salaryMin: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
    salaryMax: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
    currency: z.string().trim().length(3).optional(),
    vacancies: z.coerce.number().int().min(1).max(1000).optional(),
    applicationDeadline: z.coerce.date().optional().nullable(),
    skillIds: z.array(z.string().uuid()).max(30).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' })
  .refine(
    (data) => !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
    { message: 'Maximum salary must be greater than or equal to minimum salary', path: ['salaryMax'] }
  );

const jobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED'], {
    errorMap: () => ({ message: 'Status must be DRAFT, OPEN, or CLOSED' }),
  }),
});

const myJobsQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'FLAG_REVIEW']).optional(),
  keyword: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  companySchema,
  updateCompanySchema,
  jobCreateSchema,
  jobUpdateSchema,
  jobStatusSchema,
  myJobsQuerySchema,
};
