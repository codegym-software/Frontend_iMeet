import React, { useState, useEffect } from 'react';
import roomService from '../../../services/roomService';

const RoomDevicesList = ({ room, devices }) => {
  const [deviceInfo, setDeviceInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const MAX_VISIBLE_DEVICES = 3;

  useEffect(() => {
    let isMounted = true;

    const loadDeviceInfo = async () => {
      try {
        setLoading(true);
        const resp = await roomService.getDevicesByRoom(room.id);
        if (isMounted && resp && resp.success && Array.isArray(resp.data)) {
          const deviceMap = {};
          resp.data.forEach(rd => {
            const device = devices.find(d => d.id === rd.deviceId);
            deviceMap[rd.deviceId] = {
              name: device ? device.name : `Device #${rd.deviceId}`,
              quantity: rd.quantityAssigned || 1
            };
          });
          setDeviceInfo(deviceMap);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading device info:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (room.id) {
      loadDeviceInfo();
    }

    return () => {
      isMounted = false;
    };
  }, [room.id, devices]);

  if (loading) {
    return <span style={{ fontSize: '13px', color: '#999' }}>Đang tải...</span>;
  }

  const deviceEntries = Object.entries(deviceInfo);
  
  if (deviceEntries.length === 0) {
    return <span style={{ fontSize: '13px', color: '#999' }}>Không có</span>;
  }

  const visibleDevices = deviceEntries.slice(0, MAX_VISIBLE_DEVICES);
  const hasMore = deviceEntries.length > MAX_VISIBLE_DEVICES;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {visibleDevices.map(([deviceId, info]) => (
          <span key={deviceId} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid #bbdefb'
          }}>
            {info.name}
            <span style={{
              backgroundColor: '#1976d2',
              color: 'white',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {info.quantity}
            </span>
          </span>
        ))}
        {hasMore && (
          <span 
            onClick={() => setShowAllDevices(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#666';
            }}
            title={`Xem thêm ${deviceEntries.length - MAX_VISIBLE_DEVICES} thiết bị`}
          >
            +{deviceEntries.length - MAX_VISIBLE_DEVICES}
          </span>
        )}
      </div>

      {showAllDevices && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setShowAllDevices(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '12px'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Thiết bị trong {room.name}
              </h3>
              <button
                onClick={() => setShowAllDevices(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deviceEntries.map(([deviceId, info]) => (
                <div 
                  key={deviceId} 
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '600'
                  }}>
                    {info.name}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    backgroundColor: '#e3f2fd',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    Số lượng: {info.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #f0f0f0',
              textAlign: 'right'
            }}>
              <button
                onClick={() => setShowAllDevices(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomDevicesList;
