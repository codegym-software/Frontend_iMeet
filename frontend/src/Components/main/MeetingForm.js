// components/CreateMeetingForm.js
import React, { useState, useEffect, useRef } from 'react';
import './MeetingForm.css'; // Import the CSS file for styling
import { roomAPI } from './MainCalendar/utils/RoomAPI';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';
import DateTimePicker from '../common/DateTimePicker';
import adminService from '../../services/adminService';
import DeviceSelectorModal from './DeviceSelectorModal';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';
import { useMeetingWithDevices } from '../../hooks/useMeetingWithDevices';

const CreateMeetingForm = ({ selectedDate, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDateTime: selectedDate ? new Date(selectedDate.setHours(9, 0, 0, 0)) : new Date(),
    endDateTime: selectedDate ? new Date(selectedDate.setHours(10, 0, 0, 0)) : new Date(),
    guests: '',
    room: '',
    location: '',
    devices: [], // Changed from device to devices array
    isAllDay: false
  });

  const [errors, setErrors] = useState({});
  const [guestSuggestions, setGuestSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomDevices, setSelectedRoomDevices] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [currentPickerMonth, setCurrentPickerMonth] = useState(new Date());
  const guestInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const datePickerRef = useRef(null);

  // ✅ USE CACHE - No more slow API calls!
  const { getDevicesWithAvailability, checkAvailability } = useDeviceInventory();
  const { createMeetingWithDevices } = useMeetingWithDevices();
  
  // Get devices from cache - INSTANT!
  const allDevices = getDevicesWithAvailability();

  // Load rooms only - devices từ cache rồi!
  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        if (isMounted) setLoadingRooms(true);
        const roomsData = await roomAPI.getAvailableRooms();
        if (isMounted) {
          setRooms(roomsData);
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
    // ✅ Devices từ cache - không cần fetch nữa!

    return () => {
      isMounted = false;
    };
  }, []);

  // Load thiết bị khi chọn phòng
  const handleRoomChange = async (e) => {
    const roomId = e.target.value;
    setFormData(prev => ({
      ...prev,
      room: roomId,
      location: '', // Reset location
      devices: [] // Reset devices
    }));

    if (roomId) {
      try {
        // Tìm room được chọn để lấy location
        const selectedRoom = rooms.find(r => r.roomId === parseInt(roomId));
        if (selectedRoom) {
          setFormData(prev => ({
            ...prev,
            location: selectedRoom.location || ''
          }));
        }

        // Load thiết bị của phòng
        const devices = await roomAPI.getRoomDevices(roomId);
        setSelectedRoomDevices(devices);
      } catch (error) {
        console.error('Error loading room devices:', error);
        setSelectedRoomDevices([]);
      }
    } else {
      setSelectedRoomDevices([]);
    }
  };

  // Mock data - Thay thế bằng API call thực tế
  const mockUsers = [
    { id: 1, email: 'user1@gmail.com', name: 'User One' },
    { id: 2, email: 'user2@gmail.com', name: 'User Two' },
    { id: 3, email: 'user3@gmail.com', name: 'User Three' },
    { id: 4, email: 'user4@gmail.com', name: 'User Four' },
    { id: 5, email: 'admin@gmail.com', name: 'Admin User' },
    { id: 6, email: 'test@gmail.com', name: 'Test User' },
  ];

  // Format date to dd/mm/yyyy
  function formatDateToDisplay(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Convert dd/mm/yyyy to yyyy-mm-dd for submission
  function formatDateForSubmission(dateString) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  }

  // Validate date format (dd/mm/yyyy)
  function validateDate(dateString) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return false;
    }
    
    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return false;
    }
    
    return true;
  }

  // Validate time format (hh:mm AM/PM)
  function validateTime(timeString) {
    const regex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    return regex.test(timeString);
  }

  // Search users by email or name
  const searchUsers = async (query) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filteredUsers = mockUsers.filter(user =>
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setIsLoading(false);
    return filteredUsers;
  };

  // Handle guest input change
  const handleGuestChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      guests: value
    }));

    // Clear error when user starts typing
    if (errors.guests) {
      setErrors(prev => ({
        ...prev,
        guests: ''
      }));
    }

    // Show suggestions if query is not empty
    if (value.trim().length > 1) {
      const suggestions = await searchUsers(value.trim());
      setGuestSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setGuestSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle guest selection from suggestions
  const handleGuestSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      guests: user.email
    }));
    setShowSuggestions(false);
    setGuestSuggestions([]);
  };

  // Close suggestions and date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestInputRef.current && 
        !guestInputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Date picker functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  const handleDateSelect = (day) => {
    const { year, month } = getDaysInMonth(currentPickerMonth);
    const selectedDate = new Date(year, month, day);
    const formattedDate = formatDateToDisplay(selectedDate);
    
    setFormData(prev => ({
      ...prev,
      date: formattedDate
    }));
    
    setShowDatePicker(false);
    
    // Clear error
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };
  
  const handlePrevMonth = () => {
    setCurrentPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Skip guest field as it has its own handler
    if (name === 'guests') return;
    
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

  // Convert time from "hh:mm AM/PM" to "HH:mm:ss"
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    // Validate form
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }
    
    // Validate start and end datetime
    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Vui lòng chọn thời gian bắt đầu';
    }
    
    if (!formData.endDateTime) {
      newErrors.endDateTime = 'Vui lòng chọn thời gian kết thúc';
    }
    
    if (formData.startDateTime && formData.endDateTime) {
      if (formData.endDateTime <= formData.startDateTime) {
        newErrors.endDateTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }

    if (!formData.room) {
      newErrors.room = 'Vui lòng chọn phòng';
    }
    
    // ✅ VALIDATE DEVICE AVAILABILITY
    const deviceErrors = [];
    formData.devices.forEach(device => {
      if (!checkAvailability(device.deviceId, device.quantity)) {
        const available = allDevices.find(d => d.deviceId === device.deviceId)?.available || 0;
        deviceErrors.push(`${device.deviceName}: chỉ còn ${available} (yêu cầu ${device.quantity})`);
      }
    });
    
    if (deviceErrors.length > 0) {
      newErrors.devices = 'Không đủ thiết bị:\n' + deviceErrors.join('\n');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Helper function to format date as LocalDateTime string (without timezone)
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        description: formData.description || '',
        startTime: formatLocalDateTime(formData.startDateTime),
        endTime: formatLocalDateTime(formData.endDateTime),
        isAllDay: formData.isAllDay,
        roomId: parseInt(formData.room),
        participants: formData.guests ? [formData.guests] : [],
        deviceIds: formData.devices.map(d => d.deviceId) // Extract deviceIds from devices array
      };
      
      // Call API to create meeting
      const createdMeeting = await calendarAPI.createMeeting(meetingData);
      
      console.log('✅ Meeting created successfully:', createdMeeting);
      
      // ✅ OPTIMISTIC UPDATE - Instant UI refresh!
      createMeetingWithDevices(createdMeeting);
      
      // Call parent onSubmit callback
      if (onSubmit) {
        onSubmit(createdMeeting, 'Tạo cuộc họp thành công!');
      }
      
      // Close form
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 100);
    } catch (error) {
      console.error('Error creating meeting:', error);
      setErrors({ submit: error.message || 'Không thể tạo cuộc họp. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-meeting-modal-overlay">
      <div className="create-meeting-modal simple-style">
        <div className="modal-header">
          <h2>Thêm tiêu đề</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="meeting-form icon-form">
          {/* Submit Error Message */}
          {errors.submit && (
            <div className="error-banner" style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: '#fee', 
              color: '#c00', 
              borderRadius: '4px',
              border: '1px solid #fcc'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Title Input */}
          <div className="form-group">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Thêm tiêu đề"
              className={`title-input ${errors.title ? 'error' : ''}`}
              autoFocus
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Date & Time Section */}
          <div className="form-row">
            <div className="form-icon">🕐</div>
            <div className="form-row-content time-inputs-row">
              {/* Date Input */}
              <DateTimePicker
                value={formData.startDateTime}
                onChange={(date) => {
                  // Update both start and end date, keeping the time
                  const newStart = new Date(date);
                  newStart.setHours(formData.startDateTime.getHours(), formData.startDateTime.getMinutes());
                  
                  const newEnd = new Date(date);
                  newEnd.setHours(formData.endDateTime.getHours(), formData.endDateTime.getMinutes());
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    startDateTime: newStart,
                    endDateTime: newEnd
                  }));
                }}
                showTime={false}
                showDate={true}
                placeholder="Chọn ngày"
                className="date-picker-input"
                displayFormat="date"
                disablePastDates={true}
                showCalendarHeader={true}
              />
              
              {/* Start Time Input */}
              <DateTimePicker
                value={formData.startDateTime}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, startDateTime: date }));
                  // Automatically set end time 1 hour later if end time is before start
                  if (date >= formData.endDateTime) {
                    const endDate = new Date(date.getTime() + 60 * 60 * 1000);
                    setFormData(prev => ({ ...prev, endDateTime: endDate }));
                  }
                }}
                showTime={true}
                showDate={false}
                mode="start"
                placeholder="9:00 AM"
                className="time-picker-input"
                displayFormat="time"
              />
              
              <span className="time-separator">—</span>
              
              {/* End Time Input */}
              <DateTimePicker
                value={formData.endDateTime}
                onChange={(date) => setFormData(prev => ({ ...prev, endDateTime: date }))}
                showTime={true}
                showDate={false}
                mode="end"
                baseDate={formData.startDateTime}
                placeholder="10:00 AM"
                className="time-picker-input"
                displayFormat="time"
              />
              
              {/* All Day Checkbox - Inline */}
              <label className="checkbox-wrapper inline-checkbox">
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isAllDay: e.target.checked }));
                    if (e.target.checked) {
                      // Set to all day (start of day to end of day)
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
                />
                <span className="checkbox-label">Cả ngày</span>
              </label>
              
              {errors.startDateTime && <span className="error-message">{errors.startDateTime}</span>}
              {errors.endDateTime && <span className="error-message">{errors.endDateTime}</span>}
            </div>
          </div>
          {(errors.date || errors.startTime || errors.endTime) && (
            <div className="error-message">
              {errors.date || errors.startTime || errors.endTime}
            </div>
          )}

          {/* Guests Section with Autocomplete */}
          <div className="form-row">
            <div className="form-icon">👤</div>
            <div className="form-row-content guest-autocomplete" ref={guestInputRef}>
              <input
                type="text"
                name="guests"
                value={formData.guests}
                onChange={handleGuestChange}
                placeholder="thêm khách"
                className="inline-input"
                autoComplete="off"
              />
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="suggestions-loading">
                  <div className="loading-spinner"></div>
                  <span>Đang tìm kiếm...</span>
                </div>
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && guestSuggestions.length > 0 && (
                <div className="suggestions-dropdown" ref={suggestionsRef}>
                  {guestSuggestions.map(user => (
                    <div
                      key={user.id}
                      className="suggestion-item"
                      onClick={() => handleGuestSelect(user)}
                    >
                      <div className="suggestion-email">{user.email}</div>
                      <div className="suggestion-name">{user.name}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {showSuggestions && !isLoading && guestSuggestions.length === 0 && (
                <div className="suggestions-dropdown">
                  <div className="suggestion-item no-results">
                    Không tìm thấy kết quả
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room Section */}
          <div className="form-row">
            <div className="form-icon">🏠</div>
            <div className="form-row-content">
              <select
                name="room"
                value={formData.room}
                onChange={handleRoomChange}
                className="inline-select"
                disabled={loadingRooms}
              >
                <option value="">Chọn phòng</option>
                {rooms.map(room => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.name} - Sức chứa: {room.capacity} người
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loadingRooms && <div className="loading-text">Đang tải phòng...</div>}
          {errors.room && <div className="error-message">{errors.room}</div>}

          {/* Location Section - Auto-filled */}
          {formData.location && (
            <div className="form-row">
              <div className="form-icon">📍</div>
              <div className="form-row-content">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  readOnly
                  placeholder="vị trí room"
                  className="inline-input"
                  style={{ backgroundColor: 'transparent', cursor: 'not-allowed', border: 'none', color: '#5f6368' }}
                />
              </div>
            </div>
          )}

          {/* Room Devices Display */}
          {formData.room && selectedRoomDevices.length > 0 && (
            <div className="form-row">
              <div className="form-icon">🔧</div>
              <div className="form-row-content">
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                    Thiết bị trong phòng:
                  </div>
                  {selectedRoomDevices.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedRoomDevices.map(device => (
                        <span
                          key={device.deviceId}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e7f3ff',
                            color: '#0056b3',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            border: '1px solid #b3d9ff'
                          }}
                        >
                          {device.deviceName} {device.deviceType ? `- ${device.deviceType}` : ''} (SL: {device.quantityAssigned || device.quantity || 1})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '14px' }}>
                      Không có thiết bị sẵn trong phòng
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Device Selection */}
          <div className="form-row">
            <div className="form-icon">💻</div>
            <div className="form-row-content">
              <div style={{ width: '100%' }}>
                {formData.devices.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>
                      Thiết bị mượn:
                    </div>
                    <div className="selected-devices-tags">
                      {formData.devices.map(device => {
                        // ✅ Backend returns 'name' field, but form may use 'deviceName'
                        const displayName = device.name || device.deviceName || 'Thiết bị';
                        if (!device.name && !device.deviceName) {
                          console.warn('⚠️ Device tag missing name:', device);
                        }
                        return (
                          <span key={device.deviceId} className="device-tag">
                            <strong>{displayName}</strong> (x{device.quantity})
                            <button
                              type="button"
                              className="device-tag-remove"
                              onClick={() => {
                                const newDevices = formData.devices.filter(d => d.deviceId !== device.deviceId);
                                setFormData(prev => ({ ...prev, devices: newDevices }));
                              }}
                              title="Xóa"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="device-add-btn"
                  onClick={() => setShowDeviceModal(true)}
                  title="Thêm thiết bị"
                >
                  + Chọn thiết bị
                </button>
                {errors.devices && <div className="error-message" style={{ whiteSpace: 'pre-line', marginTop: '8px' }}>{errors.devices}</div>}
              </div>
            </div>
          </div>

          {/* Device Selector Modal */}
          <DeviceSelectorModal
            isOpen={showDeviceModal}
            onClose={() => setShowDeviceModal(false)}
            devices={allDevices}
            selectedDevices={formData.devices}
            onConfirm={(devices) => setFormData(prev => ({ ...prev, devices }))}
          />

          {/* Description Section */}
          <div className="form-row">
            <div className="form-icon">📋</div>
            <div className="form-row-content">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Thêm mô tả"
                className="description-textarea"
                rows="3"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions simple-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isLoading}>
              Hủy
            </button>
            <button type="submit" className="save-btn" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingForm;