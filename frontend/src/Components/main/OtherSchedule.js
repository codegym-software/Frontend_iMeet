import React, { useState, useMemo } from 'react';
import './OtherSchedule.css';
import { useMeetings } from '../../contexts/MeetingContext';

const OtherSchedule = () => {
  const { meetings, loading: globalLoading } = useMeetings();
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' | 'pending' | 'all'

  // Filter meetings using useMemo to avoid re-computation
  const upcomingMeetings = useMemo(() => {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.userId;

    if (!currentUserId) {
      return [];
    }

    const now = new Date();

    // Filter user's meetings
    let filteredMeetings = meetings.filter(meeting => {
      const isUserMeeting = meeting.userId === currentUserId;
      const isNotCancelled = meeting.bookingStatus?.toUpperCase() !== 'CANCELLED';
      const meetingEndTime = new Date(meeting.endTime);
      const isUpcoming = meetingEndTime >= now;

      return isUserMeeting && isNotCancelled && isUpcoming;
    });

    // Apply view mode filter
    if (viewMode === 'pending') {
      filteredMeetings = filteredMeetings.filter(
        m => m.bookingStatus?.toUpperCase() === 'PENDING' || m.bookingStatus?.toUpperCase() === 'BOOKED'
      );
    }
    // 'upcoming' and 'all' modes show everything (already filtered above)

    // Sort by start time
    filteredMeetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Take only first 5 for compact view
    return filteredMeetings.slice(0, 5);
  }, [meetings, viewMode]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Ngày mai';
    }

    return date.toLocaleDateString('vi-VN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusColor = (status) => {
    // ✅ Normalize CONFIRMED → BOOKED for backward compatibility
    let statusUpper = status?.toUpperCase();
    if (statusUpper === 'CONFIRMED') {
      statusUpper = 'BOOKED';
    }
    
    switch (statusUpper) {
      case 'PENDING':
      case 'BOOKED':
        return '#fbbc04';
      case 'APPROVED':
      case 'IN_PROGRESS':
        return '#34a853';
      case 'CANCELLED':
        return '#ea4335';
      case 'COMPLETED':
        return '#5f6368';
      default:
        return '#5f6368';
    }
  };

  const getStatusLabel = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'BOOKED':
        return 'Đã đặt';
      case 'APPROVED':
        return 'Đã duyệt';
      default:
        return status;
    }
  };

  return (
    <div className="other-schedule">
      <div className="my-schedule-header">
        <strong>Lịch của tôi</strong>
        <div className="view-mode-tabs">
          <button
            className={`view-tab ${viewMode === 'upcoming' ? 'active' : ''}`}
            onClick={() => setViewMode('upcoming')}
            title="Lịch sắp tới đã duyệt"
          >
            Sắp tới
          </button>
          <button
            className={`view-tab ${viewMode === 'pending' ? 'active' : ''}`}
            onClick={() => setViewMode('pending')}
            title="Lịch đang chờ duyệt"
          >
            Chờ duyệt
          </button>
          <button
            className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
            title="Tất cả lịch"
          >
            Tất cả
          </button>
        </div>
      </div>

      {globalLoading ? (
        <div className="schedule-loading-mini">
          <div className="spinner-mini"></div>
          <span>Đang tải...</span>
        </div>
      ) : upcomingMeetings.length === 0 ? (
        <div className="schedule-empty-mini">
          <div className="empty-icon-mini">📅</div>
          <p>
            {viewMode === 'pending' 
              ? 'Không có lịch chờ duyệt' 
              : viewMode === 'upcoming'
              ? 'Không có lịch sắp tới'
              : 'Chưa có lịch nào'}
          </p>
        </div>
      ) : (
        <ul className="my-schedule-list">
          {upcomingMeetings.map((meeting, index) => (
            <li key={meeting.meetingId || index} className="my-schedule-item">
              <div className="meeting-date-badge">
                <div className="date-day">{formatDate(meeting.startTime)}</div>
                <div className="date-time">
                  {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                </div>
              </div>
              <div className="meeting-info">
                <div className="meeting-title-row">
                  <span 
                    className="status-indicator" 
                    style={{ backgroundColor: getStatusColor(meeting.bookingStatus) }}
                  ></span>
                  <span className="meeting-title">{meeting.title}</span>
                </div>
                {meeting.roomName && (
                  <div className="meeting-room">
                    <span className="room-icon">🏢</span>
                    {meeting.roomName}
                  </div>
                )}
                <div className="meeting-status-badge">
                  <span 
                    className="status-label"
                    style={{ 
                      backgroundColor: `${getStatusColor(meeting.bookingStatus)}20`,
                      color: getStatusColor(meeting.bookingStatus)
                    }}
                  >
                    {getStatusLabel(meeting.bookingStatus)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OtherSchedule;