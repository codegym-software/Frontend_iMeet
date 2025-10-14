// components/TopBar.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import './TopBar.css';
import { MdSettings } from 'react-icons/md';
import { IoSunny, IoMoon } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';
import calendarLogo from '../../assets/calendar-logo.png';
import MeetingForm from './MeetingForm'; // Import MeetingForm

const TopBar = ({ selectedDate, onDateChange, viewType, onViewChange, theme, toggleTheme, onCreateEvent, onMeetingCreated }) => {
  const { logout, user } = useAuth();
  const history = useHistory();
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false); // Thay thế create dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Lấy thông tin user từ context hoặc localStorage
  const getUserData = () => {
    // Ưu tiên user từ context (quan trọng để tự động cập nhật)
    if (user) return user;

    // Fallback: lấy từ localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedData = JSON.parse(userData);
      return parsedData;
    }

    const oauth2Data = localStorage.getItem('oauth2User');
    if (oauth2Data) {
      const oauth2User = JSON.parse(oauth2Data);
      // Xử lý dữ liệu OAuth2 để có cấu trúc nhất quán
      return {
        ...oauth2User,
        fullName: oauth2User.name || oauth2User.fullName,
        email: oauth2User.email,
        username: oauth2User.username || oauth2User.email?.split('@')[0],
        avatarUrl: oauth2User.picture || oauth2User.avatarUrl
      };
    }

    return null;
  };

  const userData = getUserData();

  // Xử lý hiển thị tên và email từ database
  let displayName = userData?.fullName || userData?.name || 'User';
  let userEmail = userData?.email || '';

  // Nếu không có fullName, sử dụng username
  if (!userData?.fullName && !userData?.name && userData?.username) {
    displayName = userData.username;
  }

  const avatarUrl = userData?.avatarUrl;
  const isGooglePicture = avatarUrl && avatarUrl.startsWith('https://');
  const isBase64Data = avatarUrl && avatarUrl.startsWith('data:');

  // Tạo avatar từ tên hoặc email
  const getAvatarInitials = () => {
    if (userData?.fullName) {
      return userData.fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userData?.email) {
      return userData.email[0].toUpperCase();
    }
    return 'U';
  };

  // Render avatar - ưu tiên avatar upload, sau đó Google picture, cuối cùng là initials
  const renderAvatar = () => {
    if (avatarUrl) {
      let imageSrc = avatarUrl;

      if (isGooglePicture) {
        // Google picture URL
        imageSrc = avatarUrl;
      } else if (isBase64Data) {
        // Base64 data URL từ database
        imageSrc = avatarUrl;
      } else {
        // Fallback cho uploaded file (nếu có)
        imageSrc = `http://localhost:8081${avatarUrl}`;
      }

      return (
        <img
          src={imageSrc}
          alt={displayName}
          className="avatar-image"
        />
      );
    } else {
      return getAvatarInitials();
    }
  };

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsViewDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date) => {
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

  const getViewDisplayName = () => {
    switch (viewType) {
      case 'day': return 'Day';
      case 'week': return 'Week';
      case 'month': return 'Month';
      case 'year': return 'Year';
      case 'schedule': return 'Schedule';
      default: return 'Week';
    }
  };

  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else if (viewType === 'schedule') {
      newDate.setDate(newDate.getDate() - 7); // Schedule thường hiển thị theo tuần
    }
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(selectedDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else if (viewType === 'schedule') {
      newDate.setDate(newDate.getDate() + 7); // Schedule thường hiển thị theo tuần
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const handleViewSelect = (newViewType) => {
    onViewChange(newViewType);
    setIsViewDropdownOpen(false);
  };

  const handleAvatarClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleProfileClick = () => {
    history.push('/profile');
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileDropdownOpen(false);
    } catch (error) {
      // Silent error handling
    }
  };

  // Xử lý Create button - mở form trực tiếp
  const handleCreateClick = () => {
    setShowMeetingForm(true);
  };

  const handleMeetingFormClose = () => {
    setShowMeetingForm(false);
  };

  const handleMeetingFormSubmit = (meetingData) => {
    setShowMeetingForm(false);
    
    // Gọi callback để refresh meetings
    if (onMeetingCreated) {
      onMeetingCreated();
    }
    
    // Legacy callback
    if (onCreateEvent) {
      onCreateEvent('Event', selectedDate, meetingData);
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-content">
        {/* Left Section - Menu, Logo, Date Navigation */}
        <div className="top-bar-left">
          <div className="logo-section">
            <div className="app-logo">
              <img src={calendarLogo} alt="iMeet Logo" className="logo-image" />
            </div>
          </div>

          <div className="date-navigation">
            <button className="nav-btn" onClick={goToToday}>
              Today
            </button>

            <div className="nav-arrows">
              <button className="arrow-btn" onClick={goToPrevious}>
                ‹
              </button>
              <button className="arrow-btn" onClick={goToNext}>
                ›
              </button>
            </div>

            <div className="current-date">
              {formatDate(selectedDate)}
            </div>
          </div>
        </div>

        {/* Center Section - Search và Create Button */}
        <div className="top-bar-center">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create Button - Mở form trực tiếp */}
          <div className="create-button-container">
            <button
              className="create-button primary"
              onClick={handleCreateClick}
            >
              <FaPlus className="create-icon" />
              <span className="create-text">Create</span>
            </button>
          </div>
        </div>

        {/* Right Section - View Controls, Settings, User */}
        <div className="top-bar-right">
          {/* View Selector Dropdown */}
          <div className="view-selector-container" ref={dropdownRef}>
            <button
              className="view-selector-btn"
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            >
              <span className="view-selector-text">{getViewDisplayName()}</span>
              <span className={`dropdown-arrow ${isViewDropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>

            {isViewDropdownOpen && (
              <div className="view-dropdown">
                <button
                  className={`dropdown-item ${viewType === 'day' ? 'active' : ''}`}
                  onClick={() => handleViewSelect('day')}
                >
                  <span className="dropdown-item-text">Day</span>
                  {viewType === 'day' && <span className="checkmark">✓</span>}
                </button>

                <button
                  className={`dropdown-item ${viewType === 'week' ? 'active' : ''}`}
                  onClick={() => handleViewSelect('week')}
                >
                  <span className="dropdown-item-text">Week</span>
                  {viewType === 'week' && <span className="checkmark">✓</span>}
                </button>

                <button
                  className={`dropdown-item ${viewType === 'month' ? 'active' : ''}`}
                  onClick={() => handleViewSelect('month')}
                >
                  <span className="dropdown-item-text">Month</span>
                  {viewType === 'month' && <span className="checkmark">✓</span>}
                </button>

                <button
                  className={`dropdown-item ${viewType === 'year' ? 'active' : ''}`}
                  onClick={() => handleViewSelect('year')}
                >
                  <span className="dropdown-item-text">Year</span>
                  {viewType === 'year' && <span className="checkmark">✓</span>}
                </button>

                {/* Thêm Schedule option */}
                <button
                  className={`dropdown-item ${viewType === 'schedule' ? 'active' : ''}`}
                  onClick={() => handleViewSelect('schedule')}
                >
                  <span className="dropdown-item-text">Schedule</span>
                  {viewType === 'schedule' && <span className="checkmark">✓</span>}
                </button>
              </div>
            )}
          </div>

          <div className="top-actions">
            {/* Theme Toggle Button */}
            <button
              className="action-btn theme-toggle-btn"
              onClick={() => {
                toggleTheme();
                setIsProfileDropdownOpen(false);
              }}
              title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
            >
              <span className="action-icon">
                {theme === 'light' ? <IoSunny /> : <IoMoon />}
              </span>
            </button>

            {/* User Profile với Dropdown */}
            <div className="user-profile-container" ref={profileDropdownRef}>
              <div
                className="user-profile"
                onClick={handleAvatarClick}
                title={`${displayName} - Click to view profile`}
              >
                <div className="user-avatar">
                  {renderAvatar()}
                </div>
                <span className="user-name">{displayName}</span>
              </div>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="user-info">
                    <div className="user-avatar-container">
                      <div className="user-avatar-large">
                        {renderAvatar()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{displayName}</span>
                        <span className="user-email">{userEmail}</span>
                      </div>
                    </div>
                    <div className="profile-actions">
                      <button onClick={handleProfileClick} className="profile-btn">
                        View Profile
                      </button>
                      <button onClick={handleLogout} className="logout-btn">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render Meeting Form Modal */}
      {showMeetingForm && (
        <MeetingForm
          selectedDate={selectedDate}
          onClose={handleMeetingFormClose}
          onSubmit={handleMeetingFormSubmit}
        />
      )}
    </div>
  );
};

export default TopBar;