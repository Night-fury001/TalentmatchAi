import api, { unwrap } from '../utils/axiosInstance';

export const authService = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  logout: () => unwrap(api.post('/auth/logout')),
  refreshToken: () => unwrap(api.post('/auth/refresh-token')),
  forgotPassword: (payload) => unwrap(api.post('/auth/forgot-password', payload)),
  resetPassword: (token, payload) => unwrap(api.post(`/auth/reset-password/${token}`, payload)),
  changePassword: (payload) => unwrap(api.post('/auth/change-password', payload)),
  verifyEmail: (token) => unwrap(api.get(`/auth/verify-email/${token}`)),
  resendVerification: () => unwrap(api.post('/auth/resend-verification')),
  getMe: () => unwrap(api.get('/auth/me')),
};
