import React, { useMemo } from 'react';
import { CalendarHelpers } from '../utils/CalendarHelpers';

const MonthView = React.memo(({
  selectedDate,
  events,
  onDateSelect,
  handleEventClick,
  handleEventDoubleClick,
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
      const isToday = CalendarHelpers.isSameDate(currentDay, today);
      const isSelected = CalendarHelpers.isSameDate(currentDay, selectedDate);

      // ✅ FIX: Sử dụng isEventOnDate để check chính xác, tránh lỗi timezone
      const dayEvents = events.filter(event =>
        CalendarHelpers.isEventOnDate(event, currentDay)
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
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={index} className="month-week-day">{day}</div>
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
                      onDoubleClick={(e) => handleEventDoubleClick && handleEventDoubleClick(event, e)}
                      onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                      onMouseLeave={handleEventMouseLeave}
                    >
                      <span className="event-time">
                        {event.allDay ? 'All day' : formatTime(event.start)}
                      </span>
                      <span className="event-title">
                        {event.title}
                      </span>
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

export default MonthView;