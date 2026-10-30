const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');

/**
 * notFound
 * Catches any request that didn't match a defined route and forwards a
 * structured 404 instead of Express's default HTML error page.
 */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Maps a Prisma known-request error to an ApiError with an appropriate
 * HTTP status code and a human-readable message.
 */
function fromPrismaError(err) {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
      return ApiError.conflict(`A record with this ${target || 'value'} already exists.`);
    }
    case 'P2025':
      return ApiError.notFound(err.meta?.cause || 'The requested record could not be found.');
    case 'P2003':
      return ApiError.badRequest('This operation references a record that does not exist.');
    case 'P2014':
      return ApiError.badRequest('This change would violate a required relationship between records.');
    default:
      return ApiError.internal('A database error occurred.');
  }
}

/**
 * errorHandler
 * Centralized error-handling middleware. MUST be registered last, after
 * all routes and other middleware. Normalizes every thrown/forwarded
 * error into the { success, statusCode, message, errors } envelope.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      error = fromPrismaError(error);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      error = ApiError.badRequest('Invalid data was sent to the database layer.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      error = ApiError.unauthorized('Invalid authentication token.');
    } else if (error instanceof jwt.TokenExpiredError) {
      error = ApiError.unauthorized('Authentication token has expired.');
    } else if (error instanceof multer.MulterError) {
      error = ApiError.badRequest(`Upload error: ${error.message}`);
    } else if (error.type === 'entity.too.large') {
      error = ApiError.badRequest('Request payload is too large.');
    } else if (error.type === 'entity.parse.failed') {
      error = ApiError.badRequest('Malformed JSON in request body.');
    } else {
      const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
      error = new ApiError(statusCode, error.message || 'Internal server error', [], error.stack);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  } else if (error.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${error.message}`);
  }

  const payload = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors && error.errors.length ? error.errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };

  res.status(error.statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
