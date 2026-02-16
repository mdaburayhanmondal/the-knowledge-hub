import axios from 'axios';

// DRY Base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
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
    return Promise.reject(error);
  },
);

export default api;
