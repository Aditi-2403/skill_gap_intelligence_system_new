import axios from 'axios';

const inferLocalApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  const port = window.location.port || '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const isViteDevPort = /^517\d$/.test(port);
  if (!isLocalHost || !isViteDevPort) return '';
  return `${window.location.protocol}//127.0.0.1:8000`;
};

const inferredBaseUrl = inferLocalApiBaseUrl();
const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: configuredBaseUrl || inferredBaseUrl,
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
    if (!error?.response) {
      error.message = 'Unable to reach server. Please check backend connection and try again.';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
