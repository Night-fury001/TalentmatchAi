const { prisma } = require('./prismaClient');

/**
 * Persists an entry to the ActivityLog table. Never throws — audit logging
 * failures must not break the primary request flow, so errors are swallowed
 * after being logged to the console.
 *
 * @param {object} params
 * @param {string|null} params.userId
 * @param {string} params.action - one of the ActivityAction enum values
 * @param {string} [params.entityType]
 * @param {string} [params.entityId]
 * @param {string} params.description
 * @param {import('express').Request} [params.req] - used to capture IP/User-Agent
 * @param {object} [params.metadata]
 */
async function logActivity({ userId = null, action, entityType, entityId, description, req, metadata }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
        ipAddress: req ? req.ip : undefined,
        userAgent: req ? req.headers['user-agent'] : undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[activityLogger] Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity };
