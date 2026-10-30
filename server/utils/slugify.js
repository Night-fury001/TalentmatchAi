/**
 * Converts arbitrary text into a URL-safe slug.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Generates a slug guaranteed to be unique for the given Prisma model,
 * appending "-2", "-3", etc. on collision. `excludeId` lets an update
 * operation regenerate a slug without colliding with its own prior value.
 *
 * @param {object} model - a Prisma delegate, e.g. prisma.job
 * @param {string} sourceText - text to slugify (e.g. job title)
 * @param {string} [excludeId] - id to exclude from the collision check
 */
async function generateUniqueSlug(model, sourceText, excludeId = null) {
  const base = slugify(sourceText);
  let slug = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = excludeId ? { slug, NOT: { id: excludeId } } : { slug };
    // eslint-disable-next-line no-await-in-loop
    const existing = await model.findFirst({ where });
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

module.exports = { slugify, generateUniqueSlug };
