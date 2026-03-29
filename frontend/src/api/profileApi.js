import apiClient from '../lib/apiClient';

export const getProfile = async () => {
  const response = await apiClient.get('/profile');
  return response.data;
};

export const upsertProfile = async (payload) => {
  const response = await apiClient.post('/profile', payload);
  return response.data;
};

export const uploadResume = async (formData) => {
  const response = await apiClient.post('/resume-upload', formData);
  return response.data;
};
