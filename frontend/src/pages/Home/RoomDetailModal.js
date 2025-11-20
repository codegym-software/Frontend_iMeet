import React, { useState } from 'react';
import RoomScheduleView from './RoomScheduleView';
import './RoomDetailModal.css';

const RoomDetailModal = ({ room, onClose, onBookRoom }) => {
  const [viewMode, setViewMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (!room) return null;

  const infoItems = [
    { label: 'Vị trí', value: room.location || 'Chưa cập nhật' },
    { label: 'Sức chứa', value: room.capacity ? `${room.capacity} người` : '—' }
  ];

  return (
    <div className="room-detail-view">
      <div className="room-detail-content">
        <div className="room-detail-header">
          <div>
            <p className="eyebrow">Thông tin phòng</p>
            <h2>{room.name}</h2>
          </div>
          <div className="header-actions">
            <button className="ghost-btn" onClick={onClose}>Đóng</button>
            <button className="primary-btn" onClick={onBookRoom}>Đặt phòng</button>
          </div>
        </div>

        <div className="room-detail-body">
          <div className="room-detail-info">
            {infoItems.map(item => (
              <div key={item.label} className="info-item">
                <span className="info-label">{item.label}</span>
                <span className="info-value">{item.value}</span>
              </div>
            ))}
            {room.description && (
              <div className="room-description">
                <span className="info-label">Mô tả</span>
                <p>{room.description}</p>
              </div>
            )}
          </div>

          <div className="room-detail-schedule">
            <div className="schedule-header">
              <div>
                <h3>Lịch phòng</h3>
                <p>Theo dõi tình trạng phòng theo ngày hoặc tuần</p>
              </div>
              <div className="schedule-view-switch">
                <button
                  className={viewMode === 'day' ? 'active' : ''}
                  onClick={() => setViewMode('day')}
                >
                  Ngày
                </button>
                <button
                  className={viewMode === 'week' ? 'active' : ''}
                  onClick={() => setViewMode('week')}
                >
                  Tuần
                </button>
              </div>
            </div>
            <div className="schedule-wrapper">
              <RoomScheduleView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                viewType={viewMode}
                selectedRoomId={room.id || room.roomId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;

