import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDeviceTypes } from './DeviceTypeContext';

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
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    // Wait for device types to load first
    if (!deviceTypesLoading && deviceTypes.length > 0) {
      setTimeout(() => {
        // Map device types using the fixed ENUM names: Mic, Cam, Laptop, Bảng, Màn hình, Khác
        const getTypeByName = (name) => deviceTypes.find(t => t.name === name);
        const laptopType = getTypeByName('Laptop');
        const camType = getTypeByName('Cam');
        const micType = getTypeByName('Mic');
        const boardType = getTypeByName('Bảng');
        const monitorType = getTypeByName('Màn hình');
        const otherType = getTypeByName('Khác');
        const mockData = [
          { id: 1, name: 'MacBook Pro 16-inch 2023', deviceTypeId: laptopType?.id || 3, deviceTypeName: laptopType?.name || 'Laptop', quantity: 5, description: 'Laptop cao cấp dành cho lập trình viên và thiết kế đồ họa', createdAt: '2024-01-15' },
          { id: 2, name: 'Dell XPS 13', deviceTypeId: laptopType?.id || 3, deviceTypeName: laptopType?.name || 'Laptop', quantity: 8, description: 'Laptop mỏng nhẹ cho công việc văn phòng', createdAt: '2024-01-20' },
          { id: 3, name: 'Logitech C920 HD Pro', deviceTypeId: camType?.id || 2, deviceTypeName: camType?.name || 'Cam', quantity: 15, description: 'Webcam HD 1080p cho video conference', createdAt: '2024-04-01' },
          { id: 4, name: 'Blue Yeti USB Microphone', deviceTypeId: micType?.id || 1, deviceTypeName: micType?.name || 'Mic', quantity: 6, description: 'Microphone chuyên nghiệp cho recording và streaming', createdAt: '2024-04-15' },
          { id: 5, name: 'BenQ Portable Projector', deviceTypeId: otherType?.id || 6, deviceTypeName: otherType?.name || 'Khác', quantity: 2, description: 'Máy chiếu di động (gắn vào loại Khác)', createdAt: '2024-03-01' },
          { id: 6, name: 'LG UltraWide 34WP65C', deviceTypeId: monitorType?.id || 5, deviceTypeName: monitorType?.name || 'Màn hình', quantity: 10, description: 'Màn hình cong 34 inch siêu rộng', createdAt: '2024-03-10' }
        ];
        
        setDevices(mockData);
        setLoading(false);
      }, 300);
    }
  }, [deviceTypes, deviceTypesLoading]);

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