import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './TimeTable.css';
import { calendarAPI } from './utils/CalendarAPI';
import { CalendarHelpers } from './utils/CalendarHelpers';
import EditMeetingForm from '../EditMeetingForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import Toast from '../../common/Toast';
import { useMeetings } from '../../../contexts/MeetingContext';

// Import các components đã tách
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import YearView from './views/YearView';
import ScheduleView from './ScheduleView';

const TimeTable = ({ selectedDate, viewType, onDateSelect, refreshTrigger, onMeetingUpdated, onSelectionComplete, activeSelection, onSelectionRangeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const { meetings, isDataLoaded, fetchMeetings } = useMeetings();
  
  // ✅ Log meetings from context whenever they change
  useEffect(() => {
    console.log('📦 TimeTable: Meetings from context changed', {
      meetingsLength: meetings?.length || 0,
      isDataLoaded,
      meetingsType: typeof meetings,
      isArray: Array.isArray(meetings),
      sampleMeeting: meetings?.[0] ? {
        id: meetings[0].meetingId || meetings[0].id,
        title: meetings[0].title,
        startTime: meetings[0].startTime,
        endTime: meetings[0].endTime
      } : null
    });
  }, [meetings, isDataLoaded]);

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
    if (!event?.canEdit) {
      setToast({
        isOpen: true,
        message: 'Bạn không có quyền chỉnh sửa cuộc họp này.',
        type: 'info'
      });
      return;
    }
    console.log('Edit meeting:', event);
    setEditingMeeting(event);
    setShowEditForm(true);
    resetEventStates();
  }, [resetEventStates]);

  // Handle double click on event to open edit form
  const handleEventDoubleClick = useCallback((event, mouseEvent) => {
    if (!event?.canEdit) {
      setToast({
        isOpen: true,
        message: 'Bạn chỉ có quyền xem cuộc họp này.',
        type: 'info'
      });
      return;
    }
    console.log('Double click on event:', event);
    if (mouseEvent) {
      mouseEvent.stopPropagation();
    }
    handleEditMeeting(event);
  }, [handleEditMeeting]);

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
      const { message } = await calendarAPI.deleteMeeting(meetingId);
      
      // ✅ Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('🧹 Component unmounted, skipping delete state update');
        return;
      }
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(e => e.id !== meetingId));
      
      // Reset tooltip states
      resetEventStates();
      
      console.log('Meeting deleted successfully');
      
      // Show success toast
      setToast({
        isOpen: true,
        message: message || 'Xóa cuộc họp thành công!',
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
    console.log('Meeting updated, triggering calendar refresh', updatedMeeting);
    
    // Validate updatedMeeting
    if (!updatedMeeting) {
      console.error('❌ Updated meeting is null or undefined');
      setToast({
        isOpen: true,
        message: 'Lỗi: Không nhận được dữ liệu meeting sau khi cập nhật',
        type: 'error'
      });
      return;
    }
    
    // Show success toast
    if (message) {
      setToast({
        isOpen: true,
        message: message,
        type: 'success'
      });
    }
    
    // Trigger parent refresh - pass updatedMeeting to avoid "Failed to create meeting" error
    if (onMeetingUpdated) {
      onMeetingUpdated(updatedMeeting, message);
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
      console.log('🧹 TimeTable unmounting, canceling state updates');
      isMountedRef.current = false;
    };
  }, []);

  // Ensure meeting data is cached (fetch once or on refresh trigger)
  useEffect(() => {
    let cancelled = false;
    
    const ensureMeetings = async () => {
      try {
        console.log('🔄 TimeTable: ensureMeetings called', {
          refreshTrigger,
          isDataLoaded,
          meetingsLength: meetings?.length || 0
        });

        setError(null);
        
        if (refreshTrigger > 0) {
          console.log('🔄 TimeTable: Force refresh triggered');
          setLoading(true);
          const fetchedMeetings = await fetchMeetings(true);
          if (!cancelled) {
            console.log('✅ TimeTable: Meetings fetched after refresh:', fetchedMeetings?.length || 0);
          }
        } else if (!isDataLoaded) {
          console.log('🔄 TimeTable: Data not loaded, fetching...');
          setLoading(true);
          const fetchedMeetings = await fetchMeetings(false);
          if (!cancelled) {
            console.log('✅ TimeTable: Meetings fetched:', fetchedMeetings?.length || 0);
          }
        } else {
          console.log('✅ TimeTable: Data already loaded, skipping fetch', {
            meetingsCount: meetings?.length || 0
          });
        }
      } catch (fetchError) {
        console.error('❌ TimeTable: Error loading meetings:', fetchError);
        if (!cancelled) {
          setError('Không thể tải danh sách cuộc họp');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    ensureMeetings();
    
    return () => {
      cancelled = true;
    };
  }, [fetchMeetings, isDataLoaded, refreshTrigger]); // ✅ FIX: Remove meetings?.length to avoid re-render loop

  // Transform cached meetings into events for the current view
  useEffect(() => {
    console.log('🔄 TimeTable: useEffect triggered for transform', {
      meetingsLength: meetings?.length || 0,
      meetingsIsArray: Array.isArray(meetings),
      meetingsType: typeof meetings,
      selectedDate: selectedDate?.toISOString(),
      viewType,
      isDataLoaded
    });

    // ✅ CRITICAL: Check if meetings is empty or undefined
    if (!meetings || meetings.length === 0) {
      console.warn('⚠️ TimeTable: No meetings available!', {
        meetings,
        isDataLoaded,
        meetingsType: typeof meetings
      });
      setEvents([]);
      return;
    }

    const startRange = CalendarHelpers.getStartDateForView(selectedDate, viewType);
    const endRange = CalendarHelpers.getEndDateForView(selectedDate, viewType);

    if (!startRange || !endRange) {
      console.log('⚠️ TimeTable: Invalid date range', { startRange, endRange });
      setEvents([]);
      return;
    }

    console.log('📅 TimeTable: Transforming meetings', {
      meetingsCount: meetings?.length || 0,
      viewType,
      selectedDate: selectedDate?.toISOString(),
      startRange: startRange.toISOString(),
      endRange: endRange.toISOString()
    });

    // ✅ Log first meeting structure to debug
    if (meetings.length > 0) {
      const firstMeeting = meetings[0];
      console.log('🔍 TimeTable: First meeting structure:', {
        meetingId: firstMeeting.meetingId || firstMeeting.id,
        title: firstMeeting.title,
        startTime: firstMeeting.startTime,
        endTime: firstMeeting.endTime,
        start: firstMeeting.start,
        end: firstMeeting.end,
        bookingStatus: firstMeeting.bookingStatus,
        allKeys: Object.keys(firstMeeting)
      });
    }

    // ✅ Remove duplicates by meetingId/id before filtering
    const uniqueMeetings = (meetings || []).reduce((acc, meeting) => {
      const meetingId = meeting.meetingId || meeting.id;
      if (!meetingId) return acc;
      
      // Check if this meeting ID already exists
      const exists = acc.find(m => (m.meetingId || m.id) === meetingId);
      if (!exists) {
        acc.push(meeting);
      } else {
        console.log('⚠️ Duplicate meeting found:', meeting.title, 'ID:', meetingId);
      }
      return acc;
    }, []);

    console.log('📊 Unique meetings after deduplication:', {
      original: meetings?.length || 0,
      unique: uniqueMeetings.length
    });

    const now = currentTime || new Date();

    const transformedEvents = uniqueMeetings
      .filter((meeting) => {
        const status = meeting.bookingStatus?.toUpperCase();
        if (status === 'CANCELLED') {
          console.log('❌ Filtered out CANCELLED meeting:', meeting.title);
          return false;
        }

        const rawStart = meeting.startTime || meeting.start;
        const rawEnd = meeting.endTime || meeting.end;
        if (!rawStart || !rawEnd) {
          console.log('❌ Filtered out meeting (no dates):', meeting.title, { rawStart, rawEnd });
          return false;
        }

        const start = new Date(rawStart);
        const end = new Date(rawEnd);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          console.log('❌ Filtered out meeting (invalid dates):', meeting.title, { rawStart, rawEnd, start, end });
          return false;
        }

        // ✅ FIX: Use getTime() for reliable numeric comparison
        // Check if meeting overlaps with view range
        // Meeting overlaps if: meeting.end >= view.start AND meeting.start <= view.end
        const startTime = start.getTime();
        const endTime = end.getTime();
        const startRangeTime = startRange.getTime();
        const endRangeTime = endRange.getTime();
        
        const overlaps = endTime >= startRangeTime && startTime <= endRangeTime;
        
        if (!overlaps) {
          console.log('❌ Filtered out meeting (out of range):', meeting.title, {
            meetingStart: start.toISOString(),
            meetingEnd: end.toISOString(),
            viewStart: startRange.toISOString(),
            viewEnd: endRange.toISOString(),
            meetingStartTime: startTime,
            meetingEndTime: endTime,
            viewStartTime: startRangeTime,
            viewEndTime: endRangeTime,
            check1: endTime >= startRangeTime,
            check2: startTime <= endRangeTime
          });
        } else {
          console.log('✅ Meeting in range:', meeting.title, {
            meetingStart: start.toISOString(),
            meetingEnd: end.toISOString(),
            viewStart: startRange.toISOString(),
            viewEnd: endRange.toISOString()
          });
        }

        return overlaps;
      })
      .map((meeting) => {
        const rawStart = meeting.startTime || meeting.start;
        const rawEnd = meeting.endTime || meeting.end;
        const start = new Date(rawStart);
        const end = new Date(rawEnd);
        const canEdit = meeting.canEdit !== undefined ? meeting.canEdit : true;
        // Real-time status override (except CANCELLED)
        const computeEffectiveStatus = (bookingStatus, startDate, endDate, nowDate) => {
          const s = bookingStatus?.toUpperCase();
          if (s === 'CANCELLED') return 'CANCELLED';
          const n = nowDate.getTime();
          const st = startDate.getTime();
          const et = endDate.getTime();
          if (n < st) return 'BOOKED';
          if (n >= st && n <= et) return 'IN_PROGRESS';
          return 'COMPLETED';
        };
        const effectiveStatus = computeEffectiveStatus(meeting.bookingStatus, start, end, now);
        return {
          id: meeting.meetingId || meeting.id,
          title: meeting.title,
          start,
          end,
          color: getStatusColor(effectiveStatus),
          calendar: 'Meeting',
          organizer: meeting.userName || meeting.organizer || 'Unknown',
          attendees: meeting.participants || meeting.attendees || [],
          description: meeting.description || '',
          meetingRoom: meeting.roomName || meeting.room || 'N/A',
          roomLocation: meeting.roomLocation || meeting.location || '',
          building: meeting.building || 'N/A',
          floor: meeting.floor || 'N/A',
          bookingStatus: effectiveStatus,
          allDay: meeting.isAllDay || meeting.allDay || false,
          roomId: meeting.roomId,
          deviceIds: meeting.deviceIds || [],
          devices: meeting.devices || [],
          canEdit,
          meetingRole: meeting.meetingRole || (canEdit ? 'owner' : 'guest'),
          readOnly: !canEdit,
          opacity: 1
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    console.log('✅ TimeTable: Transformed events', {
      totalMeetings: meetings?.length || 0,
      uniqueMeetings: uniqueMeetings.length,
      transformedCount: transformedEvents.length,
      events: transformedEvents.map(e => ({ 
        id: e.id,
        title: e.title, 
        start: e.start.toISOString(), 
        end: e.end.toISOString(),
        allDay: e.allDay
      }))
    });

    // ✅ Log before setting events
    console.log('📤 TimeTable: Setting events state', {
      eventsCount: transformedEvents.length,
      willRender: transformedEvents.length > 0
    });

    setEvents(transformedEvents);
    
    // ✅ Log after setting (in next render cycle)
    setTimeout(() => {
      console.log('✅ TimeTable: Events state updated', {
        eventsLength: transformedEvents.length
      });
    }, 0);
  }, [meetings, selectedDate, viewType, currentTime]);

  // Helper function to get color based on status
  const getStatusColor = (status) => {
    // ✅ Normalize status - Map CONFIRMED → BOOKED for backward compatibility
    const normalizedStatus = status === 'CONFIRMED' ? 'BOOKED' : status;
    
    const colorMap = {
      'PENDING': '#f9ab00',   // Đang xử lý
      'BOOKED': '#4285f4',    // Đã đặt - màu xanh cũ (mặc định)
      'CONFIRMED': '#4285f4', // ⚠️ DEPRECATED - Map to BOOKED (xanh cũ)
      'IN_PROGRESS': '#f9ab00', // Đang diễn ra - màu vàng
      'COMPLETED': '#5f6368', // Đã hoàn thành - màu xám
      'CANCELLED': '#ea4335'  // Đã hủy
    };
    return colorMap[normalizedStatus] || '#5f6368';
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

        {/* Notice for read-only meetings */}
        {(!eventToShow.canEdit || eventToShow.meetingRole === 'guest') && (
          <div className="edit-disabled-notice">
            <span>ℹ️ Bạn chỉ có thể xem cuộc họp này.</span>
          </div>
        )}

        <div className="tooltip-footer">
          {/* Chỉ hiển thị nút Edit nếu status hợp lệ và user có quyền */}
          {eventToShow.canEdit && ['BOOKED', 'IN_PROGRESS'].includes(eventToShow.bookingStatus?.toUpperCase()) ? (
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
          ) : eventToShow.canEdit ? (
            <button 
              className="tooltip-action-btn"
              onClick={() => handleDeleteMeeting(eventToShow.id)}
              style={{ width: '100%' }}
            >
              🗑️ Delete
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  // Render view với useMemo
  // Render view với useMemo
  const renderTimeTable = useMemo(() => {
    console.log('🎨 TimeTable: Rendering view', {
      viewType,
      eventsCount: events?.length || 0,
      selectedDate: selectedDate?.toISOString(),
      eventsSample: events?.slice(0, 2).map(e => ({
        id: e.id,
        title: e.title,
        start: e.start?.toISOString()
      }))
    });

    const weekViewProps = {
      selectedDate: selectedDate,
      events,
      onDateSelect,
      handleEventClick,
      handleEventDoubleClick,
      handleEventMouseEnter,
      handleEventMouseLeave,
      formatTime,
      currentTime,
      onSelectionComplete,
      lockedSelection: activeSelection,
      onLockSelection: onSelectionRangeChange
    };

    const monthViewProps = {
      selectedDate: selectedDate,
      events,
      onDateSelect,
      handleEventClick,
      handleEventDoubleClick,
      handleEventMouseEnter,
      handleEventMouseLeave,
      formatTime
    };

    switch (viewType) {
      case 'day':
        return (
          <DayView
            selectedDate={selectedDate}
            events={events}
            onDateSelect={onDateSelect}
            handleEventClick={handleEventClick}
            handleEventDoubleClick={handleEventDoubleClick}
            handleEventMouseEnter={handleEventMouseEnter}
            handleEventMouseLeave={handleEventMouseLeave}
            formatTime={formatTime}
            currentTime={currentTime}
            handleTimeSlotClick={handleTimeSlotClick}
            onSelectionComplete={onSelectionComplete}
            lockedSelection={activeSelection}
            onLockSelection={onSelectionRangeChange}
          />
        );
      case 'week':
        return <WeekView {...weekViewProps} />;
      case 'month':
        return <MonthView {...monthViewProps} />;
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
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleTimeSlotClick,
    onSelectionComplete,
    onSelectionRangeChange,
    activeSelection,
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