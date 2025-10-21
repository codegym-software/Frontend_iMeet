import React, { useState } from 'react';
import DateTimePicker from './DateTimePicker';

const DateTimePickerDemo = () => {
  const [startDateTime, setStartDateTime] = useState(null);
  const [endDateTime, setEndDateTime] = useState(null);
  const [isAllDay, setIsAllDay] = useState(false);

  const handleAllDayChange = (checked) => {
    setIsAllDay(checked);
    if (checked) {
      // Set to all day
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      
      setStartDateTime(startDate);
      setEndDateTime(endDate);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>DateTimePicker Demo - Giống Google Calendar</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Thời gian bắt đầu:
        </label>
        <DateTimePicker
          value={startDateTime}
          onChange={setStartDateTime}
          placeholder="Chọn ngày và giờ bắt đầu"
          showTime={!isAllDay}
          showDate={true}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Thời gian kết thúc:
        </label>
        <DateTimePicker
          value={endDateTime}
          onChange={setEndDateTime}
          placeholder="Chọn ngày và giờ kết thúc"
          showTime={!isAllDay}
          showDate={true}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => handleAllDayChange(e.target.checked)}
          />
          <span>Cả ngày</span>
        </label>
      </div>

      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Kết quả:</h3>
        <p><strong>Bắt đầu:</strong> {startDateTime ? startDateTime.toLocaleString('vi-VN') : 'Chưa chọn'}</p>
        <p><strong>Kết thúc:</strong> {endDateTime ? endDateTime.toLocaleString('vi-VN') : 'Chưa chọn'}</p>
        <p><strong>Cả ngày:</strong> {isAllDay ? 'Có' : 'Không'}</p>
      </div>
    </div>
  );
};

export default DateTimePickerDemo;

