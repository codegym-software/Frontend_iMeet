import React from 'react';
import './MeetingReminderNotification.css';

/**
 * Component hiển thị thông báo reminder cho meeting sắp bắt đầu
 */
const MeetingReminderNotification = ({ reminder, onClose, onView }) => {
  if (!reminder) return null;

  const meetingTitle = reminder.title || 'Cuộc họp';
  const startTime = reminder.startTime || reminder.start;
  const endTime = reminder.endTime || reminder.end;
  const roomName = reminder.room?.name || reminder.roomName || 'Chưa xác định';
  const roomLocation = reminder.room?.location || reminder.roomLocation || '';
  const minutesUntilStart = reminder.minutesUntilStart || 15;

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="meeting-reminder-notification">
      <div className="reminder-header">
        <div className="reminder-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.21z" fill="currentColor"/>
          </svg>
        </div>
        <div className="reminder-title">
          <h3>Nhắc nhở: Cuộc họp sắp bắt đầu</h3>
          <p className="reminder-time-badge">
            {minutesUntilStart} phút nữa
          </p>
        </div>
        <button className="reminder-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>
      
      <div className="reminder-content">
        <div className="reminder-meeting-title">{meetingTitle}</div>
        
        <div className="reminder-details">
          <div className="reminder-detail-item">
            <span className="reminder-detail-label">📅 Ngày:</span>
            <span className="reminder-detail-value">{formatDate(startTime)}</span>
          </div>
          
          <div className="reminder-detail-item">
            <span className="reminder-detail-label">🕐 Thời gian:</span>
            <span className="reminder-detail-value">
              {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>
          
          <div className="reminder-detail-item">
            <span className="reminder-detail-label">📍 Phòng:</span>
            <span className="reminder-detail-value">
              {roomName}
              {roomLocation && ` (${roomLocation})`}
            </span>
          </div>
        </div>
      </div>
      
      <div className="reminder-actions">
        <button className="reminder-btn reminder-btn-primary" onClick={onView}>
          Xem chi tiết
        </button>
        <button className="reminder-btn reminder-btn-secondary" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
};

export default MeetingReminderNotification;

