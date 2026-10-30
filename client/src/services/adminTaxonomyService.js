import api, { unwrap } from '../utils/axiosInstance';

export const adminTaxonomyService = {
  listCategories: () => unwrap(api.get('/admin/taxonomy/categories')),
  createCategory: (payload) => unwrap(api.post('/admin/taxonomy/categories', payload)),
  updateCategory: (id, payload) => unwrap(api.put(`/admin/taxonomy/categories/${id}`, payload)),
  deleteCategory: (id) => unwrap(api.delete(`/admin/taxonomy/categories/${id}`)),

  listLocations: () => unwrap(api.get('/admin/taxonomy/locations')),
  createLocation: (payload) => unwrap(api.post('/admin/taxonomy/locations', payload)),
  updateLocation: (id, payload) => unwrap(api.put(`/admin/taxonomy/locations/${id}`, payload)),
  deleteLocation: (id) => unwrap(api.delete(`/admin/taxonomy/locations/${id}`)),

  listSkills: () => unwrap(api.get('/admin/taxonomy/skills')),
  createSkill: (payload) => unwrap(api.post('/admin/taxonomy/skills', payload)),
  updateSkill: (id, payload) => unwrap(api.put(`/admin/taxonomy/skills/${id}`, payload)),
  deleteSkill: (id) => unwrap(api.delete(`/admin/taxonomy/skills/${id}`)),
};
