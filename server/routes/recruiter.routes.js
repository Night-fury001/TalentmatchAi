const express = require('express');
const recruiterController = require('../controllers/recruiterController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { imageUpload } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  idParamSchema,
  jobIdParamSchema,
  applicationIdParamSchema,
} = require('../validators/common.validators');
const {
  companySchema,
  updateCompanySchema,
  jobCreateSchema,
  jobUpdateSchema,
  jobStatusSchema,
  myJobsQuerySchema,
} = require('../validators/recruiter.validators');
const {
  jobApplicationsQuerySchema,
  allApplicationsQuerySchema,
  updateApplicationStatusSchema,
  scheduleInterviewSchema,
  updateInterviewSchema,
  interviewStatusSchema,
} = require('../validators/application.validators');

const router = express.Router();

// Every route in this file requires an authenticated RECRUITER.
router.use(protect, authorize('RECRUITER'));

// --- Companies ---
router.get('/companies', recruiterController.getMyCompanies);
router.post('/companies', validate(companySchema), recruiterController.createCompany);
router.get('/companies/:id', validate(idParamSchema, 'params'), recruiterController.getCompanyById);
router.put(
  '/companies/:id',
  validate(idParamSchema, 'params'),
  validate(updateCompanySchema),
  recruiterController.updateCompany
);
router.post(
  '/companies/:id/logo',
  validate(idParamSchema, 'params'),
  imageUpload.single('logo'),
  recruiterController.uploadCompanyLogo
);

// --- Jobs ---
router.get('/jobs', validate(myJobsQuerySchema, 'query'), recruiterController.getMyJobs);
router.post('/jobs', validate(jobCreateSchema), recruiterController.createJob);
router.get('/jobs/:id', validate(idParamSchema, 'params'), recruiterController.getJobById);
router.put(
  '/jobs/:id',
  validate(idParamSchema, 'params'),
  validate(jobUpdateSchema),
  recruiterController.updateJob
);
router.patch(
  '/jobs/:id/status',
  validate(idParamSchema, 'params'),
  validate(jobStatusSchema),
  recruiterController.updateJobStatus
);
router.delete('/jobs/:id', validate(idParamSchema, 'params'), recruiterController.deleteJob);

// --- Applications (AI-ranked ATS pipeline) ---
router.get(
  '/jobs/:jobId/applications',
  validate(jobIdParamSchema, 'params'),
  validate(jobApplicationsQuerySchema, 'query'),
  recruiterController.getJobApplications
);
router.get(
  '/applications',
  validate(allApplicationsQuerySchema, 'query'),
  recruiterController.getAllApplications
);
router.get(
  '/applications/:id',
  validate(idParamSchema, 'params'),
  recruiterController.getApplicationDetail
);
router.patch(
  '/applications/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateApplicationStatusSchema),
  recruiterController.updateApplicationStatus
);

// --- Interviews ---
router.post(
  '/applications/:applicationId/interviews',
  validate(applicationIdParamSchema, 'params'),
  validate(scheduleInterviewSchema),
  recruiterController.scheduleInterview
);
router.get(
  '/applications/:applicationId/interviews',
  validate(applicationIdParamSchema, 'params'),
  recruiterController.getApplicationInterviews
);
router.put(
  '/interviews/:id',
  validate(idParamSchema, 'params'),
  validate(updateInterviewSchema),
  recruiterController.updateInterview
);
router.patch(
  '/interviews/:id/status',
  validate(idParamSchema, 'params'),
  validate(interviewStatusSchema),
  recruiterController.updateInterviewStatus
);

// --- Dashboard ---
router.get('/dashboard', recruiterController.getRecruiterDashboard);

// --- AI matching ---
router.get(
  '/applications/:id/analysis',
  validate(idParamSchema, 'params'),
  recruiterController.getApplicationAnalysis
);
router.post(
  '/applications/:id/analysis/refresh',
  validate(idParamSchema, 'params'),
  recruiterController.refreshApplicationAnalysis
);

module.exports = router;
