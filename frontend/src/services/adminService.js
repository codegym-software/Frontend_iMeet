const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

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
      console.error('Error fetching users:', error);
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
      console.error('Error fetching user:', error);
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
      console.error('Error creating user:', error);
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
      console.error('Error updating user:', error);
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
      console.error('Error deleting user:', error);
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
      console.error('Error fetching user stats:', error);
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
      console.error('Error creating admin:', error);
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
      console.error('Error checking admin:', error);
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
      console.error('Error fetching rooms:', error);
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
      console.error('Error creating room:', error);
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
      console.error('Error updating room:', error);
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
      console.error('Error deleting room:', error);
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
      console.error('Error fetching room:', error);
      throw error;
    }
  }

  // ===== DEVICE MANAGEMENT METHODS =====

  // Lấy danh sách thiết bị (admin)
  async getDevices() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Backend wraps responses with ApiResponse<T> { success, message, data }
      const json = await response.json();
      // Expect json.data to be a page or a list. If it's a page, try to extract content
      if (!json) return [];
      const payload = json.data;
      if (!payload) return [];
      // If payload has 'content' (Page), return that; if it's an array, return it directly
      if (Array.isArray(payload)) return payload;
      if (payload.content && Array.isArray(payload.content)) return payload.content;
      // Otherwise, return empty array as fallback
      return [];
    } catch (error) {
      console.error('Error fetching devices:', error);
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
      console.error('Error creating device:', error);
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
      console.error('Error updating device:', error);
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
      console.error('Error deleting device:', error);
      throw error;
    }
  }
}

export default new AdminService();
