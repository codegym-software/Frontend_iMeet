import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import roomService from '../../services/roomService';
import meetingService from '../../services/meetingService';

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

  // Meetings data
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  
  // ✅ Room-Device Mappings (Pre-load 1 lần!)
  const [roomDeviceMappings, setRoomDeviceMappings] = useState({
    byRoom: {}, // { roomId: [{ deviceId, quantity, deviceName }] }
    byDevice: {}, // { deviceId: [{ roomId, quantity, roomName }] }
    raw: [] // raw mappings
  });
  const [mappingsLoading, setMappingsLoading] = useState(true);

  // Global loading state
  const [isPreloading, setIsPreloading] = useState(true);
  
  // ✅ Track if data has been loaded - ONLY LOAD ONCE!
  const [isDataLoaded, setIsDataLoaded] = useState(false);

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
  const loadUsers = useCallback(async (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc', search = '', isMounted = { current: true }) => {
    try {
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token available for loading users');
        if (isMounted.current) {
          setUsers([]);
          setUsersLoading(false);
        }
        return { users: [], totalPages: 0, totalElements: 0, currentPage: 0 };
      }

      if (isMounted.current) setUsersLoading(true);
      const response = await adminService.getUsers(page, size, sortBy, sortDir, search);
      
      if (isMounted.current) {
        setUsers(response.users || []);
        setUsersTotalPages(response.totalPages || 0);
        setUsersTotalElements(response.totalElements || 0);
        setUsersCurrentPage(response.currentPage || 0);
      }
      
      return response;
    } catch (error) {
      // Chỉ log error nếu không phải lỗi authentication
      if (!error.message.includes('Authentication required')) {
      console.error('Error loading users:', error);
      }
      if (isMounted.current) setUsers([]);
      throw error;
    } finally {
      if (isMounted.current) setUsersLoading(false);
    }
  }, []);

  // Load user stats
  const loadUserStats = useCallback(async (isMounted = { current: true }) => {
    try {
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token available for loading user stats');
        if (isMounted.current) {
          setUserStats(null);
        }
        return null;
      }

      const response = await adminService.getUserStats();
      if (isMounted.current) setUserStats(response);
      return response;
    } catch (error) {
      // Chỉ log error nếu không phải lỗi authentication
      if (!error.message.includes('Authentication required')) {
      console.error('Error loading user stats:', error);
      }
      if (isMounted.current) setUserStats(null);
      throw error;
    }
  }, []);

  // Load devices
  const loadDevices = useCallback(async (deviceTypes = [], isMounted = { current: true }) => {
    try {
      if (isMounted.current) setDevicesLoading(true);
      const list = await adminService.getDevices();
      const normalized = Array.isArray(list) ? list.map(d => normalizeDevice(d, deviceTypes)).filter(Boolean) : [];
      if (isMounted.current) setDevices(normalized);
      return normalized;
    } catch (error) {
      console.error('Error loading devices:', error);
      if (isMounted.current) setDevices([]);
      throw error;
    } finally {
      if (isMounted.current) setDevicesLoading(false);
    }
  }, [normalizeDevice]);

  // Load rooms
  const loadRooms = useCallback(async (isMounted = { current: true }) => {
    try {
      if (isMounted.current) setRoomsLoading(true);
      const result = await roomService.getAllRooms();
      
      if (result && result.success) {
        const roomsList = result.data || [];
        
        // Enrich each room with selectedDevices
        try {
          const devicePromises = roomsList.map(r => {
            const roomId = r.id || r.roomId;
            // Wrap in promise that always resolves to prevent Promise.all from failing
            return roomService.getDevicesByRoom(roomId)
              .catch(err => {
                console.warn(`Failed to get devices for room ${roomId}:`, err);
                return { success: true, data: [] }; // Return empty array on error
              });
          });
          const deviceResponses = await Promise.allSettled(devicePromises);
          // Extract values from settled promises
          const deviceData = deviceResponses.map(result => 
            result.status === 'fulfilled' ? result.value : { success: true, data: [] }
          );
          const enriched = roomsList.map((r, idx) => {
            const resp = deviceData[idx];
            const ids = (resp && resp.success && Array.isArray(resp.data)) 
              ? resp.data.map(x => Number(x.deviceId)) 
              : [];
            return { ...r, selectedDevices: ids };
          });
          console.log('Rooms enriched with devices:', enriched);
          if (isMounted.current) setRooms(enriched);
          return enriched;
        } catch (enrichErr) {
          console.warn('Failed to enrich rooms with devices:', enrichErr);
          // Still set rooms with empty selectedDevices array
          const roomsWithEmptyDevices = roomsList.map(r => ({ ...r, selectedDevices: [] }));
          if (isMounted.current) setRooms(roomsWithEmptyDevices);
          return roomsWithEmptyDevices;
        }
      } else {
        if (isMounted.current) setRooms([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      if (isMounted.current) setRooms([]);
      throw error;
    } finally {
      if (isMounted.current) setRoomsLoading(false);
    }
  }, []);

  // Load meetings
  const loadMeetings = useCallback(async (isMounted = { current: true }) => {
    try {
      if (isMounted.current) setMeetingsLoading(true);
      const response = await meetingService.getAllMeetings();
      
      let meetingsData = [];
      if (Array.isArray(response)) {
        meetingsData = response;
      } else if (Array.isArray(response?.data)) {
        meetingsData = response.data;
      } else if (response?.success && Array.isArray(response?.data)) {
        meetingsData = response.data;
      } else {
        console.warn('⚠️ Unexpected meetings response format:', response);
        meetingsData = [];
      }

      const normalizedMeetings = meetingsData.map(meeting => ({
          ...meeting,
          bookingStatus: meeting.bookingStatus?.toLowerCase() || 'booked'
        }));

        if (isMounted.current) {
        setMeetings(normalizedMeetings);
        console.log('Meetings Result:', normalizedMeetings);
        }

      return normalizedMeetings;
    } catch (error) {
      console.error('Error loading meetings:', error);
      if (isMounted.current) setMeetings([]);
      throw error;
    } finally {
      if (isMounted.current) setMeetingsLoading(false);
    }
  }, []);
  
  // ✅ Load room-device mappings (Pre-load ALL assignments at once!)
  const loadRoomDeviceMappings = useCallback(async (roomsList, isMounted = { current: true }) => {
    if (!isMounted || !isMounted.current) return;
    
    try {
      if (isMounted.current) setMappingsLoading(true);
      console.log('🔄 Loading room-device mappings...');
      
      if (!roomsList || roomsList.length === 0) {
        console.log('⚠️ No rooms provided, skipping mappings');
        if (isMounted.current) {
          setMappingsLoading(false);
          setRoomDeviceMappings({ byRoom: {}, byDevice: {}, raw: [] });
        }
        return;
      }
      
      const allMappings = [];
      
      // Fetch device assignments for each room in parallel
      const mappingPromises = roomsList.map(async (room) => {
        try {
          const roomId = room.roomId || room.id;
          const resp = await roomService.getDevicesByRoom(roomId);
          if (resp && resp.success && Array.isArray(resp.data)) {
            return resp.data.map(rd => ({
              roomId,
              roomName: room.roomName || room.name,
              roomLocation: room.location || '',
              deviceId: rd.deviceId,
              deviceName: rd.deviceName,
              quantity: rd.quantityAssigned || 1
            }));
          }
        } catch (err) {
          console.warn(`Failed to load devices for room ${room.roomId || room.id}:`, err);
        }
        return [];
      });
      
      const results = await Promise.all(mappingPromises);
      results.forEach(mappings => allMappings.push(...mappings));
      
      // Build lookup maps for instant access
      const byRoom = {};
      const byDevice = {};
      
      allMappings.forEach(m => {
        // By room
        if (!byRoom[m.roomId]) byRoom[m.roomId] = [];
        byRoom[m.roomId].push({
          deviceId: m.deviceId,
          deviceName: m.deviceName,
          quantity: m.quantity
        });
        
        // By device
        if (!byDevice[m.deviceId]) byDevice[m.deviceId] = [];
        byDevice[m.deviceId].push({
          roomId: m.roomId,
          roomName: m.roomName,
          roomLocation: m.roomLocation,
          quantity: m.quantity
        });
      });
      
      if (isMounted.current) {
        setRoomDeviceMappings({
          byRoom,
          byDevice,
          raw: allMappings
        });
        console.log('✅ Room-device mappings loaded:', allMappings.length, 'assignments');
      }
    } catch (error) {
      console.error('❌ Failed to load room-device mappings:', error);
    } finally {
      if (isMounted.current) setMappingsLoading(false);
    }
  }, []);
  
  // ✅ Update mappings for a single room (Optimistic - no full reload!)
  const updateSingleRoomMappings = useCallback((roomId, roomName, roomLocation, devicesList) => {
    console.log(`🔄 Updating mappings for room ${roomId} only...`);
    
    setRoomDeviceMappings(prev => {
      const newByRoom = { ...prev.byRoom };
      const newByDevice = { ...prev.byDevice };
      const newRaw = [...prev.raw];
      
      // Remove old mappings for this room
      const oldMappings = newRaw.filter(m => m.roomId === roomId);
      oldMappings.forEach(oldMap => {
        // Remove from byDevice
        if (newByDevice[oldMap.deviceId]) {
          newByDevice[oldMap.deviceId] = newByDevice[oldMap.deviceId].filter(r => r.roomId !== roomId);
          if (newByDevice[oldMap.deviceId].length === 0) {
            delete newByDevice[oldMap.deviceId];
          }
        }
      });
      
      // Remove from raw
      const filteredRaw = newRaw.filter(m => m.roomId !== roomId);
      
      // Add new mappings for this room
      const newMappings = devicesList.map(device => ({
        roomId,
        roomName,
        roomLocation,
        deviceId: device.deviceId,
        deviceName: device.deviceName || device.name,
        quantity: device.quantity || 1
      }));
      
      // Update byRoom
      newByRoom[roomId] = devicesList.map(device => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName || device.name,
        quantity: device.quantity || 1
      }));
      
      // Update byDevice
      newMappings.forEach(m => {
        if (!newByDevice[m.deviceId]) newByDevice[m.deviceId] = [];
        newByDevice[m.deviceId].push({
          roomId: m.roomId,
          roomName: m.roomName,
          roomLocation: m.roomLocation,
          quantity: m.quantity
        });
      });
      
      console.log(`✅ Mappings updated for room ${roomId} instantly!`);
      
      return {
        byRoom: newByRoom,
        byDevice: newByDevice,
        raw: [...filteredRaw, ...newMappings]
      };
    });
  }, []);
  
  // ✅ Remove all mappings for a deleted room (Optimistic)
  const removeRoomMappings = useCallback((roomId) => {
    console.log(`🗑️ Removing all mappings for room ${roomId}...`);
    
    setRoomDeviceMappings(prev => {
      const newByRoom = { ...prev.byRoom };
      const newByDevice = { ...prev.byDevice };
      
      // Get all mappings for this room before removing
      const oldMappings = prev.raw.filter(m => m.roomId === roomId);
      
      // Remove from byDevice
      oldMappings.forEach(oldMap => {
        if (newByDevice[oldMap.deviceId]) {
          newByDevice[oldMap.deviceId] = newByDevice[oldMap.deviceId].filter(r => r.roomId !== roomId);
          if (newByDevice[oldMap.deviceId].length === 0) {
            delete newByDevice[oldMap.deviceId];
          }
        }
      });
      
      // Remove from byRoom
      delete newByRoom[roomId];
      
      // Remove from raw
      const filteredRaw = prev.raw.filter(m => m.roomId !== roomId);
      
      console.log(`✅ Removed ${oldMappings.length} mappings for room ${roomId}`);
      
      return {
        byRoom: newByRoom,
        byDevice: newByDevice,
        raw: filteredRaw
      };
    });
  }, []);

  // ✅ Preload all data ONLY ONCE - No refetch when switching pages!
  useEffect(() => {
    // Skip if already loaded
    if (isDataLoaded) {
      console.log('📦 Data already loaded from cache - skip fetch');
      return;
    }

    // Kiểm tra authentication trước khi gọi API
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No authentication token found. Skipping data preload.');
      setIsPreloading(false);
      setIsDataLoaded(true); // Mark as loaded to prevent retry
      return;
    }

    const isMountedRef = { current: true };

    const preloadAllData = async () => {
      console.log('🚀 Loading data for the first time...');
      if (isMountedRef.current) setIsPreloading(true);
      
      try {
        // Load all data in parallel with isMounted check
        const [
          usersResponse,
          statsResponse,
          devicesResponse,
          roomsResponse,
          meetingsResponse
        ] = await Promise.all([
          loadUsers(0, 1000, 'createdAt', 'desc', '', isMountedRef).catch(err => {
            // Chỉ log warning nếu không phải lỗi authentication
            if (!err.message.includes('Authentication required')) {
            console.warn('❌ Failed to load users:', err.message);
            }
            return null;
          }),
          loadUserStats(isMountedRef).catch(err => {
            if (!err.message.includes('Authentication required')) {
            console.warn('❌ Failed to load user stats:', err.message);
            }
            return null;
          }),
          loadDevices([], isMountedRef).catch(err => {
            if (!err.message.includes('Authentication required')) {
            console.warn('❌ Failed to load devices:', err.message);
            }
            return null;
          }),
          loadRooms(isMountedRef).catch(err => {
            if (!err.message.includes('Authentication required')) {
            console.warn('❌ Failed to load rooms:', err.message);
            }
            return null;
          }),
          loadMeetings(isMountedRef).catch(err => {
            if (!err.message.includes('Authentication required')) {
            console.warn('❌ Failed to load meetings:', err.message);
            }
            return null;
          })
        ]);
        
        // ✅ Load room-device mappings after rooms are loaded
        if (isMountedRef.current && roomsResponse && roomsResponse.length > 0) {
          await loadRoomDeviceMappings(roomsResponse, isMountedRef).catch(err => {
            if (!err.message.includes('Authentication required')) {
            console.warn('❌ Failed to load room-device mappings:', err.message);
            }
          });
        }
        
        if (isMountedRef.current) {
          setIsDataLoaded(true); // ✅ Mark as loaded
          console.log('✅ Initial data loaded and cached!');
        }
      } catch (error) {
        console.error('❌ Error preloading data:', error);
      } finally {
        if (isMountedRef.current) setIsPreloading(false);
      }
    };

    preloadAllData();

    return () => {
      isMountedRef.current = false;
    };
  }, [isDataLoaded]); // ✅ ONLY depend on isDataLoaded to prevent infinite loops

  const value = {
    isDataLoaded,
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
    devices,
    devicesLoading,
    loadDevices,
    setDevices,
    rooms,
    roomsLoading,
    loadRooms,
    setRooms,
    meetings,
    meetingsLoading,
    loadMeetings,
    setMeetings,
    roomDeviceMappings,
    mappingsLoading,
    loadRoomDeviceMappings,
    updateSingleRoomMappings,
    removeRoomMappings,
    isPreloading
  };

  return React.createElement(
    DataPreloaderContext.Provider,
    { value },
    children
  );
};

export default DataPreloaderContext;
