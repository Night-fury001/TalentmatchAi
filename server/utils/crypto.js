const crypto = require('crypto');

/**
 * Generates a cryptographically secure random token (hex string).
 * The RAW token is what gets emailed/returned to the user; only its
 * SHA-256 hash is ever persisted to the database.
 */
function generateRawToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Deterministic one-way hash used to look up raw tokens (email verification,
 * password reset, refresh token rotation) without storing them in plaintext.
 */
function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = { generateRawToken, sha256Hex };
