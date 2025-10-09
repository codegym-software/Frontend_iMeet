import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import roomService from '../../services/roomService';

// Tạo Context
const DataPreloaderContext = createContext();

// Hook để sử dụng context
export const usePreloadedData = () => {
  const context = useContext(DataPreloaderContext);
  if (!context) {
    throw new Error('usePreloadedData phải được sử dụng trong DataPreloaderProvider');
  }
  return context;
};

// Provider Component
export const DataPreloaderProvider = ({ children }) => {
  // Users data
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalElements, setUsersTotalElements] = useState(0);
  const [usersCurrentPage, setUsersCurrentPage] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);

  // Devices data
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  // Rooms data
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Global loading state
  const [isPreloading, setIsPreloading] = useState(true);

  // Normalize backend device object to frontend shape
  const normalizeDevice = useCallback((d, deviceTypes = []) => {
    if (!d) return null;
    const id = d.deviceId ?? d.id ?? d.device_id ?? null;
    const name = d.name ?? '';
    const quantity = d.quantity ?? 0;
    const description = d.description ?? '';
    
    let deviceTypeName = '';
    if (d.deviceType) {
      if (typeof d.deviceType === 'string') {
        const enumVal = d.deviceType;
        const enumToDisplay = {
          MIC: 'Mic', CAM: 'Cam', LAPTOP: 'Laptop', BANG: 'Bảng', MAN_HINH: 'Màn hình', MAY_CHIEU: 'Máy chiếu', KHAC: 'Khác'
        };
        deviceTypeName = enumToDisplay[enumVal] || enumToDisplay[String(enumVal).toUpperCase()] || d.deviceType;
      } else if (typeof d.deviceType === 'object') {
        deviceTypeName = d.deviceType.displayName ?? d.deviceType.name ?? String(d.deviceType);
      } else {
        deviceTypeName = String(d.deviceType);
      }
    } else if (d.deviceTypeName) {
      deviceTypeName = d.deviceTypeName;
    }

    const typeObj = deviceTypes.find(t => String(t.name).toLowerCase() === String(deviceTypeName).toLowerCase());
    const deviceTypeId = typeObj ? typeObj.id : (d.deviceTypeId ?? null);
    const createdAt = d.createdAt ?? d.createdAtString ?? d.created_at ?? new Date().toISOString();
    
    return { 
      id, 
      name, 
      deviceTypeId, 
      deviceTypeName: deviceTypeName || (typeObj ? typeObj.name : ''), 
      quantity, 
      description, 
      createdAt 
    };
  }, []);

  // Load users
  const loadUsers = useCallback(async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', search = '') => {
    try {
      setUsersLoading(true);
      const response = await adminService.getUsers(page, size, sortBy, sortDir, search);
      
      setUsers(response.users || []);
      setUsersTotalPages(response.totalPages || 0);
      setUsersTotalElements(response.totalElements || 0);
      setUsersCurrentPage(response.currentPage || 0);
      
      return response;
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      throw error;
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load user stats
  const loadUserStats = useCallback(async () => {
    try {
      const response = await adminService.getUserStats();
      setUserStats(response);
      return response;
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats(null);
      throw error;
    }
  }, []);

  // Load devices
  const loadDevices = useCallback(async (deviceTypes = []) => {
    try {
      setDevicesLoading(true);
      const list = await adminService.getDevices();
      const normalized = Array.isArray(list) ? list.map(d => normalizeDevice(d, deviceTypes)).filter(Boolean) : [];
      setDevices(normalized);
      return normalized;
    } catch (error) {
      console.error('Error loading devices:', error);
      setDevices([]);
      throw error;
    } finally {
      setDevicesLoading(false);
    }
  }, [normalizeDevice]);

  // Load rooms
  const loadRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      const result = await roomService.getAllRooms();
      
      if (result && result.success) {
        const roomsList = result.data || [];
        
        // Enrich each room with selectedDevices
        try {
          const devicePromises = roomsList.map(r => {
            const roomId = r.id || r.roomId;
            return roomService.getDevicesByRoom(roomId);
          });
          const deviceResponses = await Promise.all(devicePromises);
          const enriched = roomsList.map((r, idx) => {
            const resp = deviceResponses[idx];
            const ids = (resp && resp.success && Array.isArray(resp.data)) 
              ? resp.data.map(x => Number(x.deviceId)) 
              : [];
            return { ...r, selectedDevices: ids };
          });
          console.log('Rooms enriched with devices:', enriched);
          setRooms(enriched);
          return enriched;
        } catch (enrichErr) {
          console.warn('Failed to enrich rooms with devices:', enrichErr);
          // Still set rooms with empty selectedDevices array
          const roomsWithEmptyDevices = roomsList.map(r => ({ ...r, selectedDevices: [] }));
          setRooms(roomsWithEmptyDevices);
          return roomsWithEmptyDevices;
        }
      } else {
        setRooms([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
      throw error;
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // Preload all data on mount
  useEffect(() => {
    const preloadAllData = async () => {
      setIsPreloading(true);
      
      try {
        // Load all data in parallel
        await Promise.all([
          loadUsers(),
          loadUserStats(),
          loadDevices(),
          loadRooms()
        ]);
      } catch (error) {
        console.error('Error preloading data:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadAllData();
  }, [loadUsers, loadUserStats, loadDevices, loadRooms]);

  const value = {
    // Users
    users,
    userStats,
    usersTotalPages,
    usersTotalElements,
    usersCurrentPage,
    usersLoading,
    loadUsers,
    loadUserStats,
    setUsers,
    setUserStats,
    
    // Devices
    devices,
    devicesLoading,
    loadDevices,
    setDevices,
    
    // Rooms
    rooms,
    roomsLoading,
    loadRooms,
    setRooms,
    
    // Global
    isPreloading
  };

  return (
    <DataPreloaderContext.Provider value={value}>
      {children}
    </DataPreloaderContext.Provider>
  );
};

export default DataPreloaderContext;
