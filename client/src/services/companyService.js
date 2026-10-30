import api, { unwrap } from '../utils/axiosInstance';

export const companyService = {
  getMyCompanies: () => unwrap(api.get('/recruiter/companies')),
  getCompanyById: (id) => unwrap(api.get(`/recruiter/companies/${id}`)),
  createCompany: (payload) => unwrap(api.post('/recruiter/companies', payload)),
  updateCompany: (id, payload) => unwrap(api.put(`/recruiter/companies/${id}`, payload)),
  uploadLogo: (id, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return unwrap(
      api.post(`/recruiter/companies/${id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};
