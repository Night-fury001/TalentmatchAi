const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validateMiddleware');
const { idParamSchema } = require('../validators/common.validators');
const {
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
} = require('../validators/admin.validators');

const router = express.Router();

// Every route in this file requires an authenticated ADMIN.
router.use(protect, authorize('ADMIN'));

// --- Taxonomy: Categories ---
router.get('/taxonomy/categories', adminController.listCategories);
router.post('/taxonomy/categories', validate(categorySchema), adminController.createCategory);
router.put(
  '/taxonomy/categories/:id',
  validate(idParamSchema, 'params'),
  validate(updateCategorySchema),
  adminController.updateCategory
);
router.delete(
  '/taxonomy/categories/:id',
  validate(idParamSchema, 'params'),
  adminController.deleteCategory
);

// --- Taxonomy: Locations ---
router.get('/taxonomy/locations', adminController.listLocations);
router.post('/taxonomy/locations', validate(locationSchema), adminController.createLocation);
router.put(
  '/taxonomy/locations/:id',
  validate(idParamSchema, 'params'),
  validate(updateLocationSchema),
  adminController.updateLocation
);
router.delete(
  '/taxonomy/locations/:id',
  validate(idParamSchema, 'params'),
  adminController.deleteLocation
);

// --- Taxonomy: Skills ---
router.get('/taxonomy/skills', adminController.listSkills);
router.post('/taxonomy/skills', validate(skillSchema), adminController.createSkill);
router.put(
  '/taxonomy/skills/:id',
  validate(idParamSchema, 'params'),
  validate(updateSkillSchema),
  adminController.updateSkill
);
router.delete('/taxonomy/skills/:id', validate(idParamSchema, 'params'), adminController.deleteSkill);

// --- User governance ---
router.get('/users', validate(listUsersQuerySchema, 'query'), adminController.listUsers);
router.patch(
  '/users/:id/status',
  validate(idParamSchema, 'params'),
  validate(toggleUserActiveSchema),
  adminController.toggleUserActive
);
router.delete('/users/:id', validate(idParamSchema, 'params'), adminController.deleteUser);

// --- Company verification ---
router.get('/companies', validate(listCompaniesQuerySchema, 'query'), adminController.listCompanies);
router.patch(
  '/companies/:id/verify',
  validate(idParamSchema, 'params'),
  adminController.verifyCompany
);
router.patch(
  '/companies/:id/reject',
  validate(idParamSchema, 'params'),
  validate(rejectCompanySchema),
  adminController.rejectCompany
);

// --- Job moderation ---
router.get('/jobs', validate(listJobsQuerySchema, 'query'), adminController.listJobs);
router.patch(
  '/jobs/:id/flag',
  validate(idParamSchema, 'params'),
  validate(flagJobSchema),
  adminController.flagJob
);
router.patch(
  '/jobs/:id/resolve-flag',
  validate(idParamSchema, 'params'),
  validate(resolveJobFlagSchema),
  adminController.resolveJobFlag
);

// --- Activity log ---
router.get(
  '/activity-logs',
  validate(listActivityLogsQuerySchema, 'query'),
  adminController.listActivityLogs
);

// --- Dashboard ---
router.get('/dashboard', adminController.getAdminDashboard);

module.exports = router;
