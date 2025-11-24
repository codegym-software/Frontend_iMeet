import apiClient from './apiClient';

/**
 * Service để quản lý kết nối Google Calendar
 * Các API này sẽ được implement ở backend sau
 */
const googleCalendarService = {
  /**
   * Lấy URL OAuth để kết nối Google Calendar
   * @returns {Promise<{success: boolean, data: {authUrl: string}}>}
   */
  getAuthUrl: async () => {
    try {
      const response = await apiClient.get('/api/google-calendar/auth-url');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error getting Google Calendar auth URL:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy URL xác thực Google Calendar'
      };
    }
  },

  /**
   * Kiểm tra trạng thái kết nối Google Calendar
   * @returns {Promise<{success: boolean, data: {connected: boolean, email?: string}}>}
   */
  getConnectionStatus: async () => {
    try {
      const response = await apiClient.get('/api/google-calendar/status');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      // Nếu API chưa có, trả về trạng thái chưa kết nối
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        return {
          success: true,
          data: {
            connected: false
          }
        };
      }
      console.error('Error getting Google Calendar connection status:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Không thể kiểm tra trạng thái kết nối'
      };
    }
  },

  /**
   * Ngắt kết nối Google Calendar
   * @returns {Promise<{success: boolean, message: string}>}
   */
  disconnect: async () => {
    try {
      const response = await apiClient.post('/api/google-calendar/disconnect');
      return {
        success: true,
        message: response.data.message || 'Đã ngắt kết nối Google Calendar thành công'
      };
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Không thể ngắt kết nối Google Calendar'
      };
    }
  },

  /**
   * Xử lý callback sau khi OAuth thành công
   * @param {string} code - Authorization code từ Google
   * @returns {Promise<{success: boolean, message: string}>}
   */
  handleCallback: async (code) => {
    try {
      const response = await apiClient.post('/api/google-calendar/callback', { code });
      return {
        success: true,
        message: response.data.message || 'Kết nối Google Calendar thành công'
      };
    } catch (error) {
      console.error('Error handling Google Calendar callback:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Không thể hoàn tất kết nối Google Calendar'
      };
    }
  }
};

export default googleCalendarService;

