// Device Inventory Context - Real-time device availability tracking
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import adminService from '../services/adminService';
import meetingService from '../services/meetingService';
import roomService from '../services/roomService';

const DeviceInventoryContext = createContext();

export const useDeviceInventory = () => {
  const context = useContext(DeviceInventoryContext);
  if (!context) {
    throw new Error('useDeviceInventory must be used within DeviceInventoryProvider');
  }
  return context;
};

export const DeviceInventoryProvider = ({ children }) => {
  // Device inventory: { deviceId: { total, borrowed, available } }
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(false);
  
  // ✅ Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Initialize inventory from devices, active meetings, and room assignments
  const initializeInventory = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Initializing device inventory...');

      // Get all devices
      let devicesResponse = await adminService.getDevices();
      const devices = Array.isArray(devicesResponse) ? devicesResponse : (devicesResponse?.data || []);
      
      // Get all active meetings (not ended yet)
      let allMeetingsResponse = await meetingService.getAllMeetings();
      
      // ✅ Handle different response formats
      let allMeetings = [];
      if (Array.isArray(allMeetingsResponse)) {
        allMeetings = allMeetingsResponse;
      } else if (allMeetingsResponse?.data && Array.isArray(allMeetingsResponse.data)) {
        allMeetings = allMeetingsResponse.data;
      } else {
        // Silently handle empty/invalid response - don't spam console
        allMeetings = [];
      }
      
      const now = new Date();
      const activeMeetings = allMeetings.filter(m => {
        const endTime = new Date(m.endTime);
        return endTime > now && m.bookingStatus?.toUpperCase() !== 'CANCELLED';
      });

      // Calculate borrowed devices from active meetings
      const borrowedMap = {};
      activeMeetings.forEach(meeting => {
        if (meeting.devices && Array.isArray(meeting.devices)) {
          meeting.devices.forEach(device => {
            const deviceId = device.deviceId;
            const quantity = device.quantity || 1;
            borrowedMap[deviceId] = (borrowedMap[deviceId] || 0) + quantity;
          });
        }
      });

      // Get all rooms and their device assignments
      let roomsResponse = await adminService.getRooms();
      const allRooms = Array.isArray(roomsResponse) ? roomsResponse : (roomsResponse?.data || []);
      console.log('🏢 Rooms loaded:', allRooms.length);
      if (allRooms.length > 0) {
        console.log('🏢 Sample room:', allRooms[0]);
      }
      const assignedMap = {};
      
      // Fetch device assignments for each room in parallel
      const roomAssignmentPromises = allRooms.map(async (room) => {
        try {
          // ✅ Handle both 'id' and 'roomId' property names
          const roomId = room.id || room.roomId;
          if (!roomId) {
            console.warn('⚠️ Room has no ID:', room);
            return [];
          }
          const resp = await roomService.getDevicesByRoom(roomId);
          if (resp && resp.success && Array.isArray(resp.data)) {
            return resp.data;
          }
        } catch (err) {
          console.warn(`Failed to load devices for room ${room.id || room.roomId}:`, err);
        }
        return [];
      });
      
      const allRoomAssignments = await Promise.all(roomAssignmentPromises);
      
      // Calculate total devices assigned to rooms
      allRoomAssignments.flat().forEach(assignment => {
        const deviceId = assignment.deviceId;
        const quantity = assignment.quantityAssigned || 1;
        assignedMap[deviceId] = (assignedMap[deviceId] || 0) + quantity;
      });

      // Build inventory
      const newInventory = {};
      console.log('📦 Building inventory from', devices.length, 'devices');
      if (devices.length > 0) {
        console.log('📦 Sample device from backend:', devices[0]);
      }
      
      devices.forEach(device => {
        const deviceId = device.deviceId;
        const total = device.quantity || 0;
        const borrowed = borrowedMap[deviceId] || 0;
        const assignedToRooms = assignedMap[deviceId] || 0;
        const available = Math.max(0, total - borrowed - assignedToRooms);

        newInventory[deviceId] = {
          deviceId,
          // ✅ Backend returns 'name', not 'deviceName'
          name: device.name,
          deviceName: device.name, // Keep for backward compatibility
          // ✅ Backend returns enum string like "MIC", "CAM", "LAPTOP"
          deviceType: device.deviceType || 'KHAC',
          total,
          borrowed,
          assignedToRooms,
          available
        };
        
        // Log warning if negative
        if (available < 0) {
          console.error(`🚫 Device ${deviceId} (${device.name}) has negative availability!`, {
            total,
            borrowed,
            assignedToRooms,
            calculated: total - borrowed - assignedToRooms
          });
        }
      });

      // ✅ Only update state if component is still mounted
      if (isMountedRef.current) {
        setInventory(newInventory);
        console.log('✅ Device inventory initialized:', newInventory);
        console.log('📊 Active meetings using devices:', activeMeetings.length);
        console.log('🏢 Devices assigned to rooms:', Object.keys(assignedMap).length, 'types');
      }
    } catch (error) {
      console.error('❌ Error initializing inventory:', error);
    } finally {
      // ✅ Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Borrow devices (when creating/updating meeting)
  const borrowDevices = useCallback((devices, meetingId) => {
    console.log('📤 Borrowing devices for meeting:', meetingId, devices);
    
    setInventory(prev => {
      const updated = { ...prev };
      const errors = [];
      
      devices.forEach(device => {
        const deviceId = device.deviceId;
        const quantity = device.quantity || 1;
        
        if (updated[deviceId]) {
          // ✅ VALIDATE: Không cho mượn nếu không đủ
          if (updated[deviceId].available < quantity) {
            errors.push(`${updated[deviceId].deviceName}: yêu cầu ${quantity} nhưng chỉ còn ${updated[deviceId].available}`);
            console.warn(`⚠️ Không đủ ${updated[deviceId].deviceName}! Yêu cầu: ${quantity}, Còn: ${updated[deviceId].available}`);
            return; // Skip device này
          }
          
          const newBorrowed = updated[deviceId].borrowed + quantity;
          const newAvailable = updated[deviceId].total - newBorrowed - (updated[deviceId].assignedToRooms || 0);
          
          // ✅ DOUBLE CHECK: KHÔNG BAO GIỜ ÂM!
          if (newAvailable < 0) {
            console.error(`🚫 CRITICAL: ${updated[deviceId].deviceName} would go negative! Blocking.`);
            errors.push(`${updated[deviceId].deviceName}: không thể mượn (sẽ âm)`);
            return; // Skip device này
          }
          
          updated[deviceId] = {
            ...updated[deviceId],
            borrowed: newBorrowed,
            available: newAvailable
          };
          
          console.log(`  - ${updated[deviceId].deviceName}: ${quantity} borrowed, ${newAvailable} left`);
        } else {
          console.warn(`⚠️ Device ${deviceId} not found in inventory`);
        }
      });
      
      // Show errors if any
      if (errors.length > 0) {
        console.error('❌ Errors borrowing devices:', errors);
        alert('⚠️ Không thể mượn một số thiết bị:\n\n' + errors.join('\n'));
      }
      
      return updated;
    });
  }, []);

  // Return devices (when meeting ends or is deleted)
  const returnDevices = useCallback((devices, meetingId) => {
    console.log('📥 Returning devices from meeting:', meetingId, devices);
    
    setInventory(prev => {
      const updated = { ...prev };
      devices.forEach(device => {
        const deviceId = device.deviceId;
        const quantity = device.quantity || 1;
        
        if (updated[deviceId]) {
          const newBorrowed = Math.max(0, updated[deviceId].borrowed - quantity);
          const newAvailable = updated[deviceId].total - newBorrowed - (updated[deviceId].assignedToRooms || 0);
          
          updated[deviceId] = {
            ...updated[deviceId],
            borrowed: newBorrowed,
            available: Math.max(0, newAvailable)
          };
          
          console.log(`  - ${updated[deviceId].deviceName}: ${quantity} returned, ${updated[deviceId].available} available`);
        }
      });
      return updated;
    });
  }, []);

  // Update devices when meeting is modified
  const updateMeetingDevices = useCallback((oldDevices, newDevices, meetingId) => {
    console.log('🔄 Updating meeting devices:', meetingId);
    
    // Return old devices first
    if (oldDevices && oldDevices.length > 0) {
      returnDevices(oldDevices, meetingId);
    }
    
    // Borrow new devices
    if (newDevices && newDevices.length > 0) {
      borrowDevices(newDevices, meetingId);
    }
  }, [borrowDevices, returnDevices]);

  // Assign devices to room (when adding/updating room assignments)
  const assignDevicesToRoom = useCallback((devicesList, roomId) => {
    console.log('🏢 Assigning devices to room:', roomId, devicesList);
    
    setInventory(prev => {
      const updated = { ...prev };
      const errors = [];
      
      devicesList.forEach(device => {
        const deviceId = device.deviceId || device.id;
        const quantity = device.quantity || 1;
        
        if (updated[deviceId]) {
          // ✅ VALIDATE: Check if available
          if (updated[deviceId].available < quantity) {
            errors.push(`${updated[deviceId].deviceName}: yêu cầu ${quantity} nhưng chỉ còn ${updated[deviceId].available}`);
            console.warn(`⚠️ Không đủ ${updated[deviceId].deviceName} để gán cho phòng!`);
            return;
          }
          
          const newAssignedToRooms = (updated[deviceId].assignedToRooms || 0) + quantity;
          const newAvailable = updated[deviceId].total - (updated[deviceId].borrowed || 0) - newAssignedToRooms;
          
          // ✅ DOUBLE CHECK: KHÔNG BAO GIỜ ÂM!
          if (newAvailable < 0) {
            console.error(`🚫 CRITICAL: ${updated[deviceId].deviceName} would go negative! Blocking.`);
            errors.push(`${updated[deviceId].deviceName}: không thể gán (sẽ âm)`);
            return;
          }
          
          updated[deviceId] = {
            ...updated[deviceId],
            assignedToRooms: newAssignedToRooms,
            available: newAvailable
          };
          
          console.log(`  - ${updated[deviceId].deviceName}: ${quantity} assigned to room, ${newAvailable} left`);
        } else {
          console.warn(`⚠️ Device ${deviceId} not found in inventory`);
        }
      });
      
      // Show errors if any
      if (errors.length > 0) {
        console.error('❌ Errors assigning devices to room:', errors);
        alert('⚠️ Không thể gán một số thiết bị:\n\n' + errors.join('\n'));
      }
      
      return updated;
    });
  }, []);

  // Unassign devices from room (when removing/updating room assignments)
  const unassignDevicesFromRoom = useCallback((devicesList, roomId) => {
    console.log('🏢 Unassigning devices from room:', roomId, devicesList);
    
    setInventory(prev => {
      const updated = { ...prev };
      devicesList.forEach(device => {
        const deviceId = device.deviceId || device.id;
        const quantity = device.quantity || 1;
        
        if (updated[deviceId]) {
          const newAssignedToRooms = Math.max(0, (updated[deviceId].assignedToRooms || 0) - quantity);
          const newAvailable = updated[deviceId].total - (updated[deviceId].borrowed || 0) - newAssignedToRooms;
          
          updated[deviceId] = {
            ...updated[deviceId],
            assignedToRooms: newAssignedToRooms,
            available: Math.max(0, newAvailable)
          };
          
          console.log(`  - ${updated[deviceId].deviceName}: ${quantity} unassigned from room, ${updated[deviceId].available} available`);
        }
      });
      return updated;
    });
  }, []);

  // Check if device has enough available quantity
  const checkAvailability = useCallback((deviceId, requestedQuantity) => {
    const device = inventory[deviceId];
    if (!device) return false;
    return device.available >= requestedQuantity;
  }, [inventory]);

  // Get available quantity for a device
  const getAvailableQuantity = useCallback((deviceId) => {
    return inventory[deviceId]?.available || 0;
  }, [inventory]);

  // Get devices with availability info
  const getDevicesWithAvailability = useCallback(() => {
    return Object.values(inventory).map(device => ({
      ...device,
      isAvailable: device.available > 0,
      status: device.available === 0 ? 'Hết' : `${device.available}/${device.total} có sẵn`
    }));
  }, [inventory]);

  // Auto-return devices from ended meetings (check every minute)
  useEffect(() => {
    const checkEndedMeetings = async () => {
      try {
        let allMeetingsResponse = await meetingService.getAllMeetings();
        
        // ✅ Check if component is still mounted after async operation
        if (!isMountedRef.current) {
          console.log('🧹 Component unmounted, skipping meeting check');
          return;
        }
        
        // ✅ Handle different response formats - getAllMeetings already returns array
        let allMeetings = [];
        if (Array.isArray(allMeetingsResponse)) {
          allMeetings = allMeetingsResponse;
        } else if (allMeetingsResponse?.data && Array.isArray(allMeetingsResponse.data)) {
          allMeetings = allMeetingsResponse.data;
        } else {
          // If empty array or null, just continue without error
          console.log('⚠️ No meetings found or empty response in checkEndedMeetings');
          return;
        }
        
        const now = new Date();
        
        // Find meetings that just ended
        const justEndedMeetings = allMeetings.filter(m => {
          const endTime = new Date(m.endTime);
          const timeSinceEnd = now - endTime;
          // Meetings ended in last minute and have devices
          return timeSinceEnd > 0 && 
                 timeSinceEnd < 60000 && 
                 m.devices && 
                 m.devices.length > 0 &&
                 m.bookingStatus?.toUpperCase() !== 'CANCELLED';
        });

        // ✅ Check again before state updates
        if (isMountedRef.current && justEndedMeetings.length > 0) {
          justEndedMeetings.forEach(meeting => {
            console.log('⏰ Meeting ended, auto-returning devices:', meeting.meetingId);
            returnDevices(meeting.devices, meeting.meetingId);
          });
        }
      } catch (error) {
        // Silently handle errors - don't spam console
        console.log('⚠️ Error checking ended meetings (will retry):', error.message);
      }
    };

    // Check every minute
    const interval = setInterval(checkEndedMeetings, 60000);
    
    // ✅ Cleanup: Clear interval on unmount
    return () => {
      console.log('🧹 Clearing device check interval');
      clearInterval(interval);
    };
  }, [returnDevices]);

  // Initialize on mount and setup cleanup
  useEffect(() => {
    initializeInventory();
    
    // ✅ Cleanup: Mark component as unmounted
    return () => {
      console.log('🧹 DeviceInventoryProvider unmounting, canceling state updates');
      isMountedRef.current = false;
    };
  }, [initializeInventory]);

  const value = {
    inventory,
    loading,
    initializeInventory,
    borrowDevices,
    returnDevices,
    updateMeetingDevices,
    assignDevicesToRoom,
    unassignDevicesFromRoom,
    checkAvailability,
    getAvailableQuantity,
    getDevicesWithAvailability
  };

  return (
    <DeviceInventoryContext.Provider value={value}>
      {children}
    </DeviceInventoryContext.Provider>
  );
};

export default DeviceInventoryContext;

