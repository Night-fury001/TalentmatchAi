function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds which of the given skill names appear as whole words/phrases in
 * `text` (case-insensitive). Uses lookaround assertions instead of `\b`
 * so multi-character-class skill names like "C++" or "C#" still match
 * correctly — `\b` doesn't behave usefully around `+` or `#`.
 *
 * This is deliberately simple and deterministic (no AI call): it gives
 * the matching engine a free, always-available evidence signal to
 * complement the paid/rate-limited semantic similarity score.
 */
function extractSkillsFromText(text, skillNames) {
  if (!text || !Array.isArray(skillNames) || skillNames.length === 0) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const found = [];

  for (const name of skillNames) {
    const escaped = escapeRegExp(name.toLowerCase());
    const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (pattern.test(lowerText)) {
      found.push(name);
    }
  }

  return found;
}

module.exports = { extractSkillsFromText };
