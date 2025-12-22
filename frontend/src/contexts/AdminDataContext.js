// Admin Data Context - Global cache for admin resources
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import adminService from '../services/adminService';
import roomService from '../services/roomService';

const AdminDataContext = createContext();

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};

export const AdminDataProvider = ({ children }) => {
  console.log('🟢 AdminDataProvider is rendering!');
  
  // State for each resource
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  
  // ✅ Track if data has been loaded - ONLY LOAD ONCE!
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Cache timestamps
  const [lastFetchUsers, setLastFetchUsers] = useState(null);
  const [lastFetchRooms, setLastFetchRooms] = useState(null);
  const [lastFetchDevices, setLastFetchDevices] = useState(null);
  
  const CACHE_DURATION = 60000; // 60 seconds cache

  // ==================== USERS ====================
  const fetchUsers = useCallback(async (forceRefresh = false, page = 0, size = 100) => {
    const now = Date.now();
    if (!forceRefresh && lastFetchUsers && (now - lastFetchUsers) < CACHE_DURATION) {
      console.log('✅ Using cached users');
      return users;
    }

    try {
      setLoadingUsers(true);
      const response = await adminService.getUsers(page, size);
      const usersData = response.data?.content || response.data || [];
      setUsers(usersData);
      setLastFetchUsers(now);
      console.log('✅ Users fetched:', usersData.length);
      return usersData;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    } finally {
      setLoadingUsers(false);
    }
  }, [lastFetchUsers, users]);

  const addUser = useCallback((newUser) => {
    console.log('➕ Optimistically adding user');
    setUsers(prev => [newUser, ...prev]);
    setLastFetchUsers(Date.now());
  }, []);

  const updateUser = useCallback((updatedUser) => {
    console.log('✏️ Optimistically updating user:', updatedUser.userId);
    setUsers(prev => prev.map(u => u.userId === updatedUser.userId ? updatedUser : u));
    setLastFetchUsers(Date.now());
  }, []);

  const deleteUser = useCallback((userId) => {
    console.log('🗑️ Optimistically deleting user:', userId);
    setUsers(prev => prev.filter(u => u.userId !== userId));
    setLastFetchUsers(Date.now());
  }, []);

  // ==================== ROOMS ====================
  const fetchRooms = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && lastFetchRooms && (now - lastFetchRooms) < CACHE_DURATION) {
      console.log('✅ Using cached rooms');
      return rooms;
    }

    try {
      setLoadingRooms(true);
      const response = await roomService.getAllRooms();
      const roomsData = response.data || [];
      setRooms(roomsData);
      setLastFetchRooms(now);
      console.log('✅ Rooms fetched:', roomsData.length);
      return roomsData;
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      return [];
    } finally {
      setLoadingRooms(false);
    }
  }, [lastFetchRooms, rooms]);

  const addRoom = useCallback((newRoom) => {
    console.log('➕ Optimistically adding room');
    setRooms(prev => [newRoom, ...prev]);
    setLastFetchRooms(Date.now());
  }, []);

  const updateRoom = useCallback((updatedRoom) => {
    console.log('✏️ Optimistically updating room:', updatedRoom.roomId);
    setRooms(prev => prev.map(r => r.roomId === updatedRoom.roomId ? updatedRoom : r));
    setLastFetchRooms(Date.now());
  }, []);

  const deleteRoom = useCallback((roomId) => {
    console.log('🗑️ Optimistically deleting room:', roomId);
    setRooms(prev => prev.filter(r => r.roomId !== roomId));
    setLastFetchRooms(Date.now());
  }, []);

  // ==================== DEVICES ====================
  const fetchDevices = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && lastFetchDevices && (now - lastFetchDevices) < CACHE_DURATION) {
      console.log('✅ Using cached devices');
      return devices;
    }

    try {
      setLoadingDevices(true);
      const devicesData = await adminService.getDevices();
      setDevices(devicesData || []);
      setLastFetchDevices(now);
      console.log('✅ Devices fetched:', devicesData?.length || 0);
      return devicesData;
    } catch (error) {
      console.error('❌ Error fetching devices:', error);
      return [];
    } finally {
      setLoadingDevices(false);
    }
  }, [lastFetchDevices, devices]);

  const addDevice = useCallback((newDevice) => {
    console.log('➕ Optimistically adding device');
    setDevices(prev => [newDevice, ...prev]);
    setLastFetchDevices(Date.now());
  }, []);

  const updateDevice = useCallback((updatedDevice) => {
    console.log('✏️ Optimistically updating device:', updatedDevice.deviceId);
    setDevices(prev => prev.map(d => d.deviceId === updatedDevice.deviceId ? updatedDevice : d));
    setLastFetchDevices(Date.now());
  }, []);

  const deleteDevice = useCallback((deviceId) => {
    console.log('🗑️ Optimistically deleting device:', deviceId);
    setDevices(prev => prev.filter(d => d.deviceId !== deviceId));
    setLastFetchDevices(Date.now());
  }, []);

  // ==================== DEVICE TYPES ====================
  const fetchDeviceTypes = useCallback(async () => {
    try {
      const types = await adminService.getDeviceTypes();
      setDeviceTypes(types || []);
      return types;
    } catch (error) {
      console.error('❌ Error fetching device types:', error);
      return [];
    }
  }, []);

  // ✅ Initial data load ONLY ONCE - No refetch when switching pages!
  useEffect(() => {
    // Skip if already loaded
    if (isDataLoaded) {
      console.log('📦 Admin data already loaded from cache - skip fetch');
      return;
    }
    
    console.log('🚀 AdminDataContext: Loading initial data...');
    const loadInitialData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchRooms(),
        fetchDevices(),
        fetchDeviceTypes()
      ]);
      setIsDataLoaded(true); // ✅ Mark as loaded
      console.log('✅ Admin data loaded and cached!');
    };
    loadInitialData();
  }, [isDataLoaded, fetchUsers, fetchRooms, fetchDevices, fetchDeviceTypes]);

  const value = {
    // Data loaded flag
    isDataLoaded,
    
    // Users
    users,
    loadingUsers,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    
    // Rooms
    rooms,
    loadingRooms,
    fetchRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    
    // Devices
    devices,
    loadingDevices,
    fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    
    // Device Types
    deviceTypes,
    fetchDeviceTypes
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export default AdminDataContext;

