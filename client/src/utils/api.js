import axios from 'axios';

const BASE = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('playsync_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
