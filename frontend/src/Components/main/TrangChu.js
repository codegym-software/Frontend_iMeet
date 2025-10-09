// src/Components/main/Main.js
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext'; // Điều chỉnh đường dẫn cho đúng
import './TrangChu.css';
import TopBar from './TopBar';
import MiniCalendar from './MiniCalendar';
import SearchSection from './SearchSection';
import TimeInsight from './TimeInsight';
import OtherSchedule from './OtherSchedule';
import TimeTable from './TimeTable';

const Main = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('day');
  const [theme, setTheme] = useState('light');
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

  return (
    <div className="main">
      <TopBar 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        viewType={viewType}
        onViewChange={handleViewChange}
        theme={theme}
        toggleTheme={toggleTheme}
        history={history} // Thêm history prop
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
            <TimeInsight />
            <OtherSchedule />
          </div>
          
          {/* Right Panel */}
          <div className="right-panel">
            <TimeTable 
              selectedDate={selectedDate} 
              viewType={viewType} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap với AuthProvider nếu chưa có
export default Main;