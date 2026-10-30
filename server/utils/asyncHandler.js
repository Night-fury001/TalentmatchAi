/**
 * asyncHandler
 * Wraps an async Express route/controller so any thrown error or rejected
 * promise is forwarded to next(err) instead of crashing the process or
 * requiring a try/catch block in every controller.
 *
 * Usage: router.post('/login', asyncHandler(authController.login));
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
