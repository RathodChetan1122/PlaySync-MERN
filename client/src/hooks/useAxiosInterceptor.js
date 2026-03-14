import { useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Sets up a global Axios response interceptor.
 * Shows toast on 500 errors and handles 401 by clearing storage.
 */
export function useAxiosInterceptor() {
  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        const status = err.response?.status;
        if (status === 500) {
          toast.error('Server error. Please try again.');
        }
        if (status === 401) {
          // Token expired — clear and redirect
          localStorage.removeItem('playsync_token');
          delete axios.defaults.headers.common['Authorization'];
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);
}
