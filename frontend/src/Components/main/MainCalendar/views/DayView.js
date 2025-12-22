import React, { useRef, useEffect, useMemo, useState } from 'react';
import { CalendarHelpers } from '../utils/CalendarHelpers';

const DayView = React.memo(({
  selectedDate,
  events,
  currentTime,
  onDateSelect,
  handleEventClick,
  handleEventDoubleClick,
  handleEventMouseEnter,
  handleEventMouseLeave,
  handleTimeSlotClick,
  formatTime,
  onSelectionComplete,
  lockedSelection,
  onLockSelection
}) => {
  const today = new Date();
  const isToday = CalendarHelpers.isSameDate(selectedDate, today);
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const timeSlotsRef = useRef(null);
  
  // ✅ NEW: State for drag-to-create selection
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  // ✅ FIX: Filter events cho đúng ngày được select (fix lỗi timezone)
  const dayEvents = useMemo(() => 
    events.filter(event => CalendarHelpers.isEventOnDate(event, selectedDate)),
    [events, selectedDate]
  );

  const allDayEvents = useMemo(() => dayEvents.filter(event => event.allDay), [dayEvents]);
  const timedEvents = useMemo(() => dayEvents.filter(event => !event.allDay), [dayEvents]);

  // ✅ Calculate overlapping events layout (like Google Calendar)
  const getEventLayout = useMemo(() => {
    if (timedEvents.length === 0) return [];
    
    // Sort events by start time, then by duration (longer first)
    const sorted = [...timedEvents].sort((a, b) => {
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
  }, [timedEvents]);

  const renderTimedEvents = useMemo(() => {
    return timedEvents.map(event => {
      const eventLayout = getEventLayout.get(event.id) || { left: 0, width: 100 };
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
      
      // ✅ EXACT height like Google Calendar
      // 1 minute = 1px, minimum 12px for clickability only
      // 5 min → 12px, 10 min → 12px, 15 min → 15px, 30 min → 30px, 60 min → 60px
      const height = Math.max(duration, 12);
      
      // ✅ Position for overlapping events
      // Time labels take 84px, right padding 12px
      const EVENT_AREA_LEFT = 84;
      const EVENT_AREA_RIGHT = 12;

      return (
        <div
          key={`event-${event.id}-timed-${event.start.getTime()}`}
          className={`calendar-event timed-event`}
          style={{
            top: `${top}px`,
            height: `${height}px`,
            left: `calc(${EVENT_AREA_LEFT}px + (100% - ${EVENT_AREA_LEFT + EVENT_AREA_RIGHT}px) * ${eventLayout.left / 100})`,
            width: `calc((100% - ${EVENT_AREA_LEFT + EVENT_AREA_RIGHT}px) * ${eventLayout.width / 100})`,
            backgroundColor: event.color || '#1a73e8',
            borderLeft: `3px solid ${event.color || '#1a73e8'}`
          }}
          onClick={(e) => handleEventClick(event, e)}
          onDoubleClick={(e) => handleEventDoubleClick && handleEventDoubleClick(event, e)}
          onMouseEnter={(e) => handleEventMouseEnter(event, e)}
          onMouseLeave={handleEventMouseLeave}
        >
          <div className="event-content">
            {duration < 30 ? (
              // Very short meeting (< 30 min): compact single line
              <div className="event-title-inline" style={{ fontSize: '12px', lineHeight: '1.3', fontWeight: '600' }}>
                {event.title}
              </div>
            ) : duration < 60 ? (
              // Short meeting (30-60 min): show title + time
              <>
                <div className="event-title" style={{ fontSize: '13px', fontWeight: '600' }}>
                  {event.title}
                </div>
                <div className="event-time" style={{ fontSize: '11px' }}>
                  {formatTime(event.start)} - {formatTime(event.end)}
                </div>
              </>
            ) : (
              // Long meeting (> 60 min): multi-line format with larger text
              <>
                <div className="event-title" style={{ fontSize: '14px', fontWeight: '600' }}>
                  {event.title}
                </div>
                <div className="event-time" style={{ fontSize: '12px' }}>
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

  // ✅ NEW: Helper to convert pixel Y position to Date
  const pixelToTime = (pixelY, container) => {
    if (!container) return null;
    
    const GMT_OFFSET = 48; // Header height
    const PIXELS_PER_HOUR = 60;
    
    // Calculate minutes from top (accounting for GMT header)
    const relativeY = Math.max(0, pixelY - GMT_OFFSET);
    const totalMinutes = Math.round(relativeY); // Round to nearest minute
    
    // Calculate hour and minute
    const hour = Math.floor(totalMinutes / PIXELS_PER_HOUR);
    const minute = totalMinutes % PIXELS_PER_HOUR;
    
    // Validate hour (0-23)
    if (hour < 0 || hour > 23) return null;
    
    // Create date with selected time
    const date = new Date(selectedDate);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // ✅ NEW: Handle mouse down on time slot
  const handleSlotMouseDown = (e) => {
    if (!timeSlotsRef.current) return;
    if (e.target.closest('.calendar-event')) {
      return;
    }
    if (onLockSelection) {
      onLockSelection(null);
    }
    
    // Get position relative to the scrollable container
    const container = timeSlotsRef.current;
    const rect = container.getBoundingClientRect();
    const pixelY = e.clientY - rect.top + container.scrollTop;
    
    const startTime = pixelToTime(pixelY, container);
    if (!startTime) return;
    
    setSelectionStart(startTime);
    setSelectionEnd(startTime);
  };

  // ✅ NEW: Handle mouse move during drag
  const handleSlotMouseMove = (e) => {
    if (!selectionStart || !timeSlotsRef.current) return;
    
    // Get position relative to the scrollable container
    const container = timeSlotsRef.current;
    const rect = container.getBoundingClientRect();
    const pixelY = e.clientY - rect.top + container.scrollTop;
    
    const endTime = pixelToTime(pixelY, container);
    if (endTime) {
      setSelectionEnd(endTime);
    }
  };

  // ✅ NEW: Handle mouse up (selection complete)
  const handleSlotMouseUp = () => {
    if (selectionStart && selectionEnd) {
      const start = new Date(Math.min(selectionStart.getTime(), selectionEnd.getTime()));
      const end = new Date(Math.max(selectionStart.getTime(), selectionEnd.getTime()));
      
      // Ensure at least 15 minutes duration
      if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
        end.setTime(start.getTime() + 15 * 60 * 1000);
      }
      
      if (onLockSelection) {
        onLockSelection({ start, end });
      }

      if (onSelectionComplete) {
        onSelectionComplete({ start, end });
      }
    }
    
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // ✅ NEW: Add mouse event listeners for drag-to-select
  useEffect(() => {
    const timeSlots = timeSlotsRef.current;
    if (!timeSlots) return;

    timeSlots.addEventListener('mousedown', handleSlotMouseDown);
    document.addEventListener('mousemove', handleSlotMouseMove);
    document.addEventListener('mouseup', handleSlotMouseUp);

    return () => {
      timeSlots.removeEventListener('mousedown', handleSlotMouseDown);
      document.removeEventListener('mousemove', handleSlotMouseMove);
      document.removeEventListener('mouseup', handleSlotMouseUp);
    };
  }, [selectionStart, selectionEnd]);

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
            {allDayEvents.map((event, index) => (
              <div
                key={`event-${event.id}-all-day-${index}-${event.start.getTime()}`}
                className={`calendar-event all-day-event`}
                style={{
                  backgroundColor: event.color,
                  borderLeft: `3px solid ${event.color}`
                }}
                onClick={(e) => handleEventClick(event, e)}
                onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                onMouseLeave={handleEventMouseLeave}
              >
                <div className="event-title">
                  {event.title}
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

          {/* ✅ NEW: Selection indicator (highlight during drag) */}
          {selectionStart && selectionEnd && (
            <div
              className="time-slot-selection"
              style={{
                top: `${48 + Math.min(selectionStart.getHours() * 60 + selectionStart.getMinutes(), selectionEnd.getHours() * 60 + selectionEnd.getMinutes())}px`,
                height: `${Math.max(Math.abs((selectionEnd.getTime() - selectionStart.getTime()) / (1000 * 60)), 12)}px`,
                left: '84px',
                right: '12px',
                backgroundColor: 'rgba(66, 133, 244, 0.2)',
                border: '2px solid #4285f4',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 3,
                position: 'absolute'
              }}
            >
              <div className="selection-time-info" style={{
                position: 'absolute',
                top: '4px',
                left: '6px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#4285f4',
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '2px'
              }}>
                {formatTime(selectionStart <= selectionEnd ? selectionStart : selectionEnd)} - {formatTime(selectionEnd >= selectionStart ? selectionEnd : selectionStart)}
              </div>
            </div>
          )}

          {/* Locked selection (after mouse up) */}
          {!selectionStart && !selectionEnd && lockedSelection && CalendarHelpers.isEventOnDate(
            {
              start: lockedSelection.start,
              end: lockedSelection.end
            },
            selectedDate
          ) && (
            <div
              className="time-slot-selection"
              style={{
                top: `${48 + (lockedSelection.start.getHours() * 60 + lockedSelection.start.getMinutes())}px`,
                height: `${Math.max(
                  (lockedSelection.end.getTime() - lockedSelection.start.getTime()) / (1000 * 60),
                  12
                )}px`,
                left: '84px',
                right: '12px',
                backgroundColor: 'rgba(66, 133, 244, 0.2)',
                border: '2px solid #4285f4',
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 3,
                position: 'absolute'
              }}
            >
              <div className="selection-time-info" style={{
                position: 'absolute',
                top: '4px',
                left: '6px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#4285f4',
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '2px'
              }}>
                {formatTime(lockedSelection.start)} - {formatTime(lockedSelection.end)}
              </div>
            </div>
          )}

          {/* Render timed events */}
          {renderTimedEvents}
        </div>
      </div>
    </div>
  );
});

export default DayView;