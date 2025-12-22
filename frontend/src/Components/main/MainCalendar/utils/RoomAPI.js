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
      const response = await fetch(`${API_BASE_URL}/rooms`, {
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
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
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
      const response = await fetch(`${API_BASE_URL}/rooms/search?search=${encodeURIComponent(searchQuery)}`, {
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

  // ✅ NEW: Lấy phòng trống theo khoảng thời gian (startTime, endTime) với các filter
  async getAvailableRoomsInRange(startTime, endTime, options = {}) {
    try {
      // Format datetime to ISO string for backend
      const startDateTime = startTime instanceof Date ? startTime.toISOString() : new Date(startTime).toISOString();
      const endDateTime = endTime instanceof Date ? endTime.toISOString() : new Date(endTime).toISOString();
      
      const params = new URLSearchParams({
        startTime: startDateTime,
        endTime: endDateTime
      });
      
      // Thêm minCapacity nếu có
      if (options.minCapacity && Number(options.minCapacity) > 0) {
        params.append('minCapacity', Number(options.minCapacity));
      }
      
      // Thêm requiredDeviceTypes nếu có
      if (options.requiredDeviceTypes && Array.isArray(options.requiredDeviceTypes) && options.requiredDeviceTypes.length > 0) {
        // Backend nhận requiredDeviceTypes là danh sách string
        options.requiredDeviceTypes.forEach(deviceType => {
          params.append('requiredDeviceTypes', deviceType);
        });
      }
      
      console.log('📡 Fetching available rooms for range:', {
        startTime: startDateTime,
        endTime: endDateTime,
        minCapacity: options.minCapacity,
        requiredDeviceTypes: options.requiredDeviceTypes
      });
      
      const response = await fetch(`${API_BASE_URL}/rooms/available-in-range?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('⚠️ Could not fetch available rooms in range. Status:', response.status, 'Error:', errorText);
        return [];
      }
      const data = await response.json();
      console.log('✅ Available rooms in range:', data.data?.length || 0, 'rooms found');
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching available rooms in range:', error);
      return [];
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
      if (!response.ok) {
        console.warn('⚠️ Could not fetch room devices. Status:', response.status);
        return [];
      }
      const data = await response.json();
      if (!data.success) {
        console.warn('⚠️ Backend error:', data.message);
        return [];
      }
      return data.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch room devices. Returning empty data.', error);
      return [];
    }
  },
};
