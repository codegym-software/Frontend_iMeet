import React, { useState, useEffect } from 'react';
import roomService from '../../../services/roomService';

const DeviceRoomsList = ({ device }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const MAX_VISIBLE_ROOMS = 2;

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        setLoading(true);
        const response = await roomService.getRoomsByDevice(device.id);
        if (isMounted && response && response.success && Array.isArray(response.data)) {
          setRooms(response.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading rooms for device:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (device.id) {
      loadRooms();
    }

    return () => {
      isMounted = false;
    };
  }, [device.id]);

  if (loading) {
    return <span style={{ fontSize: '13px', color: '#999' }}>Đang tải...</span>;
  }

  if (rooms.length === 0) {
    return <span style={{ fontSize: '13px', color: '#999' }}>Chưa gán</span>;
  }

  const visibleRooms = rooms.slice(0, MAX_VISIBLE_ROOMS);
  const hasMore = rooms.length > MAX_VISIBLE_ROOMS;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {visibleRooms.map(room => (
          <span key={room.roomId} style={{
            display: 'inline-block',
            padding: '4px 10px',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid #a5d6a7'
          }}>
            {room.name}
          </span>
        ))}
        {hasMore && (
          <span 
            onClick={() => setShowAllRooms(true)}
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
            title={`Xem thêm ${rooms.length - MAX_VISIBLE_ROOMS} phòng`}
          >
            +{rooms.length - MAX_VISIBLE_ROOMS}
          </span>
        )}
      </div>

      {showAllRooms && (
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
          onClick={() => setShowAllRooms(false)}
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
                Phòng sử dụng {device.name}
              </h3>
              <button
                onClick={() => setShowAllRooms(false)}
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
              {rooms.map(room => (
                <div 
                  key={room.roomId} 
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {room.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    📍 {room.location}
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
                onClick={() => setShowAllRooms(false)}
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

export default DeviceRoomsList;
