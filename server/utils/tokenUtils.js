const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  // Fail fast — running with missing secrets is a critical misconfiguration.
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in the environment before the server can start.'
  );
}

/**
 * Signs a short-lived access token carrying minimal identity + role claims.
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

/**
 * Signs a longer-lived refresh token. Only its hash is persisted server-side
 * so a stolen DB row alone cannot be replayed as a valid refresh token.
 */
function generateRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/**
 * Converts a duration string like "7d" / "15m" / "12h" into milliseconds
 * for cookie maxAge. Falls back to 7 days if the format is unrecognized.
 */
function durationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[unit];
}

/**
 * Shared cookie options for the refresh token cookie.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: durationToMs(REFRESH_EXPIRES_IN),
    signed: true,
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshCookieOptions,
  durationToMs,
};
