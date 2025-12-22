import React, { useState, useEffect, useRef, useMemo } from 'react';
import './DateTimePicker.css';
import MiniCalendar from '../main/MiniCalendar';
import MeetingCalendar from './MeetingCalendar';

// DateTimePicker component with useMemo for performance optimization
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
  // Track input value separately for manual typing
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const timeListRef = useRef(null);

  // Parse initial value - use value timestamp to prevent infinite loops
  const valueTimestamp = value instanceof Date && !isNaN(value.getTime()) ? value.getTime() : null;
  const prevValueTimestampRef = useRef(null);
  
  useEffect(() => {
    // Only update if value timestamp actually changed
    if (valueTimestamp && valueTimestamp !== prevValueTimestampRef.current) {
      prevValueTimestampRef.current = valueTimestamp;
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setSelectedTime({
          hour: date.getHours(),
          minute: date.getMinutes()
        });
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } else if (!valueTimestamp && !selectedDate) {
      // Set default to today only if no date is selected
      const today = new Date();
      setSelectedDate(today);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueTimestamp]); // Only depend on timestamp, not the Date object

  // Update input value when selected time changes (but not when user is typing)
  // Use useMemo to prevent infinite loops
  const selectedTimeHour = selectedTime?.hour ?? 0;
  const selectedTimeMinute = selectedTime?.minute ?? 0;
  const selectedDateTimestamp = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
    ? selectedDate.getTime() 
    : null;
  
  const displayValue = useMemo(() => {
    if (!selectedDateTimestamp) return '';
    
    // Create date from timestamp to avoid using selectedDate object directly
    const date = new Date(selectedDateTimestamp);
    
    // Use displayFormat to control what to show
    if (displayFormat === 'time') {
      const hour12 = selectedTimeHour % 12 || 12;
      const period = selectedTimeHour >= 12 ? 'PM' : 'AM';
      return `${hour12}:${selectedTimeMinute.toString().padStart(2, '0')} ${period}`;
    }
    
    if (displayFormat === 'date') {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    
    // displayFormat === 'datetime'
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const dateStr = `${month}/${day}/${year}`;
    
    if (showTime) {
      const hour12 = selectedTimeHour % 12 || 12;
      const period = selectedTimeHour >= 12 ? 'PM' : 'AM';
      const timeStr = `${hour12}:${selectedTimeMinute.toString().padStart(2, '0')} ${period}`;
      return `${dateStr} ${timeStr}`;
    }
    
    return dateStr;
  }, [selectedDateTimestamp, selectedTimeHour, selectedTimeMinute, displayFormat, showTime]);
  
  const prevDisplayValueRef = useRef('');
  useEffect(() => {
    if (!isTyping && displayValue && displayValue !== prevDisplayValueRef.current) {
      prevDisplayValueRef.current = displayValue;
      setInputValue(displayValue);
    }
  }, [displayValue, isTyping]);

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

  // Format display value - Enhanced Google Calendar style
  const formatDisplayValue = () => {
    if (!selectedDate) return '';
    
    // Use displayFormat to control what to show
    if (displayFormat === 'time') {
      // Google Calendar style time format: H:MM AM/PM (no leading zero for hour)
      const hour12 = selectedTime.hour % 12 || 12;
      const period = selectedTime.hour >= 12 ? 'PM' : 'AM';
      // Minutes always padded to 2 digits, hour without leading zero (like Google Calendar)
      return `${hour12}:${selectedTime.minute.toString().padStart(2, '0')} ${period}`;
    }
    
    if (displayFormat === 'date') {
      // Google Calendar style date format: M/D/YYYY or MM/DD/YYYY
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const year = selectedDate.getFullYear();
      return `${month}/${day}/${year}`;
    }
    
    // displayFormat === 'datetime' - show both in Google Calendar style
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const year = selectedDate.getFullYear();
    const dateStr = `${month}/${day}/${year}`;
    
    if (showTime) {
      const hour12 = selectedTime.hour % 12 || 12;
      const period = selectedTime.hour >= 12 ? 'PM' : 'AM';
      const timeStr = `${hour12}:${selectedTime.minute.toString().padStart(2, '0')} ${period}`;
      return `${dateStr} ${timeStr}`;
    }
    
    return dateStr;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setIsTyping(false);
    
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
    setIsTyping(false);
    
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
      startMinute = Math.ceil(startMinute / 15) * 15;
      if (startMinute >= 60) {
        startMinute = 0;
        startHour++;
      }
    }
    
    // Generate times from start time to end of day - 15 MINUTE INTERVALS (like Google Calendar)
    for (let hour = startHour; hour < 24; hour++) {
      const minuteStart = (hour === startHour) ? startMinute : 0;
      
      // Generate 15-minute intervals: 0, 15, 30, 45
      for (let minute = minuteStart; minute < 60; minute += 15) {
        // Google Calendar style time display: H:MM AM/PM
        const hour12 = hour % 12 || 12;
        const period = hour >= 12 ? 'PM' : 'AM';
        const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
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


  // Handle manual input (date or time) - Enhanced Google Calendar style
  const handleManualInputBlur = (e) => {
    setIsTyping(false);
    const inputVal = e.target.value.trim();
    
    // If empty, reset to formatted value
    if (!inputVal) {
      setInputValue(formatDisplayValue());
      return;
    }
    
    // Parse date input for date or datetime formats
    if (displayFormat === 'date' || displayFormat === 'datetime') {
      // Support multiple date formats like Google Calendar
      const formats = [
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY-MM-DD
        /^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/, // DD MM YYYY
        /^(\d{1,2})\s+(\w+)\s+(\d{4})$/, // DD Month YYYY (e.g., "15 Dec 2024")
        /^(\w+)\s+(\d{1,2})\s+(\d{4})$/, // Month DD YYYY (e.g., "Dec 15 2024")
        /^(\d{1,2})\s+(\d{1,2})$/, // DD MM (assume current year)
        /^(\d{1,2})$/, // DD (assume current month and year)
      ];
      
      let day, month, year;
      let matchFound = false;
      
      for (let i = 0; i < formats.length; i++) {
        const match = inputVal.match(formats[i]);
        if (match) {
          matchFound = true;
          
          if (i === 0) { // DD/MM/YYYY or DD-MM-YYYY
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = parseInt(match[3]);
          } else if (i === 1) { // YYYY-MM-DD
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          } else if (i === 2) { // DD MM YYYY
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = parseInt(match[3]);
          } else if (i === 3) { // DD Month YYYY
            day = parseInt(match[1]);
            month = getMonthNumber(match[2]);
            year = parseInt(match[3]);
          } else if (i === 4) { // Month DD YYYY
            month = getMonthNumber(match[1]);
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          } else if (i === 5) { // DD MM (current year)
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = new Date().getFullYear();
          } else if (i === 6) { // DD (current month and year)
            day = parseInt(match[1]);
            month = new Date().getMonth() + 1;
            year = new Date().getFullYear();
          }
          break;
        }
      }
      
      if (matchFound && day && month && year) {
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
          setInputValue(formatDisplayValue());
          return;
        }
      }
    }
    
    // Parse time input - Enhanced Google Calendar style with more formats
    const timeFormats = [
      /^(\d{1,2}):(\d{1,2})\s+(AM|PM)$/i, // H:MM AM/PM with space
      /^(\d{1,2}):(\d{1,2})(AM|PM)$/i, // H:MMAM/PM without space
      /^(\d{1,2}):(\d{1,2})$/, // H:MM (24-hour format)
      /^(\d{1,2})\s+(AM|PM)$/i, // H AM/PM (assume :00 minutes)
      /^(\d{1,2})(AM|PM)$/i, // HAM/PM (assume :00 minutes)
      /^(\d{1,2})$/, // H (assume :00 minutes, current period)
    ];
    
    let hour, minute;
    let timeMatchFound = false;
    
    for (let i = 0; i < timeFormats.length; i++) {
      const match = inputVal.match(timeFormats[i]);
      if (match) {
        timeMatchFound = true;
        
        if (i === 0 || i === 1) { // With AM/PM
          hour = parseInt(match[1]);
          minute = parseInt(match[2]);
          const period = match[3].toUpperCase();
          
          // Validate hour in 12-hour format (1-12) and minute (0-59)
          if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
              hour += 12;
            } else if (period === 'AM' && hour === 12) {
              hour = 0;
            }
          } else {
            timeMatchFound = false;
            continue;
          }
        } else if (i === 2) { // 24-hour format
          hour = parseInt(match[1]);
          minute = parseInt(match[2]);
          
          // Validate and accept 0-23 for hours and 0-59 for minutes
          if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            timeMatchFound = false;
            continue;
          }
        } else if (i === 3 || i === 4) { // Hour with AM/PM, no minutes
          hour = parseInt(match[1]);
          minute = 0;
          const period = match[2].toUpperCase();
          
          // Validate hour in 12-hour format (1-12)
          if (hour >= 1 && hour <= 12) {
            // Convert to 24-hour format
            if (period === 'PM' && hour !== 12) {
              hour += 12;
            } else if (period === 'AM' && hour === 12) {
              hour = 0;
            }
          } else {
            timeMatchFound = false;
            continue;
          }
        } else if (i === 5) { // Just hour, assume current period
          hour = parseInt(match[1]);
          minute = 0;
          
          // If hour is 1-12, assume current AM/PM period
          if (hour >= 1 && hour <= 12) {
            const currentHour = new Date().getHours();
            const isPM = currentHour >= 12;
            
            if (isPM && hour !== 12) {
              hour += 12;
            } else if (!isPM && hour === 12) {
              hour = 0;
            }
          } else if (hour >= 0 && hour <= 23) {
            // Already in 24-hour format
          } else {
            timeMatchFound = false;
            continue;
          }
        }
        break;
      }
    }
    
    if (timeMatchFound && hour !== undefined && minute !== undefined) {
      const newDate = new Date(selectedDate || new Date());
      newDate.setHours(hour, minute, 0, 0);
      setSelectedTime({ hour, minute });
      onChange(newDate);
      setInputValue(formatDisplayValue());
      return;
    }
    
    // If no valid format found, reset to previous value
    setInputValue(formatDisplayValue());
  };

  // Helper function to convert month name to number
  const getMonthNumber = (monthName) => {
    const months = {
      'jan': 1, 'january': 1,
      'feb': 2, 'february': 2,
      'mar': 3, 'march': 3,
      'apr': 4, 'april': 4,
      'may': 5,
      'jun': 6, 'june': 6,
      'jul': 7, 'july': 7,
      'aug': 8, 'august': 8,
      'sep': 9, 'september': 9,
      'oct': 10, 'october': 10,
      'nov': 11, 'november': 11,
      'dec': 12, 'december': 12
    };
    return months[monthName.toLowerCase()] || 0;
  };

  // Handle input focus - allow editing
  const handleInputFocus = (e) => {
    // Don't auto-open dropdown on focus, let user type
    setIsTyping(true);
    if (displayFormat === 'time') {
      // For time-only input, select all text for easy editing
      e.target.select();
    }
  };

  // Handle input click - ONLY for manual input, don't open dropdown
  const handleInputClick = (e) => {
    // Allow clicking input to focus and type
    // Dropdown only opens via icon click or arrow key
    e.stopPropagation();
  };

  // Handle icon click to toggle dropdown
  const handleIconClick = (e) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
      // Stop typing mode when opening dropdown
      if (!isOpen) {
        setIsTyping(false);
        setInputValue(formatDisplayValue());
      }
    }
  };

  // Handle input change while typing
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle wrapper click - unified click handler for the entire input area
  const handleWrapperClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    // If clicking on the icon area, don't trigger input click
    if (e.target.closest('.input-icons')) {
      handleIconClick(e);
    } else {
      // Clicking on input area - open picker
      handleInputClick(e);
    }
  };

  return (
    <div className={`date-time-picker ${className}`} ref={pickerRef}>
      <div 
        className="date-time-input-wrapper" 
        onClick={handleWrapperClick}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <input
          type="text"
          className={`date-time-input ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              handleInputClick(e);
            }
          }}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          onBlur={handleManualInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleManualInputBlur(e);
              e.target.blur();
            } else if (e.key === 'ArrowDown') {
              // Open dropdown with arrow down
              e.preventDefault();
              setIsOpen(true);
              setIsTyping(false);
            } else if (e.key === 'Escape') {
              // Close dropdown with escape
              setIsOpen(false);
              setIsTyping(false);
              setInputValue(formatDisplayValue());
              e.target.blur();
            }
          }}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          ref={inputRef}
          readOnly={false} // Allow manual input for all formats
          style={{ cursor: disabled ? 'not-allowed' : 'text' }}
        />
        <div className="input-icons" onClick={(e) => e.stopPropagation()}>
          {(displayFormat === 'date' || displayFormat === 'datetime') && (
            <span 
              className="calendar-icon" 
              onClick={handleIconClick}
              title="Chọn từ lịch"
            >
              📅
            </span>
          )}
          {displayFormat !== 'date' && (
            <span 
              className="dropdown-toggle-icon" 
              onClick={handleIconClick}
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

