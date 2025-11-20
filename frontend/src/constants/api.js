// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_CODE: '/api/auth/verify-code',
    CHANGE_PASSWORD: '/api/auth/change-password',
    OAUTH2_USER: '/api/oauth2/user',
    OAUTH2_LOGIN: '/oauth2/authorization/cognito',
  },
  
  // User
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    UPLOAD_AVATAR: '/api/users/avatar',
  },
  
  // Admin
  ADMIN: {
    USERS: '/api/admin/users',
    DEVICES: '/api/admin/devices',
    ROOMS: '/api/admin/rooms',
    MEETINGS: '/api/admin/meetings',
  },
  
  // Meetings
  MEETINGS: {
    LIST: '/api/meetings',
    CREATE: '/api/meetings',
    UPDATE: '/api/meetings',
    DELETE: '/api/meetings',
  },
  
  // Rooms
  ROOMS: {
    LIST: '/api/rooms',
    AVAILABLE: '/api/rooms/available',
  },
};

export default API_ENDPOINTS;
