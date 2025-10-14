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
        d.setHours(23, 59, 59, 999);
        return d;
      case 'week':
        d.setDate(d.getDate() + (6 - d.getDay()));
        d.setHours(23, 59, 59, 999);
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
  }
};