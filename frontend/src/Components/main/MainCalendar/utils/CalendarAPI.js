// API service module
const API_BASE_URL = 'http://localhost:8081/api';

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
      const response = await fetch(`${API_BASE_URL}/meetings`, {
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

  // Lấy cuộc họp theo phòng
  async getMeetingsByRoom(roomId, signal) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/room/${roomId}`, {
        credentials: 'include',
        headers: getHeaders(),
        signal,
      });
      if (!response.ok) {
        console.warn('⚠️ Could not fetch meetings by room. Status:', response.status);
        return [];
      }
      const data = await response.json();
      if (data.success === false) {
        console.warn('⚠️ Backend error (meetings by room):', data.message);
        return [];
      }
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch meetings by room. Returning empty data.');
      return [];
    }
  },

  // Lấy meetings theo khoảng thời gian (với optional user filter)
  async getMeetingsByDateRange(startDate, endDate, userId = null) {
    try {
      // ✅ Build URL với optional userId parameter
      let url = `${API_BASE_URL}/meetings/date-range?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`;
      
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

  // Lấy meetings hôm nay (với optional user filter)
  async getMeetingsToday(userId = null) {
    try {
      let url = `${API_BASE_URL}/meetings/today`;
      
      if (userId) {
        url += `?userId=${userId}`;
        console.log(`📅 Fetching today meetings for user ${userId}`);
      } else {
        console.log(`📅 Fetching all today meetings`);
      }
      
      const response = await fetch(url, {
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

  // Lấy upcoming meetings (với optional user filter)
  async getUpcomingMeetings(userId = null) {
    try {
      let url = `${API_BASE_URL}/meetings/upcoming`;
      
      if (userId) {
        url += `?userId=${userId}`;
        console.log(`📅 Fetching upcoming meetings for user ${userId}`);
      } else {
        console.log(`📅 Fetching all upcoming meetings`);
      }
      
      const response = await fetch(url, {
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
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
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

  // Mời người tham gia vào meeting
  async inviteParticipants(meetingId, inviteRequest) {
    try {
      console.log('📧 Inviting participants to meeting:', meetingId, inviteRequest);
      
      // Ensure inviteRequest has the correct structure
      const requestBody = {
        emails: inviteRequest.emails || [],
        message: inviteRequest.message || null
      };
      
      console.log('📧 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });
      
      // Try to parse response as JSON
      let data;
      try {
        const text = await response.text();
        console.log('📧 Response text:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse invite response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (data.success === false) {
        console.error('❌ Backend error:', data.message);
        throw new Error(data.message || 'Không thể mời người tham gia');
      }
      
      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Successfully invited participants:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Invite participants error:', error);
      throw error;
    }
  },

  // Lấy danh sách invitees của meeting
  async getMeetingInvitees(meetingId) {
    try {
      console.log('📧 Fetching invitees for meeting:', meetingId);
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/invitees`, {
        credentials: 'include',
        headers: getHeaders(),
      });
      
      // Nếu meeting không tồn tại (404), trả về empty array
      if (response.status === 404) {
        console.warn('⚠️ Meeting not found or no invitees for meeting:', meetingId);
        return [];
      }
      
      if (!response.ok) {
        console.warn('⚠️ Could not fetch invitees. Status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      // Nếu backend trả về error (meeting không tồn tại), trả về empty array
      if (data.success === false) {
        console.warn('⚠️ Backend error:', data.message);
        // Nếu là lỗi "không tìm thấy meeting", trả về empty array
        if (data.message && data.message.includes('Không tìm thấy cuộc họp')) {
          return [];
        }
        return [];
      }
      
      // Trả về danh sách invitees (có thể rỗng)
      const invitees = data.data || [];
      console.log('✅ Loaded invitees:', invitees.length, 'items');
      return invitees;
    } catch (error) {
      console.warn('⚠️ Could not fetch invitees. Returning empty array.', error);
      return [];
    }
  },

  // Tạo meeting mới
  async createMeeting(meetingData) {
    try {
      console.log('📤 Creating meeting with data:', meetingData);
      
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(meetingData),
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      // Get response text first (can only read once)
      const responseText = await response.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON. Response text:', responseText.substring(0, 200));
        throw new Error(`Server response is not valid JSON. Status: ${response.status}`);
      }
      console.log('📥 Response data:', data);
      
      // Check backend success flag first
      if (data.success === false) {
        console.warn('⚠️ Backend returned error:', data.message);
        throw new Error(data.message || 'Không thể tạo cuộc họp');
      }
      
      if (!response.ok) {
        console.warn('⚠️ HTTP error. Status:', response.status);
        throw new Error(data.message || `HTTP ${response.status}: Không thể tạo cuộc họp`);
      }
      
      if (!data.data) {
        console.warn('⚠️ Response missing data field:', data);
        throw new Error('Response không chứa dữ liệu meeting');
      }
      
      console.log('✅ Meeting created successfully:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Create meeting error:', error);
      // Re-throw with more context
      if (error.message) {
        throw error;
      } else {
        throw new Error('Lỗi không xác định khi tạo cuộc họp: ' + error.toString());
      }
    }
  },

  // Cập nhật meeting
  async updateMeeting(meetingId, meetingData) {
    try {
      console.log('📤 Updating meeting:', meetingId, meetingData);
      
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(meetingData),
      });
      
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (data.success === false) {
        console.error('❌ Backend error:', data.message);
        throw new Error(data.message || 'Không thể cập nhật cuộc họp');
      }
      
      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Meeting updated successfully:', data.data);
      return {
        meeting: data.data,
        message: data.message || 'Cập nhật cuộc họp thành công'
      };
    } catch (error) {
      console.error('❌ Update meeting error:', error);
      throw error;
    }
  },

  // Xóa meeting
  async deleteMeeting(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders(),
      });
      
      let data = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse delete response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      if (data.success === false) {
        console.warn('⚠️ Could not delete meeting:', data.message);
        throw new Error(data.message || 'Không thể xóa cuộc họp');
      }
      
      if (!response.ok) {
        console.warn('⚠️ Could not delete meeting. Status:', response.status);
        throw new Error(data.message || 'Không thể xóa cuộc họp');
      }
      
      console.log('✅ Meeting deleted successfully');
      return {
        success: true,
        message: data.message || 'Hủy cuộc họp thành công'
      };
    } catch (error) {
      console.warn('⚠️ Delete meeting error:', error.message);
      throw error;
    }
  },

  // Cập nhật trạng thái meeting
  async updateMeetingStatus(meetingId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/status`, {
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

  // Kiểm tra phòng có trống không (hỗ trợ excludeMeetingId khi đang sửa)
  async checkRoomAvailability(roomId, startTime, endTime, excludeMeetingId = null) {
    try {
      const formatLocalDateTime = (date) => {
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      const start = formatLocalDateTime(startTime);
      const end = formatLocalDateTime(endTime);
      const excludeParam = excludeMeetingId != null ? `&excludeMeetingId=${excludeMeetingId}` : '';
      const response = await fetch(
        `${API_BASE_URL}/meetings/check-availability?roomId=${roomId}&startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}${excludeParam}`,
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
      const response = await fetch(`${API_BASE_URL}/meetings/search?title=${encodeURIComponent(title)}`, {
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

  // Tải file ICS cho meeting
  async downloadICS(meetingId) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/download-ics`, {
        method: 'GET',
        credentials: 'include',
        headers: headers,
      });

      if (!response.ok) {
        // Nếu response không phải là ICS file, thử parse JSON error
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tải file lịch');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Lấy filename từ Content-Disposition header hoặc tạo mặc định
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `meeting-${meetingId}.ics`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Lấy nội dung file
      const blob = await response.blob();
      
      // Tạo URL object và trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ ICS file downloaded successfully:', filename);
      return { success: true, filename };
    } catch (error) {
      console.error('❌ Download ICS error:', error);
      throw error;
    }
  },
};