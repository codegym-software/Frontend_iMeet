// components/main/MiniCalendar.js
import React, { useState, useRef, useEffect } from 'react';
import './MiniCalendar.css';

const MiniCalendar = ({ selectedDate, onDateSelect, currentDate, onMonthChange }) => {
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

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const days = getDaysInMonth(currentDate);

  const isSelected = (day) => {
    return selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const isPrevMonth = (day, weekIndex) => {
    return weekIndex === 0 && day > 7;
  };

  const isNextMonth = (day, weekIndex) => {
    return weekIndex >= days.length - 1 && day < 14;
  };

  const handleDayClick = (day, isPrevMonth, isNextMonth) => {
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

  return (
    <div className="calendar-container">
      {/* CALENDAR - CHỈ CÒN LƯỚI NGÀY */}
      <div className="calendar">
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
    </div>
  );
};

export default MiniCalendar;