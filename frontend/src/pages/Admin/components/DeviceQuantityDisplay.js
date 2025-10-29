import React from 'react';

// ✅ NO API CALLS - Read from cache!
const DeviceQuantityDisplay = ({ device, roomMappings }) => {
  const totalQuantity = device.quantity || 0;
  
  // Calculate assigned quantity from mappings (instant!)
  const deviceRooms = roomMappings?.[device.id] || [];
  const assignedQuantity = deviceRooms.reduce((sum, room) => {
    return sum + (room.quantity || 0);
  }, 0);
  
  const availableQuantity = totalQuantity - assignedQuantity;

  return (
    <span style={{ 
      padding: '4px 8px', 
      borderRadius: '4px', 
      backgroundColor: '#e8f5e8',
      color: '#2e7d32',
      fontSize: '14px',
      fontWeight: '600'
    }}>
      {availableQuantity}/{totalQuantity}
    </span>
  );
};

export default DeviceQuantityDisplay;
