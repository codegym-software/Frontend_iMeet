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

  // Xử lý response và kiểm tra authentication
  async handleResponse(response) {
    // Xử lý 401 - Unauthorized
    if (response.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('oauth2User');
      
      // Chỉ redirect nếu đang ở trang admin và không phải trang login
      const isAdminPage = window.location.pathname.includes('/admin');
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (isAdminPage && !isLoginPage) {
        // Nếu đang ở trang admin, redirect đến login
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      // Không log lỗi nếu đã redirect
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not fetch users:', error.message);
      }
      throw error;
    }
  }

  // Lấy thông tin chi tiết user
  async getUserById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
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
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      return await this.handleResponse(response);
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
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      return await this.handleResponse(response);
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
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
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
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      // Không log lỗi nếu đã redirect
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not fetch user stats:', error.message);
      }
      throw error;
    }
  }

  // Tạo admin user
  async createAdmin(email = 'admin@imeet.com', password = 'admin123', username = 'admin', fullName = 'System Administrator') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/create-admin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, username, fullName }),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not create admin:', error.message);
      }
      throw error;
    }
  }

  // Kiểm tra admin user
  async checkAdmin() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/check-admin`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not check admin:', error.message);
      }
      throw error;
    }
  }

  // ===== ROOM MANAGEMENT METHODS =====
  
  // Lấy tất cả phòng
  async getRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      const json = await this.handleResponse(response);
      // Backend wraps response in ApiResponse { success, message, data }
      return json.data || [];
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not fetch rooms:', error.message);
      }
      throw error;
    }
  }

  // Tạo phòng mới
  async createRoom(roomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(roomData),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not create room:', error.message);
      }
      throw error;
    }
  }

  // Cập nhật phòng
  async updateRoom(roomId, roomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(roomData),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not update room:', error.message);
      }
      throw error;
    }
  }

  // Xóa phòng
  async deleteRoom(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not delete room:', error.message);
      }
      throw error;
    }
  }

  // Lấy phòng theo ID
  async getRoomById(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not fetch room:', error.message);
      }
      throw error;
    }
  }

  // ===== DEVICE MANAGEMENT METHODS =====

  // Lấy danh sách thiết bị (admin) - TẤT CẢ không phân trang
  async getDevices() {
    try {
      // ✅ Use /filter endpoint which returns List<DeviceResponse> instead of Page
      // Default to no filters to get all devices
      const response = await fetch(`${API_BASE_URL}/api/devices/filter`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      // Handle network errors gracefully
      if (response.status === 0 || !response.ok) {
        // Network error or failed response
        if (response.status === 0 || response.type === 'error') {
          console.warn('⚠️ Network error fetching devices - returning empty array');
          return [];
        }
      }

      // Backend returns ApiResponse<List<DeviceResponse>> { success, message, data: [...] }
      const json = await this.handleResponse(response);
      console.log('📥 getDevices response from /filter:', json);
      
      if (!json) return [];
      
      // Extract devices from response data
      const payload = json.data;
      
      if (Array.isArray(payload)) {
        return payload;
      } else if (payload && typeof payload === 'object') {
        if (payload.content && Array.isArray(payload.content)) {
          return payload.content; // Page object format fallback
        }
      }
      
      return [];
    } catch (error) {
      // Handle network errors gracefully
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_NETWORK_CHANGED') ||
          error.message.includes('NetworkError') ||
          error.message.includes('Network Error')) {
        console.warn('⚠️ Network error fetching devices - returning empty array');
        return [];
      }
      
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not fetch devices:', error.message);
      }
      // For non-network errors, still throw to let caller handle
      throw error;
    }
  }

  // Tạo thiết bị mới
  async createDevice(deviceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(deviceData),
        credentials: 'include'
      });

      // Backend returns ApiResponse<DeviceResponse> with structure: { success, message, data }
      const json = await this.handleResponse(response);
      // Return the full response so DeviceList can access json.data
      return json;
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not create device:', error.message);
      }
      throw error;
    }
  }

  // Cập nhật thiết bị
  async updateDevice(deviceId, deviceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(deviceData),
        credentials: 'include'
      });

      // Backend returns ApiResponse<DeviceResponse> with structure: { success, message, data }
      const json = await this.handleResponse(response);
      // Return the full response so DeviceList can access json.data
      return json;
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not update device:', error.message);
      }
      throw error;
    }
  }

  // Xóa thiết bị
  async deleteDevice(deviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (response.status === 204 || response.status === 200) {
      const text = await response.text();
      if (!text) return { message: 'deleted' };
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.data) return parsed.data;
        return parsed;
      } catch (e) {
        return { message: 'deleted' };
      }
      }

      return await this.handleResponse(response);
    } catch (error) {
      if (!error.message.includes('Authentication required')) {
      console.warn('⚠️ Could not delete device:', error.message);
      }
      throw error;
    }
  }
}

export default new AdminService();
