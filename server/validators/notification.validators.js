const { z } = require('zod');

const listNotificationsQuerySchema = z.object({
  isRead: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = { listNotificationsQuerySchema };
