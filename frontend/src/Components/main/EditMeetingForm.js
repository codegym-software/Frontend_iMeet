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

const EditMeetingForm = ({ meeting, onClose, onSubmit, onDelete }) => {
  console.log('EditMeetingForm - Meeting data:', meeting);
  
  // Check if meeting is editable (only CONFIRMED meetings can be edited)
  const isEditable = meeting?.bookingStatus?.toUpperCase() === 'CONFIRMED';
  
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
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  
  // ✅ USE CACHE - No more slow API calls!
  const { getDevicesWithAvailability, checkAvailability } = useDeviceInventory();
  const { updateMeetingWithDevices, deleteMeetingWithDevices } = useMeetingWithDevices();
  
  // Get devices from cache - INSTANT!
  const allDevices = getDevicesWithAvailability();
  
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

  // Load rooms only - devices từ cache rồi!
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

    loadRooms();
    // ✅ Devices từ cache - không cần fetch nữa!

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
    
    // ✅ VALIDATE DEVICE AVAILABILITY (considering current meeting's devices)
    const deviceErrors = [];
    formData.devices.forEach(device => {
      // Get current device in this meeting (to add back to available)
      const currentDeviceInMeeting = meeting.devices?.find(d => d.deviceId === device.deviceId);
      const currentQuantity = currentDeviceInMeeting?.quantity || 0;
      
      // Calculate actual available = current available + what this meeting is using
      const deviceInfo = allDevices.find(d => d.deviceId === device.deviceId);
      const actualAvailable = (deviceInfo?.available || 0) + currentQuantity;
      
      // Check if new quantity exceeds actual available
      if (device.quantity > actualAvailable) {
        deviceErrors.push(`${device.deviceName}: chỉ còn ${actualAvailable} (yêu cầu ${device.quantity})`);
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
      
      // Call API to update meeting
      const updatedMeeting = await calendarAPI.updateMeeting(meeting.id, meetingData);
      
      console.log('✅ Meeting updated successfully:', updatedMeeting);
      
      // ✅ OPTIMISTIC UPDATE - Return old devices, borrow new ones
      updateMeetingWithDevices(meeting, updatedMeeting);
      
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
          <h2>{isEditable ? 'Chỉnh sửa cuộc họp' : 'Xem chi tiết cuộc họp'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Notice for non-editable meetings */}
        {!isEditable && (
          <div style={{
            margin: '0 20px 16px 20px',
            padding: '12px 16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span style={{ color: '#856404', fontSize: '14px', fontWeight: '500' }}>
              Cuộc họp này đang chờ admin duyệt. Bạn chỉ có thể xem thông tin hoặc xóa cuộc họp.
            </span>
          </div>
        )}
        
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
                disabled={!isEditable}
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
                showCalendarHeader={true}
                disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={loadingRooms || !isEditable}
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
                          {device.name || device.deviceName} {(device.deviceType || device.type) ? `- ${device.deviceType || device.type}` : ''} (SL: {device.quantityAssigned || device.quantity || 1})
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
                            {isEditable && (
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
                            )}
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
                  disabled={!isEditable}
                  title="Thêm thiết bị"
                >
                  + Chọn thiết bị
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
                disabled={!isEditable}
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
            {isEditable ? (
              <>
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
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={onClose}
                  style={{ flex: 1 }}
                >
                  Đóng
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className="save-btn"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) {
                        onDelete(meeting.id);
                        onClose();
                      }
                    }}
                    style={{ 
                      flex: 1,
                      backgroundColor: '#dc3545',
                      borderColor: '#dc3545'
                    }}
                  >
                    Xóa cuộc họp
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMeetingForm;
