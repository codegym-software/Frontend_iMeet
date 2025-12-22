import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { calendarAPI } from '../../Components/main/MainCalendar/utils/CalendarAPI';
import DayView from '../../Components/main/MainCalendar/views/DayView';
import WeekView from '../../Components/main/MainCalendar/views/WeekView';
import EditMeetingForm from '../../Components/main/EditMeetingForm';
import { CalendarHelpers } from '../../Components/main/MainCalendar/utils/CalendarHelpers';
import './RoomScheduleView.css';
import { useMeetings } from '../../contexts/MeetingContext';

const RoomScheduleView = ({ selectedDate: parentSelectedDate, onDateChange, viewType, selectedRoomId }) => {
  const [selectedDate, setSelectedDate] = useState(parentSelectedDate || new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false); // only true when no data to show
  const [refreshing, setRefreshing] = useState(false); // background refresh indicator
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  
  // ✅ NEW: State for drag-to-create meeting form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // ✅ Track if component is mounted
  const isMountedRef = useRef(true);
  const { meetings: cachedMeetings } = useMeetings();
  // Per-room cache with TTL
  const roomCacheRef = useRef(new Map()); // roomId -> { data: [], ts: number }
  const CACHE_TTL = 30000; // 30s
  // Abort controller for in-flight requests
  const abortRef = useRef(null);
  
  // Use viewType from parent (day or week only)
  const viewMode = viewType === 'week' ? 'week' : 'day';

  // Sync with parent date
  useEffect(() => {
    if (parentSelectedDate) {
      setSelectedDate(parentSelectedDate);
    }
  }, [parentSelectedDate]);

  // Update current time every second for realtime color changes
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      if (!isMountedRef.current) return;
      setCurrentTime(new Date());
    }, 1000); // Update every 1 second for smooth realtime updates
    
    return () => clearInterval(timer);
  }, []);

  // Instant render using cached data when room changes; refresh in background
  useEffect(() => {
    if (!selectedRoomId) return;
    // 1) Show cached immediately (component-level per-room cache)
    const entry = roomCacheRef.current.get(selectedRoomId);
    const now = Date.now();
    if (entry && (now - entry.ts) < CACHE_TTL) {
      if (isMountedRef.current) setMeetings(entry.data);
    } else if (Array.isArray(cachedMeetings)) {
      // fallback to global cache filtered by room
      const fromGlobal = cachedMeetings.filter(m => m.roomId === selectedRoomId && m.bookingStatus?.toUpperCase() !== 'CANCELLED');
      if (fromGlobal.length) {
        if (isMountedRef.current) setMeetings(fromGlobal);
        roomCacheRef.current.set(selectedRoomId, { data: fromGlobal, ts: now });
      }
    }
    // 2) SWR: refresh in background without blanking the view
    loadRoomSchedule(true);
  }, [selectedRoomId, cachedMeetings]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadRoomSchedule = async (swr = false) => {
    if (!selectedRoomId) return;
    
    if (!isMountedRef.current) return;
    if (meetings.length === 0 || !swr) setLoading(true); else setRefreshing(true);
    
    try {
      // Abort previous in-flight request
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (_) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Use optimized endpoint by room
      const allMeetings = await calendarAPI.getMeetingsByRoom(selectedRoomId, controller.signal);
      
      // ✅ Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Normalize and filter
      const filteredMeetings = (Array.isArray(allMeetings) ? allMeetings : []).filter(meeting => 
        meeting.roomId === selectedRoomId && meeting.bookingStatus?.toUpperCase() !== 'CANCELLED'
      );
      
      console.log('✅ Loaded meetings for room:', selectedRoomId, 'Count:', filteredMeetings.length);
      filteredMeetings.forEach(m => {
        console.log(`  - ${m.title} (${m.startTime} to ${m.endTime})`);
      });
      
      setMeetings(filteredMeetings);
      // Update per-room cache
      roomCacheRef.current.set(selectedRoomId, { data: filteredMeetings, ts: Date.now() });
    } catch (error) {
      if (error?.name === 'AbortError') {
        console.log('⏹️ Fetch aborted for room', selectedRoomId);
      } else {
        console.error('Error loading room schedule:', error);
      }
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get color based on meeting status (REALTIME)
  const getMeetingStatusColor = (meeting) => {
    const now = currentTime;
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    
    // ✅ Đã kết thúc (quá khứ) → Xám
    if (endTime < now) {
      return '#9e9e9e';  // Gray - Đã kết thúc
    }
    
    // ✅ Đang diễn ra → Xanh lá
    if (startTime <= now && now < endTime) {
      return '#34a853';  // Green - Đang diễn ra
    }
    
    // ✅ Chưa bắt đầu (tương lai) → Vàng
    if (now < startTime) {
      return '#f9ab00';  // Yellow - Chưa bắt đầu
    }
    
    return '#1a73e8';  // Default blue
  };

  // Helper function to get color based on status (DEPRECATED - kept for backward compatibility)
  const getStatusColor = (status) => {
    // ✅ Normalize CONFIRMED → BOOKED for backward compatibility
    const normalizedStatus = status?.toUpperCase() === 'CONFIRMED' ? 'BOOKED' : status?.toUpperCase();
    
    const colorMap = {
      'PENDING': '#f9ab00',
      'BOOKED': '#1a73e8',  // BOOKED = Đã đặt (approved by admin)
      'CONFIRMED': '#1a73e8',  // ⚠️ DEPRECATED - Map to BOOKED
      'IN_PROGRESS': '#34a853',  // Đang diễn ra
      'COMPLETED': '#5f6368',  // Đã kết thúc
      'CANCELLED': '#ea4335'  // Đã hủy
    };
    return colorMap[normalizedStatus] || '#1a73e8';
  };

  // Convert meetings to events format for TimeTable
  const events = useMemo(() => {
    // Get current user ID
    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('oauth2User') || '{}');
    const currentUserId = currentUser.userId || currentUser.id;
    
    return meetings.map(meeting => {
      const isOwner = meeting.userId === currentUserId;
      
      // ✅ Nếu KHÔNG phải lịch của user: chỉ hiển thị block/màu, không có chi tiết
      if (!isOwner) {
        return {
          id: meeting.meetingId,
          title: '🔒 Đã đặt', // Chỉ hiển thị "Đã đặt", không có tên meeting
          start: new Date(meeting.startTime),
          end: new Date(meeting.endTime),
          color: getMeetingStatusColor(meeting), // ✅ Use realtime color based on time
          bookingStatus: meeting.bookingStatus,
          roomId: meeting.roomId,
          isOwner: false, // Flag để biết đây không phải lịch của mình
          // KHÔNG có: description, organizerName, guests, devices
        };
      }
      
      // ✅ Nếu LÀ lịch của user: hiển thị đầy đủ chi tiết
      return {
        id: meeting.meetingId,
        title: meeting.title,
        start: new Date(meeting.startTime),
        end: new Date(meeting.endTime),
        color: getMeetingStatusColor(meeting), // ✅ Use realtime color based on time
        bookingStatus: meeting.bookingStatus,
        description: meeting.description,
        roomId: meeting.roomId,
        roomName: meeting.roomName,
        organizerName: meeting.organizerName,
        guests: meeting.guests,
        devices: meeting.devices,
        userId: meeting.userId,
        isOwner: true, // Flag để biết đây là lịch của mình
        ...meeting
      };
    });
  }, [meetings, currentTime]);

  // Event handlers
  const handleEventClick = useCallback((event) => {
    // ✅ Chỉ cho phép click vào lịch của mình
    if (!event.isOwner) {
      console.log('⚠️ Cannot view details of other users meetings');
      return; // Không làm gì nếu không phải lịch của mình
    }
    
    const meeting = meetings.find(m => m.meetingId === event.id);
    if (meeting) {
      setEditingMeeting(meeting);
      setShowEditForm(true);
    }
  }, [meetings]);

  const handleEventMouseEnter = useCallback((event, mouseEvent) => {
    // Tooltip handled by DayView/WeekView
  }, []);

  const handleEventMouseLeave = useCallback(() => {
    // Tooltip handled by DayView/WeekView
  }, []);

  const handleTimeSlotClick = useCallback((date) => {
    // Optional: Open create meeting form at selected time
  }, []);

  const formatTime = useCallback((date) => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const handleUpdateMeeting = async (updatedMeeting) => {
    try {
      const { meeting } = await calendarAPI.updateMeeting(updatedMeeting.meetingId, updatedMeeting);
      if (!meeting) {
        throw new Error('Không nhận được dữ liệu sau khi cập nhật');
      }
      
      // ✅ Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setShowEditForm(false);
      setEditingMeeting(null);
      loadRoomSchedule(); // Reload
    } catch (error) {
      console.error('Error updating meeting:', error);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await calendarAPI.deleteMeeting(meetingId);
      
      // ✅ Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setShowEditForm(false);
      setEditingMeeting(null);
      loadRoomSchedule(); // Reload
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const handleDateSelect = (newDate) => {
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // ✅ NEW: Handle closing the create form
  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    setSelectedSlot(null);
  };

  // ✅ NEW: Handle create meeting submission
  const handleCreateMeeting = async (formData) => {
    try {
      // Extract start and end times from form data
      const startTime = formData.startDateTime || selectedSlot.startTime;
      const endTime = formData.endDateTime || selectedSlot.endTime;
      
      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        description: formData.description,
        startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
        endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
        roomId: selectedRoomId,
        guests: formData.guests || [],
        deviceIds: formData.devices?.map(d => d.deviceId) || []
      };
      
      console.log('📝 Creating meeting with data:', meetingData);
      
      // Call API to create meeting
      const newMeeting = await calendarAPI.createMeeting(meetingData);
      
      console.log('✅ Meeting created:', newMeeting);
      
      // Refresh meetings list
      if (isMountedRef.current) {
        await loadRoomSchedule();
        handleCloseCreateForm();
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Lỗi tạo lịch: ' + (error.response?.data?.message || error.message));
    }
  };
  const handleSelectSlot = (slotInfo) => {
    console.log('📍 Selected time slot:', slotInfo.start, 'to', slotInfo.end);
    
    // Store the selected slot times
    setSelectedSlot({
      startTime: slotInfo.start,
      endTime: slotInfo.end,
      date: slotInfo.start
    });
    
    // Open the create meeting form
    setShowCreateForm(true);
  };

  const renderTimeTable = useMemo(() => {
    const commonProps = {
      selectedDate,
      events,
      onDateSelect: handleDateSelect,
      handleEventClick,
      handleEventMouseEnter,
      handleEventMouseLeave,
      formatTime,
      onSelectSlot: handleSelectSlot // ✅ NEW: Pass slot selection handler
    };

    if (viewMode === 'day') {
      return (
        <DayView
          {...commonProps}
          currentTime={currentTime}
          handleTimeSlotClick={handleTimeSlotClick}
        />
      );
    } else {
      return (
        <WeekView
          {...commonProps}
          currentTime={currentTime}
        />
      );
    }
  }, [viewMode, selectedDate, events, currentTime, handleEventClick, handleEventMouseEnter, handleEventMouseLeave, formatTime, handleTimeSlotClick]);

  return (
    <div className="room-schedule-view">
      {/* Schedule content - TimeTable (always render wrapper) */}
      <div className="schedule-timetable-wrapper" style={{ position: 'relative' }}>
        {!selectedRoomId ? (
          <div className="no-room-selected" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#5f6368' }}>
            <div className="no-room-icon" style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
            <div className="no-room-text">Vui lòng chọn phòng để xem lịch</div>
          </div>
        ) : (
          <>
            {renderTimeTable}
          </>
        )}
        {selectedRoomId && (loading || refreshing) && (
          <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 12, color: '#5f6368' }}>
            Đang cập nhật...
          </div>)
        }
        {selectedRoomId && loading && meetings.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div className="inline-loader">
              <span className="hourglass">⏳</span>
              <span className="ring-loader" aria-label="loading" />
            </div>
          </div>
        )}
      </div>

      {/* Edit Meeting Form */}
      {showEditForm && editingMeeting && (
        <EditMeetingForm
          meeting={editingMeeting}
          onClose={() => {
            setShowEditForm(false);
            setEditingMeeting(null);
          }}
          onSubmit={handleUpdateMeeting}
          onDelete={handleDeleteMeeting}
        />
      )}

      {/* ✅ NEW: Create Meeting Form (from drag-to-select) */}
      {showCreateForm && selectedSlot && (
        <EditMeetingForm
          meeting={{
            id: null,
            title: '',
            description: '',
            start: selectedSlot.startTime,
            end: selectedSlot.endTime,
            roomId: selectedRoomId,
            guests: [],
            devices: []
          }}
          onClose={handleCloseCreateForm}
          onSubmit={handleCreateMeeting}
        />
      )}
    </div>
  );
};

export default RoomScheduleView;

