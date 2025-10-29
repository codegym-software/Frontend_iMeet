import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { calendarAPI } from '../../Components/main/MainCalendar/utils/CalendarAPI';
import DayView from '../../Components/main/MainCalendar/views/DayView';
import WeekView from '../../Components/main/MainCalendar/views/WeekView';
import EditMeetingForm from '../../Components/main/EditMeetingForm';
import { CalendarHelpers } from '../../Components/main/MainCalendar/utils/CalendarHelpers';
import './RoomScheduleView.css';

const RoomScheduleView = ({ selectedDate: parentSelectedDate, onDateChange, viewType, selectedRoomId }) => {
  const [selectedDate, setSelectedDate] = useState(parentSelectedDate || new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  
  // ✅ Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Use viewType from parent (day or week only)
  const viewMode = viewType === 'week' ? 'week' : 'day';

  // Sync with parent date
  useEffect(() => {
    if (parentSelectedDate) {
      setSelectedDate(parentSelectedDate);
    }
  }, [parentSelectedDate]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isMountedRef.current) return;
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load meetings when room or date changes
  useEffect(() => {
    if (selectedRoomId) {
      loadRoomSchedule();
    }
  }, [selectedRoomId, selectedDate, viewMode]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadRoomSchedule = async () => {
    if (!selectedRoomId) return;
    
    if (!isMountedRef.current) return;
    setLoading(true);
    
    try {
      // Get all meetings and filter by room
      const allMeetings = await calendarAPI.getAllMeetings();
      
      // ✅ Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Filter meetings for selected room
      const filteredMeetings = (Array.isArray(allMeetings) ? allMeetings : []).filter(meeting => 
        meeting.roomId === selectedRoomId && 
        meeting.bookingStatus?.toUpperCase() !== 'CANCELLED'
      );
      
      setMeetings(filteredMeetings);
    } catch (error) {
      console.error('Error loading room schedule:', error);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  };

  // Helper function to get color based on status
  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': '#f9ab00',
      'BOOKED': '#f9ab00',
      'CONFIRMED': '#1a73e8',
      'APPROVED': '#34a853',
      'CANCELLED': '#ea4335',
      'REJECTED': '#ea4335'
    };
    return colorMap[status?.toUpperCase()] || '#1a73e8';
  };

  // Convert meetings to events format for TimeTable
  const events = useMemo(() => {
    return meetings.map(meeting => ({
      id: meeting.meetingId,
      title: meeting.title,
      start: new Date(meeting.startTime),
      end: new Date(meeting.endTime),
      color: getStatusColor(meeting.bookingStatus),
      bookingStatus: meeting.bookingStatus,
      description: meeting.description,
      roomId: meeting.roomId,
      roomName: meeting.roomName,
      organizerName: meeting.organizerName,
      guests: meeting.guests,
      devices: meeting.devices,
      ...meeting
    }));
  }, [meetings]);

  // Event handlers
  const handleEventClick = useCallback((event) => {
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
      await calendarAPI.updateMeeting(updatedMeeting.meetingId, updatedMeeting);
      
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

  const renderTimeTable = useMemo(() => {
    const commonProps = {
      selectedDate,
      events,
      onDateSelect: handleDateSelect,
      handleEventClick,
      handleEventMouseEnter,
      handleEventMouseLeave,
      formatTime
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

  // Show message if no room selected
  if (!selectedRoomId) {
    return (
      <div className="room-schedule-view">
        <div className="no-room-selected">
          <div className="no-room-icon">🏢</div>
          <div className="no-room-text">Vui lòng chọn phòng để xem lịch</div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-schedule-view">
      {/* Schedule content - TimeTable */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <div>Đang tải lịch phòng...</div>
        </div>
      ) : (
        <div className="schedule-timetable-wrapper">
          {renderTimeTable}
        </div>
      )}

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
    </div>
  );
};

export default RoomScheduleView;

