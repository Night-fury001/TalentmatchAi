import api, { unwrap } from '../utils/axiosInstance';

export const adminActivityService = {
  listActivityLogs: (params) => unwrap(api.get('/admin/activity-logs', { params })),
};
