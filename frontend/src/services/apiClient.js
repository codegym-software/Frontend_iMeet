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
    // Check if response is a redirect to Cognito (CORS error indicates redirect)
    // or if it's a 401 Unauthorized error
    if (error.message === 'Network Error' || 
        (error.response && error.response.status === 401) ||
        (error.config && error.config.url && error.config.url.includes('cognito'))) {
      
      console.warn('Authentication error detected, clearing auth data and redirecting to login');
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('oauth2User');
      
      // Redirect to login only if not already on login page
      if (window.location.pathname !== '/login' && 
          window.location.pathname !== '/' &&
          window.location.pathname !== '/signup' &&
          window.location.pathname !== '/forgot-password') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
