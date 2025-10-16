import React, { useState, useEffect } from 'react';
import roomService from '../../../services/roomService';

const DeviceQuantityDisplay = ({ device }) => {
  const [assignedQuantity, setAssignedQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAssignedQuantity = async () => {
      try {
        setLoading(true);
        const response = await roomService.getRoomsByDevice(device.id);
        if (isMounted && response && response.success && Array.isArray(response.data)) {
          const totalAssigned = response.data.reduce((sum, room) => {
            return sum + (room.quantityAssigned || 0);
          }, 0);
          setAssignedQuantity(totalAssigned);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading assigned quantity:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (device.id) {
      loadAssignedQuantity();
    }

    return () => {
      isMounted = false;
    };
  }, [device.id]);

  const totalQuantity = device.quantity || 0;
  const availableQuantity = totalQuantity - assignedQuantity;

  if (loading) {
    return <span style={{ fontSize: '13px', color: '#999' }}>Đang tải...</span>;
  }

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
