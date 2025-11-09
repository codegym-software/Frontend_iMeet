// components/EditMeetingForm.js
import React, { useState, useEffect, useRef } from 'react';
import './MeetingForm.css';
import { roomAPI } from './MainCalendar/utils/RoomAPI';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';
import DateTimePicker from '../common/DateTimePicker';
import adminService from '../../services/adminService';
import DeviceSelectorModal from './DeviceSelectorModal';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';
import { useMeetingWithDevices } from '../../hooks/useMeetingWithDevices';
import ColorPicker from '../common/ColorPicker';
import roomService from '../../services/roomService';
import { saveMeetingColor, getMeetingColor } from '../../utils/meetingColorStorage';
import meetingService from '../../services/meetingService';

const EditMeetingForm = ({ meeting, onClose, onSubmit, onDelete }) => {
  
  // ✅ ALWAYS EDITABLE - Allow editing all meetings (except cancelled)
  // Only prevent editing if meeting is cancelled
  const isEditable = meeting?.bookingStatus?.toUpperCase() !== 'CANCELLED';
  
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    startDateTime: meeting?.start ? new Date(meeting.start) : new Date(),
    endDateTime: meeting?.end ? new Date(meeting.end) : new Date(),
    guests: meeting?.attendees?.join(', ') || '',
    room: meeting?.roomId || '',
    devices: meeting?.deviceIds?.map(id => ({ deviceId: id, quantity: 1, deviceName: 'Device' + id })) || [],
    isAllDay: meeting?.allDay || false,
    color: meeting?.color || '#4285f4'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(meeting?.color || '#4285f4');
  const [roomDevices, setRoomDevices] = useState([]); // Devices in selected room
  const [loadingRoomDevices, setLoadingRoomDevices] = useState(false);
  const datePickerRef = useRef(null);
  
  // ✅ USE CACHE - No more slow API calls!
  const { getDevicesWithAvailability, checkAvailability } = useDeviceInventory();
  const { updateMeetingWithDevices, deleteMeetingWithDevices } = useMeetingWithDevices();
  
  // Get devices from cache - INSTANT!
  const allDevices = getDevicesWithAvailability();
  
  // Format date for display
  const formatDateDisplay = (date) => {
    const months = ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6', 
                    'thg 7', 'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  // Format time for display
  const formatTimeDisplay = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Update formData when meeting changes
  useEffect(() => {
    if (meeting) {
      
      // ✅ Get color from localStorage first, then meeting data, then default
      const storedColor = getMeetingColor(meeting.meetingId);
      const meetingColor = storedColor || meeting.color || '#4285f4';
      
      // ✅ Map devices with proper names from allDevices
      let devicesData = [];
      if (meeting.devices && Array.isArray(meeting.devices)) {
        devicesData = meeting.devices.map(device => {
          const deviceId = device.deviceId || device.id;
          const deviceInfo = allDevices.find(d => d.deviceId === deviceId);
          return {
            deviceId: deviceId,
            quantity: device.quantity || 1,
            deviceName: device.deviceName || device.name || deviceInfo?.name || `Device ${deviceId}`,
            name: device.name || deviceInfo?.name || `Device ${deviceId}`
          };
        });
      } else if (meeting.deviceIds && Array.isArray(meeting.deviceIds)) {
        devicesData = meeting.deviceIds.map(deviceId => {
          const deviceInfo = allDevices.find(d => d.deviceId === deviceId);
          return {
            deviceId: deviceId,
            quantity: 1,
            deviceName: deviceInfo?.name || `Device ${deviceId}`,
            name: deviceInfo?.name || `Device ${deviceId}`
          };
        });
      }
      
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        startDateTime: meeting.start ? new Date(meeting.start) : new Date(),
        endDateTime: meeting.end ? new Date(meeting.end) : new Date(),
        guests: meeting.attendees?.join(', ') || '',
        room: meeting.roomId || '',
        devices: devicesData,
        isAllDay: meeting.allDay || false,
        color: meetingColor
      });
      setSelectedColor(meetingColor);
    }
  }, [meeting, allDevices]);

  // Load rooms
  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        if (isMounted) setLoadingRooms(true);
        const roomsData = await roomAPI.getAvailableRooms();
        if (isMounted) {
          setRooms(roomsData);
          
          // Set selected room
          if (formData.room) {
            const currentRoom = roomsData.find(r => r.roomId === parseInt(formData.room));
            if (currentRoom) {
              setSelectedRoom(currentRoom);
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading rooms:', error);
          setErrors(prev => ({ ...prev, room: 'Không thể tải danh sách phòng' }));
        }
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    };

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selected room when formData.room changes and load room devices
  useEffect(() => {
    if (formData.room) {
      const currentRoom = rooms.find(r => r.roomId === parseInt(formData.room));
      if (currentRoom) {
        setSelectedRoom(currentRoom);
        
        // ✅ Load devices in this room
        const loadRoomDevices = async () => {
          try {
            setLoadingRoomDevices(true);
            const roomId = currentRoom.roomId || currentRoom.id;
            const response = await roomService.getDevicesByRoom(roomId);
            if (response && response.success && Array.isArray(response.data)) {
              setRoomDevices(response.data.map(rd => ({
                deviceId: rd.deviceId,
                deviceName: rd.deviceName,
                quantity: rd.quantityAssigned || 1
              })));
            } else {
              setRoomDevices([]);
            }
          } catch (error) {
            console.error('Error loading room devices:', error);
            setRoomDevices([]);
          } finally {
            setLoadingRoomDevices(false);
          }
        };
        
        loadRoomDevices();
      }
    } else {
      setSelectedRoom(null);
      setRoomDevices([]);
    }
  }, [formData.room, rooms]);
  
  // Close date pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        setShowStartTimePicker(false);
        setShowEndTimePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validate form
    const newErrors = {};
    
    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề cuộc họp';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Tiêu đề không được quá 100 ký tự';
    }
    
    // Validate start time
    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Vui lòng chọn thời gian bắt đầu';
    }
    
    // Validate end time
    if (!formData.endDateTime) {
      newErrors.endDateTime = 'Vui lòng chọn thời gian kết thúc';
    }
    
    // Validate date range
    if (formData.startDateTime && formData.endDateTime) {
      if (formData.endDateTime <= formData.startDateTime) {
        newErrors.endDateTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
      
      // Check if meeting is in past
      const now = new Date();
      if (formData.startDateTime < now) {
        newErrors.startDateTime = 'Không thể đặt lịch trong quá khứ';
      }
      
      // Check reasonable duration
      const duration = formData.endDateTime.getTime() - formData.startDateTime.getTime();
      const durationInHours = duration / (1000 * 60 * 60);
      if (durationInHours > 24) {
        newErrors.endDateTime = 'Cuộc họp không được kéo dài quá 24 giờ';
      }
    }

    // Validate room
    if (!formData.room) {
      newErrors.room = 'Vui lòng chọn phòng họp';
    }
    
    // Validate color
    if (!formData.color) {
      newErrors.color = 'Vui lòng chọn màu cho lịch';
    }
    
    // Validate description
    if (formData.description && formData.description.trim().length > 500) {
      newErrors.description = 'Mô tả không được quá 500 ký tự';
    }

    // Validate devices (if any selected)
    if (formData.devices && formData.devices.length > 0) {
      const invalidDevices = formData.devices.filter(d => !d.deviceId || d.quantity <= 0);
      if (invalidDevices.length > 0) {
        newErrors.devices = 'Vui lòng kiểm tra lại số lượng thiết bị mượn';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Helper function to format date as LocalDateTime string
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      // ✅ Get meeting ID (support both id and meetingId)
      const meetingId = meeting.meetingId || meeting.id;
      if (!meetingId) {
        throw new Error('Không tìm thấy ID cuộc họp');
      }
      
      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        description: formData.description || '',
        startTime: formatLocalDateTime(formData.startDateTime),
        endTime: formatLocalDateTime(formData.endDateTime),
        isAllDay: formData.isAllDay,
        roomId: parseInt(formData.room),
        participants: formData.guests ? formData.guests.split(',').map(g => g.trim()).filter(g => g) : [],
        // ✅ Backend expects 'devices' array with MeetingDeviceRequestItem format
        // Format: [{ deviceId: Long, quantityBorrowed: Integer, notes: String }]
        devices: formData.devices.map(d => ({
          deviceId: d.deviceId,
          quantityBorrowed: d.quantity || 1,
          notes: d.notes || ''
        })),
        color: formData.color || selectedColor
      };
      
      // Call API to update meeting
      const updatedMeeting = await calendarAPI.updateMeeting(meetingId, meetingData);
      
      // ✅ Save color to localStorage (frontend-only)
      const finalMeetingId = updatedMeeting.meetingId || updatedMeeting.id || meetingId;
      if (finalMeetingId && meetingData.color) {
        saveMeetingColor(finalMeetingId, meetingData.color);
      }
      
      // ✅ OPTIMISTIC UPDATE
      updateMeetingWithDevices(meeting, updatedMeeting);
      
      // ✅ Invite new participants if guests are provided
      if (formData.guests && formData.guests.trim()) {
        try {
          const finalMeetingId = updatedMeeting?.meetingId || updatedMeeting?.id || meetingId;
          if (finalMeetingId) {
            // Parse emails from guests field (comma-separated)
            const emails = formData.guests
              .split(',')
              .map(email => email.trim())
              .filter(email => email && email.includes('@')); // Basic email validation
            
            if (emails.length > 0) {
              // Invite participants (async, don't wait for result)
              meetingService.inviteParticipants(finalMeetingId, emails, formData.description || null)
                .then(result => {
                  if (result.success) {
                    console.log('✅ Đã mời thành công:', result.data.length, 'người');
                  } else {
                    console.warn('⚠️ Mời không thành công:', result.message);
                  }
                })
                .catch(error => {
                  console.warn('⚠️ Lỗi khi mời:', error);
                });
            }
          }
        } catch (error) {
          console.warn('⚠️ Lỗi khi mời người tham gia:', error);
          // Don't fail the meeting update if invite fails
        }
      }
      
      // Call parent onSubmit callback
      if (onSubmit) {
        onSubmit(updatedMeeting, 'Cập nhật cuộc họp thành công!');
      }
      
      // Close form after success
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error updating meeting:', error);
      
      // Extract error message from various error formats
      let errorMessage = 'Không thể cập nhật cuộc họp. Vui lòng thử lại.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setErrors({ submit: errorMessage });
      
      // Show error toast if onSubmit callback exists
      if (onSubmit) {
        onSubmit(null, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get meeting color
  const getMeetingColor = () => {
    return selectedColor || formData.color || '#4285f4';
  };

  return (
    <div className="edit-meeting-fullscreen">
      {/* Top Bar */}
      <div className="edit-meeting-topbar">
        <button 
          className="edit-meeting-close-btn"
          onClick={onClose}
          title="Đóng"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="edit-meeting-topbar-right">
          <button 
            type="submit"
            form="edit-meeting-form"
            className="edit-meeting-save-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button className="edit-meeting-more-btn">
            Thao tác khác
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Title Section */}
      <div className="edit-meeting-title-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {isEditingTitle ? (
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                setIsEditingTitle(false);
              }}
              onBlur={() => setIsEditingTitle(false)}
              className="edit-meeting-title-input"
              autoFocus
              disabled={!isEditable}
              style={{ flex: 1 }}
            />
          ) : (
            <div 
              className="edit-meeting-title-display"
              onClick={() => isEditable && setIsEditingTitle(true)}
              style={{ cursor: isEditable ? 'text' : 'default', flex: 1 }}
            >
              {formData.title || 'Nhập tiêu đề'}
            </div>
          )}
          {/* Color Picker Button */}
          <button
            type="button"
            className="edit-meeting-color-btn"
            onClick={() => isEditable && setShowColorPicker(!showColorPicker)}
            disabled={!isEditable}
            title="Chọn màu"
          >
            <div 
              className="edit-meeting-color-indicator"
              style={{ backgroundColor: getMeetingColor() }}
            ></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {showColorPicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, marginTop: '8px' }}>
              <ColorPicker
                selectedColor={selectedColor}
                onColorSelect={(color) => {
                  setSelectedColor(color);
                  setFormData(prev => ({ ...prev, color: color }));
                  setShowColorPicker(false);
                  
                  // ✅ Save to localStorage immediately (frontend-only)
                  if (meeting?.id || meeting?.meetingId) {
                    const meetingId = meeting.id || meeting.meetingId;
                    saveMeetingColor(meetingId, color);
                  }
                }}
                onClose={() => setShowColorPicker(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Date & Time Section */}
      <div className="edit-meeting-datetime-section" ref={datePickerRef}>
        {/* Start Date */}
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <DateTimePicker
            value={formData.startDateTime}
            onChange={(date) => {
              // ✅ When date picker changes, preserve time from current startDateTime
              // Only update if date actually changed (compare dates, not time)
              const newDate = new Date(date);
              const currentDate = new Date(formData.startDateTime);
              
              // Compare dates only (ignore time)
              const newDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
              const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
              
              if (newDateOnly.getTime() !== currentDateOnly.getTime()) {
                const currentHours = formData.startDateTime.getHours();
                const currentMinutes = formData.startDateTime.getMinutes();
                newDate.setHours(currentHours, currentMinutes, 0, 0);
                
                setFormData(prev => ({ ...prev, startDateTime: newDate }));
                setShowStartDatePicker(false);
              }
            }}
            placeholder="Chọn ngày bắt đầu"
            showTime={false}
            showDate={true}
            displayFormat="date"
            disabled={!isEditable}
            className="edit-meeting-date-picker"
            isOpen={showStartDatePicker}
            onOpen={() => {
              setShowStartDatePicker(true);
              setShowEndDatePicker(false);
              setShowStartTimePicker(false);
              setShowEndTimePicker(false);
            }}
            onClose={() => setShowStartDatePicker(false)}
          />
        </div>
        
        {/* Start Time */}
        <div style={{ position: 'relative', minWidth: '140px' }}>
          <DateTimePicker
            value={formData.startDateTime}
            onChange={(date) => {
              // ✅ When time picker changes, preserve date from current startDateTime
              // Only update if time actually changed
              const newTime = new Date(date);
              const currentTime = new Date(formData.startDateTime);
              
              if (newTime.getHours() !== currentTime.getHours() || 
                  newTime.getMinutes() !== currentTime.getMinutes()) {
                const newStart = new Date(formData.startDateTime);
                newStart.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
                
                setFormData(prev => {
                  const updated = { ...prev, startDateTime: newStart };
                  // Auto-adjust end time if start >= end
                  if (newStart >= prev.endDateTime) {
                    const endDate = new Date(newStart.getTime() + 60 * 60 * 1000);
                    updated.endDateTime = endDate;
                  }
                  return updated;
                });
                setShowStartTimePicker(false);
              }
            }}
            placeholder="Chọn giờ bắt đầu"
            showTime={true}
            showDate={false}
            displayFormat="time"
            disabled={!isEditable}
            className="edit-meeting-time-picker"
            isOpen={showStartTimePicker}
            onOpen={() => {
              setShowStartTimePicker(true);
              setShowStartDatePicker(false);
              setShowEndDatePicker(false);
              setShowEndTimePicker(false);
            }}
            onClose={() => setShowStartTimePicker(false)}
          />
        </div>
        
        <span className="edit-meeting-time-separator">tới</span>
        
        {/* End Time */}
        <div style={{ position: 'relative', minWidth: '140px' }}>
          <DateTimePicker
            value={formData.endDateTime}
            onChange={(date) => {
              // ✅ When time picker changes, preserve date from current endDateTime
              // Only update if time actually changed
              const newTime = new Date(date);
              const currentTime = new Date(formData.endDateTime);
              
              if (newTime.getHours() !== currentTime.getHours() || 
                  newTime.getMinutes() !== currentTime.getMinutes()) {
                const newEnd = new Date(formData.endDateTime);
                newEnd.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
                
                setFormData(prev => ({ ...prev, endDateTime: newEnd }));
                setShowEndTimePicker(false);
              }
            }}
            placeholder="Chọn giờ kết thúc"
            showTime={true}
            showDate={false}
            displayFormat="time"
            disabled={!isEditable}
            mode="end"
            baseDate={formData.startDateTime}
            className="edit-meeting-time-picker"
            isOpen={showEndTimePicker}
            onOpen={() => {
              setShowEndTimePicker(true);
              setShowStartDatePicker(false);
              setShowEndDatePicker(false);
              setShowStartTimePicker(false);
            }}
            onClose={() => setShowEndTimePicker(false)}
          />
        </div>
        
        {/* End Date */}
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <DateTimePicker
            value={formData.endDateTime}
            onChange={(date) => {
              // ✅ When date picker changes, preserve time from current endDateTime
              // Only update if date actually changed (compare dates, not time)
              const newDate = new Date(date);
              const currentDate = new Date(formData.endDateTime);
              
              // Compare dates only (ignore time)
              const newDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
              const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
              
              if (newDateOnly.getTime() !== currentDateOnly.getTime()) {
                const currentHours = formData.endDateTime.getHours();
                const currentMinutes = formData.endDateTime.getMinutes();
                newDate.setHours(currentHours, currentMinutes, 0, 0);
                
                setFormData(prev => ({ ...prev, endDateTime: newDate }));
                setShowEndDatePicker(false);
              }
            }}
            placeholder="Chọn ngày kết thúc"
            showTime={false}
            showDate={true}
            displayFormat="date"
            disabled={!isEditable}
            className="edit-meeting-date-picker"
            isOpen={showEndDatePicker}
            onOpen={() => {
              setShowEndDatePicker(true);
              setShowStartDatePicker(false);
              setShowStartTimePicker(false);
              setShowEndTimePicker(false);
            }}
            onClose={() => setShowEndDatePicker(false)}
          />
        </div>
        <label className="edit-meeting-allday-checkbox">
          <input
            type="checkbox"
            checked={formData.isAllDay}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, isAllDay: e.target.checked }));
              if (e.target.checked) {
                const startDate = new Date(formData.startDateTime);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(formData.endDateTime);
                endDate.setHours(23, 59, 59, 999);
                setFormData(prev => ({ 
                  ...prev, 
                  startDateTime: startDate,
                  endDateTime: endDate
                }));
              }
            }}
            disabled={!isEditable}
          />
          <span>Cả ngày</span>
        </label>
      </div>

      {/* Main Content - Two Columns */}
      <div className="edit-meeting-content">
        <form id="edit-meeting-form" onSubmit={handleSubmit}>
          <div className="edit-meeting-two-columns">
            {/* Left Column - Chi tiết lịch họp */}
            <div className="edit-meeting-left-column">
              <div className="edit-meeting-section-title">Chi tiết lịch họp</div>

              {/* Phòng */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">🏢</span>
                <select
                  name="room"
                  value={formData.room}
                  onChange={(e) => {
                    handleChange(e);
                    const selected = rooms.find(r => r.roomId === parseInt(e.target.value));
                    setSelectedRoom(selected);
                  }}
                  className="edit-meeting-field-input"
                  disabled={loadingRooms || !isEditable}
                >
                  <option value="">Chọn phòng</option>
                  {rooms.map(room => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vị trí */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">📍</span>
                <div className="edit-meeting-field-input" style={{ color: '#5f6368', padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  {selectedRoom && selectedRoom.location 
                    ? selectedRoom.location
                    : 'Chưa chọn phòng'
                  }
                </div>
              </div>
              
              {/* Thiết bị trong phòng */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">🔌</span>
                <div className="edit-meeting-field-input" style={{ padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', minHeight: '60px' }}>
                  {loadingRoomDevices ? (
                    <span style={{ color: '#5f6368', fontSize: '14px' }}>Đang tải...</span>
                  ) : roomDevices.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {roomDevices.map(device => (
                        <span 
                          key={device.deviceId} 
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '16px',
                            fontSize: '13px',
                            fontWeight: '500',
                            border: '1px solid #90caf9'
                          }}
                        >
                          {device.deviceName} x{device.quantity}
                        </span>
                      ))}
                    </div>
                  ) : selectedRoom ? (
                    <span style={{ color: '#5f6368', fontSize: '14px' }}>Phòng này chưa có thiết bị</span>
                  ) : (
                    <span style={{ color: '#5f6368', fontSize: '14px' }}>Chưa chọn phòng</span>
                  )}
                </div>
              </div>

              {/* Thiết bị mượn */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">💻</span>
                <div className="edit-meeting-device-section" style={{ padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', minHeight: '80px' }}>
                  {formData.devices.length > 0 ? (
                    <div className="edit-meeting-devices-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {formData.devices.map(device => {
                        // ✅ Get device name from allDevices if not available
                        const deviceInfo = allDevices.find(d => d.deviceId === device.deviceId);
                        const deviceName = device.deviceName || device.name || deviceInfo?.name || `Device ${device.deviceId}`;
                        return (
                          <span 
                            key={device.deviceId} 
                            className="edit-meeting-device-tag"
                            style={{
                              padding: '8px 14px',
                              backgroundColor: '#fff3e0',
                              color: '#e65100',
                              borderRadius: '16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              border: '1px solid #ffcc80',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {deviceName} <span style={{ opacity: 0.7 }}>x{device.quantity || 1}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ color: '#5f6368', fontSize: '14px', display: 'block', marginBottom: '12px' }}>Chưa có thiết bị</span>
                  )}
                  <button
                    type="button"
                    className="edit-meeting-device-btn"
                    onClick={() => setShowDeviceModal(true)}
                    disabled={!isEditable}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: isEditable ? '#1976d2' : '#e0e0e0',
                      color: isEditable ? '#fff' : '#9e9e9e',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isEditable ? 'pointer' : 'not-allowed',
                      transition: 'background-color 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (isEditable) e.target.style.backgroundColor = '#1565c0';
                    }}
                    onMouseLeave={(e) => {
                      if (isEditable) e.target.style.backgroundColor = '#1976d2';
                    }}
                  >
                    {formData.devices.length > 0 ? 'Chỉnh sửa thiết bị' : 'Chọn thiết bị mượn'}
                  </button>
                </div>
              </div>

              {/* Thông báo */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">🔔</span>
                <div className="edit-meeting-field-input" style={{ color: '#5f6368' }}>
                  Thông báo trước 30 phút
                </div>
              </div>

              {/* Người tạo lịch */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">📅</span>
                <span>{meeting?.organizer || 'Chưa có thông tin'}</span>
              </div>

              {/* Mô tả */}
              <div className="edit-meeting-field">
                <span className="edit-meeting-field-icon">📝</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Thêm nội dung mô tả"
                  className="edit-meeting-description-textarea"
                  rows="4"
                  disabled={!isEditable}
                />
              </div>
            </div>

            {/* Right Column - Khách */}
            <div className="edit-meeting-right-column">
              <div className="edit-meeting-section-title">Khách</div>

              {/* Thêm khách */}
              <div className="edit-meeting-field">
                <input
                  type="text"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  placeholder="Thêm email khách (phân cách bằng dấu phẩy)"
                  className="edit-meeting-field-input"
                  disabled={!isEditable}
                />
                {formData.guests && (
                  <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                    Email sẽ được gửi lời mời sau khi lưu
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Device Selector Modal */}
      <DeviceSelectorModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        devices={allDevices}
        selectedDevices={formData.devices}
        onConfirm={(devices) => setFormData(prev => ({ ...prev, devices }))}
      />
    </div>
  );
};

export default EditMeetingForm;
