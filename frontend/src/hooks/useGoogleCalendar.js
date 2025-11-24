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
        setConnectedEmail(response.data.email || null);
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
      const response = await googleCalendarService.getAuthUrl();
      
      if (response.success && response.data?.authUrl) {
        // Chuyển hướng đến trang OAuth Google
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Không thể lấy URL xác thực');
      }
    } catch (err) {
      console.error('Error connecting to Google Calendar:', err);
      setError(err.message || 'Không thể kết nối Google Calendar');
      throw err;
    } finally {
      setLoading(false);
    }
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
  useEffect(() => {
    checkConnectionStatus();
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

