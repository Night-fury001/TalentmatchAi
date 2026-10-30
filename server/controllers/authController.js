const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { prisma } = require('../utils/prismaClient');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateRawToken, sha256Hex } = require('../utils/crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../utils/tokenUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { logActivity } = require('../utils/activityLogger');

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const PROFILE_INCLUDE = {
  jobSeekerProfile: true,
  recruiterProfile: true,
};

/**
 * Strips sensitive fields before a user object is ever sent to the client.
 */
function sanitizeUser(user) {
  const {
    passwordHash,
    verifyToken,
    verifyTokenExpiry,
    resetToken,
    resetTokenExpiry,
    refreshTokenHash,
    ...safe
  } = user;
  return safe;
}

/**
 * Issues a fresh access/refresh token pair, persists the refresh token's
 * hash on the user record (rotation-friendly), and sets the refresh
 * cookie on the response.
 */
async function issueSession(res, user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: sha256Hex(refreshToken) },
  });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}

// ============================================================================
// POST /api/auth/register
// ============================================================================
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const rawVerifyToken = generateRawToken();
  const verifyToken = sha256Hex(rawVerifyToken);
  const verifyTokenExpiry = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

  const profileRelation =
    role === 'RECRUITER'
      ? { recruiterProfile: { create: { fullName } } }
      : { jobSeekerProfile: { create: { fullName } } };

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      verifyToken,
      verifyTokenExpiry,
      ...profileRelation,
    },
    include: PROFILE_INCLUDE,
  });

  try {
    await sendVerificationEmail(user.email, rawVerifyToken);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[authController.register] Failed to send verification email:', err.message);
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'SYSTEM_ALERT',
      title: 'Welcome to Northa!',
      message:
        role === 'RECRUITER'
          ? 'Your recruiter account is ready. Set up your company profile to start posting jobs.'
          : 'Your account is ready. Complete your profile to start getting AI-matched job recommendations.',
    },
  });

  await logActivity({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    description: `New ${role.toLowerCase()} account registered: ${user.email}`,
    req,
  });

  const accessToken = await issueSession(res, user);

  return new ApiResponse(
    201,
    { user: sanitizeUser(user), accessToken },
    'Account created successfully. Please check your email to verify your account.'
  ).send(res);
});

// ============================================================================
// POST /api/auth/login
// ============================================================================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: PROFILE_INCLUDE,
  });

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    description: `User logged in: ${user.email}`,
    req,
  });

  const accessToken = await issueSession(res, user);

  return new ApiResponse(200, { user: sanitizeUser(user), accessToken }, 'Logged in successfully.').send(res);
});

// ============================================================================
// POST /api/auth/logout
// ============================================================================
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshTokenHash: null },
    });
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  return new ApiResponse(200, null, 'Logged out successfully.').send(res);
});

// ============================================================================
// POST /api/auth/refresh-token
// ============================================================================
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.signedCookies?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('No refresh token provided. Please log in again.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Refresh token is invalid or has expired. Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account not found or deactivated.');
  }

  if (!user.refreshTokenHash || user.refreshTokenHash !== sha256Hex(token)) {
    // Token reuse or a previously-revoked token — invalidate the whole session as a precaution.
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
    throw ApiError.unauthorized('Session is no longer valid. Please log in again.');
  }

  const accessToken = await issueSession(res, user);

  return new ApiResponse(200, { accessToken }, 'Token refreshed successfully.').send(res);
});

// ============================================================================
// POST /api/auth/forgot-password
// ============================================================================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return the same response whether or not the account exists,
  // to avoid leaking which emails are registered.
  const genericMessage = 'If an account exists for that email, a password reset link has been sent.';

  if (user) {
    const rawResetToken = generateRawToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: sha256Hex(rawResetToken),
        resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    try {
      await sendPasswordResetEmail(user.email, rawResetToken);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[authController.forgotPassword] Failed to send reset email:', err.message);
    }
  }

  return new ApiResponse(200, null, genericMessage).send(res);
});

// ============================================================================
// POST /api/auth/reset-password/:token
// ============================================================================
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = sha256Hex(token);
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('This password reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      refreshTokenHash: null, // force re-login everywhere
    },
  });

  await logActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    description: `Password reset completed for: ${user.email}`,
    req,
  });

  return new ApiResponse(200, null, 'Your password has been reset. Please log in with your new password.').send(
    res
  );
});

// ============================================================================
// POST /api/auth/change-password  (protected)
// ============================================================================
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw ApiError.unauthorized('Current password is incorrect.');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, refreshTokenHash: null },
  });

  res.clearCookie('refreshToken', { path: '/api/auth' });

  return new ApiResponse(200, null, 'Password changed successfully. Please log in again.').send(res);
});

// ============================================================================
// GET /api/auth/verify-email/:token
// ============================================================================
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = sha256Hex(token);

  const user = await prisma.user.findFirst({
    where: {
      verifyToken: hashedToken,
      verifyTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('This verification link is invalid or has expired.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null, verifyTokenExpiry: null },
  });

  await logActivity({
    userId: user.id,
    action: 'USER_ACTIVATED',
    entityType: 'User',
    entityId: user.id,
    description: `Email verified for: ${user.email}`,
    req,
  });

  return new ApiResponse(200, null, 'Email verified successfully. You now have full access to your account.').send(
    res
  );
});

// ============================================================================
// POST /api/auth/resend-verification  (protected)
// ============================================================================
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (user.isVerified) {
    throw ApiError.badRequest('Your email is already verified.');
  }

  const rawVerifyToken = generateRawToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken: sha256Hex(rawVerifyToken),
      verifyTokenExpiry: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    },
  });

  await sendVerificationEmail(user.email, rawVerifyToken);

  return new ApiResponse(200, null, 'Verification email sent. Please check your inbox.').send(res);
});

// ============================================================================
// GET /api/auth/me  (protected)
// ============================================================================
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: PROFILE_INCLUDE,
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return new ApiResponse(200, { user: sanitizeUser(user) }, 'Current user retrieved.').send(res);
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  getMe,
};
