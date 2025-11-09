import apiClient from './apiClient';

const meetingService = {
  // Get all meetings
  getAllMeetings: async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching meetings with token');
      
      const response = await apiClient.get('/api/meetings');
      
      // Backend returns ApiResponse {success, message, data}
      // ✅ Backend now always returns 200 OK with ApiResponse in body
      // Check if response indicates success
      if (response.data && response.data.success === false) {
        console.warn('⚠️ Backend returned error:', response.data.message);
        return [];
      }
      
      // Return data array, or empty array if no data
      const meetings = response.data?.data || [];
      console.log('✅ Meetings fetched:', meetings.length);
      return meetings;
    } catch (error) {
      // Handle all errors gracefully - don't throw, just warn and return empty
      const status = error.response?.status || 'Network Error';
      
      // ✅ Try to parse error response from backend
      let errorMessage = '';
      let errorData = null;
      if (error.response?.data) {
        errorData = error.response.data;
        // Backend might return error in ApiResponse format (even with 500 status)
        if (errorData.success === false && errorData.message) {
          // ✅ Backend returned ApiResponse format
          errorMessage = errorData.message;
          console.warn('⚠️ Backend returned error (ApiResponse format):', errorMessage);
          return [];
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      // Log error details for debugging
      if (status === 500) {
        console.warn(`⚠️ Meetings endpoint returned 500`);
        if (errorMessage) {
          console.warn(`Error message: ${errorMessage}`);
        }
        if (errorData) {
          console.warn('Error response:', errorData);
        }
      } else {
        console.warn(`⚠️ Could not fetch meetings. Status: ${status}. Error: ${errorMessage || error.message}`);
      }
      
      return [];
    }
  },

  // Get meeting by ID
  getMeetingById: async (meetingId) => {
    try {
      const response = await apiClient.get(`/api/meetings/${meetingId}`);
      return response.data.data || null;
    } catch (error) {
      console.warn('⚠️ Could not fetch meeting. Returning null. Status:', error.response?.status || 'Network Error');
      return null;
    }
  },

  // Delete/Cancel meeting
  cancelMeeting: async (meetingId) => {
    try {
      const url = `/api/meetings/${meetingId}`;
      const response = await apiClient.delete(url);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('⚠️ Could not cancel meeting. Status:', error.response?.status || 'Network Error');
      return { success: false, message: error.response?.data?.message || 'Failed to cancel meeting' };
    }
  },

  // Update meeting status
  updateMeetingStatus: async (meetingId, status) => {
    try {
      const response = await apiClient.patch(`/api/meetings/${meetingId}/status`, { status });
      return response.data.data || response.data;
    } catch (error) {
      console.warn('⚠️ Could not update meeting status. Status:', error.response?.status || 'Network Error');
      return { success: false, message: error.response?.data?.message || 'Failed to update status' };
    }
  },

  // Get meetings by status
  getMeetingsByStatus: async (status) => {
    try {
      const statusEnum = status.toUpperCase();
      const response = await apiClient.get(`/api/meetings/status/${statusEnum}`);
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings by status. Returning empty data.');
      return [];
    }
  },

  // Get meetings by room
  getMeetingsByRoom: async (roomId) => {
    try {
      const response = await apiClient.get(`/api/meetings/room/${roomId}`);
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings by room. Returning empty data.');
      return [];
    }
  },

  // Get meetings by user
  getMeetingsByUser: async (userId) => {
    try {
      const response = await apiClient.get(`/api/meetings/user/${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings by user. Returning empty data.');
      return [];
    }
  },

  // Get upcoming meetings
  getUpcomingMeetings: async () => {
    try {
      const response = await apiClient.get('/api/meetings/upcoming');
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch upcoming meetings. Returning empty data.');
      return [];
    }
  },

  // Get today's meetings
  getMeetingsToday: async () => {
    try {
      const response = await apiClient.get('/api/meetings/today');
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch today meetings. Returning empty data.');
      return [];
    }
  },

  // Search meetings by title
  searchMeetingsByTitle: async (title) => {
    try {
      const response = await apiClient.get('/api/meetings/search', {
        params: { title }
      });
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not search meetings. Returning empty data.');
      return [];
    }
  },

  // Get meetings by date range
  getMeetingsByDateRange: async (startTime, endTime) => {
    try {
      const response = await apiClient.get('/api/meetings/date-range', {
        params: { startTime, endTime }
      });
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings by date range. Returning empty data.');
      return [];
    }
  },

  // Check room availability
  checkRoomAvailability: async (roomId, startTime, endTime) => {
    try {
      const response = await apiClient.get('/api/meetings/check-availability', {
        params: { roomId, startTime, endTime }
      });
      return response.data.data;
    } catch (error) {
      console.warn('⚠️ Could not check room availability. Returning null.');
      return null;
    }
  },

  // Get room schedule
  getRoomSchedule: async (roomId, startTime, endTime) => {
    try {
      const response = await apiClient.get(`/api/meetings/room-schedule/${roomId}`, {
        params: { startTime, endTime }
      });
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch room schedule. Returning empty data.');
      return [];
    }
  }
};

export default meetingService;
