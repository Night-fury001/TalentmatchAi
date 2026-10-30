import api, { unwrap } from '../utils/axiosInstance';

export const adminJobService = {
  listJobs: (params) => unwrap(api.get('/admin/jobs', { params })),
  flagJob: (id, flagReason) => unwrap(api.patch(`/admin/jobs/${id}/flag`, { flagReason })),
  resolveJobFlag: (id, action) => unwrap(api.patch(`/admin/jobs/${id}/resolve-flag`, { action })),
};
