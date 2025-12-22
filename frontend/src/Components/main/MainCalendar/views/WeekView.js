import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { CalendarHelpers } from '../utils/CalendarHelpers';

const WeekView = React.memo(({
  selectedDate,
  events,
  onDateSelect,
  handleEventClick,
  handleEventDoubleClick,
  handleEventMouseEnter,
  handleEventMouseLeave,
  formatTime,
  currentTime, // <-- THÊM currentTime VÀO ĐÂY
  onSelectionComplete,
  lockedSelection,
  onLockSelection
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

  // Refs cho synchronized scrolling
  const timeLabelsRef = useRef(null);
  const contentGridRef = useRef(null);
  const columnRefs = useRef([]);
  const [selection, setSelection] = useState(null); // { startDate, endDate, startDayIndex }
  const isSelectingRef = useRef(false);
  const startDayIndexRef = useRef(null);
  const selectionRef = useRef(null);
  const onSelectionCompleteRef = useRef(onSelectionComplete);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    onSelectionCompleteRef.current = onSelectionComplete;
  }, [onSelectionComplete]);
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
    console.log('📅 WeekView: Calculating weekEvents', {
      eventsCount: events?.length || 0,
      weekDays: weekDays.map(d => d.toISOString().split('T')[0])
    });

    // ✅ Log events structure
    if (events && events.length > 0) {
      console.log('📋 WeekView: Events received', events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start?.toISOString(),
        end: e.end?.toISOString(),
        allDay: e.allDay
      })));
    } else {
      console.warn('⚠️ WeekView: No events received!', { events });
    }

    const eventsByDay = {};

    weekDays.forEach((day, index) => {
      eventsByDay[index] = {
        allDay: [],
        timed: []
      };
    });

    events.forEach((event, eventIndex) => {
      // ✅ FIX: Sử dụng helper để check event thuộc ngày nào (fix lỗi timezone)
      const dayIndex = weekDays.findIndex(day => 
        CalendarHelpers.isEventOnDate(event, day)
      );

      if (dayIndex !== -1) {
        if (event.allDay) {
          eventsByDay[dayIndex].allDay.push(event);
          console.log(`✅ WeekView: Event "${event.title}" added to day ${dayIndex} (all-day)`);
} else {
          eventsByDay[dayIndex].timed.push(event);
          console.log(`✅ WeekView: Event "${event.title}" added to day ${dayIndex} (timed)`, {
            start: event.start?.toISOString(),
            end: event.end?.toISOString()
          });
        }
      } else {
        console.log(`❌ WeekView: Event "${event.title}" not matched to any day`, {
          eventStart: event.start?.toISOString(),
          eventEnd: event.end?.toISOString(),
          weekDays: weekDays.map(d => d.toISOString().split('T')[0])
        });
      }
    });

    // ✅ Log final weekEvents structure
    console.log('📊 WeekView: Final weekEvents distribution', {
      totalEvents: events.length,
      byDay: Object.keys(eventsByDay).map(dayIndex => ({
        day: weekDays[parseInt(dayIndex)].toISOString().split('T')[0],
        allDay: eventsByDay[dayIndex].allDay.length,
        timed: eventsByDay[dayIndex].timed.length
      }))
    });

    return eventsByDay;
  }, [events, weekDays]);

  const pixelToDate = useCallback((day, pixelY) => {
    const PIXELS_PER_HOUR = 60;
    const totalMinutes = Math.min(Math.max(Math.round(pixelY), 0), 24 * 60 - 1);
    const hour = Math.floor(totalMinutes / PIXELS_PER_HOUR);
    const minute = totalMinutes % PIXELS_PER_HOUR;
    const date = new Date(day);
    date.setHours(hour, minute, 0, 0);
    return date;
  }, []);

  const getPixelPosition = useCallback((event) => {
    const container = contentGridRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return event.clientY - rect.top + container.scrollTop;
  }, []);

  const getDayIndexFromEvent = useCallback((event) => {
    if (!columnRefs.current) return -1;
    return columnRefs.current.findIndex((col) => {
      if (!col) return false;
      const rect = col.getBoundingClientRect();
      return event.clientX >= rect.left && event.clientX <= rect.right;
    });
  }, []);

  const handleColumnMouseDown = useCallback((dayIndex, day, event) => {
    if (event.target.closest('.calendar-event')) {
      return;
    }
    if (onLockSelection) {
      onLockSelection(null);
    }
    const pixelY = getPixelPosition(event);
    if (pixelY == null) return;
    const startDate = pixelToDate(day, pixelY);
    if (!startDate) return;
    isSelectingRef.current = true;
    startDayIndexRef.current = dayIndex;
    setSelection({
      startDayIndex: dayIndex,
      startDate,
      endDate: startDate
    });
  }, [getPixelPosition, pixelToDate, onLockSelection]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isSelectingRef.current) return;
      const startIndex = startDayIndexRef.current;
      if (startIndex == null) return;

      const columnIndex = getDayIndexFromEvent(event);
      if (columnIndex !== startIndex) {
        return;
      }

      const pixelY = getPixelPosition(event);
      if (pixelY == null) return;

      const day = weekDays[startIndex];
      if (!day) return;
