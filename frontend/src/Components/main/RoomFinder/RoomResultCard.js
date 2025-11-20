import React from 'react';

const RoomResultCard = ({ room, onBook, onViewDetails }) => {
  const devices = room.devices || [];
  const devicePreview = devices.slice(0, 4);

  return (
    <div className="room-card">
      <div className="room-card__header">
        <div>
          <h3>{room.name}</h3>
          <p className="muted-text">{room.location || 'Chưa cập nhật vị trí'}</p>
        </div>
        <span className="capacity-chip">👥 {room.capacity || '—'}</span>
      </div>

      {room.description && (
        <p className="room-card__description">{room.description}</p>
      )}

      {devicePreview.length > 0 && (
        <div className="room-card__devices">
          {devicePreview.map(device => (
            <span key={device.deviceId || device.id} className="device-pill">
              {device.deviceName || device.name}
            </span>
          ))}
          {devices.length > devicePreview.length && (
            <span className="device-pill device-pill--more">
              +{devices.length - devicePreview.length} thiết bị khác
            </span>
          )}
        </div>
      )}

      <div className="room-card__actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={onViewDetails}
        >
          Xem chi tiết
        </button>
        <button type="button" className="primary-btn" onClick={onBook}>
          Đặt phòng
        </button>
      </div>
    </div>
  );
};

export default RoomResultCard;

