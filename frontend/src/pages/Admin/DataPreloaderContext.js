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
      console.error('Error loading users:', error);
      if (isMounted.current) setUsers([]);
      throw error;
    } finally {
      if (isMounted.current) setUsersLoading(false);
    }
  }, []);

  // Load user stats
  const loadUserStats = useCallback(async (isMounted = { current: true }) => {
    try {
      const response = await adminService.getUserStats();
      if (isMounted.current) setUserStats(response);
      return response;
    } catch (error) {
      console.error('Error loading user stats:', error);
      if (isMounted.current) setUserStats(null);
      throw error;
    }
  }, []);

  // Load devices
  const loadDevices = useCallback(async (deviceTypes = [], isMounted = { current: true }) => {
    try {
      if (isMounted.current) setDevicesLoading(true);
      const list = await adminService.getDevices();
      // adminService.getDevices() already returns empty array on error, so we can safely use it
      const normalized = Array.isArray(list) ? list.map(d => normalizeDevice(d, deviceTypes)).filter(Boolean) : [];
      if (isMounted.current) {
        setDevices(normalized);
        console.log(`✅ Devices loaded: ${normalized.length}`);
      }
      return normalized;
    } catch (error) {
      console.warn('⚠️ Error loading devices, using empty array:', error.message);
      // Don't throw - just return empty array so other data can still load
      if (isMounted.current) setDevices([]);
      return [];
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
            return roomService.getDevicesByRoom(roomId);
          });
          const deviceResponses = await Promise.allSettled(devicePromises);
          const enriched = roomsList.map((r, idx) => {
            const resp = deviceResponses[idx];
            if (resp.status === 'fulfilled' && resp.value && resp.value.success && Array.isArray(resp.value.data)) {
              const ids = resp.value.data.map(x => Number(x.deviceId));
              return { ...r, selectedDevices: ids };
            }
            return { ...r, selectedDevices: [] };
          });
          console.log('Rooms enriched with devices:', enriched);
          if (isMounted.current) {
            setRooms(enriched);
            console.log(`✅ Rooms loaded: ${enriched.length}`);
          }
          return enriched;
        } catch (enrichErr) {
          console.warn('Failed to enrich rooms with devices:', enrichErr);
          // Still set rooms with empty selectedDevices array
          const roomsWithEmptyDevices = roomsList.map(r => ({ ...r, selectedDevices: [] }));
          if (isMounted.current) {
            setRooms(roomsWithEmptyDevices);
            console.log(`✅ Rooms loaded: ${roomsWithEmptyDevices.length} (without device enrichment)`);
          }
          return roomsWithEmptyDevices;
        }
      } else {
        if (isMounted.current) {
          setRooms([]);
          console.log('✅ Rooms loaded: 0');
        }
        return [];
      }
    } catch (error) {
      console.warn('⚠️ Error loading rooms, using empty array:', error.message);
      // Don't throw - just return empty array so other data can still load
      if (isMounted.current) {
        setRooms([]);
        console.log('✅ Rooms loaded: 0 (error fallback)');
      }
      return [];
    } finally {
      if (isMounted.current) setRoomsLoading(false);
    }
  }, []);

  // Load meetings
  const loadMeetings = useCallback(async (isMounted = { current: true }) => {
    try {
      if (isMounted.current) setMeetingsLoading(true);
      // meetingService.getAllMeetings() returns array directly, not {success, data}
      const response = await meetingService.getAllMeetings();
      
      // Response is already an array (or empty array on error)
      const meetingsData = Array.isArray(response) 
        ? response.map(meeting => {
            // ✅ Normalize deprecated statuses to BOOKED
            let status = meeting.bookingStatus?.toLowerCase() || 'booked';
            if (status === 'pending' || status === 'confirmed') {
              status = 'booked';
            }
            return {
              ...meeting,
              bookingStatus: status
            };
          })
        : [];
        
      if (isMounted.current) {
        setMeetings(meetingsData);
        console.log(`✅ Meetings loaded: ${meetingsData.length}`);
      }
      return meetingsData;
    } catch (error) {
      console.warn('⚠️ Error loading meetings, using empty array:', error.message);
      // Don't throw - just return empty array so other data can still load
      if (isMounted.current) setMeetings([]);
      return [];
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

    const isMountedRef = { current: true };

    const preloadAllData = async () => {
      console.log('🚀 Loading data for the first time...');
      if (isMountedRef.current) setIsPreloading(true);
      
      try {
        // Load all data in parallel with isMounted check
        // ✅ Use Promise.allSettled instead of Promise.all to handle partial failures
        const results = await Promise.allSettled([
          loadUsers(0, 1000, 'createdAt', 'desc', '', isMountedRef),
          loadUserStats(isMountedRef),
          loadDevices([], isMountedRef),
          loadRooms(isMountedRef),
          loadMeetings(isMountedRef)
        ]);
        
        // ✅ Log results for debugging
        console.log('📊 Data loading results:', {
          users: results[0].status,
          stats: results[1].status,
          devices: results[2].status,
          rooms: results[3].status,
          meetings: results[4].status
        });
        
        // ✅ Load room-device mappings after rooms are loaded
        const roomsResult = results[3];
        if (isMountedRef.current && roomsResult.status === 'fulfilled' && roomsResult.value && roomsResult.value.length > 0) {
          await loadRoomDeviceMappings(roomsResult.value, isMountedRef);
        }
        
        if (isMountedRef.current) {
          setIsDataLoaded(true); // ✅ Mark as loaded even if some failed
          console.log('✅ Initial data loaded and cached!');
        }
      } catch (error) {
        console.error('Error preloading data:', error);
        // ✅ Still mark as loaded so UI can render with partial data
        if (isMountedRef.current) {
          setIsDataLoaded(true);
        }
      } finally {
        if (isMountedRef.current) setIsPreloading(false);
      }
    };

    preloadAllData();

    return () => {
      isMountedRef.current = false;
    };
  }, [isDataLoaded, loadUsers, loadUserStats, loadDevices, loadRooms, loadMeetings, loadRoomDeviceMappings]);

  const value = {
    // Data loaded flag
    isDataLoaded,
    
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
    
    // Meetings
    meetings,
    meetingsLoading,
    loadMeetings,
    setMeetings,
    
    // ✅ Room-Device Mappings
    roomDeviceMappings,
    mappingsLoading,
    loadRoomDeviceMappings,
    updateSingleRoomMappings, // ✅ Optimistic update for single room
    removeRoomMappings, // ✅ Remove mappings when deleting room
    
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
