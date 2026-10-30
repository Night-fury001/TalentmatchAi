import api, { unwrap } from '../utils/axiosInstance';

export const recruiterJobService = {
  getMyJobs: (params) => unwrap(api.get('/recruiter/jobs', { params })),
  getJobById: (id) => unwrap(api.get(`/recruiter/jobs/${id}`)),
  createJob: (payload) => unwrap(api.post('/recruiter/jobs', payload)),
  updateJob: (id, payload) => unwrap(api.put(`/recruiter/jobs/${id}`, payload)),
  updateJobStatus: (id, status) => unwrap(api.patch(`/recruiter/jobs/${id}/status`, { status })),
  deleteJob: (id) => unwrap(api.delete(`/recruiter/jobs/${id}`)),
};
