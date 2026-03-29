import apiClient from '../lib/apiClient';

export const registerUser = async (payload) => {
  const response = await apiClient.post('/register', payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await apiClient.post('/token', payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};
