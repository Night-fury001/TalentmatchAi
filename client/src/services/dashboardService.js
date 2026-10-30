import api, { unwrap } from '../utils/axiosInstance';

export const dashboardService = {
  getClientDashboard: () => unwrap(api.get('/client/dashboard')),
};
