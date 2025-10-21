// components/EditMeetingForm.js
import React, { useState, useEffect, useRef } from 'react';
import './MeetingForm.css';
import { roomAPI } from './MainCalendar/utils/RoomAPI';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';
import DateTimePicker from '../common/DateTimePicker';
import adminService from '../../services/adminService';
import DeviceSelectorModal from './DeviceSelectorModal';

const EditMeetingForm = ({ meeting, onClose, onSubmit, onDelete }) => {
  console.log('EditMeetingForm - Meeting data:', meeting);
  
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    startDateTime: meeting?.start ? new Date(meeting.start) : new Date(),
    endDateTime: meeting?.end ? new Date(meeting.end) : new Date(),
    guests: meeting?.attendees?.join(', ') || '',
    room: meeting?.roomId || '',
    devices: meeting?.deviceIds?.map(id => ({ deviceId: id, quantity: 1, deviceName: 'Device' + id })) || [],
    isAllDay: meeting?.allDay || false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomDevices, setSelectedRoomDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  
  // Update formData when meeting changes
  useEffect(() => {
    if (meeting) {
      console.log('Updating formData with meeting:', meeting);
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        startDateTime: meeting.start ? new Date(meeting.start) : new Date(),
        endDateTime: meeting.end ? new Date(meeting.end) : new Date(),
        guests: meeting.attendees?.join(', ') || '',
        room: meeting.roomId || '',
        devices: meeting.deviceIds?.map(id => ({ deviceId: id, quantity: 1, deviceName: 'Device' + id })) || [],
        isAllDay: meeting.allDay || false
      });
    }
  }, [meeting]);

  // Load rooms and all devices khi component mount
  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        if (isMounted) setLoadingRooms(true);
        const roomsData = await roomAPI.getAvailableRooms();
        if (isMounted) {
          setRooms(roomsData);
          
          // Load devices for current room
          if (formData.room) {
            const currentRoom = roomsData.find(r => r.roomId === parseInt(formData.room));
            if (currentRoom?.devices) {
              setSelectedRoomDevices(currentRoom.devices);
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

    const loadAllDevices = async () => {
      try {
        if (isMounted) setLoadingDevices(true);
        const devicesData = await adminService.getDevices();
        if (isMounted) {
          setAllDevices(devicesData || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading devices:', error);
        }
      } finally {
        if (isMounted) setLoadingDevices(false);
      }
    };

    loadRooms();
    loadAllDevices();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update devices when room changes
  useEffect(() => {
    if (formData.room) {
      const selectedRoom = rooms.find(r => r.roomId === parseInt(formData.room));
      if (selectedRoom?.devices) {
        setSelectedRoomDevices(selectedRoom.devices);
      } else {
        setSelectedRoomDevices([]);
      }
      // Reset device selection if room changes
      if (formData.device && !selectedRoom?.devices?.some(d => d.deviceId === parseInt(formData.device))) {
        setFormData(prev => ({ ...prev, device: '' }));
      }
    } else {
      setSelectedRoomDevices([]);
    }
  }, [formData.room, rooms]);

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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }
    
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
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        description: formData.description || '',
        startTime: formData.startDateTime.toISOString(),
        endTime: formData.endDateTime.toISOString(),
        isAllDay: formData.isAllDay,
        roomId: parseInt(formData.room),
        participants: formData.guests ? [formData.guests] : [],
        deviceIds: formData.devices.map(d => d.deviceId) // Extract deviceIds from devices array
      };
      
      // Call API to update meeting
      const updatedMeeting = await calendarAPI.updateMeeting(meeting.id, meetingData);
      
      console.log('Meeting updated successfully:', updatedMeeting);
      
      // Call parent onSubmit callback to refresh calendar FIRST
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
      console.error('Error updating meeting:', error);
      setErrors({ submit: error.message || 'Không thể cập nhật cuộc họp. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="create-meeting-modal-overlay">
      <div className="create-meeting-modal simple-style">
        <div className="modal-header">
          <h2>Chỉnh sửa cuộc họp</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="meeting-form icon-form">
          {/* Title Section */}
          <div className="form-row">
            <div className="form-icon">✏️</div>
            <div className="form-row-content">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Thêm tiêu đề"
                className="title-input"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="form-row">
            <div className="form-icon">⏰</div>
            <div className="form-row-content time-inputs-row">
              {/* Date Input */}
              <DateTimePicker
                value={formData.startDateTime}
                onChange={(date) => {
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
                placeholder="dd/mm/yyyy"
                className="date-only-picker"
                displayFormat="date"
              />
              
              {/* Start Time Input */}
              <DateTimePicker
                value={formData.startDateTime}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, startDateTime: date }));
                  if (date >= formData.endDateTime) {
                    const endDate = new Date(date.getTime() + 60 * 60 * 1000);
                    setFormData(prev => ({ ...prev, endDateTime: endDate }));
                  }
                }}
                showTime={true}
                showDate={true}
                mode="start"
                placeholder="00:00 AM"
                className="time-picker-input"
                displayFormat="time"
              />
              
              <span className="time-separator">—</span>
              
              {/* End Time Input */}
              <DateTimePicker
                value={formData.endDateTime}
                onChange={(date) => setFormData(prev => ({ ...prev, endDateTime: date }))}
                showTime={true}
                showDate={true}
                mode="end"
                baseDate={formData.startDateTime}
                placeholder="23:59 PM"
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

          {/* Guests Section */}
          <div className="form-row">
            <div className="form-icon">👨‍👩‍👧‍👦</div>
            <div className="form-row-content">
              <input
                type="text"
                name="guests"
                value={formData.guests}
                onChange={handleChange}
                placeholder="Thêm khách mời"
                className="inline-input"
              />
            </div>
          </div>

          {/* Room Section */}
          <div className="form-row">
            <div className="form-icon">🏛️</div>
            <div className="form-row-content">
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="inline-select"
                disabled={loadingRooms}
              >
                <option value="">
                  {loadingRooms ? 'Đang tải...' : 'Chọn phòng họp'}
                </option>
                {rooms.map(room => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.name} - {room.building} (Tầng {room.floor})
                    {room.capacity && ` - ${room.capacity} người`}
                  </option>
                ))}
              </select>
              {errors.room && <span className="error-message">{errors.room}</span>}
            </div>
          </div>

          {/* Room Devices Display */}
          {formData.room && (
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
                          {device.name || device.deviceName} - {device.deviceType || device.type} (SL: {device.quantity || 1})
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
              <div className="device-selection-container">
                {formData.devices.length > 0 && (
                  <div className="selected-devices-tags">
                    {formData.devices.map(device => (
                      <span key={device.deviceId} className="device-tag">
                        {device.deviceName} x{device.quantity}
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
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="device-add-btn"
                  onClick={() => setShowDeviceModal(true)}
                  disabled={loadingDevices}
                  title="Thêm thiết bị"
                >
                  {loadingDevices ? '...' : '+'}
                </button>
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

          {/* Error message */}
          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions simple-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMeetingForm;
