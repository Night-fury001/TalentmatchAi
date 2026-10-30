import api, { unwrap } from '../utils/axiosInstance';

export const adminDashboardService = {
  getAdminDashboard: () => unwrap(api.get('/admin/dashboard')),
};
