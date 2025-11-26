// src/Components/main/Main.js
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

// Import useCallback để sử dụng trong component
import { AuthProvider } from '../../contexts/AuthContext';
import { MeetingProvider, useMeetings } from '../../contexts/MeetingContext';
import { DeviceInventoryProvider } from '../../contexts/DeviceInventoryContext';
import './Home.css';
import TopBar from '../../Components/main/TopBar';
import MiniCalendar from '../../Components/main/MiniCalendar';
import UpcomingMeetings from '../../Components/main/UpcomingMeetings';
import TimeTable from '../../Components/main/MainCalendar/TimeTable';
import RoomFinder from '../../Components/main/RoomFinder/RoomFinder';
import RoomSearchForm from '../../Components/main/RoomFinder/RoomSearchForm';
import RoomResultsList from '../../Components/main/RoomFinder/RoomResultsList';
import { useRoomFinder } from '../../hooks/useRoomFinder';
import RoomDetailModal from './RoomDetailModal';
import Toast from '../../Components/common/Toast';
import EditMeetingForm from '../../Components/main/EditMeetingForm';
import MeetingForm from '../../Components/main/MeetingForm';
import MeetingReminderNotification from '../../Components/common/MeetingReminderNotification';
import { useMeetingReminders } from '../../hooks/useMeetingReminders';
import { calendarAPI } from '../../Components/main/MainCalendar/utils/CalendarAPI';

