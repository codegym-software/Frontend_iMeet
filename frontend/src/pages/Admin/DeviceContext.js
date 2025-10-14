import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDeviceTypes } from './DeviceTypeContext';
import { usePreloadedData } from './DataPreloaderContext';

// Tạo Context
const DeviceContext = createContext();

// Hook để sử dụng context
export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices phải được sử dụng trong DeviceProvider');
  }
  return context;
};

// Provider Component
export const DeviceProvider = ({ children }) => {
  const { deviceTypes, loading: deviceTypesLoading } = useDeviceTypes();
  const { devices: preloadedDevices, devicesLoading: preloadedLoading } = usePreloadedData();
  const [devices, setDevices] = useState(preloadedDevices || []);
  const [loading, setLoading] = useState(preloadedLoading);

  // Sync with preloaded devices
  useEffect(() => {
    if (preloadedDevices && preloadedDevices.length >= 0) {
      setDevices(preloadedDevices);
    }
  }, [preloadedDevices]);

  // Sync loading state
  useEffect(() => {
    setLoading(preloadedLoading || deviceTypesLoading);
  }, [preloadedLoading, deviceTypesLoading]);

  // Functions để quản lý devices
  const addDevice = (newDevice) => {
    const deviceWithId = {
      ...newDevice,
      id: Math.max(...devices.map(d => d.id), 0) + 1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDevices(prev => [...prev, deviceWithId]);
    return deviceWithId;
  };

  const updateDevice = (id, updatedData) => {
    setDevices(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, ...updatedData }
          : item
      )
    );
  };

  const deleteDevice = (id) => {
    setDevices(prev => prev.filter(item => item.id !== id));
  };

  const getDeviceById = (id) => {
    return devices.find(device => device.id === parseInt(id));
  };

  const getAvailableDevices = () => {
    return devices.filter(device => device.quantity > 0);
  };

  const value = {
    devices,
    loading,
    addDevice,
    updateDevice,
    deleteDevice,
    getDeviceById,
    getAvailableDevices,
    setDevices
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};

export default DeviceContext;