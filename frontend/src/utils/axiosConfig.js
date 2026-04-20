import axios from 'axios';

// Create a custom instance or just intercept the global axios object
// But since the project uses global `axios` imports everywhere, 
// intercepting the global one is the most effective approach.

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, handle logout globally if preferred
      // For now, returning the error to be handled by local catch blocks
      if (window.location.pathname.startsWith('/admin')) {
        // Optionally redirect to login
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
