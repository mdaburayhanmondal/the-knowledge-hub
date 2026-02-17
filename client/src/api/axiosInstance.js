import axios from 'axios';

// DRY Base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3000',
  withCredentials: true,
});

// REQUEST INTERCEPTOR: Runs automatically before every API call
api.interceptors.request.use(
  (config) => {
    // Grab the token from browser storage
    const token = localStorage.getItem('token');

    // If token exists, 'inject' it into the Headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
