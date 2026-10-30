const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const maxAttempts = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20;

/**
 * Shared handler that funnels rate-limit rejections through the same
 * ApiError -> error middleware pipeline as every other error, so the
 * client always sees the standard { success, statusCode, message } shape.
 */
function rateLimitHandler(req, res, next) {
  next(ApiError.tooManyRequests('Too many requests. Please try again later.'));
}

/**
 * Strict limiter applied to sensitive, abuse-prone auth endpoints:
 * register, login, forgot-password, reset-password.
 */
const authLimiter = rateLimit({
  windowMs,
  max: maxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

/**
 * Looser limiter for general authenticated API traffic.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { authLimiter, apiLimiter };
