const { z } = require('zod');

const csvToArray = z
  .string()
  .optional()
  .transform((val) => (val ? val.split(',').map((s) => s.trim()).filter(Boolean) : undefined));

const jobSearchQuerySchema = z.object({
  keyword: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).optional(),
  workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']).optional(),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  skillIds: csvToArray,
  sortBy: z.enum(['newest', 'salary_high', 'salary_low']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

module.exports = { jobSearchQuerySchema };
