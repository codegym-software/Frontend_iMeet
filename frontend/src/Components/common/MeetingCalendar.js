// components/common/MeetingCalendar.js
import React, { useState, useRef, useEffect } from 'react';
import './MeetingCalendar.css';

const MeetingCalendar = ({ selectedDate, onDateSelect, currentDate, onMonthChange, disablePastDates = false }) => {
  // Lấy ngày trong tháng - giữ nguyên
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const days = [];
    let currentWeek = [];

    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      currentWeek.push(prevMonthLastDay - i);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        days.push([...currentWeek]);
        currentWeek = [];
      }
    }

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

  const weekDays = ["Cn", "T2", "T3", "T4", "T5", "T6", "T7"];
  const days = getDaysInMonth(currentDate);

  const isSelected = (day) => {
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear();
  };

  const isPrevMonth = (day, weekIndex) => {
    return weekIndex === 0 && day > 7;
  };

  const isNextMonth = (day, weekIndex) => {
    return weekIndex >= days.length - 1 && day < 14;
  };

  const isPastDate = (day, isPrevMonth, isNextMonth) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate;
    if (isPrevMonth) {
      checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
    } else if (isNextMonth) {
      checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
    } else {
      checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    }
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  };

  const handleDayClick = (day, isPrevMonth, isNextMonth) => {
    // Check if date is in the past (only if disablePastDates is true)
    if (disablePastDates && isPastDate(day, isPrevMonth, isNextMonth)) {
      alert('Không thể chọn ngày đã qua. Vui lòng chọn từ hôm nay trở đi.');
      return;
    }

    let newDate;

    if (isPrevMonth) {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (isNextMonth) {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    }

    onDateSelect(newDate);
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onMonthChange(newMonth);
  };

  const formatMonthYear = () => {
    const month = currentDate.getMonth() + 1; // 1-12
    const year = currentDate.getFullYear();
    return `Tháng ${month}, ${year}`;
  };

  return (
    <div className="calendar-container">
      <div className="calendar">
        {/* Month/Year Header with Navigation */}
        <div className="calendar-header">
          <button className="nav-btn prev" onClick={handlePrevMonth} type="button">‹</button>
          <div className="month-year-display">{formatMonthYear()}</div>
          <button className="nav-btn next" onClick={handleNextMonth} type="button">›</button>
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
                const isPast = isPastDate(day, isPrev, isNext);
                return (
                  <div
                    key={dayIndex}
                    className={`calendar-day 
                      ${isSelected(day) && !isPrev && !isNext ? 'selected' : ''} 
                      ${isToday(day) && !isPrev && !isNext ? 'today' : ''}
                      ${isPrev || isNext ? 'other-month' : ''}
                      ${disablePastDates && isPast ? 'past-date' : ''}`}
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
    </div>
  );
};

export default MeetingCalendar;
