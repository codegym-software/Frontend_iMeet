import React, { createContext, useContext, useState, useEffect } from 'react';

// Tạo Context
const DeviceTypeContext = createContext();

// Hook để sử dụng context
export const useDeviceTypes = () => {
  const context = useContext(DeviceTypeContext);
  if (!context) {
    throw new Error('useDeviceTypes phải được sử dụng trong DeviceTypeProvider');
  }
  return context;
};

// Provider Component
export const DeviceTypeProvider = ({ children }) => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onDeviceTypeAdded, setOnDeviceTypeAdded] = useState(null);

  // Load initial data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Use fixed device types matching the server ENUM: Mic, Cam, Laptop, Bảng, Màn hình, Khác
      const initialData = [
        { id: 1, name: 'Mic', description: 'Microphone / Mic', createdAt: '2024-01-01' },
        { id: 2, name: 'Cam', description: 'Camera / Cam', createdAt: '2024-01-01' },
        { id: 3, name: 'Laptop', description: 'Laptop', createdAt: '2024-01-01' },
        { id: 4, name: 'Bảng', description: 'Bảng (whiteboard/board)', createdAt: '2024-01-01' },
        { id: 5, name: 'Màn hình', description: 'Màn hình', createdAt: '2024-01-01' },
        { id: 6, name: 'Khác', description: 'Thiết bị khác', createdAt: '2024-01-01' }
      ];
      setDeviceTypes(initialData);
      setLoading(false);
    }, 300);
  }, []);

  // Các functions để quản lý device types
  const addDeviceType = (newDeviceType) => {
    const deviceTypeWithId = {
      ...newDeviceType,
      id: Math.max(...deviceTypes.map(d => d.id), 0) + 1,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDeviceTypes(prev => [...prev, deviceTypeWithId]);
    
    // Gọi callback nếu có
    if (onDeviceTypeAdded) {
      onDeviceTypeAdded(deviceTypeWithId);
    }
    
    return deviceTypeWithId;
  };

  const updateDeviceType = (id, updatedData) => {
    setDeviceTypes(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, ...updatedData }
          : item
      )
    );
  };

  const deleteDeviceType = (id) => {
    setDeviceTypes(prev => prev.filter(item => item.id !== id));
  };

  const getDeviceTypeById = (id) => {
    return deviceTypes.find(type => type.id === parseInt(id));
  };

  // Function để đăng ký callback khi thêm device type mới
  const registerOnDeviceTypeAdded = (callback) => {
    setOnDeviceTypeAdded(() => callback);
  };

  const value = {
    deviceTypes,
    loading,
    addDeviceType,
    updateDeviceType,
    deleteDeviceType,
    getDeviceTypeById,
    registerOnDeviceTypeAdded,
    setDeviceTypes // Để có thể set toàn bộ danh sách nếu cần
  };

  return (
    <DeviceTypeContext.Provider value={value}>
      {children}
    </DeviceTypeContext.Provider>
  );
};

export default DeviceTypeContext;