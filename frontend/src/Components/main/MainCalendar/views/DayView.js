import React, { useRef, useEffect, useMemo } from 'react';

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

export default DayView;