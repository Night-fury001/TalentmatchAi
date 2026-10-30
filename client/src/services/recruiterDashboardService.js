import api, { unwrap } from '../utils/axiosInstance';

export const recruiterDashboardService = {
  getRecruiterDashboard: () => unwrap(api.get('/recruiter/dashboard')),
};
