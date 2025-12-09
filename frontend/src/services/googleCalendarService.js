import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

/**
 * Service để quản lý kết nối Google Calendar
 */
const googleCalendarService = {
  /**
   * Lấy URL OAuth để kết nối Google Calendar
   * @returns {Promise<{success: boolean, data: {authUrl: string}}>}
   */
  getAuthUrl: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR.AUTH_URL);
      return {
        success: response.data.success,
        data: {
          authUrl: response.data.authUrl
        }
      };
    } catch (error) {
      console.error('Error getting Google Calendar auth URL:', error);
      throw {
        success: false,
        message: error.response?.data?.error || 'Không thể lấy URL xác thực Google Calendar'
      };
    }
  },

  /**
   * Kiểm tra trạng thái kết nối Google Calendar
   * @returns {Promise<{success: boolean, data: {connected: boolean, calendarSyncEnabled: boolean, email?: string}}>}
   */
  getConnectionStatus: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR.STATUS);
      
      // Lấy email từ localStorage user data nếu connected
      let email = null;
      if (response.data.connected) {
        const userData = localStorage.getItem('user') || localStorage.getItem('oauth2User');
        if (userData) {
          const user = JSON.parse(userData);
          email = user.email;
        }
      }
      
      return {
        success: response.data.success,
        data: {
          connected: response.data.connected,
          calendarSyncEnabled: response.data.calendarSyncEnabled,
          email: email
        }
      };
    } catch (error) {
      // Nếu chưa đăng nhập hoặc có lỗi, trả về trạng thái chưa kết nối
      if (error.response?.status === 401 || error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        return {
          success: true,
          data: {
            connected: false,
            calendarSyncEnabled: false,
            email: null
          }
        };
      }
      console.error('Error getting Google Calendar connection status:', error);
      throw {
        success: false,
        message: error.response?.data?.error || 'Không thể kiểm tra trạng thái kết nối'
      };
    }
  },

  /**
   * Ngắt kết nối Google Calendar
   * @returns {Promise<{success: boolean, message: string}>}
   */
  disconnect: async () => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.GOOGLE_CALENDAR.DISCONNECT);
      return {
        success: response.data.success,
        message: response.data.message || 'Đã ngắt kết nối Google Calendar thành công'
      };
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw {
        success: false,
        message: error.response?.data?.error || 'Không thể ngắt kết nối Google Calendar'
      };
    }
  },

  /**
   * Xử lý callback sau khi OAuth thành công
   * @param {string} code - Authorization code từ Google
   * @param {string} state - State parameter for security
   * @returns {Promise<{success: boolean, message: string, user: object}>}
   */
  handleCallback: async (code, state) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR.CALLBACK, {
        params: { code, state }
      });
      return {
        success: response.data.success,
        message: response.data.message || 'Kết nối Google Calendar thành công',
        user: {
          userId: response.data.userId,
          email: response.data.email,
          calendarSyncEnabled: response.data.calendarSyncEnabled
        }
      };
    } catch (error) {
      console.error('Error handling Google Calendar callback:', error);
      throw {
        success: false,
        message: error.response?.data?.error || 'Không thể hoàn tất kết nối Google Calendar'
      };
    }
  },

  /**
   * Đồng bộ meeting lên Google Calendar ngay lập tức
   * @param {number} meetingId - ID của meeting cần đồng bộ
   * @returns {Promise<{success: boolean, message: string, eventId: string, eventLink: string}>}
   */
  syncMeetingNow: async (meetingId) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR.SYNC_NOW, null, {
        params: { meetingId }
      });
      return {
        success: response.data.success,
        message: response.data.message || 'Đã đồng bộ meeting lên Google Calendar',
        eventId: response.data.eventId,
        eventLink: response.data.eventLink
      };
    } catch (error) {
      console.error('Error syncing meeting to Google Calendar:', error);
      throw {
        success: false,
        message: error.response?.data?.error || 'Không thể đồng bộ meeting'
      };
    }
  }
};

export default googleCalendarService;