const endDate = pixelToDate(day, pixelY);
      if (!endDate) return;

      setSelection(prev => prev ? { ...prev, endDate } : prev);
    };

    const handleMouseUp = () => {
      if (!isSelectingRef.current) return;
      isSelectingRef.current = false;
      const currentSelection = selectionRef.current;
      const startIndex = startDayIndexRef.current;
      startDayIndexRef.current = null;

      if (!currentSelection || startIndex == null) {
        setSelection(null);
        return;
      }

      const start = new Date(Math.min(currentSelection.startDate.getTime(), currentSelection.endDate.getTime()));
      const end = new Date(Math.max(currentSelection.startDate.getTime(), currentSelection.endDate.getTime()));
      if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
        end.setTime(start.getTime() + 15 * 60 * 1000);
      }

      if (onLockSelection) {
        onLockSelection({ start, end });
      }

      if (onSelectionCompleteRef.current) {
        onSelectionCompleteRef.current({ start, end });
      }

      setSelection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getDayIndexFromEvent, getPixelPosition, pixelToDate, weekDays, onLockSelection]);

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
                        key={`event-${event.id}-all-day-${dayIndex}-${eventIndex}`}
                        className={`calendar-event week-all-day-event`}
                        style={{
                          backgroundColor: event.color,
                          borderLeft: `3px solid ${event.color}`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event, e);
                        }}
                        onDoubleClick={(e) => handleEventDoubleClick && handleEventDoubleClick(event, e)}
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
                    ref={(el) => { columnRefs.current[dayIndex] = el; }}
                  >
                    <div
                      className="week-day-time-cells"
                      onMouseDown={(e) => handleColumnMouseDown(dayIndex, day, e)}
style={{ position: 'relative' }}
                    >
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
                      
                      {selection && selection.startDayIndex === dayIndex && (
                        <div
                          className="week-selection-overlay"
                          style={{
                            position: 'absolute',
                            top: `${Math.min(
                              selection.startDate.getHours() * 60 + selection.startDate.getMinutes(),
                              selection.endDate.getHours() * 60 + selection.endDate.getMinutes()
                            )}px`,
                            height: `${Math.max(
                              Math.abs(
                                (selection.endDate.getTime() - selection.startDate.getTime()) / (1000 * 60)
                              ),
                              12
                            )}px`,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(66, 133, 244, 0.2)',
                            border: '2px solid #4285f4',
                            borderRadius: '4px',
                            pointerEvents: 'none',
                            zIndex: 2
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '4px',
                              left: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#4285f4',
                              backgroundColor: 'white',
                              padding: '2px 4px',
                              borderRadius: '2px'
                            }}
                          >
                            {formatTime(selection.startDate <= selection.endDate ? selection.startDate : selection.endDate)}
                            {' — '}
                            {formatTime(selection.endDate >= selection.startDate ? selection.endDate : selection.startDate)}
                          </div>
                        </div>
                      )}

                      {!selection && lockedSelection && CalendarHelpers.isEventOnDate(
                        {
                          start: lockedSelection.start,
end: lockedSelection.end
                        },
                        day
                      ) && (
                        <div
                          className="week-selection-overlay"
                          style={{
                            position: 'absolute',
                            top: `${lockedSelection.start.getHours() * 60 + lockedSelection.start.getMinutes()}px`,
                            height: `${Math.max(
                              (lockedSelection.end.getTime() - lockedSelection.start.getTime()) / (1000 * 60),
                              12
                            )}px`,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(66, 133, 244, 0.2)',
                            border: '2px solid #4285f4',
                            borderRadius: '4px',
                            pointerEvents: 'none',
                            zIndex: 2
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '4px',
                              left: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#4285f4',
                              backgroundColor: 'white',
                              padding: '2px 4px',
                              borderRadius: '2px'
                            }}
                          >
                            {formatTime(lockedSelection.start)} — {formatTime(lockedSelection.end)}
                          </div>
                        </div>
                      )}
                      
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
                            key={`event-${event.id}-${dayIndex}-${event.start.getTime()}`}
                            className={`calendar-event week-timed-event`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `${layout.left}%`,
                              width: `${layout.width}%`,
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
                                  {' '}({formatTime(event.start)} - {formatTime(event.end)})
                                </div>
                              ) : (
                                // Long meeting (> 60 min): multi-line
                                <>
                                  <div className="event-title">
                                    {event.title}
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