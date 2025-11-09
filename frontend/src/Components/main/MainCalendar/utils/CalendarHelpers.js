// Helper functions
export const CalendarHelpers = {
  getStartDateForView(date, view) {
    const d = new Date(date);
    switch (view) {
      case 'day':
        d.setHours(0, 0, 0, 0);
        return d;
      case 'week':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return d;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      case 'year':
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return d;
      default:
        return d;
    }
  },

  getEndDateForView(date, view) {
    const d = new Date(date);
    switch (view) {
      case 'day':
        // ✅ Set to end of day + 1 hour to include events ending at 10PM (22:00) or later
        d.setHours(23, 59, 59, 999);
        // Add 1 hour buffer to ensure events ending at 10PM+ are included
        d.setTime(d.getTime() + 60 * 60 * 1000);
        return d;
      case 'week':
        d.setDate(d.getDate() + (6 - d.getDay()));
        d.setHours(23, 59, 59, 999);
        // Add 1 hour buffer
        d.setTime(d.getTime() + 60 * 60 * 1000);
        return d;
      case 'month':
        d.setMonth(d.getMonth() + 1, 0);
        d.setHours(23, 59, 59, 999);
        return d;
      case 'year':
        d.setMonth(11, 31);
        d.setHours(23, 59, 59, 999);
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
   * ✅ FIX: Improved timezone handling for events at 9PM-10PM
   * @param {Object} event - Event object với start và end properties
   * @param {Date} date - Ngày cần check
   * @returns {boolean}
   */
  isEventOnDate(event, date) {
    if (!event || !event.start || !date) return false;
    
    // Normalize dates to midnight for comparison (local time, no timezone conversion)
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    // ✅ Parse event dates correctly - use local timezone
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Check if event overlaps with the given date
    // Event is on this date if:
    // - Event starts on this date, OR
    // - Event ends on this date, OR
    // - Event spans across this date (starts before and ends after)
    const overlaps = eventStart <= dateEnd && eventEnd >= dateStart;
    
    return overlaps;
  }
};