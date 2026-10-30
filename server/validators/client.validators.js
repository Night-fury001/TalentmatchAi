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
// PROFILE
// ============================================================================
const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  headline: optionalText(150),
  bio: optionalText(2000),
  phone: optionalText(20),
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  locationId: z.string().uuid().optional().nullable(),
  openToRemote: z.boolean().optional(),
  expectedSalaryMin: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
  expectedSalaryMax: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
});

// ============================================================================
// EDUCATION
// ============================================================================
const baseEducationSchema = z.object({
  institution: z.string().trim().min(2).max(150),
  degree: z.string().trim().min(2).max(150),
  fieldOfStudy: optionalText(150),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  isCurrent: z.boolean().default(false),
  grade: optionalText(50),
  description: optionalText(1000),
});

const educationSchema = baseEducationSchema.refine(
  (data) => data.isCurrent || data.endDate,
  {
    message: 'End date is required unless this is your current program',
    path: ['endDate'],
  }
);

const updateEducationSchema = baseEducationSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

// ============================================================================
// EXPERIENCE
// ============================================================================
const experienceSchema = z
  .object({
    company: z.string().trim().min(2).max(150),
    title: z.string().trim().min(2).max(150),
    employmentType: z
      .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
      .default('FULL_TIME'),
    location: optionalText(150),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    isCurrent: z.boolean().default(false),
    description: optionalText(2000),
  })
  .refine((data) => data.isCurrent || data.endDate, {
    message: 'End date is required unless this is your current role',
    path: ['endDate'],
  });

const updateExperienceSchema = z
  .object({
    company: z.string().trim().min(2).max(150).optional(),
    title: z.string().trim().min(2).max(150).optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).optional(),
    location: optionalText(150),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    isCurrent: z.boolean().optional(),
    description: optionalText(2000),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// PROJECT
// ============================================================================
const projectSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: optionalText(2000),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  techStack: optionalText(300),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

const updateProjectSchema = projectSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// CERTIFICATION
// ============================================================================
const certificationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  issuer: z.string().trim().min(2).max(150),
  issueDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  credentialId: optionalText(100),
  credentialUrl: optionalUrl,
});

const updateCertificationSchema = certificationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

// ============================================================================
// SKILLS
// ============================================================================
const addSkillSchema = z.object({
  skillId: z.string().uuid('Invalid skill selected'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
  yearsUsed: z.coerce.number().int().min(0).max(50).optional(),
});

const updateSkillSchema = z
  .object({
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    yearsUsed: z.coerce.number().int().min(0).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

module.exports = {
  updateProfileSchema,
  educationSchema,
  updateEducationSchema,
  experienceSchema,
  updateExperienceSchema,
  projectSchema,
  updateProjectSchema,
  certificationSchema,
  updateCertificationSchema,
  addSkillSchema,
  updateSkillSchema,
};
