import api, { unwrap } from '../utils/axiosInstance';

export const pipelineService = {
  getJobApplications: (jobId, params) => unwrap(api.get(`/recruiter/jobs/${jobId}/applications`, { params })),
  getAllApplications: (params) => unwrap(api.get('/recruiter/applications', { params })),
  getApplicationDetail: (id) => unwrap(api.get(`/recruiter/applications/${id}`)),
  updateApplicationStatus: (id, payload) => unwrap(api.patch(`/recruiter/applications/${id}/status`, payload)),

  scheduleInterview: (applicationId, payload) =>
    unwrap(api.post(`/recruiter/applications/${applicationId}/interviews`, payload)),
  getApplicationInterviews: (applicationId) =>
    unwrap(api.get(`/recruiter/applications/${applicationId}/interviews`)),
  updateInterview: (id, payload) => unwrap(api.put(`/recruiter/interviews/${id}`, payload)),
  updateInterviewStatus: (id, status) => unwrap(api.patch(`/recruiter/interviews/${id}/status`, { status })),

  getApplicationAnalysis: (id) => unwrap(api.get(`/recruiter/applications/${id}/analysis`)),
  refreshApplicationAnalysis: (id) => unwrap(api.post(`/recruiter/applications/${id}/analysis/refresh`)),
};
