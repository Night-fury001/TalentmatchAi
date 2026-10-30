/**
 * Prisma Client Singleton
 * Ensures only one PrismaClient instance exists per process (prevents
 * exhausting SQLite/DB connections during nodemon hot-reloads).
 */
const { PrismaClient } = require('@prisma/client');

const logLevels =
  process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.__prisma = prisma;
}

/**
 * Verifies the database connection is reachable. Call once at server boot.
 */
async function connectDatabase() {
  await prisma.$connect();
}

/**
 * Disconnects Prisma cleanly. Call during graceful shutdown.
 */
async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
