// src/Components/main/Main.js
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { MeetingProvider, useMeetings } from '../../contexts/MeetingContext';
import { DeviceInventoryProvider } from '../../contexts/DeviceInventoryContext';
import './Home.css';
import TopBar from '../../Components/main/TopBar';
import MiniCalendar from '../../Components/main/MiniCalendar';
import SearchSection from '../../Components/main/SearchSection';
import UpcomingMeetings from '../../Components/main/UpcomingMeetings';
import TimeTable from '../../Components/main/MainCalendar/TimeTable';
import RoomScheduleView from './RoomScheduleView';
import RoomSelector from './RoomSelector';
import Toast from '../../Components/common/Toast';

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
  const history = useHistory();
  const { addMeeting } = useMeetings(); // Get optimistic update function

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

  // Hàm xử lý thay đổi ngày
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // Cập nhật currentMonth để MiniCalendar hiển thị đúng tháng
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  // Hàm xử lý thay đổi tháng từ MiniCalendar
  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  // Hàm xử lý khi tạo meeting - OPTIMISTIC UPDATE
  const handleMeetingCreated = (meetingData, message) => {
    if (meetingData) {
      // Add to shared cache immediately - NO API CALL!
      addMeeting(meetingData);
      
      // ✅ Trigger immediate refresh để hiển thị meeting mới ngay lập tức
      // Không cần delay vì đã có optimistic update
      setRefreshTrigger(prev => prev + 1);
      
      // ✅ Also trigger a delayed refresh để đảm bảo backend đã xử lý xong
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1500); // Delayed refresh after 1.5 seconds
      
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

  const [selectedRoomId, setSelectedRoomId] = useState(null);

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
      />
      
      <div className="main-content">
        <div className="container">
          {/* Left Panel */}
          <div className="left-panel">
            {/* ✅ VIEW MODE TOGGLE - Swap giữa Calendar và Room */}
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

            {/* ✅ ROOM SELECTOR - Chỉ hiển thị khi ở Room mode */}
            {viewMode === 'room' && (
              <RoomSelector 
                selectedRoomId={selectedRoomId}
                onRoomSelect={setSelectedRoomId}
              />
            )}

            {/* ✅ GỘP CHUNG MINICALENDAR VÀ NAVIGATION THÀNH 1 KHỐI */}
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

            <SearchSection />
            <UpcomingMeetings />
          </div>
          
          {/* Right Panel */}
          <div className="right-panel">
            {viewMode === 'calendar' ? (
              <TimeTable 
                selectedDate={selectedDate} 
                viewType={viewType}
                refreshTrigger={refreshTrigger}
                onDateSelect={handleDateChange}
                onMeetingUpdated={handleMeetingCreated}
              />
            ) : (
              <RoomScheduleView 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                viewType={viewType}
                selectedRoomId={selectedRoomId}
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