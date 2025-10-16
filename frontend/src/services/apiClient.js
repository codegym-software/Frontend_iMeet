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
    // Check for authentication/session errors:
    // 1. 401 Unauthorized
    // 2. Network Error (CORS from redirect)
    // 3. Failed to fetch (CORS error - session expired)
    // 4. TypeError: Failed to fetch
    const isAuthError = 
      (error.response && error.response.status === 401) ||
      error.message === 'Network Error' ||
      error.message === 'Failed to fetch' ||
      (error.name === 'TypeError' && error.message.includes('fetch'));
    
    if (isAuthError) {
      console.warn('Session expired or authentication error, redirecting to login');
      
      // Clear auth data immediately
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('oauth2User');
      
      // Redirect to login only if not already on public pages
      const publicPaths = ['/login', '/', '/signup', '/forgot-password'];
      const currentPath = window.location.pathname;
      
      if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
