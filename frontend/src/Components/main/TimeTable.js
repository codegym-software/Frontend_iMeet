// src/Components/main/TimeTable.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './TimeTable.css';

const YearView = React.memo(({ selectedDate, onDateSelect }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = selectedDate.getFullYear();
  const today = new Date();

  const renderMonthGrid = (monthIndex) => {
    const firstDay = new Date(currentYear, monthIndex, 1);
    const lastDay = new Date(currentYear, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty days for the beginning of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, monthIndex, day);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        day,
        date: date,
        isCurrentMonth: true,
        isToday
      });
    }

    return days;
  };

  return (
    <div className="time-table year-view">
      <div className="calendar-header">
        <div className="date-display">
          <div className="year-title">{currentYear}</div>
        </div>
      </div>

      <div className="year-content">
        <div className="year-months-grid">
          {months.map((monthName, monthIndex) => {
            const monthDays = renderMonthGrid(monthIndex);
            const today = new Date();
            const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === monthIndex;

            // Chia days thành các tuần (mỗi tuần 7 ngày)
            const weeks = [];
            for (let i = 0; i < monthDays.length; i += 7) {
              weeks.push(monthDays.slice(i, i + 7));
            }

            // Đảm bảo luôn có 6 tuần để layout đồng đều
            while (weeks.length < 6) {
              weeks.push(Array(7).fill(null));
            }

            return (
              <div key={monthIndex} className="year-month-card">
                <div className="year-month-header">
                  <div className="year-month-name">{monthName}</div>
                </div>

                <div className="year-month-weekdays">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="year-weekday">{day}</div>
                  ))}
                </div>

                <div className="year-month-days-grid">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="year-month-week">
                      {week.map((dayObj, dayIndex) => {
                        const isEmpty = dayObj === null;

                        return (
                          <div
                            key={`${monthIndex}-${weekIndex}-${dayIndex}`}
                            className={`year-month-day 
                            ${isEmpty ? 'empty' : ''} 
                            ${dayObj && dayObj.isToday ? 'today' : ''}`}
                            onClick={() => {
                              if (dayObj && dayObj.isCurrentMonth) {
                                const newDate = new Date(currentYear, monthIndex, dayObj.day);
                                onDateSelect && onDateSelect(newDate);
                              }
                            }}
                          >
                            {!isEmpty && dayObj && (
                              <span className="year-day-number">{dayObj.day}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>




  );
});

const DayView = React.memo(({
  selectedDate,
  events,
  currentTime,
  onDateSelect,
  handleEventClick,
  handleEventMouseEnter,
  handleEventMouseLeave,
  handleTimeSlotClick,
  formatTime
}) => {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const timeSlotsRef = useRef(null);

  const allDayEvents = useMemo(() => events.filter(event => event.allDay), [events]);
  const timedEvents = useMemo(() => events.filter(event => !event.allDay), [events]);

  const renderTimedEvents = useMemo(() => {
    return timedEvents.map(event => {
      const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
      const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
      const duration = endMinutes - startMinutes;

      const top = (startMinutes / 60) * 60;
      const height = Math.max((duration / 60) * 60, 20);

      return (
        <div
          key={event.id}
          className="calendar-event timed-event"
          style={{
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: event.color,
            borderLeft: `3px solid ${event.color}`
          }}
          onClick={(e) => handleEventClick(event, e)}
          onMouseEnter={(e) => handleEventMouseEnter(event, e)}
          onMouseLeave={handleEventMouseLeave}
        >
          <div className="event-content">
            <div className="event-time">
              {formatTime(event.start)}
            </div>
            <div className="event-title">{event.title}</div>
            <div className="event-calendar">{event.calendar}</div>
          </div>
        </div>
      );
    });
  }, [timedEvents, handleEventClick, handleEventMouseEnter, handleEventMouseLeave, formatTime]);

  // Scroll to current time
  useEffect(() => {
    if (timeSlotsRef.current) {
      const currentHour = currentTime.getHours();
      const scrollPosition = currentHour * 60 - 200;
      timeSlotsRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [currentTime]);

  return (
    <div className="time-table day-view">
      <div className="calendar-header">
        <div className="date-display">
          <div className="day-of-week">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className="full-date">
            <span className="month">{selectedDate.toLocaleDateString('en-US', { month: 'long' })}</span>
            <span className="day"> {selectedDate.getDate()}</span>
            <span className="year">, {selectedDate.getFullYear()}</span>
          </div>
          {isToday && <div className="today-indicator">Today</div>}
        </div>
      </div>

      {/* All Day Section */}
      {allDayEvents.length > 0 && (
        <div className="all-day-section">
          <div className="all-day-label">All day</div>
          <div className="all-day-events">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className="calendar-event all-day-event"
                style={{
                  backgroundColor: event.color,
                  borderLeft: `3px solid ${event.color}`
                }}
                onClick={(e) => handleEventClick(event, e)}
                onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                onMouseLeave={handleEventMouseLeave}
              >
                <div className="event-title">{event.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="time-slots-container" ref={timeSlotsRef}>
        <div className="time-slots">
          {/* Current Time Indicator */}
          {isToday && (
            <div
              className="current-time-indicator"
              style={{ top: `${(currentHour * 60 + currentMinute)}px` }}
            >
              <div className="current-time-dot"></div>
              <div className="current-time-line"></div>
            </div>
          )}

          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="time-slot-hour">
              <div className="hour-label">
                {hour === 0 ? '12 AM' :
                  hour < 12 ? `${hour} AM` :
                    hour === 12 ? '12 PM' :
                      `${hour - 12} PM`}
              </div>
              <div className="hour-slot">
                <div
                  className="time-slot"
                  onClick={() => handleTimeSlotClick(hour, 0)}
                ></div>
                <div
                  className="time-slot half-hour"
                  onClick={() => handleTimeSlotClick(hour, 30)}
                ></div>
              </div>
            </div>
          ))}

          {/* Render timed events */}
          {renderTimedEvents}
        </div>
      </div>
    </div>
  );
});

// WeekView component - Fixed với synchronized scrolling
const WeekView = React.memo(({
  selectedDate,
  events,
  onDateSelect,
  handleEventClick,
  handleEventMouseEnter,
  handleEventMouseLeave,
  formatTime
}) => {
  const startOfWeek = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return start;
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [startOfWeek]);

  const today = new Date();

  // Refs cho synchronized scrolling
  const timeLabelsRef = useRef(null);
  const contentGridRef = useRef(null);
  const allDayRef = useRef(null);

  // Synchronized scrolling
  useEffect(() => {
    const handleContentScroll = () => {
      if (contentGridRef.current && timeLabelsRef.current) {
        timeLabelsRef.current.scrollTop = contentGridRef.current.scrollTop;
      }
    };

    const handleTimeLabelsScroll = () => {
      if (timeLabelsRef.current && contentGridRef.current) {
        contentGridRef.current.scrollTop = timeLabelsRef.current.scrollTop;
      }
    };

    const contentGrid = contentGridRef.current;
    const timeLabels = timeLabelsRef.current;

    if (contentGrid && timeLabels) {
      contentGrid.addEventListener('scroll', handleContentScroll);
      timeLabels.addEventListener('scroll', handleTimeLabelsScroll);

      return () => {
        contentGrid.removeEventListener('scroll', handleContentScroll);
        timeLabels.removeEventListener('scroll', handleTimeLabelsScroll);
      };
    }
  }, []);

  // Tính toán events cho từng ngày trong tuần
  const weekEvents = useMemo(() => {
    const eventsByDay = {};

    weekDays.forEach((day, index) => {
      eventsByDay[index] = {
        allDay: [],
        timed: []
      };
    });

    events.forEach(event => {
      const eventDate = new Date(event.start);
      const dayIndex = weekDays.findIndex(day =>
        day.toDateString() === eventDate.toDateString()
      );

      if (dayIndex !== -1) {
        if (event.allDay) {
          eventsByDay[dayIndex].allDay.push(event);
        } else {
          eventsByDay[dayIndex].timed.push(event);
        }
      }
    });

    return eventsByDay;
  }, [events, weekDays]);

  return (
    <div className="time-table week-view">
      <div className="calendar-header">
        <div className="date-display">
          <div className="week-range">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –
            {new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="week-grid">
        {/* All day row */}
        <div className="week-all-day-section" ref={allDayRef}>
          <div className="week-all-day-label">All day</div>
          <div className="week-all-day-content">
            {weekDays.map((day, dayIndex) => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div
                  key={dayIndex}
                  className={`week-all-day-cell ${isToday ? 'today' : ''}`}
                  onClick={() => onDateSelect && onDateSelect(day)}
                >
                  {weekEvents[dayIndex]?.allDay.map((event, eventIndex) => (
                    <div
                      key={`${event.id}-all-day`}
                      className="calendar-event week-all-day-event"
                      style={{
                        backgroundColor: event.color,
                        borderLeft: `3px solid ${event.color}`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event, e);
                      }}
                      onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                      onMouseLeave={handleEventMouseLeave}
                    >
                      <div className="event-title">{event.title}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time grid với synchronized scrolling */}
        <div className="week-time-section">
          {/* Time labels - scrollable và sync với content */}
          <div
            className="week-time-labels"
            ref={timeLabelsRef}
          >
            {Array.from({ length: 25 }, (_, hour) => (
              <div key={hour} className="week-time-label">
                {hour === 0 ? '12 AM' :
                  hour < 12 ? `${hour} AM` :
                    hour === 12 ? '12 PM' :
                      `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Content grid - scrollable và sync với time labels */}
          <div
            className="week-days-content"
            ref={contentGridRef}
          >
            <div className="week-days-grid">
              {weekDays.map((day, dayIndex) => {
                const isToday = day.toDateString() === today.toDateString();
                const dayEvents = weekEvents[dayIndex]?.timed || [];

                return (
                  <div
                    key={dayIndex}
                    className={`week-day-column ${isToday ? 'today' : ''}`}
                  >
                    <div
                      className="week-day-header"
                      onClick={() => onDateSelect && onDateSelect(day)}
                    >
                      <div className="week-day-name">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="week-day-number">{day.getDate()}</div>
                    </div>

                    <div className="week-day-time-cells">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const hourEvents = dayEvents.filter(event => {
                          const eventHour = event.start.getHours();
                          const eventEndHour = event.end.getHours();
                          return eventHour <= hour && eventEndHour >= hour;
                        });

                        return (
                          <div
                            key={hour}
                            className="week-time-cell"
                            onClick={() => {
                              const newDate = new Date(day);
                              newDate.setHours(hour, 0, 0, 0);
                              onDateSelect && onDateSelect(newDate);
                            }}
                          >
                            {hourEvents.map((event, eventIndex) => {
                              const eventStartHour = event.start.getHours();
                              const eventStartMinute = event.start.getMinutes();
                              const eventEndHour = event.end.getHours();
                              const eventEndMinute = event.end.getMinutes();

                              const isFirstHour = eventStartHour === hour;
                              const isLastHour = eventEndHour === hour;
                              const duration = eventEndHour - eventStartHour;

                              // Tính toán vị trí và chiều cao
                              const top = isFirstHour ? (eventStartMinute / 60) * 60 : 0;
                              const height = isFirstHour && isLastHour
                                ? ((eventEndMinute - eventStartMinute) / 60) * 60
                                : isFirstHour
                                  ? 60 - top
                                  : isLastHour
                                    ? (eventEndMinute / 60) * 60
                                    : 60;

                              return (
                                <div
                                  key={event.id}
                                  className="calendar-event week-timed-event"
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    backgroundColor: event.color,
                                    borderLeft: `3px solid ${event.color}`
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event, e);
                                  }}
                                  onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                                  onMouseLeave={handleEventMouseLeave}
                                >
                                  {isFirstHour && (
                                    <div className="event-content">
                                      <div className="event-time">
                                        {formatTime(event.start)}
                                      </div>
                                      <div className="event-title">{event.title}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const MonthView = React.memo(({
  selectedDate,
  events,
  onDateSelect,
  handleEventClick,
  handleEventMouseEnter,
  handleEventMouseLeave,
  formatTime
}) => {
  const { calendarGrid } = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay());
    const totalDays = 42;
    const today = new Date();

    const calendarGrid = Array.from({ length: totalDays }, (_, index) => {
      const currentDay = new Date(startDay);
      currentDay.setDate(startDay.getDate() + index);

      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === today.toDateString();
      const isSelected = currentDay.toDateString() === selectedDate.toDateString();

      const dayEvents = events.filter(event =>
        event.start.toDateString() === currentDay.toDateString()
      );

      return {
        date: currentDay,
        isCurrentMonth,
        isToday,
        isSelected,
        dayEvents
      };
    });

    return { calendarGrid };
  }, [selectedDate, events]);

  return (
    <div className="time-table month-view">
      <div className="calendar-header">
        <div className="date-display">
          <div className="month-year">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="month-calendar">
        <div className="month-week-days">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="month-week-day">{day}</div>
          ))}
        </div>

        <div className="month-days-grid">
          {calendarGrid.map((dayInfo, index) => (
            <div
              key={index}
              className={`month-day 
                ${!dayInfo.isCurrentMonth ? 'other-month' : ''} 
                ${dayInfo.isToday ? 'today' : ''} 
                ${dayInfo.isSelected ? 'selected' : ''}`}
              onClick={() => onDateSelect && onDateSelect(dayInfo.date)}
            >
              <div className="month-day-number">
                {dayInfo.date.getDate()}
              </div>
              {dayInfo.dayEvents.length > 0 && (
                <div className="month-day-events">
                  {dayInfo.dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="month-event-indicator"
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => handleEventClick(event, e)}
                      onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                      onMouseLeave={handleEventMouseLeave}
                    >
                      <span className="event-time">
                        {event.allDay ? 'All day' : formatTime(event.start)}
                      </span>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                  {dayInfo.dayEvents.length > 3 && (
                    <div className="more-events">+{dayInfo.dayEvents.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const TimeTable = ({ selectedDate, viewType, onDateSelect }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);

  // States cho event management với pin functionality
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [pinnedEvent, setPinnedEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  // Custom functions cho event management
  const handleEventMouseEnter = useCallback((event, mouseEvent) => {
    if (!pinnedEvent) {
      setHoveredEvent(event);
      setTooltipPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY
      });
    }
  }, [pinnedEvent]);

  const handleEventMouseLeave = useCallback(() => {
    if (!pinnedEvent) {
      setHoveredEvent(null);
    }
  }, [pinnedEvent]);

  const handleEventClick = useCallback((event, mouseEvent) => {
    const isCurrentlyPinned = pinnedEvent && pinnedEvent.id === event.id;

    if (isCurrentlyPinned) {
      setPinnedEvent(null);
      setHoveredEvent(null);
    } else {
      setPinnedEvent(event);
      setHoveredEvent(event);

      if (mouseEvent) {
        setTooltipPosition({
          x: mouseEvent.clientX,
          y: mouseEvent.clientY
        });
      }
    }
  }, [pinnedEvent]);

  const handleClickOutside = useCallback((event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setPinnedEvent(null);
      setHoveredEvent(null);
    }
  }, []);

  const resetEventStates = useCallback(() => {
    setPinnedEvent(null);
    setHoveredEvent(null);
  }, []);

  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock events data với đầy đủ thông tin
  useEffect(() => {
    const generateEvents = () => {
      const baseDate = new Date(selectedDate);
      const events = [];

      // Events for the selected date
      events.push({
        id: 1,
        title: 'Daily Standup',
        start: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 9, 0),
        end: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 9, 30),
        color: '#4285f4',
        calendar: 'Work',
        location: 'Meeting Room A - Floor 3',
        organizer: 'John Doe',
        host: 'Jane Smith',
        attendees: ['Alice Brown', 'Bob Johnson', 'Carol Davis'],
        description: 'Daily team sync meeting to discuss progress and blockers',
        meetingRoom: 'MR-A301',
        building: 'Tech Tower',
        floor: '3'
      });

      events.push({
        id: 2,
        title: 'Lunch with Team',
        start: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0),
        end: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 13, 0),
        color: '#34a853',
        calendar: 'Work',
        location: 'Company Cafeteria',
        organizer: 'Team Lead',
        host: 'Team Lead',
        attendees: ['All Team Members'],
        description: 'Weekly team lunch bonding',
        meetingRoom: 'Cafeteria',
        building: 'Main Building',
        floor: '1'
      });

      events.push({
        id: 3,
        title: 'Client Meeting - Project Alpha',
        start: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 14, 30),
        end: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 15, 30),
        color: '#f9ab00',
        calendar: 'Work',
        location: 'Conference Room B - Floor 5',
        organizer: 'Sales Department',
        host: 'Michael Chen',
        attendees: ['Client: ABC Corp', 'Technical Team', 'Sales Team'],
        description: 'Quarterly review meeting with ABC Corp',
        meetingRoom: 'CR-B501',
        building: 'Business Center',
        floor: '5'
      });

      events.push({
        id: 4,
        title: 'Dentist Appointment',
        start: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 16, 0),
        end: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 17, 0),
        color: '#ea4335',
        calendar: 'Personal',
        location: 'Smile Dental Clinic - 123 Main St',
        organizer: 'Self',
        host: 'Dr. Wilson',
        attendees: ['Patient'],
        description: 'Regular dental checkup',
        meetingRoom: 'Room 5',
        building: 'Smile Dental Building',
        floor: '2'
      });

      events.push({
        id: 5,
        title: 'Project Deadline - Final Delivery',
        start: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0),
        end: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59),
        color: '#4285f4',
        calendar: 'Work',
        location: 'Remote',
        organizer: 'Project Manager',
        host: 'Project Manager',
        attendees: ['Development Team', 'QA Team', 'Design Team'],
        description: 'Final delivery deadline for Project X',
        meetingRoom: 'N/A',
        building: 'Remote',
        floor: 'N/A',
        allDay: true
      });

      return events;
    };

    setEvents(generateEvents());
  }, [selectedDate]);

  // Đóng tooltip khi click outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleTimeSlotClick = useCallback((hour, minute = 0) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, minute, 0, 0);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  }, [selectedDate, onDateSelect]);

  // Format time function
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const formatDateFull = useCallback((date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Tính toán vị trí thông minh để tránh bị che
  const getAdjustedPosition = useCallback((x, y) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 280;
    const tooltipHeight = 300;

    let adjustedX = x + 10;
    let adjustedY = y + 10;

    // Nếu tooltip vượt qua cạnh phải
    if (adjustedX + tooltipWidth > viewportWidth - 20) {
      adjustedX = x - tooltipWidth - 10;
    }

    // Nếu tooltip vượt qua cạnh dưới
    if (adjustedY + tooltipHeight > viewportHeight - 20) {
      adjustedY = y - tooltipHeight - 10;
    }

    return { x: adjustedX, y: adjustedY };
  }, []);

  // Tooltip component với pin functionality
  const EventTooltip = () => {
    const eventToShow = pinnedEvent || hoveredEvent;
    if (!eventToShow) return null;

    const adjustedPos = getAdjustedPosition(tooltipPosition.x, tooltipPosition.y);
    const isPinned = !!pinnedEvent;

    return (
      <div
        ref={tooltipRef}
        className={`event-tooltip ${isPinned ? 'pinned' : ''}`}
        style={{
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`
        }}
      >
        <div className="tooltip-header" style={{ backgroundColor: eventToShow.color }}>
          <div className="tooltip-title">{eventToShow.title}</div>
          <div className="tooltip-meta">
            <span className="tooltip-calendar">{eventToShow.calendar}</span>
            {isPinned && <span className="pin-indicator">📌 Pinned</span>}
          </div>
          {isPinned && (
            <button className="close-tooltip-btn" onClick={resetEventStates}>
              ×
            </button>
          )}
        </div>

        <div className="tooltip-content">
          <div className="tooltip-section">
            <div className="tooltip-time">
              <strong>📅 {formatDateFull(eventToShow.start)}</strong>
            </div>
            <div className="tooltip-time">
              <strong>🕐 {formatTime(eventToShow.start)} - {formatTime(eventToShow.end)}</strong>
            </div>
          </div>

          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">📍</span>
              <span>{eventToShow.location}</span>
            </div>
            {eventToShow.meetingRoom && eventToShow.meetingRoom !== 'N/A' && (
              <div className="tooltip-info compact">
                <span className="tooltip-label">🚪</span>
                <span>{eventToShow.meetingRoom}</span>
              </div>
            )}
          </div>

          <div className="tooltip-section">
            <div className="tooltip-info compact">
              <span className="tooltip-label">👤</span>
              <span>{eventToShow.organizer}</span>
            </div>
            <div className="tooltip-info compact">
              <span className="tooltip-label">🎯</span>
              <span>{eventToShow.host}</span>
            </div>
          </div>

          <div className="tooltip-section">
            <div className="tooltip-info">
              <span className="tooltip-label">👥 ({eventToShow.attendees.length})</span>
              <div className="attendees-list">
                {eventToShow.attendees.slice(0, 3).map((attendee, index) => (
                  <span key={index} className="attendee">• {attendee}</span>
                ))}
                {eventToShow.attendees.length > 3 && (
                  <span className="attendee">+ {eventToShow.attendees.length - 3} more</span>
                )}
              </div>
            </div>
          </div>

          {eventToShow.description && (
            <div className="tooltip-section">
              <div className="tooltip-info">
                <span className="tooltip-label">📝</span>
                <span>{eventToShow.description.length > 100
                  ? `${eventToShow.description.substring(0, 100)}...`
                  : eventToShow.description}</span>
              </div>
            </div>
          )}
        </div>

        {isPinned && (
          <div className="tooltip-footer">
            <button className="tooltip-action-btn">Edit</button>
            <button className="tooltip-action-btn">Delete</button>
            <button className="tooltip-action-btn primary">Join</button>
          </div>
        )}
      </div>
    );
  };

  // Render view với useMemo
  const renderTimeTable = useMemo(() => {
    const commonProps = {
      selectedDate,
      events,
      onDateSelect,
      handleEventClick,
      handleEventMouseEnter,
      handleEventMouseLeave,
      formatTime
    };

    switch (viewType) {
      case 'day':
        return <DayView {...commonProps} currentTime={currentTime} handleTimeSlotClick={handleTimeSlotClick} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'month':
        return <MonthView {...commonProps} />;
      case 'year':
        return <YearView selectedDate={selectedDate} onDateSelect={onDateSelect} />;
      default:
        return <MonthView {...commonProps} />;
    }
  }, [
    viewType,
    selectedDate,
    events,
    currentTime,
    onDateSelect,
    handleEventClick,
    handleEventMouseEnter,
    handleEventMouseLeave,
    handleTimeSlotClick,
    formatTime
  ]);

  return (
    <>
      {renderTimeTable}
      <EventTooltip />
    </>
  );
};

export default TimeTable;