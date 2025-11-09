// Room API service module
import { API_BASE_URL } from '../../../../constants/api';
const API_BASE_URL_WITH_API = `${API_BASE_URL}/api`;

export const roomAPI = {
  // Lấy tất cả phòng
  async getAllRooms() {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/rooms`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.warn('⚠️ Could not fetch rooms. Status:', response.status);
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch rooms. Returning empty data.');
      return [];
    }
  },

  // Lấy phòng có sẵn (trả về tất cả phòng vì backend đã bỏ status)
  async getAvailableRooms() {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/rooms`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.warn('⚠️ Could not fetch available rooms. Status:', response.status);
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch available rooms. Returning empty data.');
      return [];
    }
  },

  // Lấy phòng theo ID
  async getRoomById(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/rooms/${roomId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.warn('⚠️ Could not fetch room. Status:', response.status);
        return null;
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.warn('⚠️ Could not fetch room. Returning null.');
      return null;
    }
  },

  // Tìm kiếm phòng
  async searchRooms(searchQuery) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/rooms/search?search=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.warn('⚠️ Could not search rooms. Status:', response.status);
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not search rooms. Returning empty data.');
      return [];
    }
  },

  // Lấy thiết bị của phòng
  async getRoomDevices(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL_WITH_API}/room-devices/room/${roomId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.warn('⚠️ Could not fetch room devices. Status:', response.status);
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch room devices. Returning empty data.');
      return [];
    }
  },
};
