const { z } = require('zod');

/**
 * Validates a single :id route param as a UUID (all our Prisma models use
 * @default(uuid()) primary keys).
 */
const idParamSchema = z.object({
  id: z.string().uuid('Invalid identifier format'),
});

/**
 * Factory for validating a differently-named UUID route param, needed on
 * nested routes like /jobs/:jobId/applications where more than one
 * resource id can appear in the same path.
 */
function namedIdParamSchema(paramName) {
  return z.object({ [paramName]: z.string().uuid('Invalid identifier format') });
}

const jobIdParamSchema = namedIdParamSchema('jobId');
const applicationIdParamSchema = namedIdParamSchema('applicationId');
const interviewIdParamSchema = namedIdParamSchema('interviewId');

/**
 * Generic pagination query params shared by every list endpoint.
 */
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  idParamSchema,
  namedIdParamSchema,
  jobIdParamSchema,
  applicationIdParamSchema,
  interviewIdParamSchema,
  paginationQuerySchema,
};
