import api, { unwrap } from '../utils/axiosInstance';

export const adminCompanyService = {
  listCompanies: (params) => unwrap(api.get('/admin/companies', { params })),
  verifyCompany: (id) => unwrap(api.patch(`/admin/companies/${id}/verify`)),
  rejectCompany: (id, verificationNote) =>
    unwrap(api.patch(`/admin/companies/${id}/reject`, { verificationNote })),
};
