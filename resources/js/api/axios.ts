import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Не трогаем 401 с эндпоинтов верификации email — они могут возвращать 401/422
    // по разным причинам, и мы не хотим убивать сессию пользователя (особенно при смене почты).
    const url = error.config?.url || '';
    const isVerificationRoute = url.includes('/email-verification/');

    if (error.response?.status === 401 && !isVerificationRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth'; // правильный путь к странице авторизации
    }
    return Promise.reject(error);
  }
);

export default api;