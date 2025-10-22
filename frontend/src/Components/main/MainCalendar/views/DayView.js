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
      const startHour = event.start.getHours();
      const startMinute = event.start.getMinutes();
      const endHour = event.end.getHours();
      const endMinute = event.end.getMinutes();
      
      // Calculate total minutes from start of day (00:00)
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const duration = endMinutes - startMinutes;

      // Calculate exact pixel position: 
      // - GMT header offset = 48px (fixed height)
      // - Each hour = 60px (fixed height)
      // - Each minute = 1px
      // Formula: top = GMT_OFFSET + (hours × PIXELS_PER_HOUR) + minutes
      // Example: 9:45 AM = 48 + (9 × 60) + 45 = 633px
      const GMT_OFFSET = 48;
      const PIXELS_PER_HOUR = 60;
      const top = GMT_OFFSET + (startHour * PIXELS_PER_HOUR) + startMinute;
      const height = Math.max(duration, 20); // Minimum 20px for visibility

      return (
        <div
          key={event.id}
          className={`calendar-event timed-event ${(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') ? 'pending-event' : ''}`}
          style={{
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor: event.color,
            borderLeft: `3px solid ${event.color}`,
            opacity: event.opacity || 1
          }}
          onClick={(e) => handleEventClick(event, e)}
          onMouseEnter={(e) => handleEventMouseEnter(event, e)}
          onMouseLeave={handleEventMouseLeave}
        >
          <div className="event-content">
            {duration < 60 ? (
              // Short meeting: single line format "Title (10:00 AM - 11:00 AM)"
              <div className="event-title-inline">
                {event.title}
                {(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') && ' (chờ duyệt ⏳)'}
                {' '}({formatTime(event.start)} - {formatTime(event.end)})
              </div>
            ) : (
              // Long meeting: multi-line format
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
                className={`calendar-event all-day-event ${(event.bookingStatus === 'PENDING' || event.bookingStatus === 'BOOKED') ? 'pending-event' : ''}`}
                style={{
                  backgroundColor: event.color,
                  borderLeft: `3px solid ${event.color}`,
                  opacity: event.opacity || 1
                }}
                onClick={(e) => handleEventClick(event, e)}
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
      )}

      <div className="time-slots-container" ref={timeSlotsRef}>
        <div className="time-slots">
          {/* GMT+7 Label */}
          <div className="time-slot-hour gmt-header">
            <div className="hour-label gmt-label">GMT+7</div>
            <div className="hour-slot gmt-spacer"></div>
          </div>

          {/* Current Time Indicator */}
          {isToday && (
            <div
              className="current-time-indicator"
              style={{ top: `${(currentHour * 60 + currentMinute + 48)}px` }}
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