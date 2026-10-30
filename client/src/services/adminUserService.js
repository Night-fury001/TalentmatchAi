import api, { unwrap } from '../utils/axiosInstance';

export const adminUserService = {
  listUsers: (params) => unwrap(api.get('/admin/users', { params })),
  toggleUserActive: (id, isActive) => unwrap(api.patch(`/admin/users/${id}/status`, { isActive })),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),
};
