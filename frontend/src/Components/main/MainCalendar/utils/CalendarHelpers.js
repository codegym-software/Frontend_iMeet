// Helper functions
export const CalendarHelpers = {
  getStartDateForView(date, view) {
    const d = new Date(date);
    // ✅ Normalize to local timezone to avoid timezone issues
    d.setHours(0, 0, 0, 0);
    
    switch (view) {
      case 'day':
        return d;
      case 'week':
        // Get start of week (Sunday = 0)
        const dayOfWeek = d.getDay();
        d.setDate(d.getDate() - dayOfWeek);
        return d;
      case 'month':
        // ✅ FIX: Return start of calendar grid (Sunday of week containing 1st of month)
        // This matches MonthView which shows 42 days starting from this date
        d.setDate(1);
        const firstDayOfMonth = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        d.setDate(d.getDate() - firstDayOfMonth); // Go back to Sunday
        return d;
      case 'year':
        d.setMonth(0, 1);
        return d;
      default:
        return d;
    }
  },

  getEndDateForView(date, view) {
    const d = new Date(date);
    // ✅ Normalize to local timezone to avoid timezone issues
    d.setHours(23, 59, 59, 999);
    
    switch (view) {
      case 'day':
        return d;
      case 'week':
        // Get end of week (Saturday)
        const dayOfWeek = d.getDay();
        d.setDate(d.getDate() + (6 - dayOfWeek));
        return d;
      case 'month':
        // ✅ FIX: Return end of calendar grid (42 days from start, which is Saturday of week containing last day)
        // This matches MonthView which shows 42 days
        d.setMonth(d.getMonth() + 1, 0); // Last day of current month
        const lastDayOfMonth = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToAdd = 6 - lastDayOfMonth; // Days to add to reach Saturday (end of week)
        d.setDate(d.getDate() + daysToAdd); // Go forward to Saturday
        return d;
      case 'year':
        d.setMonth(11, 31); // December 31
        return d;
      default:
        return d;
    }
  },

  getEventColor(type) {
    const colors = {
      meeting: '#4285f4',
      personal: '#34a853',
      appointment: '#f9ab00',
      deadline: '#ea4335',
      work: '#4285f4',
      default: '#5f6368'
    };
    return colors[type] || colors.default;
  },

  formatEventFromAPI(apiEvent) {
    return {
      id: apiEvent.id,
      title: apiEvent.title,
      start: new Date(apiEvent.startTime),
      end: new Date(apiEvent.endTime),
      color: this.getEventColor(apiEvent.type),
      calendar: apiEvent.calendarType || 'Personal',
      location: apiEvent.location || '',
      organizer: apiEvent.organizerName || '',
      host: apiEvent.hostName || '',
      attendees: apiEvent.participants || [],
      description: apiEvent.description || '',
      meetingRoom: apiEvent.roomNumber || '',
      building: apiEvent.buildingName || '',
      floor: apiEvent.floorLevel || '',
      allDay: apiEvent.isAllDay || false,
      type: apiEvent.type || 'default'
    };
  },

  formatEventForAPI(eventData) {
    return {
      title: eventData.title,
      startTime: eventData.start.toISOString(),
      endTime: eventData.end.toISOString(),
      type: eventData.type || 'meeting',
      calendarType: eventData.calendar || 'Personal',
      location: eventData.location,
      organizerName: eventData.organizer,
      hostName: eventData.host,
      participants: eventData.attendees,
      description: eventData.description,
      roomNumber: eventData.meetingRoom,
      buildingName: eventData.building,
      floorLevel: eventData.floor,
      isAllDay: eventData.allDay || false
    };
  },

  /**
   * So sánh 2 dates có cùng ngày không (bỏ qua timezone, hour, minute, second)
   * Fix lỗi: meeting ngày 29 hiển thị ở ngày khác do timezone
   * @param {Date} date1 
   * @param {Date} date2 
   * @returns {boolean}
   */
  isSameDate(date1, date2) {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },

  /**
   * Kiểm tra xem event có thuộc ngày cụ thể không
   * Xử lý cả single-day và multi-day events
   * @param {Object} event - Event object với start và end properties
   * @param {Date} date - Ngày cần check
   * @returns {boolean}
   */
  isEventOnDate(event, date) {
    if (!event || !event.start || !date) return false;
    
    // Normalize dates to midnight for comparison
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Check if event overlaps with the given date
    // Event is on this date if:
    // - Event starts on this date, OR
    // - Event ends on this date, OR
    // - Event spans across this date (starts before and ends after)
    return eventStart <= dateEnd && eventEnd >= dateStart;
  }
};