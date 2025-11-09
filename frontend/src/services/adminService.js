import { API_BASE_URL } from '../constants/api';

class AdminService {
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

  // Lấy danh sách users với phân trang
  async getUsers(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDir
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not fetch users:', error.message);
      throw error;
    }
  }

  // Lấy thông tin chi tiết user
  async getUserById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not fetch user:', error.message);
      throw error;
    }
  }

  // Tạo user mới
  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not create user:', error.message);
      throw error;
    }
  }

  // Cập nhật user
  async updateUser(id, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not update user:', error.message);
      throw error;
    }
  }

  // Xóa user
  async deleteUser(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not delete user:', error.message);
      throw error;
    }
  }

  // Lấy thống kê users
  async getUserStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not fetch user stats:', error.message);
      throw error;
    }
  }

  // Tạo admin user
  async createAdmin(email = 'admin@imeet.com', password = 'admin123', username = 'admin', fullName = 'System Administrator') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/create-admin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, username, fullName })
      });

      if (!response.ok) {
        // Try to parse JSON error body, otherwise include raw text for diagnostics
        let errBody = null;
        try {
          errBody = await response.json();
          throw new Error(errBody.message || JSON.stringify(errBody) || `HTTP error! status: ${response.status}`);
        } catch (e) {
          try {
            const txt = await response.text();
            throw new Error(txt || `HTTP error! status: ${response.status}`);
          } catch (e2) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not create admin:', error.message);
      throw error;
    }
  }

  // Kiểm tra admin user
  async checkAdmin() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/check-admin`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not check admin:', error.message);
      throw error;
    }
  }

  // ===== ROOM MANAGEMENT METHODS =====
  
  // Lấy tất cả phòng
  async getRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      // Backend wraps response in ApiResponse { success, message, data }
      return json.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch rooms:', error.message);
      throw error;
    }
  }

  // Tạo phòng mới
  async createRoom(roomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        // Try to parse JSON error body, otherwise include raw text for diagnostics
        try {
          const errBody = await response.json();
          throw new Error(errBody.message || JSON.stringify(errBody) || `HTTP error! status: ${response.status}`);
        } catch (e) {
          try {
            const txt = await response.text();
            throw new Error(txt || `HTTP error! status: ${response.status}`);
          } catch (e2) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not create room:', error.message);
      throw error;
    }
  }

  // Cập nhật phòng
  async updateRoom(roomId, roomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not update room:', error.message);
      throw error;
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

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not delete room:', error.message);
      throw error;
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Could not fetch room:', error.message);
      throw error;
    }
  }

  // ===== DEVICE MANAGEMENT METHODS =====

  // Lấy danh sách thiết bị (admin) - TẤT CẢ không phân trang
  async getDevices() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/all`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Backend wraps responses with ApiResponse<List<DeviceResponse>> { success, message, data }
      const json = await response.json();
      // json.data should be an array of all devices
      if (!json) return [];
      const payload = json.data;
      if (!payload) return [];
      // Return the array directly
      if (Array.isArray(payload)) return payload;
      // Otherwise, return empty array as fallback
      return [];
    } catch (error) {
      console.warn('⚠️ Could not fetch devices:', error.message);
      throw error;
    }
  }

  // Tạo thiết bị mới
  async createDevice(deviceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(deviceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Backend returns ApiResponse<DeviceResponse> with structure: { success, message, data }
      const json = await response.json();
      // Return the full response so DeviceList can access json.data
      return json;
    } catch (error) {
      console.warn('⚠️ Could not create device:', error.message);
      throw error;
    }
  }

  // Cập nhật thiết bị
  async updateDevice(deviceId, deviceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(deviceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Backend returns ApiResponse<DeviceResponse> with structure: { success, message, data }
      const json = await response.json();
      // Return the full response so DeviceList can access json.data
      return json;
    } catch (error) {
      console.warn('⚠️ Could not update device:', error.message);
      throw error;
    }
  }

  // Xóa thiết bị
  async deleteDevice(deviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) return { message: 'deleted' };
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.data) return parsed.data;
        return parsed;
      } catch (e) {
        return { message: 'deleted' };
      }
    } catch (error) {
      console.warn('⚠️ Could not delete device:', error.message);
      throw error;
    }
  }
}

export default new AdminService();
