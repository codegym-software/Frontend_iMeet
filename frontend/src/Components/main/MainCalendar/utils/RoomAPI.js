// Room API service module
const API_BASE_URL = 'http://localhost:8081/api';

export const roomAPI = {
  // Lấy tất cả phòng
  async getAllRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getAllRooms:', error);
      throw error;
    }
  },

  // Lấy phòng có sẵn
  async getAvailableRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/available`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch available rooms');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getAvailableRooms:', error);
      throw error;
    }
  },

  // Lấy phòng theo ID
  async getRoomById(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch room');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('API Error - getRoomById:', error);
      throw error;
    }
  },

  // Tìm kiếm phòng
  async searchRooms(searchQuery) {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/search?search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to search rooms');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - searchRooms:', error);
      throw error;
    }
  },

  // Lấy thiết bị của phòng
  async getRoomDevices(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/room-devices/room/${roomId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch room devices');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error - getRoomDevices:', error);
      throw error;
    }
  },
};
