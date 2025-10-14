import React from 'react';

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

export default YearView;