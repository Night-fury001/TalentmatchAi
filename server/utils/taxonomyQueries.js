const { prisma } = require('./prismaClient');

/**
 * Returns categories. Public/anonymous callers only ever see active ones;
 * admin callers can request the full set (including deactivated entries)
 * so they can be re-activated from the admin console.
 */
async function getCategories({ includeInactive = false } = {}) {
  return prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

async function getLocations({ includeInactive = false } = {}) {
  return prisma.location.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ country: 'asc' }, { city: 'asc' }],
  });
}

async function getSkills({ includeInactive = false } = {}) {
  return prisma.skill.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

module.exports = { getCategories, getLocations, getSkills };
