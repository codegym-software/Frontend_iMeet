import { useState, useEffect, useRef } from 'react';
import { useMeetings } from '../contexts/MeetingContext';

/**
 * Hook để kiểm tra và quản lý thông báo reminder cho meetings sắp bắt đầu
 * Kiểm tra mỗi 30 giây để tìm meetings bắt đầu trong 15 phút tới
 */
export const useMeetingReminders = () => {
  const { meetings } = useMeetings();
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const shownReminderIdsRef = useRef(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    const checkUpcomingMeetings = () => {
      if (!meetings || meetings.length === 0) {
        setUpcomingReminders([]);
        return;
      }

      const now = new Date();
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
      const in14Minutes = new Date(now.getTime() + 14 * 60 * 1000);

      // Tìm các meetings sắp bắt đầu trong khoảng 14-16 phút
      const upcoming = meetings
        .filter(meeting => {
          if (!meeting.startTime && !meeting.start) return false;
          
          const startTime = new Date(meeting.startTime || meeting.start);
          const meetingId = meeting.meetingId || meeting.id || meeting._id;
          
          // Chỉ lấy meetings chưa bắt đầu và trong khoảng 14-16 phút
          if (startTime <= now) return false;
          if (startTime < in14Minutes) return false;
          if (startTime > in15Minutes) return false;
          
          // Chỉ hiển thị một lần cho mỗi meeting
          if (shownReminderIdsRef.current.has(meetingId)) return false;
          
          // Chỉ hiển thị cho meetings chưa bị hủy
          const status = meeting.bookingStatus || meeting.status;
          if (status === 'CANCELLED' || status === 'COMPLETED') return false;
          
          return true;
        })
        .map(meeting => {
          const startTime = new Date(meeting.startTime || meeting.start);
          const endTime = new Date(meeting.endTime || meeting.end);
          const minutesUntilStart = Math.round((startTime - now) / 60000);
          
          return {
            ...meeting,
            minutesUntilStart,
            startTime,
            endTime
          };
        })
        .sort((a, b) => a.startTime - b.startTime);

      // Xóa các reminders đã qua thời gian (đã bắt đầu hoặc quá 15 phút)
      setUpcomingReminders(prev => {
        const filtered = prev.filter(reminder => {
          const startTime = reminder.startTime || reminder.start;
          if (!startTime) return false;
          const start = new Date(startTime);
          // Giữ lại nếu chưa bắt đầu và vẫn trong khoảng 15 phút
          return start > now && start <= in15Minutes;
        });
        
        // Thêm các reminders mới
        if (upcoming.length > 0) {
          const existingIds = new Set(filtered.map(m => m.meetingId || m.id || m._id));
          const newReminders = upcoming.filter(m => {
            const id = m.meetingId || m.id || m._id;
            return !existingIds.has(id);
          });
          
          // Đánh dấu đã hiển thị
          newReminders.forEach(meeting => {
            const meetingId = meeting.meetingId || meeting.id || meeting._id;
            shownReminderIdsRef.current.add(meetingId);
          });
          
          return [...filtered, ...newReminders].sort((a, b) => a.startTime - b.startTime);
        }
        
        return filtered;
      });
    };

    // Kiểm tra ngay lập tức
    checkUpcomingMeetings();

    // Kiểm tra mỗi 30 giây
    intervalRef.current = setInterval(checkUpcomingMeetings, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [meetings]);

  // Reset shown reminders khi meetings thay đổi (xóa các meeting không còn tồn tại)
  useEffect(() => {
    if (meetings && meetings.length > 0) {
      const currentIds = new Set(
        meetings.map(m => m.meetingId || m.id || m._id).filter(Boolean)
      );
      // Xóa các ID không còn trong danh sách meetings
      shownReminderIdsRef.current.forEach(id => {
        if (!currentIds.has(id)) {
          shownReminderIdsRef.current.delete(id);
        }
      });
    }
  }, [meetings]);

  return {
    upcomingReminders,
    clearReminder: (meetingId) => {
      setUpcomingReminders(prev => 
        prev.filter(m => (m.meetingId || m.id || m._id) !== meetingId)
      );
    },
    clearAllReminders: () => {
      setUpcomingReminders([]);
    }
  };
};

