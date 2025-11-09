// API Configuration
// Sử dụng absolute URL trực tiếp - backend đã được cấu hình CORS
// Nếu gặp lỗi CORS, hãy đảm bảo backend cho phép origin từ frontend
const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://imeeet.onrender.com';

// Luôn dùng absolute URL - backend cần được cấu hình CORS đúng
export const API_BASE_URL = backendUrl;

// Debug: Log API_BASE_URL để kiểm tra
console.log('[API Config] API_BASE_URL:', API_BASE_URL);

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
