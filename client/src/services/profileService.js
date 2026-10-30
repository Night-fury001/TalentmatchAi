import api, { unwrap } from '../utils/axiosInstance';

export const profileService = {
  getProfile: () => unwrap(api.get('/client/profile')),
  updateProfile: (payload) => unwrap(api.put('/client/profile', payload)),

  uploadResume: (file, onProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    return unwrap(
      api.post('/client/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
    );
  },
  deleteResume: () => unwrap(api.delete('/client/profile/resume')),

  uploadAvatar: (file, onProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return unwrap(
      api.post('/client/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
    );
  },
  deleteAvatar: () => unwrap(api.delete('/client/profile/avatar')),

  addEducation: (payload) => unwrap(api.post('/client/educations', payload)),
  updateEducation: (id, payload) => unwrap(api.put(`/client/educations/${id}`, payload)),
  deleteEducation: (id) => unwrap(api.delete(`/client/educations/${id}`)),

  addExperience: (payload) => unwrap(api.post('/client/experiences', payload)),
  updateExperience: (id, payload) => unwrap(api.put(`/client/experiences/${id}`, payload)),
  deleteExperience: (id) => unwrap(api.delete(`/client/experiences/${id}`)),

  addProject: (payload) => unwrap(api.post('/client/projects', payload)),
  updateProject: (id, payload) => unwrap(api.put(`/client/projects/${id}`, payload)),
  deleteProject: (id) => unwrap(api.delete(`/client/projects/${id}`)),

  addCertification: (payload) => unwrap(api.post('/client/certifications', payload)),
  updateCertification: (id, payload) => unwrap(api.put(`/client/certifications/${id}`, payload)),
  deleteCertification: (id) => unwrap(api.delete(`/client/certifications/${id}`)),

  addSkill: (payload) => unwrap(api.post('/client/skills', payload)),
  updateSkill: (id, payload) => unwrap(api.put(`/client/skills/${id}`, payload)),
  removeSkill: (id) => unwrap(api.delete(`/client/skills/${id}`)),
};
