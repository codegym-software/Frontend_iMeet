import React, { useState, useEffect, useRef } from 'react';
import { roomAPI } from '../../Components/main/MainCalendar/utils/RoomAPI';
import './RoomSelector.css';

const RoomSelector = ({ selectedRoomId, onRoomSelect }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  // ✅ Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    loadRooms();
    
    // ✅ Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRooms = async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    try {
      const data = await roomAPI.getAllRooms();
      
      // ✅ Only update state if still mounted
      if (!isMountedRef.current) return;
      
      // ✅ Normalize data: Backend returns 'roomId', we need 'id'
      const normalizedRooms = data.map(room => ({
        ...room,
        id: room.id || room.roomId  // Use 'id' if exists, otherwise use 'roomId'
      }));
      
      console.log('📍 Loaded rooms:', normalizedRooms.length);
      
      setRooms(normalizedRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      // ✅ Only update loading if still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRoomSelect = (room) => {
    console.log('🏠 Selected room:', room.name, '(ID:', room.id, ')');
    onRoomSelect(room.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Group rooms by location
  const groupedRooms = rooms.reduce((acc, room) => {
    const location = room.location || 'Khác';
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(room);
    return acc;
  }, {});

  // Filter rooms by search term (only by name)
  const filteredGroupedRooms = Object.entries(groupedRooms).reduce((acc, [location, roomList]) => {
    const filtered = roomList.filter(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[location] = filtered;
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="room-dropdown-container">
        <div className="room-dropdown-loading">
          <span className="loading-spinner">⏳</span>
          <span>Đang tải phòng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="room-dropdown-container" ref={dropdownRef}>
      <div className="room-dropdown-header">
        <span className="room-icon">🏢</span>
        <span className="room-label">Phòng họp</span>
      </div>

      {/* Selected Room Display + Dropdown Trigger */}
      <button 
        className={`room-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedRoom ? (
          <div className="selected-room-display">
            <div className="selected-room-name">
              {selectedRoom.name}
            </div>
          </div>
        ) : (
          <div className="no-room-selected-text">Chọn phòng họp...</div>
        )}
        <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="room-dropdown-menu">
          {/* Search Box */}
          <div className="room-search-box">
            <input
              type="text"
              placeholder="🔍 Tìm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Room List - Grouped by Location */}
          <div className="room-dropdown-list">
            {Object.keys(filteredGroupedRooms).length === 0 ? (
              <div className="no-rooms-found">Không tìm thấy phòng</div>
            ) : (
              Object.entries(filteredGroupedRooms).map(([location, roomList], groupIndex) => (
                <div key={`location-${groupIndex}-${location}`} className="room-group">
                  <div className="room-group-header">📍 {location}</div>
                  <div className="room-group-items">
                    {roomList.map((room, roomIndex) => (
                      <button
                        key={`room-${room.id}-${roomIndex}`}
                        className={`room-dropdown-item ${selectedRoomId === room.id ? 'selected' : ''}`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="room-item-content">
                          <div className="room-item-name">
                            {selectedRoomId === room.id && <span className="check-icon">✓</span>}
                            {room.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomSelector;

