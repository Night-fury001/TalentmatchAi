export const JOB_TYPE_LABELS = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

export const WORK_MODE_LABELS = {
  ONSITE: 'On-site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

export const EXPERIENCE_LEVEL_LABELS = {
  ENTRY: 'Entry level',
  MID: 'Mid level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
};

export const SKILL_LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

export const APPLICATION_STATUS_LABELS = {
  PENDING: 'Pending review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWING: 'Interviewing',
  OFFERED: 'Offer extended',
  ACCEPTED: 'Accepted',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
};

export const APPLICATION_STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  SHORTLISTED: 'bg-sky-100 text-sky-800 border-sky-200',
  INTERVIEWING: 'bg-brand-100 text-brand-800 border-brand-200',
  OFFERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  WITHDRAWN: 'bg-ink-100 text-ink-600 border-ink-200',
};

export const APPLICATION_STATUS_STEPS = [
  'PENDING',
  'SHORTLISTED',
  'INTERVIEWING',
  'OFFERED',
  'ACCEPTED',
];

export const JOB_STATUS_LABELS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  CLOSED: 'Closed',
  FLAG_REVIEW: 'Under review',
};

export const EMPLOYMENT_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const WORK_MODE_OPTIONS = Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const EXPERIENCE_LEVEL_OPTIONS = Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const SKILL_LEVEL_OPTIONS = Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function matchScoreColor(score) {
  if (score >= 80) return 'text-glow-emerald';
  if (score >= 60) return 'text-brand-500';
  if (score >= 40) return 'text-glow-amber';
  return 'text-ink-500';
}

export function matchScoreBg(score) {
  if (score >= 80) return 'bg-glow-emerald';
  if (score >= 60) return 'bg-brand-500';
  if (score >= 40) return 'bg-glow-amber';
  return 'bg-ink-400';
}

// ============================================================================
// RECRUITER — ATS PIPELINE
// ============================================================================
export const PIPELINE_COLUMNS = [
  { status: 'PENDING', label: 'New', accent: 'border-t-amber-400' },
  { status: 'SHORTLISTED', label: 'Shortlisted', accent: 'border-t-sky-400' },
  { status: 'INTERVIEWING', label: 'Interviewing', accent: 'border-t-brand-500' },
  { status: 'OFFERED', label: 'Offered', accent: 'border-t-glow-emerald' },
  { status: 'ACCEPTED', label: 'Accepted', accent: 'border-t-emerald-600' },
  { status: 'REJECTED', label: 'Rejected', accent: 'border-t-rose-400' },
];

export const INTERVIEW_MODE_LABELS = {
  VIDEO: 'Video call',
  PHONE: 'Phone call',
  ONSITE: 'On-site',
};

export const INTERVIEW_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

export const JOB_STATUS_COLORS = {
  DRAFT: 'bg-ink-100 text-ink-600 border-ink-200',
  OPEN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CLOSED: 'bg-ink-100 text-ink-600 border-ink-200',
  FLAG_REVIEW: 'bg-rose-100 text-rose-700 border-rose-200',
};

// ============================================================================
// ADMIN
// ============================================================================
export const ROLE_LABELS = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  CLIENT: 'Job seeker',
};

export const ROLE_COLORS = {
  ADMIN: 'bg-brand-100 text-brand-800 border-brand-200',
  RECRUITER: 'bg-amber-100 text-amber-800 border-amber-200',
  CLIENT: 'bg-sky-100 text-sky-800 border-sky-200',
};

export const ACTIVITY_ACTION_LABELS = {
  USER_REGISTERED: 'User registered',
  USER_LOGIN: 'User logged in',
  USER_ACTIVATED: 'User activated',
  USER_DEACTIVATED: 'User deactivated',
  USER_DELETED: 'User deleted',
  COMPANY_CREATED: 'Company created',
  COMPANY_VERIFIED: 'Company verified',
  COMPANY_REJECTED: 'Company rejected',
  JOB_CREATED: 'Job created',
  JOB_UPDATED: 'Job updated',
  JOB_CLOSED: 'Job closed',
  JOB_FLAGGED: 'Job flagged',
  JOB_REMOVED: 'Job removed',
  APPLICATION_SUBMITTED: 'Application submitted',
  APPLICATION_STATUS_CHANGED: 'Application status changed',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  TAXONOMY_UPDATED: 'Taxonomy updated',
  AI_ANALYSIS_RUN: 'AI analysis run',
};

export const CHART_COLORS = ['#6d3fff', '#34d399', '#fbbf24', '#fb7185', '#38bdf8', '#a78bfa'];
