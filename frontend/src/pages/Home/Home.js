// src/Components/main/Main.js
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import './Home.css';
import TopBar from '../../Components/main/TopBar';
import MiniCalendar from '../../Components/main/MiniCalendar';
import SearchSection from '../../Components/main/SearchSection';
import UpcomingMeetings from '../../Components/main/UpcomingMeetings';
import OtherSchedule from '../../Components/main/OtherSchedule';
import TimeTable from '../../Components/main/MainCalendar/TimeTable';
import Toast from '../../Components/common/Toast';

const Main = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('day');
  const [theme, setTheme] = useState('light');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const history = useHistory();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const toggleTheme = () => { 
    setTheme(theme === 'light' ? 'dark' : 'light'); 
  };  

  // Hàm xử lý thay đổi view type
  const handleViewChange = (newViewType) => {
    setViewType(newViewType);
  };

  // Hàm xử lý thay đổi ngày
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // Hàm xử lý thay đổi tháng từ MiniCalendar
  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  // Hàm xử lý khi tạo meeting thành công
  const handleMeetingCreated = (meetingData, message) => {
    console.log('handleMeetingCreated called, refreshing calendar...');
    setRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('refreshTrigger updated:', prev, '->', newValue);
      return newValue;
    });
    
    // Show toast if message provided
    if (message) {
      setToast({
        isOpen: true,
        message: message,
        type: 'success'
      });
    }
  };

  return (
    <div className="main">
      <TopBar 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        viewType={viewType}
        onViewChange={handleViewChange}
        theme={theme}
        toggleTheme={toggleTheme}
        history={history}
        onMeetingCreated={handleMeetingCreated}
      />
      
      <div className="main-content">
        <div className="container">
          {/* Left Panel */}
          <div className="left-panel">
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
            <OtherSchedule />
          </div>
          
          {/* Right Panel */}
          <div className="right-panel">
            <TimeTable 
              selectedDate={selectedDate} 
              viewType={viewType}
              refreshTrigger={refreshTrigger}
              onDateSelect={handleDateChange}
              onMeetingUpdated={handleMeetingCreated}
            />
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

// Wrap với AuthProvider nếu chưa có
export default Main;