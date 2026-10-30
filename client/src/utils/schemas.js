import { z } from 'zod';

const passwordRule = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: passwordRule,
    confirmPassword: z.string(),
    role: z.enum(['CLIENT', 'RECRUITER']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRule,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''));

export const profileBasicsSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  headline: z.string().trim().max(150).optional().or(z.literal('')),
  bio: z.string().trim().max(2000).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  locationId: z.string().optional().or(z.literal('')),
  openToRemote: z.boolean().optional(),
  expectedSalaryMin: z.coerce.number().int().min(0).optional().or(z.literal('')),
  expectedSalaryMax: z.coerce.number().int().min(0).optional().or(z.literal('')),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
});

export const educationSchema = z
  .object({
    institution: z.string().trim().min(2, 'Required').max(150),
    degree: z.string().trim().min(2, 'Required').max(150),
    fieldOfStudy: z.string().trim().max(150).optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().or(z.literal('')),
    isCurrent: z.boolean().optional(),
    grade: z.string().trim().max(50).optional().or(z.literal('')),
    description: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .refine((data) => data.isCurrent || data.endDate, {
    message: 'End date is required unless this is ongoing',
    path: ['endDate'],
  });

export const experienceSchema = z
  .object({
    company: z.string().trim().min(2, 'Required').max(150),
    title: z.string().trim().min(2, 'Required').max(150),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
    location: z.string().trim().max(150).optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().or(z.literal('')),
    isCurrent: z.boolean().optional(),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine((data) => data.isCurrent || data.endDate, {
    message: 'End date is required unless this is your current role',
    path: ['endDate'],
  });

export const projectSchema = z.object({
  title: z.string().trim().min(2, 'Required').max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  techStack: z.string().trim().max(300).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(2, 'Required').max(150),
  issuer: z.string().trim().min(2, 'Required').max(150),
  issueDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  credentialId: z.string().trim().max(100).optional().or(z.literal('')),
  credentialUrl: optionalUrl,
});

export const addSkillSchema = z.object({
  skillId: z.string().min(1, 'Choose a skill'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  yearsUsed: z.coerce.number().int().min(0).max(50).optional(),
});

export const applySchema = z.object({
  coverLetter: z.string().trim().max(3000).optional().or(z.literal('')),
});

// ============================================================================
// RECRUITER — COMPANY
// ============================================================================
export const companySchema = z.object({
  name: z.string().trim().min(2, 'Required').max(150),
  website: optionalUrl,
  description: z.string().trim().max(3000).optional().or(z.literal('')),
  industry: z.string().trim().max(100).optional().or(z.literal('')),
  size: z.string().trim().max(20).optional().or(z.literal('')),
  foundedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().or(z.literal('')),
  headquartersId: z.string().optional().or(z.literal('')),
});

// ============================================================================
// RECRUITER — JOB POSTING
// ============================================================================
export const jobFormSchema = z
  .object({
    companyId: z.string().min(1, 'Choose a company'),
    title: z.string().trim().min(3, 'Required').max(150),
    description: z.string().trim().min(20, 'At least 20 characters').max(10000),
    requirements: z.string().trim().min(10, 'At least 10 characters').max(5000),
    responsibilities: z.string().trim().max(5000).optional().or(z.literal('')),
    benefits: z.string().trim().max(3000).optional().or(z.literal('')),
    categoryId: z.string().min(1, 'Choose a category'),
    locationId: z.string().min(1, 'Choose a location'),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
    workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
    experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']),
    salaryMin: z.coerce.number().int().min(0).optional().or(z.literal('')),
    salaryMax: z.coerce.number().int().min(0).optional().or(z.literal('')),
    currency: z.string().trim().length(3).default('USD'),
    vacancies: z.coerce.number().int().min(1).max(1000).default(1),
    applicationDeadline: z.string().optional().or(z.literal('')),
    status: z.enum(['DRAFT', 'OPEN']).optional(),
    skillIds: z.array(z.string()).default([]),
  })
  .refine((data) => !data.salaryMin || !data.salaryMax || Number(data.salaryMax) >= Number(data.salaryMin), {
    message: 'Max salary must be greater than or equal to min salary',
    path: ['salaryMax'],
  });

// ============================================================================
// RECRUITER — INTERVIEW SCHEDULING
// ============================================================================
export const scheduleInterviewSchema = z.object({
  scheduledAt: z.string().min(1, 'Pick a date and time'),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(30),
  mode: z.enum(['VIDEO', 'PHONE', 'ONSITE']),
  meetingLink: z.string().trim().max(500).optional().or(z.literal('')),
  location: z.string().trim().max(300).optional().or(z.literal('')),
  interviewerName: z.string().trim().max(150).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const applicationStatusSchema = z.object({
  status: z.enum(['SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED']),
  recruiterNote: z.string().trim().max(1000).optional().or(z.literal('')),
});

// ============================================================================
// ADMIN — TAXONOMY
// ============================================================================
export const adminCategorySchema = z.object({
  name: z.string().trim().min(2, 'Required').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  icon: z.string().trim().max(50).optional().or(z.literal('')),
});

export const adminLocationSchema = z.object({
  city: z.string().trim().min(1, 'Required').max(100),
  state: z.string().trim().max(100).optional().or(z.literal('')),
  country: z.string().trim().min(2, 'Required').max(100),
});

export const adminSkillSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(60),
  category: z.string().trim().max(60).optional().or(z.literal('')),
});

// ============================================================================
// ADMIN — MODERATION
// ============================================================================
export const rejectCompanySchema = z.object({
  verificationNote: z.string().trim().min(5, 'Explain why, in a few words').max(500),
});

export const flagJobSchema = z.object({
  flagReason: z.string().trim().min(5, 'Explain why, in a few words').max(500),
});
