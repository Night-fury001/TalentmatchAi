/**
 * ApiError
 * A structured, operational error thrown from controllers/services and
 * caught by the global error-handling middleware. Keeping this distinct
 * from unexpected/programmer errors lets the error handler decide how
 * much detail is safe to expose to the client.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {Array<{field?: string, message: string}>} errors - Field-level validation errors
   * @param {string} [stack]
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict', errors = []) {
    return new ApiError(409, message, errors);
  }

  static unprocessable(message = 'Validation failed', errors = []) {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
