import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './TimeTable.css';
import { calendarAPI } from './utils/CalendarAPI';
import { CalendarHelpers } from './utils/CalendarHelpers';
import EditMeetingForm from '../EditMeetingForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import Toast from '../../common/Toast';

// Import các components đã tách
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import YearView from './views/YearView';
import ScheduleView from './ScheduleView';

const TimeTable = ({ selectedDate, viewType, onDateSelect, refreshTrigger, onMeetingUpdated }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // States cho event management
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  
  // State cho edit meeting form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  
  // States cho confirm dialog và toast
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, meetingId: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Custom functions cho event management
  const handleEventMouseEnter = useCallback((event, mouseEvent) => {
    setHoveredEvent(event);
    setTooltipPosition({
      x: mouseEvent.clientX,
      y: mouseEvent.clientY
    });
  }, []);

  const handleEventMouseLeave = useCallback(() => {
    setHoveredEvent(null);
  }, []);

  const handleEventClick = useCallback((event, mouseEvent) => {
    setHoveredEvent(event);

    if (mouseEvent) {
      setTooltipPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      });
    }
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setHoveredEvent(null);
    }
  }, []);

  const resetEventStates = useCallback(() => {
    setHoveredEvent(null);
  }, []);

  // Handle edit meeting
  const handleEditMeeting = useCallback((event) => {
    console.log('Edit meeting:', event);
    setEditingMeeting(event);
    setShowEditForm(true);
    resetEventStates();
  }, [resetEventStates]);

  // Handle delete meeting from tooltip
  const handleDeleteMeeting = useCallback((meetingId) => {
    // Show confirm dialog
    setConfirmDialog({
      isOpen: true,
      meetingId: meetingId
    });
  }, []);
  
  // Confirm delete meeting
  const confirmDeleteMeeting = useCallback(async () => {
    const meetingId = confirmDialog.meetingId;
    
    // Close confirm dialog
    setConfirmDialog({ isOpen: false, meetingId: null });
    
    try {
      await calendarAPI.deleteMeeting(meetingId);
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(e => e.id !== meetingId));
      
      // Reset tooltip states
      resetEventStates();
      
      console.log('Meeting deleted successfully');
      
      // Show success toast
      setToast({
        isOpen: true,
        message: 'Xóa cuộc họp thành công!',
        type: 'success'
      });
      
      // Trigger parent refresh
      if (onMeetingUpdated) {
        onMeetingUpdated();
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      
      // Show error toast
      setToast({
        isOpen: true,
        message: 'Không thể xóa cuộc họp. Vui lòng thử lại.',
        type: 'error'
      });
    }
  }, [confirmDialog.meetingId, resetEventStates, onMeetingUpdated]);
  
  // Handle delete meeting from edit form (kept for compatibility)
  const handleDeleteMeetingFromForm = useCallback((meetingId) => {
    // Remove from local state
    setEvents(prevEvents => prevEvents.filter(e => e.id !== meetingId));
    
    // Reset tooltip states
    resetEventStates();
    
    console.log('Meeting deleted, triggering calendar refresh');
    
    // Trigger parent refresh
    if (onMeetingUpdated) {
      onMeetingUpdated();
    }
  }, [resetEventStates, onMeetingUpdated]);
  
  // Handle update meeting from edit form
  const handleUpdateMeeting = useCallback((updatedMeeting, message) => {
    console.log('Meeting updated, triggering calendar refresh');
    
    // Show success toast
    if (message) {
      setToast({
        isOpen: true,
        message: message,
        type: 'success'
      });
    }
    
    // Trigger parent refresh
    if (onMeetingUpdated) {
      onMeetingUpdated();
    }
  }, [onMeetingUpdated]);

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
        console.log('Loading meetings... refreshTrigger:', refreshTrigger);
        setLoading(true);
        setError(null);
        
        // Tính toán khoảng thời gian dựa trên viewType
        const startDate = CalendarHelpers.getStartDateForView(selectedDate, viewType);
        const endDate = CalendarHelpers.getEndDateForView(selectedDate, viewType);
        
        console.log('Date range:', startDate, 'to', endDate);
        
        // Gọi API để lấy meetings
        const meetingsData = await calendarAPI.getMeetingsByDateRange(startDate, endDate);
        
        console.log('Meetings data from API:', meetingsData);
        
        // Filter out cancelled meetings and transform API data to event format
        const transformedEvents = meetingsData
          .filter(meeting => {
            const status = meeting.bookingStatus?.toUpperCase();
            // Exclude cancelled meetings from calendar
            return status !== 'CANCELLED';
          })
          .map(meeting => {
            const status = meeting.bookingStatus?.toUpperCase();
            const isPending = status === 'PENDING' || status === 'BOOKED';
            
            return {
              id: meeting.meetingId,
              title: meeting.title,
              start: new Date(meeting.startTime),
              end: new Date(meeting.endTime),
              color: getStatusColor(meeting.bookingStatus),
              calendar: 'Meeting',
              organizer: meeting.userName || 'Unknown',
              attendees: meeting.participants || [],
              description: meeting.description || '',
              meetingRoom: meeting.roomName || 'N/A',
              roomLocation: meeting.roomLocation || '',
              building: meeting.building || 'N/A',
              floor: meeting.floor || 'N/A',
              bookingStatus: meeting.bookingStatus,
              allDay: meeting.isAllDay || false,
              // Add IDs for edit form
              roomId: meeting.roomId,
              deviceIds: meeting.deviceIds || [],
              devices: meeting.devices || [],
              // Add opacity for pending meetings (0.5 for pending, 1 for confirmed)
              opacity: isPending ? 0.5 : 1
            };
          });
        
        console.log('Transformed events:', transformedEvents);
        setEvents(transformedEvents);
        console.log('Events state updated with', transformedEvents.length, 'events');
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
      'BOOKED': '#ff9800',
      'CONFIRMED': '#4285f4',
      'CANCELLED': '#ea4335'
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

  // Đóng tooltip khi scroll
  useEffect(() => {
    const handleScroll = () => {
      setHoveredEvent(null);
    };
    
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

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

  // Tooltip component
  const EventTooltip = () => {
    const eventToShow = hoveredEvent;
    if (!eventToShow) return null;

    const adjustedPos = getAdjustedPosition(tooltipPosition.x, tooltipPosition.y);

    return (
      <div
        ref={tooltipRef}
        className="event-tooltip"
        style={{
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`
        }}
        onMouseEnter={() => setHoveredEvent(eventToShow)}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        <div className="tooltip-header" style={{ backgroundColor: eventToShow.color }}>
          <div className="tooltip-title">{eventToShow.title}</div>
          <div className="tooltip-meta">
            <span className="tooltip-calendar">{eventToShow.calendar}</span>
          </div>
        </div>

        <div className="tooltip-body">
          {/* 1. Ngày/tháng/năm */}
          <div className="tooltip-section">
            <div className="tooltip-time">
              <strong>📅 {formatDateFull(eventToShow.start)}</strong>
            </div>
          </div>

          {/* 2. Start time - End time */}
          <div className="tooltip-section">
            <div className="tooltip-time">
              <strong>🕐 {formatTime(eventToShow.start)} - {formatTime(eventToShow.end)}</strong>
            </div>
          </div>

          {/* 3. Phòng họp */}
          {eventToShow.meetingRoom && eventToShow.meetingRoom !== 'N/A' && (
            <div className="tooltip-section">
              <div className="tooltip-info compact">
                <span className="tooltip-label">🚪</span>
                <span>{eventToShow.meetingRoom}</span>
              </div>
            </div>
          )}

          {/* 4. Vị trí phòng */}
          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">📍</span>
              <span>
                {eventToShow.roomLocation && eventToShow.roomLocation !== 'N/A' && eventToShow.roomLocation.trim() !== '' 
                  ? eventToShow.roomLocation 
                  : (eventToShow.building && eventToShow.building !== 'N/A' && eventToShow.building.trim() !== '' 
                      ? `${eventToShow.building}${eventToShow.floor && eventToShow.floor !== 'N/A' ? ` - Tầng ${eventToShow.floor}` : ''}`
                      : 'Chưa có thông tin vị trí'
                    )
                }
              </span>
            </div>
          </div>

          {/* 5. Người chủ trì (người tạo lịch) */}
          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">👤</span>
              <span>{eventToShow.organizer}</span>
            </div>
          </div>

          {/* 6. Số người tham gia */}
          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">👥</span>
              <span>{eventToShow.attendees.length} người tham gia</span>
            </div>
          </div>

          {/* 7. Thiết bị mượn */}
          {eventToShow.devices && eventToShow.devices.length > 0 && (
            <div className="tooltip-section">
              <div className="tooltip-info">
                <span className="tooltip-label">💻 Thiết bị mượn:</span>
                <div className="devices-list">
                  {eventToShow.devices.map((device, index) => (
                    <span key={index} className="device-item">
                      • {device.deviceName} ({device.deviceType}) x{device.quantity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. Mô tả (nếu có) */}
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

        {/* Notice for pending meetings */}
        {eventToShow.bookingStatus?.toUpperCase() !== 'CONFIRMED' && (
          <div className="edit-disabled-notice">
            <span>ℹ️ Đang chờ admin duyệt. Bạn chỉ có thể xóa cuộc họp này.</span>
          </div>
        )}

        <div className="tooltip-footer">
          {/* Chỉ hiển thị nút Edit nếu status là CONFIRMED (đã được admin duyệt) */}
          {eventToShow.bookingStatus?.toUpperCase() === 'CONFIRMED' ? (
            <>
              <button 
                className="tooltip-action-btn" 
                onClick={() => handleEditMeeting(eventToShow)}
              >
                ✏️ Edit
              </button>
              <button 
                className="tooltip-action-btn" 
                onClick={() => handleDeleteMeeting(eventToShow.id)}
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            <button 
              className="tooltip-action-btn"
              onClick={() => handleDeleteMeeting(eventToShow.id)}
              style={{ width: '100%' }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
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
      case 'schedule':
        return <ScheduleView selectedDate={selectedDate} onMeetingUpdated={onMeetingUpdated} />;
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {renderTimeTable}
      <EventTooltip />
      
      {/* Edit Meeting Form */}
      {showEditForm && editingMeeting && (
        <EditMeetingForm
          meeting={editingMeeting}
          onClose={() => {
            setShowEditForm(false);
            setEditingMeeting(null);
          }}
          onSubmit={handleUpdateMeeting}
          onDelete={handleDeleteMeetingFromForm}
        />
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa cuộc họp này?"
        onConfirm={confirmDeleteMeeting}
        onCancel={() => setConfirmDialog({ isOpen: false, meetingId: null })}
        confirmText="Xóa"
        cancelText="Hủy"
      />
      
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
};

export default TimeTable;