import React, { useState } from 'react';
import DateTimePicker from './DateTimePicker';
import './DateTimePicker.css';

const DateTimePickerDemo = () => {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>DateTimePicker Demo - Google Calendar Style</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Date Picker</h3>
        <DateTimePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder="Chọn ngày"
          displayFormat="date"
          showDate={true}
          showTime={false}
          disablePastDates={true}
          showCalendarHeader={true}
        />
        <p>Selected Date: {selectedDate.toLocaleDateString()}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Time Picker (Start Time)</h3>
        <DateTimePicker
          value={startTime}
          onChange={setStartTime}
          placeholder="9:00 AM"
          displayFormat="time"
          showTime={true}
          showDate={false}
          mode="start"
        />
        <p>Start Time: {startTime.toLocaleTimeString()}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Time Picker (End Time)</h3>
        <DateTimePicker
          value={endTime}
          onChange={setEndTime}
          placeholder="10:00 AM"
          displayFormat="time"
          showTime={true}
          showDate={false}
          mode="end"
          baseDate={startTime}
        />
        <p>End Time: {endTime.toLocaleTimeString()}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Combined Date & Time Picker</h3>
        <DateTimePicker
          value={startTime}
          onChange={setStartTime}
          placeholder="Chọn ngày và giờ"
          displayFormat="datetime"
          showTime={true}
          showDate={true}
          disablePastDates={true}
        />
        <p>Selected DateTime: {startTime.toLocaleString()}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Meeting Form Style</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '12px',
          border: '1px solid #dadce0',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <DateTimePicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Chọn ngày"
            displayFormat="date"
            showDate={true}
            showTime={false}
            disablePastDates={true}
            showCalendarHeader={true}
            className="date-picker-input"
          />
          
          <DateTimePicker
            value={startTime}
            onChange={setStartTime}
            placeholder="9:00 AM"
            displayFormat="time"
            showTime={true}
            showDate={false}
            mode="start"
            className="time-picker-input"
          />
          
          <span style={{ fontSize: '16px', color: '#5f6368', fontWeight: '500' }}>—</span>
          
          <DateTimePicker
            value={endTime}
            onChange={setEndTime}
            placeholder="10:00 AM"
            displayFormat="time"
            showTime={true}
            showDate={false}
            mode="end"
            baseDate={startTime}
            className="time-picker-input"
          />
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f0fe', borderRadius: '8px' }}>
        <h4>Supported Input Formats:</h4>
        <h5>Date Formats:</h5>
        <ul>
          <li>DD/MM/YYYY (e.g., 15/12/2024)</li>
          <li>DD-MM-YYYY (e.g., 15-12-2024)</li>
          <li>YYYY-MM-DD (e.g., 2024-12-15)</li>
          <li>DD MM YYYY (e.g., 15 12 2024)</li>
          <li>DD Month YYYY (e.g., 15 Dec 2024)</li>
          <li>Month DD YYYY (e.g., Dec 15 2024)</li>
          <li>DD MM (assumes current year)</li>
          <li>DD (assumes current month and year)</li>
        </ul>
        
        <h5>Time Formats:</h5>
        <ul>
          <li>H:MM AM/PM (e.g., 9:30 AM)</li>
          <li>H:MMAM/PM (e.g., 9:30AM)</li>
          <li>H:MM (24-hour format, e.g., 9:30)</li>
          <li>H AM/PM (e.g., 9 AM)</li>
          <li>HAM/PM (e.g., 9AM)</li>
          <li>H (assumes current period, e.g., 9)</li>
        </ul>
      </div>
    </div>
  );
};

export default DateTimePickerDemo;