const MainContent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('day');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'room'
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [quickCreateRange, setQuickCreateRange] = useState(null);
  const history = useHistory();
  const location = useLocation();
  const { addMeeting, fetchMeetings } = useMeetings(); // Get optimistic update function and fetch
  const [preselectedRoomId, setPreselectedRoomId] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  
  // Meeting reminders - kiểm tra meetings sắp bắt đầu trong 15 phút
  const { upcomingReminders, clearReminder } = useMeetingReminders();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => { 
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light'); 
  };  

  // Hàm xử lý thay đổi view type
  const handleViewChange = (newViewType) => {
    setViewType(newViewType);
    // Nếu đang ở room mode và chọn month/year/schedule, switch về calendar
    if (viewMode === 'room' && ['month', 'year', 'schedule'].includes(newViewType)) {
      setViewMode('calendar');
    }
  };

  // Hàm xử lý thay đổi ngày - định nghĩa trước để có thể dùng trong hook
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    // Cập nhật currentMonth để MiniCalendar hiển thị đúng tháng
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  }, []);

  // Room finder logic - sử dụng custom hook (sau khi handleDateChange được định nghĩa)
  // Sử dụng useMemo để tránh tạo lại hook mỗi lần render
  const roomFinder = useRoomFinder(selectedDate, handleDateChange);

  // Hàm xử lý khi click vào ngày trong week/month/year view
  // Chuyển sang day view và set ngày
  const handleSelectDay = (newDate) => {
    handleDateChange(newDate);
    setViewType('day');
  };

  // Hàm xử lý thay đổi tháng từ MiniCalendar
  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const handleSelectionRangeChange = useCallback((range) => {
    if (!range) {
      setQuickCreateRange(null);
      return;
    }
    let start = new Date(range.start);
    let end = new Date(range.end);
    if (end < start) {
      const temp = start;
      start = end;
      end = temp;
    }
    setQuickCreateRange({ start, end });
  }, []);

  const handleQuickCreateRange = useCallback((range) => {
    if (!range) return;
    let start = new Date(range.start);
    let end = new Date(range.end);
    if (end < start) {
      const temp = start;
      start = end;
      end = temp;
    }
    const normalized = { start, end };
    handleSelectionRangeChange(normalized);
    setPreselectedRoomId(null);
    setShowMeetingForm(true);
  }, [handleDateChange, handleSelectionRangeChange]);

  // Hàm xử lý khi tạo meeting - OPTIMISTIC UPDATE
  const handleMeetingCreated = async (meetingData, message) => {
    if (meetingData) {
      console.log('✅ Meeting created - using optimistic update');
      // Add to shared cache immediately - NO API CALL!
      addMeeting(meetingData);
      
      // Force refresh cache to ensure latest data from server
      if (fetchMeetings) {
        console.log('🔄 Force refreshing meetings cache...');
        await fetchMeetings(true); // Force refresh
      }
      
      // Trigger refresh for calendar view - this will force TimeTable to reload
      setRefreshTrigger(prev => prev + 1);
      
      // Show success toast
      if (message) {
        setToast({
          isOpen: true,
          message: message,
          type: 'success'
        });
      }
    } else {
      // Error case - meetingData is null
      console.warn('⚠️ Failed to create meeting');
      
      // Show error toast
      if (message) {
        setToast({
          isOpen: true,
          message: message,
          type: 'error'
        });
      }
    }
  };

  const handleBookRoom = useCallback((room, range) => {
    if (!room) return;
    setPreselectedRoomId(room.id || room.roomId || null);
    if (range?.start && range?.end) {
      handleDateChange(range.start);
      handleSelectionRangeChange({
        start: range.start,
        end: range.end
      });
      setQuickCreateRange({
        start: range.start,
        end: range.end
      });
    } else {
      handleSelectionRangeChange(null);
      setQuickCreateRange(null);
    }
    setShowMeetingForm(true);
  }, [handleDateChange, handleSelectionRangeChange]);

  const handleOpenRoomDetail = useCallback((room) => {
    if (!room) return;
    setRoomDetail(room);
  }, []);

  const handleCloseRoomDetail = useCallback(() => {
    setRoomDetail(null);
  }, []);

  // Handle double click on upcoming meeting to open edit form
  const handleUpcomingMeetingDoubleClick = useCallback((meeting) => {
    console.log('Double click on upcoming meeting:', meeting);
    setEditingMeeting(meeting);
    setShowEditForm(true);
  }, []);

  // Handle update meeting from edit form
  // Note: EditMeetingForm already calls the API, so we just need to refresh and show toast
  const handleUpdateMeeting = useCallback(async (updatedMeeting, message) => {
    try {
      // Validate updatedMeeting
      if (!updatedMeeting) {
        console.error('❌ Updated meeting is null or undefined');
        setToast({
          isOpen: true,
          message: message || 'Lỗi: Không nhận được dữ liệu meeting sau khi cập nhật',
          type: 'error'
        });
        return;
      }
      
      // EditMeetingForm already updated the meeting via API
      // We just need to refresh the UI
      setShowEditForm(false);
      setEditingMeeting(null);
      // Refresh meetings
      setRefreshTrigger(prev => prev + 1);
      // Ensure Day view and jump to meeting date
      const start = updatedMeeting.start || updatedMeeting.startTime;
      if (start) {
        const dateObj = new Date(start);
        setSelectedDate(dateObj);
        setViewType('day');
      } else {
        setViewType('day');
      }
      // Navigate to dashboard route if necessary
      if (history && history.location && history.location.pathname !== '/trang-chu') {
        history.push('/trang-chu');
      }
      setToast({
        isOpen: true,
        message: message || 'Cập nhật lịch họp thành công',
        type: 'success'
      });
    } catch (error) {
      console.error('Error handling meeting update:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi cập nhật lịch họp: ' + (error.message || 'Unknown error'),
        type: 'error'
      });
    }
  }, []);

  // Handle delete meeting from edit form
  const handleDeleteMeeting = useCallback(async (meetingId) => {
    try {
      const { message } = await calendarAPI.deleteMeeting(meetingId);
      setShowEditForm(false);
      setEditingMeeting(null);
      // Refresh meetings
      setRefreshTrigger(prev => prev + 1);
      setToast({
        isOpen: true,
        message: message || 'Xóa lịch họp thành công',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi xóa lịch họp: ' + (error.message || 'Unknown error'),
        type: 'error'
      });
    }
  }, []);

  return (
    <div className="main">
      <TopBar 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        viewType={viewType}
        onViewChange={handleViewChange}
        viewMode={viewMode}
        theme={theme}
        toggleTheme={toggleTheme}
        history={history}
        onMeetingCreated={handleMeetingCreated}
        onOpenMeetingForm={() => {
          handleSelectionRangeChange(null);
          setPreselectedRoomId(null);
          setShowMeetingForm(true);
        }}
      />
      
      <div className="main-content">
        <div className="container">
          <div className="left-panel">
            <div className="view-mode-switcher">
              <button 
                className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
                title="Xem theo lịch cá nhân"
              >
                📅 Lịch
              </button>
              <button 
                className={`view-mode-btn ${viewMode === 'room' ? 'active' : ''}`}
                onClick={() => setViewMode('room')}
                title="Xem theo phòng họp"
              >
                🏢 Phòng
              </button>
            </div>

            {viewMode === 'calendar' ? (
              <>
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button 
                      className="nav-button prev"
                      onClick={() => handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      title="Previous month"
                    >
                      ‹
                    </button>
                    
                    <span className="month-display">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    
                    <button 
                      className="nav-button next"
                      onClick={() => handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      title="Next month"
                    >
                      ›
                    </button>
                  </div>
                  
                  <MiniCalendar 
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    currentDate={currentMonth}
                    onMonthChange={handleMonthChange}
                  />
                </div>

                <UpcomingMeetings onMeetingDoubleClick={handleUpcomingMeetingDoubleClick} />
              </>
            ) : (
              <RoomSearchForm
                criteria={roomFinder.criteria}
                onChange={roomFinder.updateCriteria}
                onToggleDeviceType={roomFinder.toggleDeviceType}
                onSubmit={roomFinder.fetchRooms}
                onClear={roomFinder.clearFilters}
                deviceTypeOptions={roomFinder.DEVICE_TYPE_OPTIONS}
                loading={roomFinder.loading}
                formError={roomFinder.formError}
              />
            )}
          </div>

          <div className="right-panel">
            {viewMode === 'calendar' ? (
              <TimeTable 
                selectedDate={selectedDate} 
                viewType={viewType}
                refreshTrigger={refreshTrigger}
                onDateSelect={handleSelectDay}
                onMeetingUpdated={handleMeetingCreated}
                onSelectionComplete={handleQuickCreateRange}
                activeSelection={quickCreateRange}
                onSelectionRangeChange={handleSelectionRangeChange}
              />
            ) : (
              <RoomResultsList
                rooms={roomFinder.hasSearched ? roomFinder.rooms : roomFinder.allRooms}
                loading={roomFinder.loading}
                error={roomFinder.apiError}
                hasSearched={roomFinder.hasSearched}
                searchRange={roomFinder.searchRange}
                onRetry={roomFinder.fetchRooms}
                onBookRoom={(room) => {
                  if (!room || !roomFinder.searchRange) return;
                  handleBookRoom(room, roomFinder.searchRange);
                }}
                onViewDetails={handleOpenRoomDetail}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Meeting Reminder Notifications */}
      {upcomingReminders.map((reminder, index) => {
        const meetingId = reminder.meetingId || reminder.id || reminder._id;
        return (
          <div
            key={meetingId || index}
            style={{
              position: 'fixed',
              top: `${20 + index * 320}px`,
              right: '20px',
              zIndex: 10002 + index
            }}
          >
            <MeetingReminderNotification
              reminder={reminder}
              onClose={() => clearReminder(meetingId)}
              onView={() => {
                // Mở form chỉnh sửa meeting
                setEditingMeeting(reminder);
                setShowEditForm(true);
                // Chuyển sang ngày của meeting
                const startTime = reminder.startTime || reminder.start;
                if (startTime) {
                  const dateObj = new Date(startTime);
                  setSelectedDate(dateObj);
                  setViewType('day');
                }
                // Đóng notification
                clearReminder(meetingId);
              }}
            />
          </div>
        );
      })}

      {/* Create Meeting Form */}
      {showMeetingForm && (
        <MeetingForm
          selectedDate={selectedDate}
          initialStartTime={quickCreateRange?.start || null}
          initialEndTime={quickCreateRange?.end || null}
          initialRoomId={preselectedRoomId}
          onClose={() => {
            setShowMeetingForm(false);
            handleSelectionRangeChange(null);
            setPreselectedRoomId(null);
          }}
          onSubmit={async (meetingData) => {
            setShowMeetingForm(false);
            handleSelectionRangeChange(null);
            setPreselectedRoomId(null);
            await handleMeetingCreated(meetingData, 'Tạo lịch họp thành công');
          }}
        />
      )}

      {/* Edit Meeting Form */}
      {showEditForm && editingMeeting && (
        <EditMeetingForm
          meeting={editingMeeting}
          onClose={() => {
            setShowEditForm(false);
            setEditingMeeting(null);
          }}
          onSubmit={handleUpdateMeeting}
          onDelete={handleDeleteMeeting}
        />
      )}

      {/* Room Detail Modal */}
      {roomDetail && (
        <RoomDetailModal
          room={roomDetail}
          onClose={handleCloseRoomDetail}
          onBookRoom={() => {
            handleBookRoom(roomDetail);
            handleCloseRoomDetail();
          }}
        />
      )}
    </div>
  );
};

// Wrap MainContent with providers
const Main = () => {
  return (
    <DeviceInventoryProvider>
      <MeetingProvider>
        <MainContent />
      </MeetingProvider>
    </DeviceInventoryProvider>
  );
};

export default Main;