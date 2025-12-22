import { useState, useEffect, useCallback } from 'react';
import googleCalendarService from '../services/googleCalendarService';

/**
 * Hook để quản lý trạng thái kết nối Google Calendar
 */
export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Kiểm tra trạng thái kết nối
   */
  const checkConnectionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await googleCalendarService.getConnectionStatus();
      
      if (response.success && response.data) {
        setIsConnected(response.data.connected || false);
        // Lấy email từ response, hoặc từ localStorage nếu không có
        const email = response.data.email || null;
        setConnectedEmail(email);
      } else {
        setIsConnected(false);
        setConnectedEmail(null);
      }
    } catch (err) {
      console.error('Error checking Google Calendar connection:', err);
      setError(err.message || 'Không thể kiểm tra trạng thái kết nối');
      setIsConnected(false);
      setConnectedEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Kết nối Google Calendar - lấy URL OAuth và chuyển hướng
   */
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear các flags cũ trước khi bắt đầu kết nối mới (để đảm bảo có thể kết nối lại)
      const oldConnecting = localStorage.getItem('calendar_connecting');
      // Nếu flag cũ tồn tại quá lâu (hơn 5 phút), coi như đã hết hạn và clear
      if (oldConnecting === 'true') {
        const connectingTime = localStorage.getItem('calendar_connecting_time');
        if (connectingTime) {
          const timeDiff = Date.now() - parseInt(connectingTime);
          // Nếu quá 5 phút, clear flag và cho phép kết nối lại
          if (timeDiff > 5 * 60 * 1000) {
            localStorage.removeItem('calendar_connecting');
            localStorage.removeItem('calendar_connecting_time');
          } else {
            // Nếu vẫn trong thời gian hợp lệ, có thể đang trong quá trình kết nối
            console.warn('Google Calendar connection may be in progress');
            // Vẫn tiếp tục để user có thể thử lại nếu cần
          }
        }
      }
      
      const response = await googleCalendarService.getAuthUrl();
      
      if (response.success && response.data?.authUrl) {
        // Set flag và timestamp trước khi redirect
        localStorage.setItem('calendar_connecting', 'true');
        localStorage.setItem('calendar_connecting_time', Date.now().toString());
        // Chuyển hướng đến trang OAuth Google
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Không thể lấy URL xác thực');
      }
    } catch (err) {
      // Clear flag nếu có lỗi
      localStorage.removeItem('calendar_connecting');
      localStorage.removeItem('calendar_connecting_time');
      console.error('Error connecting to Google Calendar:', err);
      setError(err.message || 'Không thể kết nối Google Calendar');
      setLoading(false);
      throw err;
    }
    // Note: Không set loading = false ở đây vì đã redirect
  }, []);

  /**
   * Ngắt kết nối Google Calendar
   */
  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await googleCalendarService.disconnect();
      
      if (response.success) {
        setIsConnected(false);
        setConnectedEmail(null);
        return response.message;
      } else {
        throw new Error('Không thể ngắt kết nối');
      }
    } catch (err) {
      console.error('Error disconnecting Google Calendar:', err);
      setError(err.message || 'Không thể ngắt kết nối Google Calendar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Kiểm tra trạng thái khi component mount
  // Chỉ check status, không tự động trigger kết nối
  useEffect(() => {
    // Đợi một chút để đảm bảo các flags đã được xử lý xong
    const timer = setTimeout(() => {
      checkConnectionStatus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [checkConnectionStatus]);

  return {
    isConnected,
    connectedEmail,
    loading,
    error,
    connect,
    disconnect,
    refreshStatus: checkConnectionStatus
  };
};

