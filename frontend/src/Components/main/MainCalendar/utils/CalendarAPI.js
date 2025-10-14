// API service module
const API_BASE_URL = 'http://localhost:8081/api';

export const calendarAPI = {
  // Lấy tất cả meetings
  async getAllMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch meetings');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getAllMeetings:', error);
      throw error;
    }
  },

  // Lấy meetings theo khoảng thời gian
  async getMeetingsByDateRange(startDate, endDate) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/meetings/date-range?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch meetings by date range');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getMeetingsByDateRange:', error);
      throw error;
    }
  },

  // Lấy meetings hôm nay
  async getMeetingsToday() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/today`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch today meetings');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getMeetingsToday:', error);
      throw error;
    }
  },

  // Lấy upcoming meetings
  async getUpcomingMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/upcoming`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch upcoming meetings');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getUpcomingMeetings:', error);
      throw error;
    }
  },

  // Lấy meeting theo ID
  async getMeetingById(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch meeting');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API Error - getMeetingById:', error);
      throw error;
    }
  },

  // Tạo meeting mới
  async createMeeting(meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create meeting');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API Error - createMeeting:', error);
      throw error;
    }
  },

  // Cập nhật meeting
  async updateMeeting(meetingId, meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update meeting');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API Error - updateMeeting:', error);
      throw error;
    }
  },

  // Xóa meeting
  async deleteMeeting(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete meeting');
      }
      return true;
    } catch (error) {
      console.error('API Error - deleteMeeting:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái meeting
  async updateMeetingStatus(meetingId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update meeting status');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API Error - updateMeetingStatus:', error);
      throw error;
    }
  },

  // Kiểm tra phòng có trống không
  async checkRoomAvailability(roomId, startTime, endTime) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/meetings/check-availability?roomId=${roomId}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to check room availability');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API Error - checkRoomAvailability:', error);
      throw error;
    }
  },

  // Tìm kiếm meetings
  async searchMeetings(title) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/search?title=${encodeURIComponent(title)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to search meetings');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - searchMeetings:', error);
      throw error;
    }
  },
};