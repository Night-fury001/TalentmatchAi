const express = require('express');
const clientController = require('../controllers/clientController');
const jobController = require('../controllers/jobController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { resumeUpload, imageUpload } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { idParamSchema, jobIdParamSchema, paginationQuerySchema } = require('../validators/common.validators');
const { jobSearchQuerySchema } = require('../validators/job.validators');
const {
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
} = require('../validators/client.validators');
const { applySchema, myApplicationsQuerySchema } = require('../validators/application.validators');
const { recommendationsQuerySchema } = require('../validators/ai.validators');

const router = express.Router();

// --- Public job browsing (optional auth — used to flag "isSaved" for logged-in job seekers) ---
// Mounted BEFORE the auth gate below so anonymous visitors can browse jobs.
router.get('/jobs', optionalAuth, validate(jobSearchQuerySchema, 'query'), jobController.searchJobs);
router.get('/jobs/:slug', optionalAuth, jobController.getJobBySlug);

// Every route below this line requires an authenticated CLIENT (job seeker).
router.use(protect, authorize('CLIENT'));

// Note: category/location/skill dropdown lookups are served by the shared
// public /api/taxonomy/* endpoints, not duplicated here.

// --- Profile ---
router.get('/profile', clientController.getMyProfile);
router.put('/profile', validate(updateProfileSchema), clientController.updateMyProfile);

// --- Resume upload ---
router.post('/profile/resume', resumeUpload.single('resume'), clientController.uploadResume);
router.delete('/profile/resume', clientController.deleteResume);

// --- Avatar upload ---
router.post('/profile/avatar', imageUpload.single('avatar'), clientController.uploadAvatar);
router.delete('/profile/avatar', clientController.deleteAvatar);

// --- Education ---
router.post('/educations', validate(educationSchema), clientController.addEducation);
router.put(
  '/educations/:id',
  validate(idParamSchema, 'params'),
  validate(updateEducationSchema),
  clientController.updateEducation
);
router.delete('/educations/:id', validate(idParamSchema, 'params'), clientController.deleteEducation);

// --- Experience ---
router.post('/experiences', validate(experienceSchema), clientController.addExperience);
router.put(
  '/experiences/:id',
  validate(idParamSchema, 'params'),
  validate(updateExperienceSchema),
  clientController.updateExperience
);
router.delete('/experiences/:id', validate(idParamSchema, 'params'), clientController.deleteExperience);

// --- Projects ---
router.post('/projects', validate(projectSchema), clientController.addProject);
router.put(
  '/projects/:id',
  validate(idParamSchema, 'params'),
  validate(updateProjectSchema),
  clientController.updateProject
);
router.delete('/projects/:id', validate(idParamSchema, 'params'), clientController.deleteProject);

// --- Certifications ---
router.post('/certifications', validate(certificationSchema), clientController.addCertification);
router.put(
  '/certifications/:id',
  validate(idParamSchema, 'params'),
  validate(updateCertificationSchema),
  clientController.updateCertification
);
router.delete(
  '/certifications/:id',
  validate(idParamSchema, 'params'),
  clientController.deleteCertification
);

// --- Skills ---
router.post('/skills', validate(addSkillSchema), clientController.addSkill);
router.put(
  '/skills/:id',
  validate(idParamSchema, 'params'),
  validate(updateSkillSchema),
  clientController.updateSkill
);
router.delete('/skills/:id', validate(idParamSchema, 'params'), clientController.removeSkill);

// --- Applications ---
router.post(
  '/jobs/:jobId/apply',
  validate(jobIdParamSchema, 'params'),
  validate(applySchema),
  clientController.applyToJob
);
router.get('/applications', validate(myApplicationsQuerySchema, 'query'), clientController.getMyApplications);
router.get('/applications/:id', validate(idParamSchema, 'params'), clientController.getApplicationById);
router.patch(
  '/applications/:id/withdraw',
  validate(idParamSchema, 'params'),
  clientController.withdrawApplication
);
router.get(
  '/applications/:id/analysis',
  validate(idParamSchema, 'params'),
  clientController.getApplicationAnalysis
);

// --- AI matching ---
router.get('/jobs/:jobId/match', validate(jobIdParamSchema, 'params'), clientController.getJobMatch);
router.get(
  '/recommendations',
  validate(recommendationsQuerySchema, 'query'),
  clientController.getRecommendedJobs
);

// --- Saved jobs ---
router.post('/jobs/:jobId/save', validate(jobIdParamSchema, 'params'), clientController.saveJob);
router.delete('/jobs/:jobId/save', validate(jobIdParamSchema, 'params'), clientController.unsaveJob);
router.get('/saved-jobs', validate(paginationQuerySchema, 'query'), clientController.getSavedJobs);

// --- Dashboard ---
router.get('/dashboard', clientController.getDashboard);

module.exports = router;
