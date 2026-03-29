import axios from 'axios';

const inferredBaseUrl =
  typeof window !== 'undefined' && window.location.port === '5174'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : '';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || inferredBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
