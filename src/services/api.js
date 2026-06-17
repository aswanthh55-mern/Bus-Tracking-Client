import axios from 'axios';

const defaultApiUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://bus-tracking-server-s751.onrender.com';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || defaultApiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authorization expiration
api.interceptors.response.use(
  (response) => {
    // Check if the response is HTML (Vercel SPA rewrite fallback)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      return Promise.reject(new Error('Expected JSON response, but received HTML. Check VITE_API_URL config.'));
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear localStorage and redirect to login if unauthorized
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
