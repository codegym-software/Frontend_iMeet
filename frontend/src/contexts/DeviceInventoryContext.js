// Device Inventory Context - Real-time device availability tracking
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import adminService from '../services/adminService';
import meetingService from '../services/meetingService';

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

  // Initialize inventory from devices and active meetings
  const initializeInventory = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Initializing device inventory...');

      // Get all devices
      const devices = await adminService.getDevices();
      
      // Get all active meetings (not ended yet)
      const allMeetings = await meetingService.getAllMeetings();
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

      // Build inventory
      const newInventory = {};
      devices.forEach(device => {
        const deviceId = device.deviceId;
        const total = device.quantity || 0;
        const borrowed = borrowedMap[deviceId] || 0;
        const available = Math.max(0, total - borrowed);

        newInventory[deviceId] = {
          deviceId,
          deviceName: device.deviceName,
          deviceType: device.deviceTypeName,
          total,
          borrowed,
          available
        };
      });

      setInventory(newInventory);
      console.log('✅ Device inventory initialized:', newInventory);
      console.log('📊 Active meetings using devices:', activeMeetings.length);
    } catch (error) {
      console.error('❌ Error initializing inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Borrow devices (when creating/updating meeting)
  const borrowDevices = useCallback((devices, meetingId) => {
    console.log('📤 Borrowing devices for meeting:', meetingId, devices);
    
    setInventory(prev => {
      const updated = { ...prev };
      devices.forEach(device => {
        const deviceId = device.deviceId;
        const quantity = device.quantity || 1;
        
        if (updated[deviceId]) {
          const newBorrowed = updated[deviceId].borrowed + quantity;
          const newAvailable = Math.max(0, updated[deviceId].total - newBorrowed);
          
          updated[deviceId] = {
            ...updated[deviceId],
            borrowed: newBorrowed,
            available: newAvailable
          };
          
          console.log(`  - ${updated[deviceId].deviceName}: ${quantity} borrowed, ${newAvailable} left`);
        }
      });
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
          const newAvailable = Math.min(updated[deviceId].total, updated[deviceId].total - newBorrowed);
          
          updated[deviceId] = {
            ...updated[deviceId],
            borrowed: newBorrowed,
            available: newAvailable
          };
          
          console.log(`  - ${updated[deviceId].deviceName}: ${quantity} returned, ${newAvailable} available`);
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
        const allMeetings = await meetingService.getAllMeetings();
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

        justEndedMeetings.forEach(meeting => {
          console.log('⏰ Meeting ended, auto-returning devices:', meeting.meetingId);
          returnDevices(meeting.devices, meeting.meetingId);
        });
      } catch (error) {
        console.error('Error checking ended meetings:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkEndedMeetings, 60000);
    return () => clearInterval(interval);
  }, [returnDevices]);

  // Initialize on mount
  useEffect(() => {
    initializeInventory();
  }, [initializeInventory]);

  const value = {
    inventory,
    loading,
    initializeInventory,
    borrowDevices,
    returnDevices,
    updateMeetingDevices,
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

