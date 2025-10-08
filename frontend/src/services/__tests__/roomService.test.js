import roomService from '../roomService';

// Mock fetch để test mà không cần gọi API thực
global.fetch = jest.fn();

describe('RoomService', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Status Mapping', () => {
    test('should map frontend status to backend correctly', () => {
      expect(roomService.mapStatusToBackend('available')).toBe('AVAILABLE');
      expect(roomService.mapStatusToBackend('booked')).toBe('BOOKED');
      expect(roomService.mapStatusToBackend('in-use')).toBe('IN_USE');
      expect(roomService.mapStatusToBackend('maintenance')).toBe('MAINTENANCE');
      expect(roomService.mapStatusToBackend('invalid')).toBe('AVAILABLE'); // fallback
    });

    test('should map backend status to frontend correctly', () => {
      expect(roomService.mapStatusToFrontend('AVAILABLE')).toBe('available');
      expect(roomService.mapStatusToFrontend('BOOKED')).toBe('booked');
      expect(roomService.mapStatusToFrontend('IN_USE')).toBe('in-use');
      expect(roomService.mapStatusToFrontend('MAINTENANCE')).toBe('maintenance');
      expect(roomService.mapStatusToFrontend('INVALID')).toBe('available'); // fallback
    });
  });

  describe('Room Data Mapping', () => {
    test('should map backend room data to frontend format', () => {
      const backendRoom = {
        roomId: 1,
        name: 'Test Room',
        location: 'Floor 1',
        capacity: 10,
        status: 'AVAILABLE',
        description: 'Test description',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      };

      const frontendRoom = roomService.mapRoomFromBackend(backendRoom);

      expect(frontendRoom).toEqual({
        id: 1,
        name: 'Test Room',
        location: 'Floor 1',
        capacity: 10,
        status: 'available',
        selectedDevices: [],
        description: 'Test description',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01T00:00:00'
      });
    });

    test('should map frontend room data to backend format', () => {
      const frontendRoom = {
        name: 'Test Room  ',
        location: '  Floor 1  ',
        capacity: '10',
        description: '  Test description  '
      };

      const backendRoom = roomService.mapRoomToBackend(frontendRoom);

      expect(backendRoom).toEqual({
        name: 'Test Room',
        location: 'Floor 1',
        capacity: 10,
        description: 'Test description'
      });
    });
  });

  describe('API Calls', () => {
    test('getAllRooms should return success response', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            roomId: 1,
            name: 'Test Room',
            location: 'Floor 1',
            capacity: 10,
            status: 'AVAILABLE',
            description: 'Test description',
            createdAt: '2024-01-01T00:00:00'
          }
        ],
        message: 'Success'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await roomService.getAllRooms();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8081/api/rooms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].status).toBe('available');
    });

    test('createRoom should return success response', async () => {
      const mockResponse = {
        success: true,
        data: {
          roomId: 1,
          name: 'New Room',
          location: 'Floor 2',
          capacity: 8,
          status: 'AVAILABLE',
          description: 'New room description',
          createdAt: '2024-01-01T00:00:00'
        },
        message: 'Room created successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const roomData = {
        name: 'New Room',
        location: 'Floor 2',
        capacity: '8',
        description: 'New room description'
      };

      const result = await roomService.createRoom(roomData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8081/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          name: 'New Room',
          location: 'Floor 2',
          capacity: 8,
          description: 'New room description'
        })
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });

    test('updateRoom should return success response', async () => {
      const mockResponse = {
        success: true,
        data: {
          roomId: 1,
          name: 'Updated Room',
          location: 'Floor 1',
          capacity: 12,
          status: 'AVAILABLE',
          description: 'Updated description',
          createdAt: '2024-01-01T00:00:00'
        },
        message: 'Room updated successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const roomData = {
        name: 'Updated Room',
        location: 'Floor 1',
        capacity: '12',
        description: 'Updated description'
      };

      const result = await roomService.updateRoom(1, roomData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8081/api/rooms/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          name: 'Updated Room',
          location: 'Floor 1',
          capacity: 12,
          description: 'Updated description'
        })
      });

      expect(result.success).toBe(true);
    });

    test('deleteRoom should return success response', async () => {
      const mockResponse = {
        success: true,
        message: 'Room deleted successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await roomService.deleteRoom(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8081/api/rooms/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result.success).toBe(true);
    });

    test('should handle API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      const result = await roomService.getAllRooms();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(result.data).toEqual([]);
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await roomService.getAllRooms();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.data).toEqual([]);
    });
  });

  describe('Search and Filter', () => {
    test('searchRooms should call correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: [],
        message: 'Search completed'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await roomService.searchRooms('test search');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8081/api/rooms/search?search=test+search', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      });
    });

    test('getRoomsByStatus should map status correctly', async () => {
      const mockResponse = {
        success: true,
        data: [],
        message: 'Success'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await roomService.getRoomsByStatus('available');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8081/api/rooms/status/AVAILABLE', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      });
    });
  });
});