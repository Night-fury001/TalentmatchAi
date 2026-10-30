const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * validate(schema, source)
 * Parses req[source] against a Zod schema. On success, req[source] is
 * replaced with the parsed (and therefore type-coerced/defaulted) value.
 * On failure, forwards a 422 ApiError with field-level messages.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(ApiError.unprocessable('Validation failed', errors));
      }
      next(err);
    }
  };
}

module.exports = validate;
