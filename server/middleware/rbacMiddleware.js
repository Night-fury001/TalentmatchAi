const ApiError = require('../utils/ApiError');

/**
 * authorize(...allowedRoles)
 * Must run AFTER `protect` (relies on req.user being populated).
 * Rejects the request with 403 if the current user's role is not in the
 * allowed list.
 *
 * Usage: router.get('/admin/users', protect, authorize('ADMIN'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`
        )
      );
    }
    next();
  };
}

/**
 * requireVerified
 * Guards routes that should only be accessible to users who have
 * confirmed their email address.
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required.'));
  }
  if (!req.user.isVerified) {
    return next(ApiError.forbidden('Please verify your email address to access this resource.'));
  }
  next();
}

module.exports = { authorize, requireVerified };
