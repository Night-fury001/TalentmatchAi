const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validateMiddleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordParamsSchema,
  resetPasswordBodySchema,
  changePasswordSchema,
  verifyEmailParamsSchema,
} = require('../validators/auth.validators');

const router = express.Router();

// --- Public routes ---
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password/:token',
  authLimiter,
  validate(resetPasswordParamsSchema, 'params'),
  validate(resetPasswordBodySchema, 'body'),
  authController.resetPassword
);
router.get(
  '/verify-email/:token',
  validate(verifyEmailParamsSchema, 'params'),
  authController.verifyEmail
);

// --- Protected routes ---
router.post('/logout', protect, authController.logout);
router.post('/resend-verification', protect, authController.resendVerificationEmail);
router.post(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);
router.get('/me', protect, authController.getMe);

module.exports = router;
