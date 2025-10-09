const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

class RoomService {
  // Lấy token từ localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Headers với authentication
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    };
  }

  // Mapping status từ frontend sang backend
  mapStatusToBackend(frontendStatus) {
    const statusMap = {
      'available': 'AVAILABLE',
      'booked': 'BOOKED', 
      'in-use': 'IN_USE',
      'maintenance': 'MAINTENANCE'
    };
    return statusMap[frontendStatus] || 'AVAILABLE';
  }

  // Mapping status từ backend sang frontend
  mapStatusToFrontend(backendStatus) {
    const statusMap = {
      'AVAILABLE': 'available',
      'BOOKED': 'booked',
      'IN_USE': 'in-use',
      'MAINTENANCE': 'maintenance'
    };
    return statusMap[backendStatus] || 'available';
  }

  // Mapping room data từ backend sang frontend
  mapRoomFromBackend(backendRoom) {
    return {
      id: backendRoom.roomId,
      name: backendRoom.name,
      location: backendRoom.location,
      capacity: backendRoom.capacity,
      status: this.mapStatusToFrontend(backendRoom.status),
      selectedDevices: [],
      description: backendRoom.description || '',
      createdAt: backendRoom.createdAt ? backendRoom.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      updatedAt: backendRoom.updatedAt
    };
  }

  // Mapping room data từ frontend sang backend
  mapRoomToBackend(frontendRoom) {
    // Ensure capacity is an integer or null so backend validation can catch missing values
    let capacity = null;
    if (frontendRoom.capacity !== '' && frontendRoom.capacity !== null && frontendRoom.capacity !== undefined) {
      const num = Number(String(frontendRoom.capacity).trim());
      if (Number.isFinite(num) && Number.isInteger(num)) {
        capacity = num;
      } else {
        capacity = null;
      }
    }

    const payload = {
      name: frontendRoom.name ? frontendRoom.name.trim() : null,
      location: frontendRoom.location ? frontendRoom.location.trim() : null,
      capacity: capacity,
      description: frontendRoom.description ? frontendRoom.description.trim() : null,
      // Include selected device IDs if present (backend currently ignores devices but keep for future)
      selectedDevices: Array.isArray(frontendRoom.selectedDevices) ? frontendRoom.selectedDevices : []
    };

    // Include status when present (for updates)
    if (frontendRoom.status) {
      payload.status = this.mapStatusToBackend(frontendRoom.status);
    }

    return payload;
  }

  // Lấy tất cả phòng
  async getAllRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: apiResponse.data.map(room => this.mapRoomFromBackend(room)),
          message: apiResponse.message
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi lấy danh sách phòng');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Lấy phòng theo ID
  async getRoomById(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy phòng');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: this.mapRoomFromBackend(apiResponse.data),
          message: apiResponse.message
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi lấy thông tin phòng');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Tạo phòng mới
  async createRoom(roomData) {
    try {
      const backendData = this.mapRoomToBackend(roomData);
      
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: this.mapRoomFromBackend(apiResponse.data),
          message: apiResponse.message || 'Tạo phòng thành công'
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi tạo phòng');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Cập nhật phòng
  async updateRoom(roomId, roomData) {
    try {
      const backendData = this.mapRoomToBackend(roomData);
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: this.mapRoomFromBackend(apiResponse.data),
          message: apiResponse.message || 'Cập nhật phòng thành công'
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi cập nhật phòng');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Gán thiết bị cho phòng (RoomDevice)
  async assignDeviceToRoom(roomId, deviceId, quantityAssigned = 1, notes = '') {
    try {
      const body = { roomId, deviceId, quantityAssigned, notes };
      const response = await fetch(`${API_BASE_URL}/api/room-devices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error((err && err.message) || `HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      if (apiResponse.success) {
        return { success: true, data: apiResponse.data, message: apiResponse.message };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi gán thiết bị cho phòng');
      }
    } catch (error) {
      console.error('Error assigning device to room:', error);
      return { success: false, error: error.message };
    }
  }

  // Lấy danh sách thiết bị đã gán cho phòng
  async getDevicesByRoom(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/room-devices/room/${roomId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      if (apiResponse.success) {
        return { success: true, data: apiResponse.data, message: apiResponse.message };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi lấy thiết bị của phòng');
      }
    } catch (error) {
      console.error('Error getting devices by room:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Xóa gán thiết bị theo roomDeviceId
  async removeRoomDevice(roomDeviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/room-devices/${roomDeviceId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error((err && err.message) || `HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      if (apiResponse.success) {
        return { success: true, message: apiResponse.message };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi xóa gán thiết bị');
      }
    } catch (error) {
      console.error('Error removing room device:', error);
      return { success: false, error: error.message };
    }
  }

  // Cập nhật trạng thái phòng
  async updateRoomStatus(roomId, status) {
    try {
      const backendStatus = this.mapStatusToBackend(status);
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: backendStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: this.mapRoomFromBackend(apiResponse.data),
          message: apiResponse.message || 'Cập nhật trạng thái phòng thành công'
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi cập nhật trạng thái phòng');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Xóa phòng
  async deleteRoom(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          message: apiResponse.message || 'Xóa phòng thành công'
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi xóa phòng');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy phòng theo trạng thái
  async getRoomsByStatus(status) {
    try {
      const backendStatus = this.mapStatusToBackend(status);
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/status/${backendStatus}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: apiResponse.data.map(room => this.mapRoomFromBackend(room)),
          message: apiResponse.message
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi lấy danh sách phòng theo trạng thái');
      }
    } catch (error) {
      console.error('Error fetching rooms by status:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Lấy phòng có sẵn
  async getAvailableRooms() {
    return this.getRoomsByStatus('available');
  }

  // Lấy phòng theo sức chứa
  async getRoomsByCapacity(minCapacity) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/capacity/${minCapacity}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: apiResponse.data.map(room => this.mapRoomFromBackend(room)),
          message: apiResponse.message
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi lấy danh sách phòng theo sức chứa');
      }
    } catch (error) {
      console.error('Error fetching rooms by capacity:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Tìm kiếm phòng
  async searchRooms(searchTerm) {
    try {
      const params = new URLSearchParams({ search: searchTerm });
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/search?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.success) {
        return {
          success: true,
          data: apiResponse.data.map(room => this.mapRoomFromBackend(room)),
          message: apiResponse.message
        };
      } else {
        throw new Error(apiResponse.message || 'Lỗi khi tìm kiếm phòng');
      }
    } catch (error) {
      console.error('Error searching rooms:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export default new RoomService();