const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokenUtils');
const { prisma } = require('../utils/prismaClient');

/**
 * Extracts the bearer token from the Authorization header, falling back to
 * an `accessToken` cookie if present (useful for same-site browser flows).
 */
function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

/**
 * protect
 * Requires a valid, non-expired access token. Loads the current user from
 * the database (so revoked/deactivated accounts are rejected immediately
 * rather than waiting for token expiry) and attaches it to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please log in.');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Session expired. Please refresh your token or log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }

  if (payload.type !== 'access') {
    throw ApiError.unauthorized('Invalid token type.');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact support for assistance.');
  }

  req.user = user;
  next();
});

/**
 * optionalAuth
 * Attaches req.user when a valid token is present, but never rejects the
 * request when it's absent or invalid. Useful for endpoints that behave
 * differently for logged-in vs anonymous users (e.g. job listings showing
 * "saved" state).
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') return next();

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, isVerified: true },
    });
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    // Invalid/expired token on an optional route — proceed as anonymous.
  }
  next();
});

module.exports = { protect, optionalAuth };
