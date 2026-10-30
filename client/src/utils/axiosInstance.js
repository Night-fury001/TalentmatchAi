import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken, triggerAuthFailure } from './tokenStore';

const api = axios.create({
  // Defaults to same-origin '/api' (works with the Vite dev proxy and with
  // the single-service production deployment where Express serves the
  // built frontend). Set VITE_API_BASE_URL at build time to point at a
  // separately-hosted API instead (e.g. the frontend on Vercel/Netlify,
  // the API on Render/Railway/a VPS).
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  // Coalesce concurrent 401s into a single refresh call.
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh-token')
      .then((res) => {
        const token = res.data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthRoute =
      config?.url?.includes('/auth/login') ||
      config?.url?.includes('/auth/register') ||
      config?.url?.includes('/auth/refresh-token');

    if (response?.status === 401 && !config._retry && !isAuthRoute) {
      config._retry = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch (refreshErr) {
        clearAccessToken();
        triggerAuthFailure();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

/** Unwraps our backend's { success, statusCode, message, data } envelope. */
export const unwrap = async (promise) => {
  const res = await promise;
  return res.data.data;
};

/** Extracts a human-readable message from an axios/ApiError response. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || err?.message || fallback;
}

/** Extracts field-level validation errors (422) as { field: message }. */
export function getFieldErrors(err) {
  const errors = err?.response?.data?.errors;
  if (!Array.isArray(errors)) return {};
  return errors.reduce((acc, e) => {
    if (e.field) acc[e.field] = e.message;
    return acc;
  }, {});
}

export default api;
