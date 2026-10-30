import api, { unwrap } from '../utils/axiosInstance';

export const applicationService = {
  getMyApplications: (params) => unwrap(api.get('/client/applications', { params })),
  getApplicationById: (id) => unwrap(api.get(`/client/applications/${id}`)),
  withdrawApplication: (id) => unwrap(api.patch(`/client/applications/${id}/withdraw`)),
  getApplicationAnalysis: (id) => unwrap(api.get(`/client/applications/${id}/analysis`)),
};
