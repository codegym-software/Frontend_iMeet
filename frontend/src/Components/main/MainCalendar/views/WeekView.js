import React, { useRef, useEffect, useMemo } from 'react';

const WeekView = React.memo(({
  selectedDate,
  events,
  onDateSelect,
  handleEventClick,
  handleEventMouseEnter,
  handleEventMouseLeave,
  formatTime,
  currentTime // <-- THÊM currentTime VÀO ĐÂY
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

  // Xử lý an toàn khi currentTime là undefined
  const safeCurrentTime = currentTime || new Date();

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
      // Ensure event.start is a Date object
      const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
      
      // Compare dates by setting time to midnight for accurate day matching
      const eventDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      
      const dayIndex = weekDays.findIndex(day => {
        const dayDateOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        return dayDateOnly.getTime() === eventDateOnly.getTime();
      });

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
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {' '}
            {new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="week-grid">
        {/* Day Headers - Fixed at top */}
        <div className="week-day-headers-row">
          <div className="week-time-label-spacer"></div>
          <div className="week-day-headers-grid">
            {weekDays.map((day, dayIndex) => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div
                  key={dayIndex}
                  className={`week-day-header ${isToday ? 'today' : ''}`}
                  onClick={() => onDateSelect && onDateSelect(day)}
                >
                  <div className="week-day-name">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="week-day-number">{day.getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All day row */}
        <div className="week-all-day-section" ref={allDayRef}>
          <div className="week-all-day-label">
            <div>All day</div>
            <div className="gmt-label-small">GMT+7</div>
          </div>
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
                      className={`calendar-event week-all-day-event ${(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') ? 'pending-event' : ''}`}
                      style={{
                        backgroundColor: event.color,
                        borderLeft: `3px solid ${event.color}`,
                        opacity: event.opacity || 1
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event, e);
                      }}
                      onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                      onMouseLeave={handleEventMouseLeave}
                    >
                      <div className="event-title">
                        {event.title}
                        {(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') && ' (chờ duyệt ⏳)'}
                      </div>
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
          <div className="week-time-labels" ref={timeLabelsRef}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="week-time-label">
                {hour === 0 ? '12 AM' : 
                 hour < 12 ? `${hour} AM` : 
                 hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Content grid - scrollable và sync với time labels */}
          <div className="week-days-content" ref={contentGridRef}>
            <div className="week-days-grid">
              {weekDays.map((day, dayIndex) => {
                const isToday = day.toDateString() === today.toDateString();
                const dayEvents = weekEvents[dayIndex]?.timed || [];

                return (
                  <div
                    key={dayIndex}
                    className={`week-day-column ${isToday ? 'today' : ''}`}
                  >
                    <div className="week-day-time-cells">
                      {/* Render hour cells for clicking */}
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div
                          key={hour}
                          className="week-time-cell"
                          onClick={() => {
                            const newDate = new Date(day);
                            newDate.setHours(hour, 0, 0, 0);
                            onDateSelect && onDateSelect(newDate);
                          }}
                        />
                      ))}
                      
                      {/* Render all events with absolute positioning */}
                      {dayEvents.map((event) => {
                        const startHour = event.start.getHours();
                        const startMinute = event.start.getMinutes();
                        const endHour = event.end.getHours();
                        const endMinute = event.end.getMinutes();
                        
                        // Calculate total minutes from start of day (00:00)
                        const startMinutes = startHour * 60 + startMinute;
                        const endMinutes = endHour * 60 + endMinute;
                        const duration = endMinutes - startMinutes;

                        // Calculate exact pixel position:
                        // - No GMT header in week view
                        // - Each hour = 60px (fixed height)
                        // - Each minute = 1px
                        // Formula: top = (hours × PIXELS_PER_HOUR) + minutes
                        // Example: 9:45 AM = (9 × 60) + 45 = 585px
                        const PIXELS_PER_HOUR = 60;
                        const top = (startHour * PIXELS_PER_HOUR) + startMinute;
                        const height = Math.max(duration, 20); // Minimum 20px for visibility

                        return (
                          <div
                            key={event.id}
                            className={`calendar-event week-timed-event ${(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') ? 'pending-event' : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: event.color,
                              borderLeft: `3px solid ${event.color}`,
                              opacity: event.opacity || 1
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event, e);
                            }}
                            onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                            onMouseLeave={handleEventMouseLeave}
                          >
                            <div className="event-content">
                              {duration < 60 ? (
                                // Short meeting: single line
                                <div className="event-title-inline">
                                  {event.title}
                                  {(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') && ' (chờ duyệt ⏳)'}
                                  {' '}({formatTime(event.start)} - {formatTime(event.end)})
                                </div>
                              ) : (
                                // Long meeting: multi-line
                                <>
                                  <div className="event-title">
                                    {event.title}
                                    {(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') && ' (chờ duyệt ⏳)'}
                                  </div>
                                  <div className="event-time">
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                  </div>
                                </>
                              )}
                            </div>
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

export default WeekView;