// components/UpcomingMeetings.js
import React, { useState, useEffect, useRef } from 'react';
import './UpcomingMeetings.css';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';

const UpcomingMeetings = ({ onMeetingDoubleClick }) => {
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

  // Load upcoming meetings từ API
  const loadUpcomingMeetings = async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      console.log('🔄 Loading upcoming meetings...');
      
      // ✅ Lấy current user ID
      const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('oauth2User') || '{}');
      const currentUserId = currentUser.userId || currentUser.id;
      console.log('👤 Current user ID:', currentUserId);
      
      // Gọi API lấy upcoming meetings (với user ID)
      const meetings = await calendarAPI.getUpcomingMeetings(currentUserId);
      console.log('✅ Raw meetings from API:', meetings);
      console.log('📊 Total meetings received:', meetings?.length || 0);
      
      // Nếu không có meetings, return empty
      if (!meetings || meetings.length === 0) {
        console.log('ℹ️ No upcoming meetings');
        if (isMountedRef.current) {
          setUpcomingMeetings([]);
          setLoading(false);
        }
        return;
      }
      
      // Lọc meetings sắp tới (chưa diễn ra và không bị cancelled)
      const now = new Date();
      console.log('🕐 Current time:', now);
      
      // ✅ Remove duplicates dựa trên meetingId
      const uniqueMeetings = Array.from(new Map(meetings.map(m => [m.meetingId, m])).values());
      console.log(`✅ Unique meetings: ${uniqueMeetings.length} (removed ${meetings.length - uniqueMeetings.length} duplicates)`);
      
      const filteredMeetings = uniqueMeetings
        .filter(meeting => {
          const startTime = new Date(meeting.startTime);
          const status = meeting.bookingStatus?.toUpperCase();
          const isFuture = startTime > now;
          const isNotCancelled = status !== 'CANCELLED';
          
          return isFuture && isNotCancelled;
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 3) // Chỉ lấy 3 meetings gần nhất
        .map(meeting => ({
          id: meeting.meetingId,
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          time: formatTime(meeting.startTime),
          date: new Date(meeting.startTime).toISOString().split('T')[0],
          duration: calculateDuration(meeting.startTime, meeting.endTime),
          participants: meeting.participants?.length || 0,
          bookingStatus: meeting.bookingStatus
        }));
      
      console.log('✨ Filtered upcoming meetings:', filteredMeetings);
      console.log('📈 Showing', filteredMeetings.length, 'meetings');
      if (isMountedRef.current) setUpcomingMeetings(filteredMeetings);
    } catch (error) {
      console.error('❌ Error loading upcoming meetings:', error);
      console.error('Error details:', error.message);
      if (isMountedRef.current) setUpcomingMeetings([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Load số cuộc họp hôm nay
  const loadTodayMeetingsCount = async () => {
    try {
      console.log('Loading today meetings count...');
      
      // ✅ Lấy current user ID
      const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('oauth2User') || '{}');
      const currentUserId = currentUser.userId || currentUser.id;
      console.log('👤 Current user ID:', currentUserId);
      
      const meetings = await calendarAPI.getMeetingsToday(currentUserId);
      console.log('Today meetings from API:', meetings);
      
      // Đếm số meetings chưa bị hủy
      const count = meetings.filter(meeting => {
        const status = meeting.bookingStatus?.toUpperCase();
        console.log(`Today meeting: ${meeting.title}, Status: ${status}`);
        return status !== 'CANCELLED';
      }).length;
      
      console.log('Today meetings count (not cancelled):', count);
      if (isMountedRef.current) setTodayMeetingsCount(count);
    } catch (error) {
      console.error('Error loading today meetings count:', error);
      if (isMountedRef.current) setTodayMeetingsCount(0);
    }
  };

  // Cập nhật thời gian hiện tại mỗi giây (real-time)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current) setCurrentTime(new Date());
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(timer);
  }, []);

  // Load data khi component mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadData = async () => {
      if (!isMountedRef.current) return;
      await loadUpcomingMeetings();
      await loadTodayMeetingsCount();
    };
    
    loadData();
    
    // Refresh mỗi 5 phút
    const refreshInterval = setInterval(() => {
      if (isMountedRef.current) {
        loadData();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(refreshInterval);
    };
  }, []); // ✅ Empty dependency array - chỉ chạy khi mount // ✅ No dependencies - only run on mount

  // Format thời gian còn lại
  const getTimeUntilMeeting = (meetingDate, meetingTime) => {
    const meetingDateTime = new Date(`${meetingDate} ${meetingTime}`);
    const timeDiff = meetingDateTime - currentTime;
    
    if (timeDiff < 0) return null;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Trong ${hours} giờ ${minutes} phút`;
    } else {
      return `Trong ${minutes} phút`;
    }
  };

  // Kiểm tra meeting tiếp theo
  const isNextMeeting = (index) => index === 0;

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
            const timeUntil = getTimeUntilMeeting(meeting.date, meeting.time);
            
            return (
              <div 
                key={meeting.id} 
                className={`meeting-item ${isNextMeeting(index) ? 'next-meeting' : ''}`}
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
                <div className="meeting-time">
                  <span className="time">{meeting.time}</span>
                  {timeUntil && (
                    <span className="time-until">{timeUntil}</span>
                  )}
                </div>
                
                <div className="meeting-details">
                  <h4 className="meeting-title">{meeting.title}</h4>
                  <div className="meeting-meta">
                    <span className="duration">{meeting.duration}</span>
                    <span className="participants">
                      👥 {meeting.participants} người
                    </span>
                  </div>
                </div>

                {isNextMeeting(index) && (
                  <div className="next-badge">Tiếp theo</div>
                )}
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