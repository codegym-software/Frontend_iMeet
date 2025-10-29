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
  // ✅ Calculate overlapping events layout for a list of events (like Google Calendar)
  const calculateEventLayout = (dayEvents) => {
    if (dayEvents.length === 0) return new Map();
    
    // Sort events by start time, then by duration (longer first)
    const sorted = [...dayEvents].sort((a, b) => {
      const diff = a.start.getTime() - b.start.getTime();
      if (diff !== 0) return diff;
      return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime());
    });
    
    // Find overlapping groups
    const columns = [];
    
    sorted.forEach(event => {
      // Find a column where this event doesn't overlap with existing events
      let placed = false;
      for (let col of columns) {
        const lastEvent = col[col.length - 1];
        // Check if event starts after or at the time last event in this column ends
        if (event.start.getTime() >= lastEvent.end.getTime()) {
          col.push(event);
          placed = true;
          break;
        }
      }
      
      // If no suitable column found, create new column
      if (!placed) {
        columns.push([event]);
      }
    });
    
    // Calculate layout for each event
    const layout = new Map();
    const totalColumns = columns.length;
    
    sorted.forEach(event => {
      // Find which column this event is in
      let columnIndex = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].includes(event)) {
          columnIndex = i;
          break;
        }
      }
      
      // Calculate how many columns this event overlaps with
      let colspan = 1;
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      
      // Check if we can expand this event to occupy empty columns
      for (let i = columnIndex + 1; i < totalColumns; i++) {
        const hasOverlap = columns[i].some(e => {
          return !(e.end.getTime() <= eventStart || e.start.getTime() >= eventEnd);
        });
        if (!hasOverlap) {
          colspan++;
        } else {
          break;
        }
      }
      
      layout.set(event.id, {
        left: (columnIndex / totalColumns) * 100,
        width: (colspan / totalColumns) * 100
      });
    });
    
    return layout;
  };

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
  // const allDayRef = useRef(null); // ✅ No longer needed with new layout

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
        {/* Combined Header + All Day Section */}
        <div className="week-header-and-allday-combined">
          {/* Left column: All day label */}
          <div className="week-all-day-label">
            <div>All day</div>
            <div className="gmt-label-small">GMT+7</div>
          </div>
          
          {/* Right columns: Day headers with all-day cells */}
          <div className="week-day-columns-grid">
            {weekDays.map((day, dayIndex) => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={dayIndex} className="week-day-column-combined">
                  {/* Day header */}
                  <div
                    className={`week-day-header ${isToday ? 'today' : ''}`}
                    onClick={() => onDateSelect && onDateSelect(day)}
                  >
                    <div className="week-day-name">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="week-day-number">{day.getDate()}</div>
                  </div>
                  
                  {/* All-day cell for this day */}
                  <div
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
                
                // ✅ Calculate layout for overlapping events
                const eventLayout = calculateEventLayout(dayEvents);

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
                        const layout = eventLayout.get(event.id) || { left: 0, width: 100 };
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
                        
                        // ✅ EXACT height like Google Calendar
                        // 1 minute = 1px, minimum 12px for clickability only
                        // 5 min → 12px, 10 min → 12px, 15 min → 15px, 30 min → 30px, 60 min → 60px
                        const height = Math.max(duration, 12);

                        return (
                          <div
                            key={event.id}
                            className={`calendar-event week-timed-event ${(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') ? 'pending-event' : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `${layout.left}%`,
                              width: `${layout.width}%`,
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
                              {duration < 30 ? (
                                // Very short meeting (< 30 min): compact single line
                                <div className="event-title-inline" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                                  {event.title} ({formatTime(event.start)} - {formatTime(event.end)})
                                </div>
                              ) : duration < 60 ? (
                                // Short meeting (30-60 min): single line with full info
                                <div className="event-title-inline">
                                  {event.title}
                                  {(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') && ' (chờ duyệt ⏳)'}
                                  {' '}({formatTime(event.start)} - {formatTime(event.end)})
                                </div>
                              ) : (
                                // Long meeting (> 60 min): multi-line
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