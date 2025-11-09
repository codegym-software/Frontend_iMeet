import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './TimeTable.css';
import { calendarAPI } from './utils/CalendarAPI';
import { CalendarHelpers } from './utils/CalendarHelpers';
import EditMeetingForm from '../EditMeetingForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import Toast from '../../common/Toast';
import ColorPicker from '../../common/ColorPicker';
import { saveMeetingColor, getMeetingColor, getMeetingColors, removeMeetingColor } from '../../../utils/meetingColorStorage';
import { useMeetings } from '../../../contexts/MeetingContext'; // ✅ Import để lấy meetings từ cache

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
  
  // ✅ Get meetings from context for optimistic updates
  const { meetings: cachedMeetings } = useMeetings();

  // States cho event management
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  
  // ✅ Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // State cho edit meeting form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  
  // States cho confirm dialog và toast
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, meetingId: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  
  // States cho context menu và color picker
  const [contextMenu, setContextMenu] = useState({ isOpen: false, event: null, position: { x: 0, y: 0 } });
  const contextMenuRef = useRef(null);

  // Custom functions cho event management
  // ✅ Removed hover handlers - tooltip only shows on click now
  
  // Empty handlers for backward compatibility (WeekView still uses them)
  const handleEventMouseEnter = useCallback(() => {
    // No-op - tooltip only shows on click now
  }, []);
  
  const handleEventMouseLeave = useCallback(() => {
    // No-op - tooltip only shows on click now
  }, []);

  const handleEventClick = useCallback((event, mouseEvent) => {
    // Left click - show tooltip (not hover)
    setHoveredEvent(event);

    if (mouseEvent) {
      setTooltipPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      });
    }
  }, []);

  // Handle edit meeting
  const handleEditMeeting = useCallback((event) => {
    setEditingMeeting(event);
    setShowEditForm(true);
    setHoveredEvent(null); // Close tooltip when opening edit form
  }, []);

  // Handle double click - open edit form
  const handleEventDoubleClick = useCallback((event) => {
    handleEditMeeting(event);
  }, [handleEditMeeting]);

  // Handle right-click on event - show color picker
  const handleEventContextMenu = useCallback((event, mouseEvent) => {
    if (mouseEvent) {
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      
      // ✅ Check if meeting has ended - don't show context menu
      const meetingEndTime = new Date(event.end);
      const now = new Date();
      
      if (meetingEndTime < now) {
        setToast({
          isOpen: true,
          message: 'Không thể thay đổi cuộc họp đã kết thúc!',
          type: 'error'
        });
        return;
      }
      
      setContextMenu({
        isOpen: true,
        event: event,
        position: {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        }
      });
    }
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setHoveredEvent(null);
    }
    if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
      setContextMenu({ isOpen: false, event: null, position: { x: 0, y: 0 } });
    }
  }, []);

  const resetEventStates = useCallback(() => {
    setHoveredEvent(null);
  }, []);

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
      
      // ✅ Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('🧹 Component unmounted, skipping delete state update');
        return;
      }
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(e => e.id !== meetingId));
      
      // ✅ Remove color from localStorage when meeting is deleted
      removeMeetingColor(meetingId);
      
      // Reset tooltip states
      resetEventStates();
      
      
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
      
      // ✅ Only update error state if component is still mounted
      if (isMountedRef.current) {
        // Show error toast
        setToast({
          isOpen: true,
          message: 'Không thể xóa cuộc họp. Vui lòng thử lại.',
          type: 'error'
        });
      }
    }
  }, [confirmDialog.meetingId, resetEventStates, onMeetingUpdated]);
  
  // Handle change meeting color - Frontend only (no API call)
  const handleChangeColor = useCallback((color) => {
    if (!contextMenu.event) return;
    
    // ✅ Check if meeting has ended - don't allow color change
    const meetingEndTime = new Date(contextMenu.event.end);
    const now = new Date();
    
    if (meetingEndTime < now) {
      setToast({
        isOpen: true,
        message: 'Không thể đổi màu cuộc họp đã kết thúc!',
        type: 'error'
      });
      setContextMenu({ isOpen: false, event: null, position: { x: 0, y: 0 } });
      return;
    }
    
    const meetingId = contextMenu.event.id;
    
    // ✅ Update UI immediately
    setEvents(prevEvents => 
      prevEvents.map(e => 
        e.id === meetingId ? { ...e, color: color } : e
      )
    );
    
    // ✅ Save to localStorage
    saveMeetingColor(meetingId, color);
    
    // Close context menu immediately
    setContextMenu({ isOpen: false, event: null, position: { x: 0, y: 0 } });
    
    // Show success toast
    setToast({
      isOpen: true,
      message: 'Đã đổi màu thành công!',
      type: 'success'
    });
  }, [contextMenu]);

  // Handle delete meeting from edit form (kept for compatibility)
  const handleDeleteMeetingFromForm = useCallback((meetingId) => {
    // Remove from local state
    setEvents(prevEvents => prevEvents.filter(e => e.id !== meetingId));
    
    // Reset tooltip states
    resetEventStates();
    
    
    // Trigger parent refresh
    if (onMeetingUpdated) {
      onMeetingUpdated();
    }
  }, [resetEventStates, onMeetingUpdated]);
  
  // Handle update meeting from edit form
  const handleUpdateMeeting = useCallback((updatedMeeting, message) => {
    
    // ✅ Update local state immediately for instant UI feedback
    if (updatedMeeting) {
      setEvents(prevEvents => {
        const updated = prevEvents.map(e => 
          e.id === updatedMeeting.meetingId || e.id === updatedMeeting.id
            ? {
                ...e,
                title: updatedMeeting.title || e.title,
                start: updatedMeeting.start ? new Date(updatedMeeting.start) : e.start,
                end: updatedMeeting.end ? new Date(updatedMeeting.end) : e.end,
                color: updatedMeeting.color || e.color,
                description: updatedMeeting.description || e.description,
                meetingRoom: updatedMeeting.roomName || e.meetingRoom,
                roomLocation: updatedMeeting.roomLocation || e.roomLocation,
                roomId: updatedMeeting.roomId || e.roomId,
                deviceIds: updatedMeeting.deviceIds || e.deviceIds,
                devices: updatedMeeting.devices || e.devices
              }
            : e
        );
        return updated;
      });
    }
    
    // Show success toast
    if (message) {
      setToast({
        isOpen: true,
        message: message,
        type: 'success'
      });
    }
    
    // Trigger parent refresh để reload từ API
    if (onMeetingUpdated) {
      onMeetingUpdated();
    }
  }, [onMeetingUpdated]);

  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      // ✅ Only update time if component is still mounted
      if (isMountedRef.current) {
        setCurrentTime(new Date());
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper function to get color based on status
  const getStatusColor = (status) => {
    // ✅ Normalize status - Map CONFIRMED → BOOKED for backward compatibility
    const normalizedStatus = status === 'CONFIRMED' ? 'BOOKED' : status;
    
    const colorMap = {
      'PENDING': '#f9ab00',  // Đang xử lý
      'BOOKED': '#4285f4',  // Đã đặt (confirmed by admin)
      'IN_PROGRESS': '#34a853',  // Đang diễn ra
      'COMPLETED': '#9aa0a6',  // Đã kết thúc
      'CANCELLED': '#ea4335'  // Đã hủy
    };
    
    return colorMap[normalizedStatus] || '#4285f4'; // Default to blue
  };

  // ✅ Optimistic update: Add newly created meetings from cache to events immediately
  useEffect(() => {
    if (!cachedMeetings || cachedMeetings.length === 0) return;
    
    // Tính toán date range hiện tại
    const currentStartDate = CalendarHelpers.getStartDateForView(selectedDate, viewType);
    const currentEndDate = CalendarHelpers.getEndDateForView(selectedDate, viewType);
    
    // Filter meetings trong date range hiện tại
    const meetingsInRange = cachedMeetings.filter(meeting => {
      if (!meeting.startTime || !meeting.endTime) return false;
      const meetingStart = new Date(meeting.startTime);
      const meetingEnd = new Date(meeting.endTime);
      return meetingStart <= currentEndDate && meetingEnd >= currentStartDate;
    });
    
    // Transform meetings to events format
    const storedColors = getMeetingColors();
    const newEvents = meetingsInRange
      .filter(meeting => {
        const status = meeting.bookingStatus?.toUpperCase();
        return status !== 'CANCELLED';
      })
      .map(meeting => {
        const color = storedColors[meeting.meetingId] || meeting.color || getStatusColor(meeting.bookingStatus);
        return {
          id: meeting.meetingId,
          title: meeting.title,
          start: new Date(meeting.startTime),
          end: new Date(meeting.endTime),
          color: color,
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
          roomId: meeting.roomId,
          deviceIds: meeting.deviceIds || [],
          devices: meeting.devices || [],
          opacity: 1
        };
      });
    
    // Merge với existing events
    if (newEvents.length > 0) {
      setEvents(prevEvents => {
        const eventMap = new Map(prevEvents.map(e => [e.id, e]));
        newEvents.forEach(event => {
          eventMap.set(event.id, event);
        });
        return Array.from(eventMap.values());
      });
    }
  }, [cachedMeetings, selectedDate, viewType]);

  // Load meetings từ API
  useEffect(() => {
    let isCancelled = false;
    
    const loadMeetings = async () => {
      if (isCancelled) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Lấy current user ID
        const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('oauth2User') || '{}');
        const currentUserId = currentUser.userId || currentUser.id;
        
        // Tính toán khoảng thời gian dựa trên viewType
        const startDate = CalendarHelpers.getStartDateForView(selectedDate, viewType);
        const endDate = CalendarHelpers.getEndDateForView(selectedDate, viewType);
        
        // ✅ Force fresh fetch by adding timestamp to bypass cache
        const cacheBuster = refreshTrigger > 0 ? `&_t=${Date.now()}` : '';
        
        // ✅ Gọi API với userId parameter và cacheBuster - backend sẽ filter
        const meetingsData = await calendarAPI.getMeetingsByDateRange(startDate, endDate, currentUserId, cacheBuster);
        
        // ✅ Check if request was cancelled before updating state
        if (isCancelled || !isMountedRef.current) {
          return;
        }
        
        if (!currentUserId) {
          console.error('⚠️ No user ID found in localStorage. Please login again.');
        }
        
        // Filter out cancelled meetings and transform API data to event format
        const storedColors = getMeetingColors(); // ✅ Load colors from localStorage
        
        const transformedEvents = meetingsData
          .filter(meeting => {
            const status = meeting.bookingStatus?.toUpperCase();
            // Exclude cancelled meetings from calendar
            return status !== 'CANCELLED';
          })
          .map(meeting => {
            // ✅ Priority: localStorage > API color > status color
            const color = storedColors[meeting.meetingId] || meeting.color || getStatusColor(meeting.bookingStatus);
            
            // ✅ Parse dates correctly - handle timezone issues
            const startDate = new Date(meeting.startTime);
            const endDate = new Date(meeting.endTime);
            
            return {
              id: meeting.meetingId,
              title: meeting.title,
              start: startDate,
              end: endDate,
              color: color,
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
              // ✅ Always full opacity - no more pending state
              opacity: 1
            };
          });
        
        // ✅ Final check before updating state
        if (isCancelled || !isMountedRef.current) {
          return;
        }
        
        // ✅ MERGE với existing events thay vì replace hoàn toàn để tránh mất events
        // Điều này đảm bảo optimistic updates không bị overwrite
        setEvents(prevEvents => {
          // Tính toán date range hiện tại
          const currentStartDate = CalendarHelpers.getStartDateForView(selectedDate, viewType);
          const currentEndDate = CalendarHelpers.getEndDateForView(selectedDate, viewType);
          
          // Filter existing events: giữ lại events ngoài date range hiện tại
          const eventsOutsideRange = prevEvents.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            // Giữ lại events không overlap với date range hiện tại
            return eventEnd < currentStartDate || eventStart > currentEndDate;
          });
          
          // Merge transformed events (trong date range) với events ngoài date range
          const allEvents = [...eventsOutsideRange, ...transformedEvents];
          
          // Remove duplicates bằng cách tạo Map
          const eventMap = new Map();
          allEvents.forEach(event => {
            eventMap.set(event.id, event);
          });
          
          return Array.from(eventMap.values());
        });
      } catch (error) {
        console.error('❌ Error loading meetings:', error);
        // ✅ Only update error state if component is still mounted and request not cancelled
        // ⚠️ Don't clear events on error - keep existing events to prevent flicker
        if (isMountedRef.current && !isCancelled) {
          setError('Không thể tải danh sách cuộc họp');
          // Don't setEvents([]) here - keep existing events
        }
      } finally {
        // ✅ Only update loading state if component is still mounted and request not cancelled
        if (isMountedRef.current && !isCancelled) {
          setLoading(false);
        }
      }
    };

    // ✅ Small delay to ensure API has processed the new meeting
    // Increase delay to 1200ms for better reliability with backend processing
    const timeoutId = setTimeout(() => {
      loadMeetings();
    }, refreshTrigger > 0 ? 1200 : 0); // Add delay when refreshTrigger changes (new meeting created)
    
    // ✅ Cleanup function to cancel ongoing request
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [selectedDate, viewType, refreshTrigger]);

  // Đóng tooltip và context menu khi click outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', (e) => {
      // Close context menu if clicking outside
      if (contextMenu.isOpen && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ isOpen: false, event: null, position: { x: 0, y: 0 } });
      }
    });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside, contextMenu.isOpen]);

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
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 
                    'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month}, ${year}`;
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

  // Tooltip component - Google Calendar style
  const EventTooltip = () => {
    const eventToShow = hoveredEvent;
    if (!eventToShow) return null;

    const adjustedPos = getAdjustedPosition(tooltipPosition.x, tooltipPosition.y);
    const canEdit = ['BOOKED', 'IN_PROGRESS'].includes(eventToShow.bookingStatus?.toUpperCase());

    return (
      <div
        ref={tooltipRef}
        className="event-tooltip google-style"
        style={{
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`
        }}
        onMouseEnter={() => setHoveredEvent(eventToShow)}
        onMouseLeave={() => setHoveredEvent(null)}
      >
        {/* Header with action icons */}
        <div className="tooltip-header-actions">
          {canEdit && (
            <button 
              className="tooltip-header-icon-btn tooltip-icon-edit"
              onClick={() => handleEditMeeting(eventToShow)}
              title="Sửa"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          <button 
            className="tooltip-header-icon-btn tooltip-icon-delete"
            onClick={() => handleDeleteMeeting(eventToShow.id)}
            title="Xóa"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          <button 
            className="tooltip-header-icon-btn tooltip-icon-more"
            title="Thêm tùy chọn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          <button 
            className="tooltip-header-icon-btn tooltip-icon-close"
            onClick={() => setHoveredEvent(null)}
            title="Đóng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Event title with color indicator */}
        <div className="tooltip-event-header">
          <div 
            className="tooltip-color-indicator"
            style={{ backgroundColor: eventToShow.color }}
          ></div>
          <div className="tooltip-event-title">{eventToShow.title}</div>
        </div>

        {/* Date and time */}
        <div className="tooltip-date-time">
          {formatDateFull(eventToShow.start)} - {formatTime(eventToShow.start)} – {formatTime(eventToShow.end)}
        </div>

        {/* Room name */}
        {eventToShow.meetingRoom && eventToShow.meetingRoom !== 'N/A' && (
          <div className="tooltip-info-row">
            <span className="tooltip-icon">🏢</span>
            <span>{eventToShow.meetingRoom}</span>
          </div>
        )}

        {/* Room location */}
        {(eventToShow.roomLocation && eventToShow.roomLocation !== 'N/A' && eventToShow.roomLocation.trim() !== '') || 
         (eventToShow.building && eventToShow.building !== 'N/A') ? (
          <div className="tooltip-info-row">
            <span className="tooltip-icon">📍</span>
            <span>
              {eventToShow.roomLocation && eventToShow.roomLocation !== 'N/A' && eventToShow.roomLocation.trim() !== '' 
                ? eventToShow.roomLocation 
                : `${eventToShow.building}${eventToShow.floor && eventToShow.floor !== 'N/A' ? ` - Tầng ${eventToShow.floor}` : ''}`
              }
            </span>
          </div>
        ) : null}

        {/* Borrowed devices */}
        {eventToShow.devices && eventToShow.devices.length > 0 && (
          <div className="tooltip-info-row">
            <span className="tooltip-icon">💻</span>
            <div className="tooltip-devices">
              {eventToShow.devices.map((device, index) => (
                <span key={index} className="tooltip-device-item">
                  {device.deviceName || device.name} x{device.quantity}
                  {index < eventToShow.devices.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Creator/Organizer */}
        <div className="tooltip-info-row">
          <span className="tooltip-icon">📅</span>
          <span>{eventToShow.organizer || 'Chưa có thông tin'}</span>
        </div>
      </div>
    );
  };

  // Render view với useMemo
  const renderTimeTable = useMemo(() => {
    const commonProps = {
      selectedDate,
      events,
      onDateSelect,
      handleEventClick,
      handleEventDoubleClick,
      handleEventContextMenu,
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
        return <ScheduleView selectedDate={selectedDate} onMeetingUpdated={onMeetingUpdated} refreshTrigger={refreshTrigger} />;
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
    handleEventDoubleClick,
    handleEventContextMenu,
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleTimeSlotClick,
    formatTime,
    onMeetingUpdated,
    refreshTrigger
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
      
      {/* Context Menu with Color Picker */}
      {contextMenu.isOpen && contextMenu.event && (
        <div
          ref={contextMenuRef}
          className="event-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.position.x}px`,
            top: `${contextMenu.position.y}px`,
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ColorPicker
            selectedColor={contextMenu.event.color}
            onColorSelect={handleChangeColor}
            onClose={() => setContextMenu({ isOpen: false, event: null, position: { x: 0, y: 0 } })}
          />
        </div>
      )}

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