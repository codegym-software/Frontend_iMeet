// components/UpcomingMeetings.js
import React, { useState, useEffect } from 'react';
import './UpcomingMeetings.css';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';

const UpcomingMeetings = () => {
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [todayMeetingsCount, setTodayMeetingsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      console.log('🔄 Loading upcoming meetings...');
      console.log('API URL:', 'http://localhost:8081/api/meetings/upcoming');
      
      // Gọi API lấy upcoming meetings
      let meetings = await calendarAPI.getUpcomingMeetings();
      console.log('✅ Raw meetings from API:', meetings);
      console.log('📊 Total meetings received:', meetings?.length || 0);
      
      // Nếu không có meetings, thử lấy tất cả meetings để debug
      if (!meetings || meetings.length === 0) {
        console.warn('⚠️ No meetings returned from /upcoming API');
        console.log('🔍 Trying to fetch ALL meetings for debugging...');
        
        try {
          const allMeetings = await calendarAPI.getAllMeetings();
          console.log('📋 All meetings in database:', allMeetings);
          console.log('📊 Total meetings in DB:', allMeetings?.length || 0);
          
          if (allMeetings && allMeetings.length > 0) {
            console.log('🔎 Sample meeting:', allMeetings[0]);
            console.log('📅 All meetings details:');
            allMeetings.forEach((m, idx) => {
              console.log(`  ${idx + 1}. "${m.title}"`);
              console.log(`     Start: ${m.startTime}`);
              console.log(`     Status: ${m.bookingStatus}`);
              console.log(`     Future: ${new Date(m.startTime) > new Date()}`);
            });
            meetings = allMeetings; // Use all meetings for now
          } else {
            console.error('❌ Database is empty! Please create some meetings first.');
            setUpcomingMeetings([]);
            return;
          }
        } catch (err) {
          console.error('❌ Error fetching all meetings:', err);
          setUpcomingMeetings([]);
          return;
        }
      }
      
      // Lọc meetings sắp tới (chưa diễn ra và không bị cancelled)
      const now = new Date();
      console.log('🕐 Current time:', now);
      
      const filteredMeetings = meetings
        .filter(meeting => {
          const startTime = new Date(meeting.startTime);
          const status = meeting.bookingStatus?.toUpperCase();
          const isFuture = startTime > now;
          const isConfirmed = status === 'CONFIRMED';
          
          console.log(`📅 Meeting: "${meeting.title}"`);
          console.log(`   Status: ${status}, StartTime: ${startTime}`);
          console.log(`   Future: ${isFuture}, Is Confirmed: ${isConfirmed}`);
          
          return isFuture && isConfirmed;
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
      setUpcomingMeetings(filteredMeetings);
    } catch (error) {
      console.error('❌ Error loading upcoming meetings:', error);
      console.error('Error details:', error.message);
      setUpcomingMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load số cuộc họp hôm nay
  const loadTodayMeetingsCount = async () => {
    try {
      console.log('Loading today meetings count...');
      const meetings = await calendarAPI.getMeetingsToday();
      console.log('Today meetings from API:', meetings);
      
      // Đếm số meetings đã xác nhận (CONFIRMED)
      const count = meetings.filter(meeting => {
        const status = meeting.bookingStatus?.toUpperCase();
        console.log(`Today meeting: ${meeting.title}, Status: ${status}`);
        return status === 'CONFIRMED';
      }).length;
      
      console.log('Today meetings count (not cancelled):', count);
      setTodayMeetingsCount(count);
    } catch (error) {
      console.error('Error loading today meetings count:', error);
      setTodayMeetingsCount(0);
    }
  };

  // Cập nhật thời gian hiện tại mỗi giây (real-time)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(timer);
  }, []);

  // Load data khi component mount
  useEffect(() => {
    loadUpcomingMeetings();
    loadTodayMeetingsCount();
    
    // Refresh mỗi 5 phút
    const refreshInterval = setInterval(() => {
      loadUpcomingMeetings();
      loadTodayMeetingsCount();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

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