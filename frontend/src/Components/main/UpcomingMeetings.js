// components/UpcomingMeetings.js
import React, { useState, useEffect } from 'react';
import './UpcomingMeetings.css';

const UpcomingMeetings = () => {
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data - thay thế bằng API call thực tế
  const mockMeetings = [
    {
      id: 1,
      title: "Project Review Meeting",
      time: "11:00 AM",
      date: "2025-01-15",
      duration: "1 hour",
      participants: 5,
      isUpcoming: true
    },
    {
      id: 2,
      title: "Team Standup",
      time: "09:30 AM", 
      date: "2025-01-15",
      duration: "30 mins",
      participants: 8,
      isUpcoming: true
    },
    {
      id: 3,
      title: "Client Presentation",
      time: "02:00 PM",
      date: "2025-01-15",
      duration: "2 hours",
      participants: 12,
      isUpcoming: true
    },
    {
      id: 4,
      title: "Sprint Planning",
      time: "10:00 AM",
      date: "2025-01-16",
      duration: "1.5 hours",
      participants: 6,
      isUpcoming: true
    },
    {
      id: 5,
      title: "Design Review",
      time: "03:30 PM",
      date: "2025-01-14",
      duration: "45 mins",
      participants: 4,
      isUpcoming: false
    }
  ];

  // Sắp xếp meetings theo thời gian gần nhất
  const sortMeetingsByTime = (meetings) => {
    return meetings
      .filter(meeting => meeting.isUpcoming)
      .sort((a, b) => {
        const timeA = new Date(`${a.date} ${a.time}`);
        const timeB = new Date(`${b.date} ${b.time}`);
        return timeA - timeB;
      })
      .slice(0, 3);
  };

  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Lọc và sắp xếp meetings
  useEffect(() => {
    const sortedMeetings = sortMeetingsByTime(mockMeetings);
    setUpcomingMeetings(sortedMeetings);
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
            {mockMeetings.filter(meeting => 
              meeting.date === currentTime.toISOString().split('T')[0] && 
              meeting.isUpcoming
            ).length} cuộc họp
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingMeetings;