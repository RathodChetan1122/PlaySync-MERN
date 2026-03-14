import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL
    ? `${process.env.REACT_APP_SERVER_URL}/api`
    : '/api',
  withCredentials: true,
});

// Attach token on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('playsync_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
