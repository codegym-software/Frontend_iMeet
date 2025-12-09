// components/UpcomingMeetings.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import './UpcomingMeetings.css';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';
import { useMeetings } from '../../contexts/MeetingContext';

const UpcomingMeetings = ({ onMeetingDoubleClick }) => {
  // Sử dụng data từ MeetingContext thay vì gọi API riêng
  const { meetings: allMeetings, isDataLoaded } = useMeetings();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [todayMeetingsCount, setTodayMeetingsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Format thời gian từ Date object
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date thành "Tomorrow" hoặc ngày cụ thể
  const formatDateDisplay = (date) => {
    const meetingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const meetingDateOnly = new Date(meetingDate);
    meetingDateOnly.setHours(0, 0, 0, 0);
    
    if (meetingDateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (meetingDateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else {
      const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 
                     'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
      return `${days[meetingDate.getDay()]}, ${meetingDate.getDate()} ${months[meetingDate.getMonth()]}`;
    }
  };

  // Tính duration giữa 2 thời gian
  const calculateDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ`;
    } else {
      return `${minutes} phút`;
    }
  };

  // Tính thời gian còn lại đến meeting (phút)
  const getMinutesUntilMeeting = (startTime) => {
    const meetingTime = new Date(startTime);
    const timeDiff = meetingTime - currentTime;
    if (timeDiff < 0) return null;
    return Math.floor(timeDiff / (1000 * 60));
  };

  // Cache để tránh gọi API nhiều lần
  const inviteesCacheRef = useRef(new Map());
  const cacheTimeoutRef = useRef(new Map());

  // Tính số lượng người tham gia (người tạo + người được mời ACCEPTED)
  // Tối ưu: Sử dụng cache và fallback về participants count từ meeting response
  const calculateParticipantCount = async (meetingId, fallbackCount = null) => {
    // Kiểm tra cache trước
    const cacheKey = `invitees_${meetingId}`;
    const cached = inviteesCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) { // Cache 1 phút
      return cached.count;
    }

    try {
      // Load invitees từ API
      const invitees = await calendarAPI.getMeetingInvitees(meetingId);
      // Đếm số người ACCEPTED
      const acceptedCount = Array.isArray(invitees) 
        ? invitees.filter(inv => (inv.status || '').toUpperCase() === 'ACCEPTED').length
        : 0;
      // Trả về: 1 (người tạo) + số người ACCEPTED
      const count = 1 + acceptedCount;
      
      // Lưu vào cache
      inviteesCacheRef.current.set(cacheKey, { count, timestamp: Date.now() });
      
      // Clear cache sau 1 phút
      if (cacheTimeoutRef.current.has(cacheKey)) {
        clearTimeout(cacheTimeoutRef.current.get(cacheKey));
      }
      const timeout = setTimeout(() => {
        inviteesCacheRef.current.delete(cacheKey);
        cacheTimeoutRef.current.delete(cacheKey);
      }, 60000);
      cacheTimeoutRef.current.set(cacheKey, timeout);
      
      return count;
    } catch (error) {
      // Fallback: sử dụng participants count từ meeting response nếu có
      if (fallbackCount !== null && fallbackCount > 0) {
        return fallbackCount;
      }
      // Fallback cuối cùng: trả về 1 (chỉ người tạo)
      return 1;
    }
  };

  // Load upcoming meetings từ cache (MeetingContext) - Tối ưu: không gọi API riêng
  const loadUpcomingMeetings = async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      
      // ✅ Sử dụng data từ MeetingContext thay vì gọi API
      if (!isDataLoaded || !allMeetings || allMeetings.length === 0) {
        if (isMountedRef.current) {
          setUpcomingMeetings([]);
          setLoading(false);
        }
        return;
      }
      
      // Lọc meetings sắp tới (chưa diễn ra và không bị cancelled)
      const now = new Date();
      
      // ✅ Remove duplicates dựa trên meetingId
      const uniqueMeetings = Array.from(new Map(allMeetings.map(m => [m.meetingId || m.id, m])).values());
      
      const filteredMeetings = uniqueMeetings
        .filter(meeting => {
          const startTime = new Date(meeting.startTime || meeting.start);
          const status = meeting.bookingStatus?.toUpperCase();
          const isFuture = startTime > now;
          const isNotCancelled = status !== 'CANCELLED';
          
          return isFuture && isNotCancelled;
        })
        .sort((a, b) => new Date(a.startTime || a.start) - new Date(b.startTime || b.start))
        .slice(0, 3); // Chỉ lấy 3 meetings gần nhất
      
      // Batch load participant counts - tối ưu: load song song thay vì tuần tự
      const meetingsWithCounts = await Promise.all(
        filteredMeetings.map(async (meeting) => {
          // Sử dụng participants count từ response làm fallback để tránh gọi API không cần thiết
          const fallbackCount = meeting.participants ? Number(meeting.participants) + 1 : null;
          const participantCount = await calculateParticipantCount(meeting.meetingId, fallbackCount);
          return {
            id: meeting.meetingId,
            title: meeting.title,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            time: formatTime(meeting.startTime),
            endTimeFormatted: formatTime(meeting.endTime),
            date: new Date(meeting.startTime).toISOString().split('T')[0],
            dateDisplay: formatDateDisplay(meeting.startTime),
            duration: calculateDuration(meeting.startTime, meeting.endTime),
            participantCount: participantCount,
            bookingStatus: meeting.bookingStatus
          };
        })
      );
      
      if (isMountedRef.current) setUpcomingMeetings(meetingsWithCounts);
    } catch (error) {
      console.error('❌ Error loading upcoming meetings:', error);
      if (isMountedRef.current) setUpcomingMeetings([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Load số cuộc họp hôm nay - Tối ưu
  const loadTodayMeetingsCount = async () => {
    try {
      // ✅ Lấy current user ID
      const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('oauth2User') || '{}');
      const currentUserId = currentUser.userId || currentUser.id;
      
      const meetings = await calendarAPI.getMeetingsToday(currentUserId);
      
      // Đếm số meetings chưa bị hủy
      const count = meetings.filter(meeting => {
        const status = meeting.bookingStatus?.toUpperCase();
        return status !== 'CANCELLED';
      }).length;
      
      if (isMountedRef.current) setTodayMeetingsCount(count);
    } catch (error) {
      if (isMountedRef.current) setTodayMeetingsCount(0);
    }
  };

  // Cập nhật thời gian hiện tại mỗi 30 giây (tối ưu - giảm re-render)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current) setCurrentTime(new Date());
    }, 30000); // Cập nhật mỗi 30 giây thay vì mỗi giây

    return () => clearInterval(timer);
  }, []);

  // Load data khi component mount hoặc khi meetings data thay đổi
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadData = async () => {
      if (!isMountedRef.current) return;
      await loadUpcomingMeetings();
      await loadTodayMeetingsCount();
    };
    
    // Chỉ load khi data đã sẵn sàng
    if (isDataLoaded) {
      loadData();
    }
    
    // Refresh mỗi 5 phút để cập nhật số lượng người tham gia (tối ưu - giảm API calls)
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current && isDataLoaded) {
        // Clear cache khi refresh để đảm bảo dữ liệu mới nhất
        inviteesCacheRef.current.clear();
        cacheTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
        cacheTimeoutRef.current.clear();
        loadData();
      }
    }, 5 * 60 * 1000); // Tăng lên 5 phút để giảm tải server
    
    return () => {
      isMountedRef.current = false;
      clearInterval(refreshInterval);
      // Clear cache và timeouts khi unmount
      inviteesCacheRef.current.clear();
      cacheTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      cacheTimeoutRef.current.clear();
    };
  }, [isDataLoaded, allMeetings]); // ✅ Depend on MeetingContext data

  // Format thời gian còn lại
  const getTimeUntilMeeting = (startTime) => {
    const minutes = getMinutesUntilMeeting(startTime);
    if (minutes === null) return null;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `Sẽ diễn ra trong ${hours} giờ ${mins} phút`;
    } else {
      return `Sẽ diễn ra trong ${minutes} phút`;
    }
  };

  // Note: formatAttendeeNames đã được xóa - không còn sử dụng


  return (
    <div className="upcoming-meetings">
      <div className="upcoming-meetings-header">
        <h3>Upcoming Meetings</h3>
        <div className="current-time">
          {currentTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {upcomingMeetings.length > 0 ? (
        <div className="meetings-list">
          {upcomingMeetings.map((meeting, index) => {
            const timeUntil = getTimeUntilMeeting(meeting.startTime);
            
            return (
              <div 
                key={meeting.id} 
                className="meeting-card"
                onDoubleClick={async () => {
                  if (onMeetingDoubleClick) {
                    try {
                      // Load full meeting data from API
                      const fullMeeting = await calendarAPI.getMeetingById(meeting.id);
                      if (fullMeeting) {
                        onMeetingDoubleClick(fullMeeting);
                      }
                    } catch (error) {
                      console.error('Error loading meeting details:', error);
                    }
                  }
                }}
                style={{ cursor: onMeetingDoubleClick ? 'pointer' : 'default' }}
              >
                {/* Title và Calendar Icon */}
                <div className="meeting-card-header">
                  <h4 className="meeting-card-title">{meeting.title}</h4>
                  <div className="calendar-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="18" rx="2" fill="#4285f4"/>
                      <path d="M7 2v4M17 2v4M3 10h18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M9 16l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="meeting-card-datetime">
                  {meeting.dateDisplay}, {meeting.time} - {meeting.endTimeFormatted}
                </div>
                
                {/* Participants Count and Countdown */}
                <div className="meeting-card-attendees">
                  <div className="participants-count">
                    👥 {meeting.participantCount || 1} người tham gia
                  </div>
                  
                  {timeUntil && (
                    <div className="meeting-countdown">
                      {timeUntil}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-meetings">
          <div className="no-meetings-icon">📅</div>
          <p>Không có lịch họp sắp tới</p>
        </div>
      )}

      <div className="today-summary">
        <div className="summary-item">
          <span className="summary-label">Hôm nay:</span>
          <span className="summary-count">
            {todayMeetingsCount} cuộc họp
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingMeetings;