import api, { unwrap } from '../utils/axiosInstance';

export const taxonomyService = {
  getCategories: () => unwrap(api.get('/taxonomy/categories')),
  getLocations: () => unwrap(api.get('/taxonomy/locations')),
  getSkills: () => unwrap(api.get('/taxonomy/skills')),
};
