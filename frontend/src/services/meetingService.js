import apiClient from './apiClient';

const meetingService = {
  // Get all meetings (admin / legacy use)
  getAllMeetings: async () => {
    try {
      const response = await apiClient.get('/api/meetings');
      return response.data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings. Returning empty data.', error.response?.status || 'Network Error');
      return [];
    }
  },

  // Get meetings relevant to current user
  getMeetingsForUser: async () => {
    try {
      console.log('🔗 Calling /api/meetings/my endpoint...');
      const response = await apiClient.get('/api/meetings/my');
      console.log('✅ /api/meetings/my response:', response.data);
      const data = response.data.data || [];
      console.log('📊 Meetings data received:', data);
      return data;
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings for current user. Returning empty data.', error.response?.status || 'Network Error');
      console.error('Full error:', error);
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
