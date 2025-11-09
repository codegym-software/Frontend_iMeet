// API service module
import { API_BASE_URL } from '../../../../constants/api';
const API_BASE_URL_WITH_API = `${API_BASE_URL}/api`;

// Helper function to get headers with auth token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const calendarAPI = {
  // Lấy tất cả meetings
  async getAllMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings`, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch meetings. Status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Backend returned error:', data.message);
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings. Returning empty data.');
      return [];
    }
  },

  // Lấy meetings theo khoảng thời gian (với optional user filter)
  async getMeetingsByDateRange(startDate, endDate, userId = null) {
    try {
      // ✅ Build URL với optional userId parameter
      let url = `${API_BASE_URL_WITH_API}/meetings/date-range?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`;
      
      if (userId) {
        url += `&userId=${userId}`;
        console.log(`📅 Fetching meetings for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      } else {
        console.log(`📅 Fetching all meetings from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      }
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch meetings by date range. Status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Backend error:', data.message);
        return [];
      }
      
      console.log(`✅ Fetched ${data.data?.length || 0} meetings`);
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings by date range. Returning empty data.');
      return [];
    }
  },

  // Lấy meetings hôm nay
  async getMeetingsToday() {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/today`, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch today meetings. Status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Backend error:', data.message);
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch today meetings. Returning empty data.');
      return [];
    }
  },

  // Lấy upcoming meetings
  async getUpcomingMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/upcoming`, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch upcoming meetings. Status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Backend error:', data.message);
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch upcoming meetings. Returning empty data.');
      return [];
    }
  },

  // Lấy meeting theo ID
  async getMeetingById(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/${meetingId}`, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch meeting. Status:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Backend error:', data.message);
        return null;
      }
      
      return data.data;
    } catch (error) {
      console.warn('⚠️ Could not fetch meeting. Returning null.');
      return null;
    }
  },

  // Tạo meeting mới
  async createMeeting(meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(meetingData),
      });
      
      const data = await response.json();
      
      // Check backend success flag first
      if (data.success === false) {
        console.warn('⚠️ Could not create meeting:', data.message);
        throw new Error(data.message || 'Không thể tạo cuộc họp');
      }
      
      if (!response.ok) {
        console.warn('⚠️ Could not create meeting. Status:', response.status);
        throw new Error(data.message || 'Không thể tạo cuộc họp');
      }
      
      console.log('✅ Meeting created successfully:', data.data);
      return data.data;
    } catch (error) {
      console.warn('⚠️ Create meeting error:', error.message);
      throw error;
    }
  },

  // Cập nhật meeting
  async updateMeeting(meetingId, meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/${meetingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(meetingData),
      });
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Could not update meeting:', data.message);
        throw new Error(data.message || 'Không thể cập nhật cuộc họp');
      }
      
      if (!response.ok) {
        console.warn('⚠️ Could not update meeting. Status:', response.status);
        throw new Error(data.message || 'Không thể cập nhật cuộc họp');
      }
      
      console.log('✅ Meeting updated successfully:', data.data);
      return data.data;
    } catch (error) {
      console.warn('⚠️ Update meeting error:', error.message);
      throw error;
    }
  },

  // Xóa meeting
  async deleteMeeting(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/${meetingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders(),
      });
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Could not delete meeting:', data.message);
        throw new Error(data.message || 'Không thể xóa cuộc họp');
      }
      
      if (!response.ok) {
        console.warn('⚠️ Could not delete meeting. Status:', response.status);
        throw new Error(data.message || 'Không thể xóa cuộc họp');
      }
      
      console.log('✅ Meeting deleted successfully');
      return true;
    } catch (error) {
      console.warn('⚠️ Delete meeting error:', error.message);
      throw error;
    }
  },

  // Cập nhật trạng thái meeting
  async updateMeetingStatus(meetingId, status) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/${meetingId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: getHeaders(),
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
        `${API_BASE_URL_WITH_API}/meetings/check-availability?roomId=${roomId}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
        {
          credentials: 'include',
          headers: getHeaders(),
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
      const response = await fetch(`${API_BASE_URL_WITH_API}/meetings/search?title=${encodeURIComponent(title)}`, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.warn('⚠️ Could not search meetings. Status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        console.warn('⚠️ Backend error:', data.message);
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not search meetings. Returning empty data.');
      return [];
    }
  },
};