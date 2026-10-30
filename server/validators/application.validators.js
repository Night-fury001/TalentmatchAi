const { z } = require('zod');

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

// ============================================================================
// CLIENT — APPLY / WITHDRAW / LIST
// ============================================================================
const applySchema = z.object({
  coverLetter: optionalText(3000),
});

const myApplicationsQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ============================================================================
// RECRUITER — REVIEW / STATUS / LISTING
// ============================================================================
const jobApplicationsQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  sortBy: z.enum(['match_score', 'newest', 'oldest']).default('match_score'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const allApplicationsQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  status: z
    .enum(['PENDING', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED'], {
    errorMap: () => ({
      message: 'Status must be one of SHORTLISTED, INTERVIEWING, OFFERED, ACCEPTED, REJECTED',
    }),
  }),
  recruiterNote: optionalText(1000),
});

// ============================================================================
// INTERVIEWS
// ============================================================================
const scheduleInterviewSchema = z.object({
  scheduledAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: 'Interview time must be in the future',
  }),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(30),
  mode: z.enum(['VIDEO', 'PHONE', 'ONSITE']).default('VIDEO'),
  meetingLink: optionalText(500),
  location: optionalText(300),
  interviewerName: optionalText(150),
  notes: optionalText(1000),
});

const updateInterviewSchema = z
  .object({
    scheduledAt: z.coerce.date().optional(),
    durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
    mode: z.enum(['VIDEO', 'PHONE', 'ONSITE']).optional(),
    meetingLink: optionalText(500),
    location: optionalText(300),
    interviewerName: optionalText(150),
    notes: optionalText(1000),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

const interviewStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'], {
    errorMap: () => ({ message: 'Status must be SCHEDULED, COMPLETED, CANCELLED, or RESCHEDULED' }),
  }),
});

module.exports = {
  applySchema,
  myApplicationsQuerySchema,
  jobApplicationsQuerySchema,
  allApplicationsQuerySchema,
  updateApplicationStatusSchema,
  scheduleInterviewSchema,
  updateInterviewSchema,
  interviewStatusSchema,
};
