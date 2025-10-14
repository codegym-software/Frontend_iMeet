import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './TimeTable.css';
import { calendarAPI } from './utils/CalendarAPI';
import { CalendarHelpers } from './utils/CalendarHelpers';

// Import các components đã tách
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import YearView from './views/YearView';

const TimeTable = ({ selectedDate, viewType, onDateSelect, refreshTrigger }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States cho event management với pin functionality
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [pinnedEvent, setPinnedEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  // Custom functions cho event management
  const handleEventMouseEnter = useCallback((event, mouseEvent) => {
    if (!pinnedEvent) {
      setHoveredEvent(event);
      setTooltipPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      });
    }
  }, [pinnedEvent]);

  const handleEventMouseLeave = useCallback(() => {
    if (!pinnedEvent) {
      setHoveredEvent(null);
    }
  }, [pinnedEvent]);

  const handleEventClick = useCallback((event, mouseEvent) => {
    const isCurrentlyPinned = pinnedEvent && pinnedEvent.id === event.id;

    if (isCurrentlyPinned) {
      setPinnedEvent(null);
      setHoveredEvent(null);
    } else {
      setPinnedEvent(event);
      setHoveredEvent(event);

      if (mouseEvent) {
        setTooltipPosition({
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        });
      }
    }
  }, [pinnedEvent]);

  const handleClickOutside = useCallback((event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setPinnedEvent(null);
      setHoveredEvent(null);
    }
  }, []);

  const resetEventStates = useCallback(() => {
    setPinnedEvent(null);
    setHoveredEvent(null);
  }, []);

  // Handle edit meeting
  const handleEditMeeting = useCallback((event) => {
    // TODO: Implement edit functionality
    console.log('Edit meeting:', event);
    alert('Edit functionality will be implemented soon');
  }, []);

  // Handle delete meeting
  const handleDeleteMeeting = useCallback(async (meetingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) {
      return;
    }

    try {
      await calendarAPI.deleteMeeting(meetingId);
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(e => e.id !== meetingId));
      
      // Reset tooltip states
      resetEventStates();
      
      alert('Xóa cuộc họp thành công!');
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Không thể xóa cuộc họp. Vui lòng thử lại.');
    }
  }, [resetEventStates]);

  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load meetings từ API
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tính toán khoảng thời gian dựa trên viewType
        const startDate = CalendarHelpers.getStartDateForView(selectedDate, viewType);
        const endDate = CalendarHelpers.getEndDateForView(selectedDate, viewType);
        
        // Gọi API để lấy meetings
        const meetingsData = await calendarAPI.getMeetingsByDateRange(startDate, endDate);
        
        // Transform API data to event format
        const transformedEvents = meetingsData.map(meeting => ({
          id: meeting.meetingId,
          title: meeting.title,
          start: new Date(meeting.startTime),
          end: new Date(meeting.endTime),
          color: getStatusColor(meeting.status),
          calendar: 'Meeting',
          location: meeting.roomName || 'N/A',
          organizer: meeting.organizerName || 'Unknown',
          host: meeting.organizerName || 'Unknown',
          attendees: meeting.participants || [],
          description: meeting.description || '',
          meetingRoom: meeting.roomName || 'N/A',
          building: meeting.building || 'N/A',
          floor: meeting.floor || 'N/A',
          status: meeting.status,
          allDay: false
        }));
        
        setEvents(transformedEvents);
      } catch (error) {
        console.error('Error loading meetings:', error);
        setError('Không thể tải danh sách cuộc họp');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, [selectedDate, viewType, refreshTrigger]);

  // Helper function to get color based on status
  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': '#f9ab00',
      'CONFIRMED': '#4285f4',
      'CANCELLED': '#ea4335',
      'COMPLETED': '#34a853'
    };
    return colorMap[status] || '#5f6368';
  };

  // Đóng tooltip khi click outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleTimeSlotClick = useCallback((hour, minute = 0) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, minute, 0, 0);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  }, [selectedDate, onDateSelect]);

  // Format time function
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const formatDateFull = useCallback((date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Tính toán vị trí thông minh để tránh bị che
  const getAdjustedPosition = useCallback((x, y) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 280;
    const tooltipHeight = 300;

    let adjustedX = x + 10;
    let adjustedY = y + 10;

    // Nếu tooltip vượt qua cạnh phải
    if (adjustedX + tooltipWidth > viewportWidth - 20) {
      adjustedX = x - tooltipWidth - 10;
    }

    // Nếu tooltip vượt qua cạnh dưới
    if (adjustedY + tooltipHeight > viewportHeight - 20) {
      adjustedY = y - tooltipHeight - 10;
    }

    return { x: adjustedX, y: adjustedY };
  }, []);

  // Tooltip component với pin functionality
  const EventTooltip = () => {
    const eventToShow = pinnedEvent || hoveredEvent;
    if (!eventToShow) return null;

    const adjustedPos = getAdjustedPosition(tooltipPosition.x, tooltipPosition.y);
    const isPinned = !!pinnedEvent;

    return (
      <div
        ref={tooltipRef}
        className={`event-tooltip ${isPinned ? 'pinned' : ''}`}
        style={{
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`
        }}
      >
        <div className="tooltip-header" style={{ backgroundColor: eventToShow.color }}>
          <div className="tooltip-title">{eventToShow.title}</div>
          <div className="tooltip-meta">
            <span className="tooltip-calendar">{eventToShow.calendar}</span>
            {isPinned && <span className="pin-indicator">📌 Pinned</span>}
          </div>
          {isPinned && (
            <button className="close-tooltip-btn" onClick={resetEventStates}>
              ×
            </button>
          )}
        </div>

        <div className="tooltip-content">
          <div className="tooltip-section">
            <div className="tooltip-time">
              <strong>📅 {formatDateFull(eventToShow.start)}</strong>
            </div>
            <div className="tooltip-time">
              <strong>🕐 {formatTime(eventToShow.start)} - {formatTime(eventToShow.end)}</strong>
            </div>
          </div>

          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">📍</span>
              <span>{eventToShow.location}</span>
            </div>
            {eventToShow.meetingRoom && eventToShow.meetingRoom !== 'N/A' && (
              <div className="tooltip-info compact">
                <span className="tooltip-label">🚪</span>
                <span>{eventToShow.meetingRoom}</span>
              </div>
            )}
          </div>

          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">👤</span>
              <span>{eventToShow.organizer}</span>
            </div>
            <div className="tooltip-info compact">
              <span className="tooltip-label">🎯</span>
              <span>{eventToShow.host}</span>
            </div>
          </div>

          <div className="tooltip-section">
            <div className="tooltip-info">
              <span className="tooltip-label">👥 ({eventToShow.attendees.length})</span>
              <div className="attendees-list">
                {eventToShow.attendees.slice(0, 3).map((attendee, index) => (
                  <span key={index} className="attendee">• {attendee}</span>
                ))}
                {eventToShow.attendees.length > 3 && (
                  <span className="attendee">+ {eventToShow.attendees.length - 3} more</span>
                )}
              </div>
            </div>
          </div>

          {eventToShow.description && (
            <div className="tooltip-section">
              <div className="tooltip-info">
                <span className="tooltip-label">📝</span>
                <span>{eventToShow.description.length > 100
                  ? `${eventToShow.description.substring(0, 100)}...`
                  : eventToShow.description}</span>
              </div>
            </div>
          )}
        </div>

        {isPinned && (
          <div className="tooltip-footer">
            <button 
              className="tooltip-action-btn" 
              onClick={() => handleEditMeeting(eventToShow)}
            >
              Edit
            </button>
            <button 
              className="tooltip-action-btn" 
              onClick={() => handleDeleteMeeting(eventToShow.id)}
            >
              Delete
            </button>
            <button className="tooltip-action-btn primary">Join</button>
          </div>
        )}
      </div>
    );
  };

  // Render view với useMemo
  // Render view với useMemo
  const renderTimeTable = useMemo(() => {
    const commonProps = {
      selectedDate,
      events,
      onDateSelect,
      handleEventClick,
      handleEventMouseEnter,
      handleEventMouseLeave,
      formatTime
    };

    switch (viewType) {
      case 'day':
        return (
          <DayView
            {...commonProps}
            currentTime={currentTime}
            handleTimeSlotClick={handleTimeSlotClick}
          />
        );
      case 'week':
        return (
          <WeekView
            {...commonProps}
            currentTime={currentTime} // <-- THÊM DÒNG NÀY
          />
        );
      case 'month':
        return <MonthView {...commonProps} />;
      case 'year':
        return <YearView selectedDate={selectedDate} onDateSelect={onDateSelect} />;
      default:
        return <MonthView {...commonProps} />;
    }
  }, [
    viewType,
    selectedDate,
    events,
    currentTime,
    onDateSelect,
    handleEventClick,
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleTimeSlotClick,
    formatTime
  ]);
  return (
    <>
      {renderTimeTable}
      <EventTooltip />
    </>
  );
};

export default TimeTable;