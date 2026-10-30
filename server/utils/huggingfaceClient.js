const axios = require('axios');
const { meanPool } = require('./vectorMath');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

const MAX_INPUT_CHARS = 2000;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * The API is considered "configured" only when a real-looking key is
 * present — the .env.example ships a placeholder value, so a server
 * running with that placeholder untouched should fall back to
 * skill-based scoring rather than firing doomed HTTP requests.
 */
const isConfigured = Boolean(HF_API_KEY && !HF_API_KEY.startsWith('hf_replace'));

/**
 * The Hugging Face Inference API's response shape for feature-extraction
 * varies by model/runtime: some models return an already-pooled sentence
 * vector (number[]), others return per-token vectors (number[][]) that
 * need mean pooling, and batched requests add another array dimension.
 * This normalizes all three shapes into a single flat vector.
 */
function normalizeEmbedding(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const first = raw[0];
  if (typeof first === 'number') {
    return raw; // already a flat, pooled sentence embedding
  }
  if (Array.isArray(first)) {
    const second = first[0];
    if (typeof second === 'number') {
      return meanPool(raw); // token-level embeddings for one input -> pool them
    }
    if (Array.isArray(second)) {
      return meanPool(raw[0]); // batched response -> take first input's token embeddings
    }
  }
  return null;
}

/**
 * Requests a sentence embedding for `text` from the configured Hugging
 * Face model. Throws if the API is unconfigured, the request fails, or
 * the response can't be normalized — callers are expected to catch this
 * and fall back to non-semantic scoring rather than surface a hard error.
 */
async function getEmbedding(text) {
  if (!isConfigured) {
    throw new Error('Hugging Face API key is not configured.');
  }

  const trimmed = (text || '').slice(0, MAX_INPUT_CHARS).trim();
  if (!trimmed) {
    throw new Error('Cannot generate an embedding for empty text.');
  }

  const response = await axios.post(
    HF_API_URL,
    { inputs: trimmed, options: { wait_for_model: true } },
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    }
  );

  const embedding = normalizeEmbedding(response.data);
  if (!embedding || embedding.length === 0) {
    throw new Error('Unexpected embedding response shape from Hugging Face API.');
  }
  return embedding;
}

module.exports = { getEmbedding, isConfigured, HF_MODEL };
