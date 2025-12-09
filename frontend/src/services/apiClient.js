import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect to login for actual 401 responses
    if (error.response && error.response.status === 401) {
      console.warn('🚨 Authentication failed (401), redirecting to login');
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('oauth2User');
      
      // Redirect to login
      const publicPaths = ['/login', '/', '/signup', '/forgot-password'];
      const currentPath = window.location.pathname;
      
      if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }
    
    // Log CORS and other errors for debugging but don't redirect
    if (error.message === 'Network Error' || error.code === 'CORS') {
      console.warn('⚠️ CORS or Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
