import axios from 'axios';
import { API_URL } from '../config.js';
import { useAuthStore } from '../stores/authStore.js';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

const flushQueue = (error) => {
  queue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/login') && !original.url.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
        flushQueue();
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError);
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
