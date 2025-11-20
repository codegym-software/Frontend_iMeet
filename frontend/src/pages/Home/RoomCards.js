import React, { useEffect, useState } from 'react';
import './RoomCards.css';
import { roomAPI } from '../../Components/main/MainCalendar/utils/RoomAPI';

const RoomCards = ({ onViewDetails, onChoose }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await roomAPI.getAllRooms();
        const normalized = (Array.isArray(data) ? data : data?.data || []).map(r => ({
          id: r.id || r.roomId,
          name: r.name,
          location: r.location,
          capacity: r.capacity ?? r.seat ?? null,
          description: r.description || '',
          devices: r.devices || [],
          building: r.building || '',
          floor: r.floor || '',
          ...r
        }));
        setRooms(normalized);
      } catch (e) {
        setError(e?.message || 'Không thể tải danh sách phòng');
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  if (loading) {
    return (
      <div className="roomcards-loading">⏳ Đang tải phòng...</div>
    );
  }

  if (error) {
    return <div className="roomcards-error">{error}</div>;
  }

  if (!rooms.length) {
    return <div className="roomcards-empty">Chưa có phòng trong hệ thống</div>;
  }

  return (
    <div className="roomcards-wrapper">
      <div className="roomcards-grid spacious">
        {rooms.map((room) => (
          <div key={room.id} className="roomcard large">
          <div className="roomcard-header">
              <div>
            <div className="roomcard-title">{room.name}</div>
                <div className="roomcard-location">📍 {room.location || 'Chưa cập nhật vị trí'}</div>
              </div>
              <div className="roomcard-capacity-pill">👥 {room.capacity || '—'} chỗ</div>
            </div>

            {room.description && (
              <div className="roomcard-description">
                {room.description.length > 120 ? `${room.description.slice(0, 120)}...` : room.description}
          </div>
            )}

            {room.devices?.length > 0 && (
              <div className="roomcard-devices">
                {room.devices.slice(0, 4).map((device, idx) => (
                  <span key={`${room.id}-${device.deviceId || idx}`} className="device-tag">
                    {device.deviceName || device.name}
                  </span>
                ))}
                {room.devices.length > 4 && (
                  <span className="device-tag more">+{room.devices.length - 4}</span>
                )}
          </div>
            )}

          <div className="roomcard-actions">
              <button 
                className="btn-outline"
                onClick={() => onViewDetails && onViewDetails(room)}
              >
                Xem chi tiết
              </button>
              <button 
                className="btn-primary"
                onClick={() => onChoose && onChoose(room)}
              >
                Đặt phòng
              </button>
            </div>
          </div>
        ))}
        </div>
    </div>
  );
};

export default RoomCards;
