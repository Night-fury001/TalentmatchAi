/**
 * Access tokens are held in memory only (a module-level variable, not
 * localStorage/sessionStorage) to reduce exposure to XSS. On a full page
 * reload the token is gone and AuthContext silently re-derives a fresh
 * one from the httpOnly refresh cookie via POST /api/auth/refresh-token.
 */
let accessToken = null;
let onAuthFailure = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

/**
 * Registered once by AuthProvider so the axios interceptor can trigger a
 * logout/redirect when token refresh ultimately fails, without axiosInstance
 * needing to import React or the auth context directly.
 */
export function setOnAuthFailure(callback) {
  onAuthFailure = callback;
}

export function triggerAuthFailure() {
  if (onAuthFailure) onAuthFailure();
}
