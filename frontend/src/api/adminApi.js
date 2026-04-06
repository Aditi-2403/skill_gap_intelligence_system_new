import apiClient from '../lib/apiClient';

export const getAdminDashboard = async () => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
};

export const deleteAdminStudent = async (studentId) => {
  const response = await apiClient.delete(`/admin/students/${studentId}`);
  return response.data;
};
