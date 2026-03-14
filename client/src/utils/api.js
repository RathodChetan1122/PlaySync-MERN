import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/api`,
  withCredentials: true,
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('playsync_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;