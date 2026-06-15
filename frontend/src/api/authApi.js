import apiClient from '../lib/apiClient';

export const registerUser = async (payload) => {
  const response = await apiClient.post('/register', payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await apiClient.post('/login', payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const verifyEmail = async (payload) => {
  const response = await apiClient.post('/verify-email', payload);
  return response.data;
};

export const resendVerification = async (payload) => {
  const response = await apiClient.post('/resend-verification', payload);
  return response.data;
};

export const forgotPassword = async (payload) => {
  const response = await apiClient.post('/forgot-password', payload);
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await apiClient.post('/reset-password', payload);
  return response.data;
};
