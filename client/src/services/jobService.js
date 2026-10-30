import api, { unwrap } from '../utils/axiosInstance';

export const jobService = {
  searchJobs: (params) => unwrap(api.get('/client/jobs', { params })),
  getJobBySlug: (slug) => unwrap(api.get(`/client/jobs/${slug}`)),

  saveJob: (jobId) => unwrap(api.post(`/client/jobs/${jobId}/save`)),
  unsaveJob: (jobId) => unwrap(api.delete(`/client/jobs/${jobId}/save`)),
  getSavedJobs: (params) => unwrap(api.get('/client/saved-jobs', { params })),

  applyToJob: (jobId, payload) => unwrap(api.post(`/client/jobs/${jobId}/apply`, payload)),
};
