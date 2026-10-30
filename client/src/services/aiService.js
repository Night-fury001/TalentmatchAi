import api, { unwrap } from '../utils/axiosInstance';

export const aiService = {
  getJobMatch: (jobId) => unwrap(api.get(`/client/jobs/${jobId}/match`)),
  getRecommendations: (params) => unwrap(api.get('/client/recommendations', { params })),
};
