const { z } = require('zod');

const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

module.exports = { recommendationsQuerySchema };
