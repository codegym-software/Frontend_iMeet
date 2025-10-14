import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
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

const meetingService = {
  // Get all meetings
  getAllMeetings: async () => {
    try {
      const response = await axiosInstance.get('/meetings');
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  },

  // Get meeting by ID
  getMeetingById: async (meetingId) => {
    try {
      const response = await axiosInstance.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meeting:', error);
      throw error;
    }
  },

  // Delete/Cancel meeting
  cancelMeeting: async (meetingId) => {
    try {
      const response = await axiosInstance.delete(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      throw error;
    }
  },

  // Update meeting status
  updateMeetingStatus: async (meetingId, status) => {
    try {
      const response = await axiosInstance.patch(`/meetings/${meetingId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  },

  // Get meetings by status
  getMeetingsByStatus: async (status) => {
    try {
      // Convert status to uppercase for enum matching
      const statusEnum = status.toUpperCase();
      const response = await axiosInstance.get(`/meetings/status/${statusEnum}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings by status:', error);
      console.error('Status value:', status);
      console.error('API URL:', axiosInstance.defaults.baseURL);
      throw error;
    }
  },

  // Get meetings by room
  getMeetingsByRoom: async (roomId) => {
    try {
      const response = await axiosInstance.get(`/meetings/room/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings by room:', error);
      throw error;
    }
  },

  // Get meetings by user
  getMeetingsByUser: async (userId) => {
    try {
      const response = await axiosInstance.get(`/meetings/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings by user:', error);
      throw error;
    }
  },

  // Get upcoming meetings
  getUpcomingMeetings: async () => {
    try {
      const response = await axiosInstance.get('/meetings/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error);
      throw error;
    }
  },

  // Get today's meetings
  getMeetingsToday: async () => {
    try {
      const response = await axiosInstance.get('/meetings/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today meetings:', error);
      throw error;
    }
  },

  // Search meetings by title
  searchMeetingsByTitle: async (title) => {
    try {
      const response = await axiosInstance.get('/meetings/search', {
        params: { title }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching meetings:', error);
      throw error;
    }
  },

  // Get meetings by date range
  getMeetingsByDateRange: async (startTime, endTime) => {
    try {
      const response = await axiosInstance.get('/meetings/date-range', {
        params: { startTime, endTime }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings by date range:', error);
      throw error;
    }
  },

  // Check room availability
  checkRoomAvailability: async (roomId, startTime, endTime) => {
    try {
      const response = await axiosInstance.get('/meetings/check-availability', {
        params: { roomId, startTime, endTime }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  },

  // Get room schedule
  getRoomSchedule: async (roomId, startTime, endTime) => {
    try {
      const response = await axiosInstance.get(`/meetings/room-schedule/${roomId}`, {
        params: { startTime, endTime }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching room schedule:', error);
      throw error;
    }
  }
};

export default meetingService;
