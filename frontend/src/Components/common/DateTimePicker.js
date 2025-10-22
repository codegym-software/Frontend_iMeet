import React, { useState, useEffect, useRef } from 'react';
import './DateTimePicker.css';
import MiniCalendar from '../main/MiniCalendar';
import MeetingCalendar from './MeetingCalendar';

const DateTimePicker = ({ 
  value, 
  onChange, 
  placeholder = "Chọn ngày và giờ",
  showTime = true,
  showDate = true,
  disabled = false,
  className = "",
  // mode: 'start' | 'end' - when 'end' we show duration suggestions next to times
  mode = 'start',
  // optional baseDate used to calculate duration suggestions (e.g., start time when editing end time)
  baseDate = null,
  // displayFormat: 'date' | 'time' | 'datetime' - controls what to show in the input
  displayFormat = 'datetime',
  // disablePastDates: prevent selecting past dates (for creating new meetings)
  disablePastDates = false,
  // showCalendarHeader: show month/year header with navigation buttons
  showCalendarHeader = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState({ hour: 9, minute: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  // Default to 'time' tab if displayFormat is 'time', otherwise 'date'
  const [activeTab, setActiveTab] = useState(displayFormat === 'time' ? 'time' : 'date');
  
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const timeListRef = useRef(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setSelectedTime({
          hour: date.getHours(),
          minute: date.getMinutes()
        });
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } else {
      // Set default to today
      const today = new Date();
      setSelectedDate(today);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-scroll to selected time when time tab is active
  useEffect(() => {
    if (activeTab === 'time' && timeListRef.current) {
      // Calculate the index of selected time slot
      const selectedIndex = selectedTime.hour * 4 + Math.floor(selectedTime.minute / 15);
      const timeSlots = timeListRef.current.querySelectorAll('.time-slot');
      
      if (timeSlots[selectedIndex]) {
        // Scroll to the selected time slot
        setTimeout(() => {
          timeSlots[selectedIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    }
  }, [activeTab, selectedTime.hour, selectedTime.minute]);

  // Format display value
  const formatDisplayValue = () => {
    if (!selectedDate) return '';
    
    // Use displayFormat to control what to show
    if (displayFormat === 'time') {
      // Only show time in 12-hour format without space before AM/PM
      const hour12 = selectedTime.hour % 12 || 12;
      const period = selectedTime.hour >= 12 ? 'PM' : 'AM';
      return `${hour12.toString().padStart(2, '0')}:${selectedTime.minute.toString().padStart(2, '0')}${period}`;
    }
    
    if (displayFormat === 'date') {
      // Only show date
      return selectedDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    // displayFormat === 'datetime' - show both
    const dateStr = selectedDate.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    if (showTime) {
      const hour12 = selectedTime.hour % 12 || 12;
      const period = selectedTime.hour >= 12 ? 'PM' : 'AM';
      const timeStr = `${hour12.toString().padStart(2, '0')}:${selectedTime.minute.toString().padStart(2, '0')}${period}`;
      return `${dateStr}, ${timeStr}`;
    }
    
    return dateStr;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    
    // If displayFormat is 'date', auto-close after selection
    if (displayFormat === 'date') {
      const finalDate = new Date(date);
      finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
      onChange(finalDate);
      setIsOpen(false);
    }
  };

  // Handle time change
  const handleTimeChange = (hour, minute) => {
    setSelectedTime({ hour, minute });
  };

  // Handle time selection directly
  const handleTimeSelect = (hour, minute) => {
    setSelectedTime({ hour, minute });
    
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(hour, minute, 0, 0);
      onChange(finalDate);
      setIsOpen(false);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      
      if (showTime) {
        finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
      }
      
      onChange(finalDate);
      setIsOpen(false);
    }
  };


  // Generate time options - all times in day with 15 min intervals
  const durationOptions = [
    { minutes: 30, label: '30 phút' },
    { minutes: 45, label: '45 phút' },
    { minutes: 60, label: '1 giờ' },
    { minutes: 90, label: '1.5 giờ' },
    { minutes: 120, label: '2 giờ' }
  ];

  const generateTimeOptions = () => {
    const options = [];
    
    // Determine start hour and minute based on mode
    let startHour = 0;
    let startMinute = 0;
    
    if (mode === 'end' && baseDate) {
      const base = new Date(baseDate);
      startHour = base.getHours();
      startMinute = base.getMinutes();
      // Round up to next 15-minute interval
      if (startMinute % 15 !== 0) {
        startMinute = Math.ceil(startMinute / 15) * 15;
        if (startMinute >= 60) {
          startMinute = 0;
          startHour++;
        }
      }
    }
    
    // Generate times from start time to end of day (23:45)
    for (let hour = startHour; hour < 24; hour++) {
      const minuteStart = (hour === startHour) ? startMinute : 0;
      
      for (let minute = minuteStart; minute < 60; minute += 15) {
        const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isSelected = selectedTime.hour === hour && selectedTime.minute === minute;
        
        // Calculate duration from base date if in end mode
        let durationText = '';
        if (mode === 'end' && baseDate) {
          const base = new Date(baseDate);
          const current = new Date(selectedDate || new Date());
          current.setHours(hour, minute, 0, 0);
          const diffMinutes = Math.round((current - base) / 60000);
          
          if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            if (hours > 0 && mins > 0) {
              durationText = `(${hours}h ${mins}p)`;
            } else if (hours > 0) {
              durationText = `(${hours}h)`;
            } else {
              durationText = `(${mins}p)`;
            }
          }
        }

        options.push(
          <div
            key={`${hour}-${minute}`}
            className={`time-slot ${isSelected ? 'selected' : ''}`}
            onClick={() => handleTimeSelect(hour, minute)}
          >
            <span className="time-label">{timeLabel}</span>
            {durationText && <span className="duration-label">{durationText}</span>}
          </div>
        );
      }
    }
    
    return options;
  };

  // Quick duration buttons for end time
  const renderDurationButtons = () => {
    if (mode !== 'end' || !baseDate) return null;

    return (
      <div className="duration-buttons">
        <div className="duration-label-text">Thời lượng nhanh:</div>
        {durationOptions.map(d => (
          <button
            key={d.minutes}
            type="button"
            className="duration-btn"
            onClick={(e) => {
              e.preventDefault();
              const base = new Date(baseDate);
              const newEnd = new Date(base.getTime() + d.minutes * 60000);
              onChange(newEnd);
              setIsOpen(false);
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
    );
  };


  // Handle manual input (date or time)
  const handleManualInput = (e) => {
    const inputValue = e.target.value.trim();
    
    // Parse date input for date or datetime formats
    if (displayFormat === 'date' || displayFormat === 'datetime') {
      // Support formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
      const dateRegex1 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/; // DD/MM/YYYY or DD-MM-YYYY
      const dateRegex2 = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/; // YYYY-MM-DD
      
      let match = inputValue.match(dateRegex1);
      let day, month, year;
      
      if (match) {
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      } else {
        match = inputValue.match(dateRegex2);
        if (match) {
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        }
      }
      
      if (match) {
        // Validate date
        const testDate = new Date(year, month - 1, day);
        const isValidDate = testDate.getDate() === day && 
                           testDate.getMonth() === month - 1 && 
                           testDate.getFullYear() === year;
        
        if (isValidDate) {
          // Check if date is not in the past (only if disablePastDates is true)
          if (disablePastDates) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            testDate.setHours(0, 0, 0, 0);
            
            if (testDate < today) {
              // Date is in the past - reset to today
              alert('Không thể chọn ngày đã qua. Vui lòng chọn từ hôm nay trở đi.');
              const today = new Date();
              setSelectedDate(today);
              onChange(today);
              return;
            }
          }
          
          const newDate = new Date(year, month - 1, day, selectedTime.hour, selectedTime.minute, 0, 0);
          setSelectedDate(newDate);
          setCurrentMonth(new Date(year, month - 1, 1));
          onChange(newDate);
          return;
        }
      }
    }
    
    // Parse time input - support multiple formats
    // Format 1: "H:MM" or "HH:MM" (24-hour format, will auto-convert to 12h display)
    const time24Regex = /^(\d{1,2}):(\d{2})$/;
    // Format 2: "H:MMAM" or "HH:MMPM" (12-hour with AM/PM attached)
    const time12Regex = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
    
    let match = inputValue.match(time24Regex);
    let hour, minute;
    
    if (match) {
      // 24-hour format input
      hour = parseInt(match[1]);
      minute = parseInt(match[2]);
      
      // Validate and accept 0-23 for hours
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        const newDate = new Date(selectedDate || new Date());
        newDate.setHours(hour, minute, 0, 0);
        setSelectedTime({ hour, minute });
        onChange(newDate);
      }
    } else {
      // Try 12-hour format with AM/PM
      match = inputValue.match(time12Regex);
      if (match) {
        hour = parseInt(match[1]);
        minute = parseInt(match[2]);
        const period = match[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }
        
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          const newDate = new Date(selectedDate || new Date());
          newDate.setHours(hour, minute, 0, 0);
          setSelectedTime({ hour, minute });
          onChange(newDate);
        }
      }
    }
  };

  // Handle input focus - allow editing
  const handleInputFocus = (e) => {
    if (displayFormat === 'time') {
      // For time-only input, select all text for easy editing
      e.target.select();
    }
  };

  // Handle input click - prevent dropdown from opening when clicking to edit
  const handleInputClick = (e) => {
    if (disabled) return;
    
    // If clicking on the input itself (not icon), don't open dropdown immediately
    // User can still open dropdown by clicking outside the text or pressing down arrow
    if (e.target.tagName === 'INPUT') {
      // Don't open dropdown, allow editing
      return;
    }
  };

  return (
    <div className={`date-time-picker ${className}`} ref={pickerRef}>
      <div className="date-time-input-wrapper">
        <input
          type="text"
          className={`date-time-input ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          onChange={handleManualInput}
          onBlur={handleManualInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleManualInput(e);
              e.target.blur();
            } else if (e.key === 'ArrowDown') {
              // Open dropdown with arrow down
              setIsOpen(true);
            }
          }}
          value={formatDisplayValue() || ''}
          placeholder={placeholder}
          disabled={disabled}
          ref={inputRef}
          readOnly={false} // Allow manual input for all formats
        />
        <div className="input-icons">
          {(displayFormat === 'date' || displayFormat === 'datetime') && (
            <span 
              className="calendar-icon" 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              title="Chọn từ lịch"
            >
              📅
            </span>
          )}
          {displayFormat !== 'date' && (
            <span 
              className="dropdown-toggle-icon" 
              onClick={() => !disabled && setIsOpen(!isOpen)}
              title="Chọn giờ"
            >
              ▼
            </span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="date-time-picker-dropdown google-style">
          <div className="picker-content">
            {/* Tabs for Date and Time - Only show if not time-only display */}
            {showDate && showTime && displayFormat !== 'time' && (
              <div className="picker-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'date' ? 'active' : ''}`}
                  onClick={() => setActiveTab('date')}
                >
                  📅 Ngày
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
                  onClick={() => setActiveTab('time')}
                >
                  🕐 Giờ
                </button>
              </div>
            )}

            {/* Calendar Section - Use MeetingCalendar or MiniCalendar component */}
            {showDate && displayFormat !== 'time' && (!showTime || activeTab === 'date') && (
              <div className="calendar-section">
                {showCalendarHeader ? (
                  <MeetingCalendar
                    selectedDate={selectedDate || new Date()}
                    currentDate={currentMonth}
                    onDateSelect={handleDateSelect}
                    onMonthChange={setCurrentMonth}
                    disablePastDates={disablePastDates}
                  />
                ) : (
                  <MiniCalendar
                    selectedDate={selectedDate || new Date()}
                    currentDate={currentMonth}
                    onDateSelect={handleDateSelect}
                    onMonthChange={setCurrentMonth}
                    disablePastDates={disablePastDates}
                  />
                )}
                
                {showTime && (
                  <div className="tab-navigation">
                    <button 
                      className="next-tab-btn"
                      onClick={() => setActiveTab('time')}
                    >
                      Tiếp theo: Chọn giờ →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Time Section */}
            {showTime && (!showDate || activeTab === 'time') && (
              <div className="time-section">
                {renderDurationButtons()}
                <div className="time-list-container" ref={timeListRef}>
                  <div className="time-list">
                    {generateTimeOptions()}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Hide for time-only and date-only display */}
            {displayFormat !== 'time' && displayFormat !== 'date' && (
              <div className="picker-actions">
                <button className="cancel-btn" onClick={() => setIsOpen(false)}>
                  Hủy
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={handleConfirm}
                  disabled={!selectedDate}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;

