// components/CreateMeetingForm.js
import React, { useState, useEffect, useRef } from 'react';
import './MeetingForm.css'; // Import the CSS file for styling
import { roomAPI } from './MainCalendar/utils/RoomAPI';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';

const CreateMeetingForm = ({ selectedDate, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: formatDateToDisplay(selectedDate), // dd/mm/yyyy
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    guests: '',
    room: '',
    location: '',
    device: ''
  });

  const [errors, setErrors] = useState({});
  const [guestSuggestions, setGuestSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomDevices, setSelectedRoomDevices] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const guestInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load rooms khi component mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Load danh sách phòng từ API
  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const roomsData = await roomAPI.getAvailableRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setErrors(prev => ({ ...prev, room: 'Không thể tải danh sách phòng' }));
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load thiết bị khi chọn phòng
  const handleRoomChange = async (e) => {
    const roomId = e.target.value;
    setFormData(prev => ({
      ...prev,
      room: roomId,
      location: '', // Reset location
      device: '' // Reset device
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
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
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

  // Close suggestions when clicking outside
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    
    // Validate form
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }
    
    if (!validateDate(formData.date)) {
      newErrors.date = 'Định dạng ngày không hợp lệ (dd/mm/yyyy)';
    }
    
    if (!validateTime(formData.startTime)) {
      newErrors.startTime = 'Định dạng giờ không hợp lệ (hh:mm AM/PM)';
    }
    
    if (!validateTime(formData.endTime)) {
      newErrors.endTime = 'Định dạng giờ không hợp lệ (hh:mm AM/PM)';
    }

    if (!formData.room) {
      newErrors.room = 'Vui lòng chọn phòng';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Convert date and time to ISO format
      const dateStr = formatDateForSubmission(formData.date);
      const startTimeStr = convertTo24Hour(formData.startTime);
      const endTimeStr = convertTo24Hour(formData.endTime);
      
      const startDateTime = `${dateStr}T${startTimeStr}`;
      const endDateTime = `${dateStr}T${endTimeStr}`;

      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        startTime: startDateTime,
        endTime: endDateTime,
        roomId: parseInt(formData.room),
        participants: formData.guests ? [formData.guests] : [],
        deviceIds: formData.device ? [parseInt(formData.device)] : []
      };
      
      // Call API to create meeting
      await calendarAPI.createMeeting(meetingData);
      
      // Call parent onSubmit callback
      onSubmit(meetingData);
    } catch (error) {
      console.error('Error creating meeting:', error);
      setErrors({ submit: error.message || 'Không thể tạo cuộc họp. Vui lòng thử lại.' });
    }
  };

  return (
    <div className="create-meeting-modal-overlay">
      <div className="create-meeting-modal simple-style">
        <div className="modal-header">
          <h2>Thêm tiêu đề</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="meeting-form simple-form">
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
          <div className="form-section">
            <div className="datetime-controls">
              {/* Date Input */}
              <div className="datetime-group">
                <div className="section-label">Ngày</div>
                <div className="form-group">
                  <input
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    placeholder="dd/mm/yyyy"
                    className={`simple-input ${errors.date ? 'error' : ''}`}
                  />
                  {errors.date && <span className="error-message">{errors.date}</span>}
                </div>
              </div>

              {/* Start Time Input */}
              <div className="datetime-group">
                <div className="section-label">Giờ bắt đầu</div>
                <div className="form-group">
                  <input
                    type="text"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    placeholder="hh:mm AM/PM"
                    className={`simple-input ${errors.startTime ? 'error' : ''}`}
                  />
                  {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                </div>
              </div>

              {/* End Time Input */}
              <div className="datetime-group">
                <div className="section-label">Giờ kết thúc</div>
                <div className="form-group">
                  <input
                    type="text"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    placeholder="hh:mm AM/PM"
                    className={`simple-input ${errors.endTime ? 'error' : ''}`}
                  />
                  {errors.endTime && <span className="error-message">{errors.endTime}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Guests Section with Autocomplete */}
          <div className="form-section">
            <div className="section-label">Thêm khách</div>
            <div className="form-group guest-autocomplete" ref={guestInputRef}>
              <input
                type="text"
                name="guests"
                value={formData.guests}
                onChange={handleGuestChange}
                placeholder="Nhập email hoặc tên..."
                className="simple-input"
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
          <div className="form-section">
            <div className="section-label">Room</div>
            <div className="form-group">
              <select
                name="room"
                value={formData.room}
                onChange={handleRoomChange}
                className="simple-select"
                disabled={loadingRooms}
              >
                <option value="">Chọn phòng</option>
                {rooms.map(room => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.roomName} - Sức chứa: {room.capacity} người
                  </option>
                ))}
              </select>
              {loadingRooms && <span className="loading-text">Đang tải phòng...</span>}
              {errors.room && <span className="error-message">{errors.room}</span>}
            </div>
          </div>

          {/* Location Section - Auto-filled */}
          <div className="form-section">
            <div className="section-label">Vị trí room</div>
            <div className="form-group">
              <input
                type="text"
                name="location"
                value={formData.location}
                readOnly
                placeholder="Vị trí sẽ tự động hiển thị khi chọn phòng"
                className="simple-input"
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Device Selection - From Room */}
          <div className="form-section">
            <div className="section-label">Chọn thiết bị</div>
            <div className="form-group">
              <select
                name="device"
                value={formData.device}
                onChange={handleChange}
                className="simple-select"
                disabled={!formData.room || selectedRoomDevices.length === 0}
              >
                <option value="">
                  {!formData.room 
                    ? 'Vui lòng chọn phòng trước' 
                    : selectedRoomDevices.length === 0 
                      ? 'Phòng không có thiết bị'
                      : 'Chọn thiết bị'}
                </option>
                {selectedRoomDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.deviceName} - {device.deviceType} (Số lượng: {device.quantity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions simple-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="save-btn">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingForm;