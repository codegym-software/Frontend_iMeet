import React, { useState, useEffect, useMemo } from 'react';
import './ScheduleView.css';
import EditMeetingForm from '../EditMeetingForm';
import { useMeetings } from '../../../contexts/MeetingContext';

const ScheduleView = ({ selectedDate, onMeetingUpdated, refreshTrigger }) => {
  // Sử dụng data từ MeetingContext thay vì gọi API riêng
  const { meetings: allMeetings, isDataLoaded } = useMeetings();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  // Generate Vietnamese holidays for any year
  const generateHolidaysForYear = (year) => {
    return [
      { date: `${year}-01-01`, name: 'Tết Dương lịch', type: 'public' },
      // Note: Tết Nguyên Đán dates vary by lunar calendar, these are approximate
      { date: `${year}-04-30`, name: 'Ngày Giải phóng miền Nam', type: 'public' },
      { date: `${year}-05-01`, name: 'Ngày Quốc tế Lao động', type: 'public' },
      { date: `${year}-09-02`, name: 'Ngày Quốc khánh', type: 'public' },
      { date: `${year}-02-14`, name: 'Lễ Tình nhân (Valentine)', type: 'festival' },
      { date: `${year}-03-08`, name: 'Ngày Quốc tế Phụ nữ', type: 'festival' },
      { date: `${year}-06-01`, name: 'Ngày Quốc tế Thiếu nhi', type: 'festival' },
      { date: `${year}-10-20`, name: 'Ngày Phụ nữ Việt Nam', type: 'festival' },
      { date: `${year}-11-20`, name: 'Ngày Nhà giáo Việt Nam', type: 'festival' },
      { date: `${year}-12-24`, name: 'Lễ Giáng sinh (Christmas Eve)', type: 'festival' },
      { date: `${year}-12-25`, name: 'Lễ Giáng sinh (Christmas)', type: 'festival' }
    ];
  };

  // Generate holidays for view year
  const generateHolidaysForSelectedYear = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate holidays for view year
    const yearHolidays = generateHolidaysForYear(viewYear);
    
    // Filter only upcoming holidays (from today onwards)
    return yearHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= today;
    });
  };

  // Filter meetings từ MeetingContext theo viewYear
  const meetings = useMemo(() => {
    if (!isDataLoaded || !allMeetings || allMeetings.length === 0) {
      return [];
    }
    
    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('oauth2User') || '{}');
    const currentUserId = currentUser.userId || currentUser.id;
    
    // Filter meetings theo năm và user
    return allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime || meeting.start);
      const meetingYear = meetingDate.getFullYear();
      const meetingUserId = meeting.userId || meeting.user?.id || meeting.user?.userId;
      
      // Lọc theo năm view và user
      return meetingYear === viewYear && 
             (String(meetingUserId) === String(currentUserId) || meeting.groupId);
    });
  }, [allMeetings, isDataLoaded, viewYear]);

  useEffect(() => {
    loadHolidays();
  }, [viewYear, refreshTrigger]);

  // Update viewYear when selectedDate changes
  useEffect(() => {
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const handlePreviousYear = () => {
    setViewYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setViewYear(prev => prev + 1);
  };

  const handleCurrentYear = () => {
    setViewYear(new Date().getFullYear());
  };

  // Debug: Log meetings structure
  useEffect(() => {
    if (isDataLoaded) {
      console.log('=== Schedule Debug ===');
      console.log('View year:', viewYear);
      console.log('Total meetings from context:', allMeetings?.length || 0);
      console.log('Filtered meetings for year:', meetings.length);
      
      // Debug: Log first meeting to see structure
      if (meetings.length > 0) {
        console.log('Sample meeting:', meetings[0]);
      }
    }
  }, [isDataLoaded, viewYear, meetings, allMeetings]);
  
  // Filter meetings: Show user's meetings that are:
  // 1. Not cancelled
  // 2. In the selected year
  // 3. Upcoming (hasn't ended yet)
  const filteredMeetings = useMemo(() => {
    if (!meetings || meetings.length === 0) return [];
    
    const now = new Date();
    
    return meetings.filter(meeting => {
      const isNotCancelled = meeting.bookingStatus?.toUpperCase() !== 'CANCELLED';
      
      const meetingStartTime = new Date(meeting.startTime || meeting.start);
      const meetingEndTime = new Date(meeting.endTime || meeting.end);
      const meetingYear = meetingStartTime.getFullYear();
      
      // Check if meeting is in view year
      const isInViewYear = meetingYear === viewYear;
      
      // Check if meeting is upcoming (hasn't ended yet)
      const isUpcoming = meetingEndTime >= now;
      
      // Show all meetings in year that haven't ended yet (including PENDING, BOOKED, APPROVED)
      return isNotCancelled && isInViewYear && isUpcoming;
    });
  }, [meetings, viewYear]);

  const loadHolidays = () => {
    const yearHolidays = generateHolidaysForSelectedYear();
    setHolidays(yearHolidays);
    console.log('Holidays for year', viewYear, ':', yearHolidays.length);
  };

  // Group meetings and holidays by date
  const groupEventsByDate = () => {
    const grouped = {};

    // Add meetings
    filteredMeetings.forEach(meeting => {
      const date = new Date(meeting.startTime).toDateString();
      if (!grouped[date]) {
        grouped[date] = { meetings: [], holidays: [] };
      }
      grouped[date].meetings.push(meeting);
    });

    // Add holidays
    holidays.forEach(holiday => {
      const date = new Date(holiday.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = { meetings: [], holidays: [] };
      }
      grouped[date].holidays.push(holiday);
    });

    // Sort by date
    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        date: new Date(date),
        ...grouped[date]
      }));
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Ngày mai';
    }

    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('vi-VN', { month: 'long' });
    const year = date.getFullYear();

    return `${weekday}, ${day} ${month} ${year}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusColor = (status) => {
    // ✅ Normalize CONFIRMED → BOOKED for backward compatibility
    let statusUpper = status?.toUpperCase();
    if (statusUpper === 'CONFIRMED') {
      statusUpper = 'BOOKED';
    }
    
    switch (statusUpper) {
      case 'PENDING':
      case 'BOOKED':
        return '#fbbc04'; // Yellow for pending
      case 'APPROVED':
      case 'IN_PROGRESS':
        return '#34a853'; // Green for approved
      case 'CANCELLED':
        return '#ea4335'; // Red for cancelled
      case 'COMPLETED':
        return '#5f6368'; // Gray for completed
      default:
        return '#5f6368'; // Gray for unknown
    }
  };

  const getStatusLabel = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'BOOKED':
        return 'Đã đặt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
    setSelectedMeeting(null);
  };

  const handleMeetingUpdate = () => {
    // Data sẽ tự động cập nhật từ MeetingContext
    // Chỉ cần trigger callback để parent component biết
    if (onMeetingUpdated) {
      onMeetingUpdated();
    }
  };

  const groupedEvents = groupEventsByDate();

  if (loading) {
    return (
      <div className="schedule-view">
        <div className="schedule-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải lịch biểu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-view">
      <div className="schedule-header">
        <div className="schedule-header-top">
          <div className="schedule-title-section">
            <h2>Lịch biểu của tôi</h2>
            <p className="schedule-subtitle">
              Các cuộc họp bạn đã tạo và ngày lễ sắp tới
            </p>
          </div>
          <div className="year-navigation">
            <button 
              className="year-nav-btn" 
              onClick={handlePreviousYear}
              title="Năm trước"
            >
              ‹
            </button>
            <div className="year-display">
              <span className="year-text">{viewYear}</span>
              {viewYear === new Date().getFullYear() && (
                <span className="current-year-badge">Hiện tại</span>
              )}
            </div>
            <button 
              className="year-nav-btn" 
              onClick={handleNextYear}
              title="Năm sau"
            >
              ›
            </button>
            {viewYear !== new Date().getFullYear() && (
              <button 
                className="today-btn" 
                onClick={handleCurrentYear}
                title="Về năm hiện tại"
              >
                Hôm nay
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="schedule-content">
        {groupedEvents.length === 0 ? (
          <div className="schedule-empty">
            <div className="empty-icon">📅</div>
            <h3>Không có sự kiện nào</h3>
            <p>Bạn chưa có cuộc họp hoặc sự kiện nào được lên lịch</p>
          </div>
        ) : (
          groupedEvents.map((dayGroup, index) => (
            <div key={index} className="schedule-day-group">
              <div className="schedule-date-header">
                <div className="date-label">{formatDate(dayGroup.date)}</div>
                <div className="date-line"></div>
              </div>

              {/* Holidays */}
              {dayGroup.holidays.map((holiday, hIndex) => (
                <div 
                  key={`holiday-${hIndex}`} 
                  className={`schedule-item holiday ${holiday.type}`}
                >
                  <div className="schedule-time">
                    <span className="holiday-icon">
                      {holiday.type === 'public' ? '🎉' : '🎊'}
                    </span>
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-title holiday-title">
                      {holiday.name}
                    </div>
                    <div className="schedule-meta">
                      <span className="holiday-badge">
                        {holiday.type === 'public' ? 'Ngày lễ' : 'Ngày hội'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Meetings */}
              {dayGroup.meetings
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .map((meeting, mIndex) => (
                  <div 
                    key={`meeting-${mIndex}`} 
                    className="schedule-item meeting"
                    onClick={() => handleMeetingClick(meeting)}
                  >
                    <div className="schedule-time">
                      <span className="time-label">
                        {formatTime(meeting.startTime)}
                      </span>
                      <span className="time-separator">-</span>
                      <span className="time-label">
                        {formatTime(meeting.endTime)}
                      </span>
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-title">
                        <span 
                          className="status-dot" 
                          style={{ backgroundColor: getStatusColor(meeting.bookingStatus) }}
                        ></span>
                        {meeting.title}
                      </div>
                      <div className="schedule-meta">
                        {meeting.roomName && (
                          <span className="meta-item">
                            <span className="meta-icon">🏢</span>
                            {meeting.roomName}
                          </span>
                        )}
                        {meeting.userName && (
                          <span className="meta-item">
                            <span className="meta-icon">👤</span>
                            {meeting.userName}
                          </span>
                        )}
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: `${getStatusColor(meeting.bookingStatus)}20`,
                            color: getStatusColor(meeting.bookingStatus)
                          }}
                        >
                          {getStatusLabel(meeting.bookingStatus)}
                        </span>
                      </div>
                      {meeting.description && (
                        <div className="schedule-description">
                          {meeting.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>

      {/* Edit Meeting Form */}
      {showEditForm && selectedMeeting && (
        <EditMeetingForm
          meeting={selectedMeeting}
          onClose={handleEditFormClose}
          onUpdate={handleMeetingUpdate}
        />
      )}
    </div>
  );
};

export default ScheduleView;
