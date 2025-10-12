// components/main/MiniCalendar.js
import React, { useState, useRef, useEffect } from 'react';
import './MiniCalendar.css';

const MiniCalendar = ({ selectedDate, onDateSelect, currentDate, onMonthChange }) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCreateMenuOpen(false);
      }
    };

    if (isCreateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateMenuOpen]);

  // Format tháng năm
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Lấy ngày trong tháng - FIXED LOGIC
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    const days = [];
    let currentWeek = [];
    
    // Thêm ngày từ tháng trước (nếu cần)
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      currentWeek.push(prevMonthLastDay - i);
    }
    
    // Thêm ngày của tháng hiện tại
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        days.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Thêm ngày từ tháng sau (nếu cần)
    if (currentWeek.length > 0) {
      let nextMonthDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push(nextMonthDay);
        nextMonthDay++;
      }
      days.push([...currentWeek]);
    }
    
    return days;
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const days = getDaysInMonth(currentDate);

  const isSelected = (day) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentDate.getMonth() && 
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  // FIXED: Logic xác định ngày của tháng trước/tháng sau
  const isPrevMonth = (day, weekIndex) => {
    return weekIndex === 0 && day > 7;
  };

  const isNextMonth = (day, weekIndex) => {
    return weekIndex >= days.length - 1 && day < 14;
  };

  const handleCreateClick = () => {
    setIsCreateMenuOpen(!isCreateMenuOpen);
  };

  const handleCreateOption = (option) => {
    setIsCreateMenuOpen(false);
  };

  const handleDayClick = (day, isPrevMonth, isNextMonth) => {
    let newDate;
    
    if (isPrevMonth) {
      // Ngày của tháng trước
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (isNextMonth) {
      // Ngày của tháng sau
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      // Ngày của tháng hiện tại
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    }
    
    onDateSelect(newDate);
  };

  return (
    <div className="calendar" ref={dropdownRef}>
      <div className="calendar-header">
        <button 
          className="create-button"
          onClick={handleCreateClick}
        >
          Create
          <span className="dropdown-arrow">▼</span>
        </button>
        
        <div className="month-year">{formatMonthYear(currentDate)}</div>
        
        {isCreateMenuOpen && (
          <div className="create-dropdown">
            <button 
              className="dropdown-item"
              onClick={() => handleCreateOption('Event')}
            >
              📅 Event
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleCreateOption('Task')}
            >
              ✅ Task
            </button>
            <button 
              className="dropdown-item"
              onClick={() => handleCreateOption('Reminder')}
            >
              ⏰ Reminder
            </button>
          </div>
        )}
      </div>
      
      <div className="week-days">
        {weekDays.map((day, index) => (
          <span key={index} className="week-day">{day}</span>
        ))}
      </div>
      
      <div className="calendar-grid">
        {days.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              const isPrev = isPrevMonth(day, weekIndex);
              const isNext = isNextMonth(day, weekIndex);
              
              return (
                <div
                  key={dayIndex}
                  className={`calendar-day 
                    ${isSelected(day) ? 'selected' : ''} 
                    ${isPrev || isNext ? 'other-month' : ''}`}
                  onClick={() => handleDayClick(day, isPrev, isNext)}
                >
                  {day}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendar;