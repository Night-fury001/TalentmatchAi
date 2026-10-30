/**
 * Dot product of two equal-length numeric vectors.
 */
function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

function magnitude(a) {
  return Math.sqrt(dot(a, a));
}

/**
 * Cosine similarity between two vectors, clamped to [0, 1]. Real-world
 * sentence embeddings for semantically related text are almost always
 * positively correlated, so a negative raw cosine is treated as "no
 * meaningful similarity" (0) rather than passed through as a negative
 * score, which would be confusing in a 0-100 match percentage.
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  const similarity = dot(a, b) / denom;
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Mean-pools a matrix of token-level embeddings (shape [tokens][dims])
 * into a single sentence-level vector (shape [dims]). Used when the
 * Hugging Face Inference API returns per-token embeddings rather than an
 * already-pooled sentence embedding.
 */
function meanPool(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];
  const dims = matrix[0].length;
  const result = new Array(dims).fill(0);
  for (const vector of matrix) {
    for (let i = 0; i < dims; i += 1) result[i] += vector[i];
  }
  for (let i = 0; i < dims; i += 1) result[i] /= matrix.length;
  return result;
}

module.exports = { cosineSimilarity, meanPool, dot, magnitude };
