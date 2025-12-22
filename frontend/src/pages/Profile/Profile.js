import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { FaRegCalendarAlt, FaCog, FaEdit, FaCheck, FaTimes, FaCamera } from 'react-icons/fa';
import { SiGooglecalendar } from 'react-icons/si';
import ChangePassword from '../../Components/ChangePassword';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import './Profile.css';
import calendarLogo from '../../assets/calendar-logo.png';

export default function Profile({ onSave }) {
  const history = useHistory();
  const { user, updateUser } = useAuth();
  
  // Google Calendar connection
  const { 
    isConnected, 
    connectedEmail, 
    loading: googleCalendarLoading, 
    error: googleCalendarError,
    connect: connectGoogleCalendar,
    disconnect: disconnectGoogleCalendar,
    refreshStatus
  } = useGoogleCalendar();
  
  // Simplified state management
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [message, setMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Settings dropdown
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  
  // Avatar upload
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // In a real app, this would fetch from your backend
      // For now, get data from localStorage/context or use dummy data
      const userData = getUserData();
      if (userData) {
        // Xử lý tên hiển thị
        const displayName = userData.fullName || userData.name || 'User';
        setName(displayName);
        
        // Xử lý username và email từ database
        let username = userData.username;
        let email = userData.email;
        
        // Nếu đăng nhập bằng email nhưng không có username
        if (email && !username) {
          // Tạo username từ email (phần trước @)
          username = email.split('@')[0];
        }
        
        setUsername(username || 'user');
        setEmail(email || 'user@example.com');
        
        // Avatar - ưu tiên picture từ OAuth2, sau đó avatarUrl
        const avatarSource = userData.picture || userData.avatarUrl;
        if (avatarSource) {
          setAvatar(avatarSource);
        } else {
          setAvatar(null); // Set null để hiển thị initials
        }
      } else {
        // Fallback dummy data
        setName('User');
        setUsername('user');
        setEmail('user@example.com');
        setAvatar(null);
      }
    };
    fetchProfile();
  }, [user]);
  
  // Effect riêng để kiểm tra calendar callback
  useEffect(() => {
    const handleCalendarCallback = async () => {
      // Kiểm tra localStorage flag từ Google Calendar callback
      const calendarJustConnected = localStorage.getItem('calendar_just_connected');
      const calendarError = localStorage.getItem('calendarConnectError');
      
      if (calendarJustConnected === 'true') {
        setMessage('Kết nối Google Calendar thành công!');
        // Xóa tất cả flags ngay lập tức để tránh trigger lại
        localStorage.removeItem('calendar_just_connected');
        localStorage.removeItem('calendar_connecting');
        localStorage.removeItem('calendar_connecting_time');
        localStorage.removeItem('calendarConnectSuccess');
        localStorage.removeItem('calendarConnectError');
        
        // Replace history để xóa entry Google OAuth khỏi history stack
        // Đảm bảo khi user click "quay lại" sẽ về trang chủ, không phải Google OAuth
        if (window.history.length > 1) {
          // Replace current entry với profile để xóa entry callback và OAuth
          window.history.replaceState(null, '', '/profile');
        }
        
        // Refresh status kết nối Google Calendar
        try {
          // Đợi một chút để backend cập nhật xong
          await new Promise(resolve => setTimeout(resolve, 500));
          // Force refresh Google Calendar status
          if (typeof refreshStatus === 'function') {
            await refreshStatus();
          }
        } catch (error) {
          console.error('Error refreshing calendar status:', error);
        }
        
        // Tự động ẩn thông báo sau 3 giây
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setMessage('');
          }
        }, 3000);
      } else if (calendarError) {
        // Hiển thị lỗi nếu có
        setMessage(calendarError);
        // Xóa flags
        localStorage.removeItem('calendarConnectError');
        localStorage.removeItem('calendar_connecting');
        localStorage.removeItem('calendar_connecting_time');
        localStorage.removeItem('calendar_just_connected');
        
        // Tự động ẩn thông báo sau 5 giây
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setMessage('');
          }
        }, 5000);
      }
      
      // Kiểm tra và clear flag connecting nếu còn sót lại (tránh trigger lại)
      const isConnecting = localStorage.getItem('calendar_connecting');
      if (isConnecting === 'true') {
        const connectingTime = localStorage.getItem('calendar_connecting_time');
        // Nếu flag cũ quá 5 phút, clear nó
        if (connectingTime) {
          const timeDiff = Date.now() - parseInt(connectingTime);
          if (timeDiff > 5 * 60 * 1000) {
            localStorage.removeItem('calendar_connecting');
            localStorage.removeItem('calendar_connecting_time');
          }
        } else {
          // Nếu không có timestamp, clear luôn
        localStorage.removeItem('calendar_connecting');
        }
      }
    };
    
    handleCalendarCallback();
  }, [refreshStatus]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear timeout khi component unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Lấy thông tin user từ context hoặc localStorage
  const getUserData = () => {
    // Ưu tiên user từ context
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

  // Lấy thông tin OAuth2 user từ server
  const getOAuth2UserData = async () => {
    try {
      const response = await authService.checkOAuth2Status();
      if (response.authenticated) {
        return {
          id: response.sub,
          username: response.username,
          email: response.email,
          fullName: response.fullName || response.name,
          picture: response.picture,
          authType: 'cognito-oauth2-server',
          attributes: response.attributes
        };
      }
    } catch (error) {
      // Silent error handling
    }
    return null;
  };

  const userData = getUserData();
  const avatarUrl = userData?.avatarUrl;
  const isGooglePicture = avatarUrl && avatarUrl.startsWith('https://');
  const isBase64Data = avatarUrl && avatarUrl.startsWith('data:');
  
  // Xác định loại tài khoản
  const isOAuth2Account = userData?.authType === 'cognito-oauth2-server' || 
                         userData?.authType === 'oauth2-server' ||
                         isGooglePicture;
  const accountType = isOAuth2Account ? 'Google Account' : 'Traditional Account';
  
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
          alt={userData.fullName || userData.username || 'User'}
          className="simple-profile-avatar-img"
        />
      );
    } else {
      return getAvatarInitials();
    }
  };

  const handleBack = () => {
    // Luôn về trang chủ thay vì dùng goBack() để tránh quay về Google OAuth
    // sau khi kết nối Google Calendar thành công
    history.push('/trang-chu');
  };
  
  const handleLogout = () => {
    authService.logout();
    history.push('/login');
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave({ name, username, email });
    }
  };

  const handleResetPassword = () => {
    if (isOAuth2Account) {
      return; // Chỉ return mà không hiển thị thông báo
    }
    setShowChangePassword(true);
  };

  const handleBackFromChangePassword = () => {
    setShowChangePassword(false);
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      // Clear các flags cũ trước khi bắt đầu kết nối mới
      localStorage.removeItem('calendar_just_connected');
      localStorage.removeItem('calendarConnectSuccess');
      localStorage.removeItem('calendarConnectError');
      
      // Lấy auth URL và set flag connecting với timestamp
      localStorage.setItem('calendar_connecting', 'true');
      localStorage.setItem('calendar_connecting_time', Date.now().toString());
      
      // connectGoogleCalendar sẽ redirect đến Google OAuth
      await connectGoogleCalendar();
      // Note: Code sau dòng này sẽ không chạy vì đã redirect
    } catch (error) {
      // Nếu có lỗi trước khi redirect, clear flag và hiển thị lỗi
      localStorage.removeItem('calendar_connecting');
      localStorage.removeItem('calendar_connecting_time');
      setMessage(error.message || 'Không thể kết nối Google Calendar');
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setMessage('');
        }
      }, 3000);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      const message = await disconnectGoogleCalendar();
      setMessage(message || 'Đã ngắt kết nối Google Calendar thành công');
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setMessage('');
        }
      }, 3000);
    } catch (error) {
      setMessage(error.message || 'Không thể ngắt kết nối Google Calendar');
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setMessage('');
        }
      }, 3000);
    }
  };

  // Name edit handlers
  const startEditName = () => {
    if (isOAuth2Account) {
      return; // Chỉ return mà không hiển thị thông báo
    }
    setTempName(name);
    setEditingName(true);
  };

  const cancelEditName = () => {
    setTempName('');
    setEditingName(false);
  };

  const saveEditName = async () => {
    if (!tempName.trim()) {
      setMessage('Tên không được để trống');
      return;
    }
    
    try {
      if (isMountedRef.current) {
        setIsUpdating(true);
      }
      
      // Thử gọi API, nhưng nếu fail thì vẫn cập nhật local
      let apiSuccess = false;
      try {
        const response = await authService.updateProfile({
          name: tempName.trim()
        });
        apiSuccess = response.success;
      } catch (apiError) {
        apiSuccess = false;
      }
      
      // Cập nhật local data
      const userData = getUserData();
      if (userData) {
        const updatedUserData = {
          ...userData,
          fullName: tempName.trim()
        };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        // Cập nhật context để TopBar tự động cập nhật
        updateUser({ fullName: tempName.trim() });
      }
      
      if (isMountedRef.current) {
        setName(tempName.trim());
        setEditingName(false);
      }
      
        // Call onSave callback
        if (onSave) {
          onSave({ name: tempName.trim(), username, email });
        }
        
        // Hiển thị thông báo thành công
        if (isMountedRef.current) {
          setMessage('Cập nhật tên thành công!');
          
          // Tự động ẩn thông báo sau 3 giây
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setMessage('');
            }
          }, 3001);
        }
      
    } catch (error) {
      if (isMountedRef.current) {
        setMessage('Có lỗi xảy ra khi cập nhật tên');
        
        // Tự động ẩn thông báo lỗi sau 3 giây
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setMessage('');
          }
        }, 3001);
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  };
  
  // Avatar upload handlers
  const handleAvatarClick = () => {
    if (isOAuth2Account) {
      return; // Chỉ return mà không hiển thị thông báo
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (isMountedRef.current) {
          setAvatar(e.target?.result);
          
          // Lưu avatar vào localStorage
          const userData = getUserData();
          if (userData) {
            const updatedUserData = {
              ...userData,
              avatarUrl: e.target?.result
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Cập nhật context để TopBar tự động cập nhật
            updateUser({ avatarUrl: e.target?.result });
            
            // Dispatch custom event để các component khác cập nhật avatar
            window.dispatchEvent(new Event('avatarUpdated'));
          }
          
          // Gửi lên server để lưu database
          try {
            const formData = new FormData();
            formData.append('avatar', file);
            await authService.uploadAvatar(formData);
          } catch (error) {
            // Server upload failed, but local update successful
          }
          
          // Hiển thị thông báo thành công
          setMessage('Cập nhật ảnh đại diện thành công!');
          
          // Tự động ẩn thông báo sau 3 giây
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setMessage('');
            }
          }, 3001);
        }
      };
      
          reader.onerror = (error) => {
            setMessage('Có lỗi khi đọc file ảnh');
          };
      
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="profile-main-container">
      {/* Change Password Modal Overlay */}
      {showChangePassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <ChangePassword onBack={handleBackFromChangePassword} />
          </div>
        </div>
      )}
      {/* Header */}
      <div className="profile-header">
        {/* Left side with back button, logo and title */}
        <div className="profile-header-left">
          {/* Back button */}
          <div className="profile-back-button" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* Logo and title */}
          <div className="profile-header-brand">
             <div className="profile-header-logo-wrapper">
               <img 
                 src={calendarLogo} 
                 alt="iMeet Logo" 
                 className="profile-header-logo" 
               />
             </div>
            <span className="profile-header-title">iMeet</span>
          </div>
        </div>
        
        {/* Settings button with dropdown */}
        <div className="profile-settings-container" ref={settingsRef}>
          <div 
            className="profile-settings-button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <FaCog className="profile-settings-icon" />
          </div>
          
          {isSettingsOpen && (
            <div className="profile-settings-dropdown">
              <button onClick={handleLogout} className="profile-logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Message Display - ở phần trên trang */}
      {message && (
        <div className={`profile-top-message ${message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <div className="profile-content-layout">
        <div className="profile-avatar-container">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {renderAvatar()}
            </div>
            {!isOAuth2Account && (
              <div className="profile-avatar-overlay" onClick={handleAvatarClick}>
                <FaCamera className="profile-avatar-camera" />
              </div>
            )}
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleAvatarChange}
            onClick={(e) => {
              e.target.value = ''; // Reset để có thể chọn cùng file
            }}
            style={{ display: 'none' }}
          />
        </div>
        <div className="profile-fields">
          {/* Account Type Display - Only for OAuth2 accounts */}
          {isOAuth2Account && (
            <div className="profile-field-row">
              <label className="profile-label">Account Type:</label>
              <div className="profile-input-container">
                <div className="profile-account-type">
                  <span className="profile-account-badge oauth2">
                    {accountType}
                  </span>
                  <span className="profile-account-note">
                    (Thông tin được đồng bộ từ Google)
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Name Field */}
          <div className="profile-field-row">
            <label className="profile-label" htmlFor="profile-name">Your name:</label>
            <div className="profile-input-container">
              <input 
                className={`profile-input ${editingName ? 'editing' : 'readonly'}`}
                id="profile-name" 
                type="text" 
                value={editingName ? tempName : name} 
                onChange={e => setTempName(e.target.value)}
                readOnly={!editingName}
              />
              <div className="profile-edit-actions">
                {!editingName ? (
                  <button 
                    className={`profile-edit-btn ${isOAuth2Account ? 'disabled' : ''}`} 
                    onClick={startEditName}
                    disabled={isOAuth2Account}
                    title={isOAuth2Account ? 'Không thể chỉnh sửa tài khoản Google' : 'Chỉnh sửa tên'}
                  >
                    <FaEdit />
                  </button>
                ) : (
                  <div className="profile-edit-buttons">
                    <button className="profile-save-btn" onClick={saveEditName} disabled={isUpdating}>
                      {isUpdating ? <i className="fas fa-spinner fa-spin"></i> : <FaCheck />}
                    </button>
                    <button className="profile-cancel-btn" onClick={cancelEditName} disabled={isUpdating}>
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Username Field */}
          <div className="profile-field-row">
            <label className="profile-label" htmlFor="profile-username">Use name:</label>
            <div className="profile-input-container">
              <input 
                className="profile-input readonly disabled"
                id="profile-username" 
                type="text" 
                value={username} 
                readOnly={true}
              />
            </div>
          </div>
          
          {/* Email Field */}
          <div className="profile-field-row">
            <label className="profile-label" htmlFor="profile-email">Email:</label>
            <div className="profile-input-container">
              <input 
                className="profile-input readonly disabled"
                id="profile-email" 
                type="email" 
                value={email} 
                readOnly={true}
              />
            </div>
          </div>
          
          {/* Google Calendar Section */}
          <div className="profile-field-row">
            <div className="profile-label"></div>
            <div className="profile-google-calendar-container">
              {isConnected ? (
                <>
                  {/* Trạng thái đã kết nối */}
                  <div className="profile-google-calendar-status">
                    <div className="profile-google-calendar-status-header">
                      <SiGooglecalendar className="profile-google-calendar-icon connected" />
                      <div className="profile-google-calendar-status-info">
                        <div className="profile-google-calendar-status-title">
                          Đã kết nối Google Calendar
                        </div>
                        {connectedEmail && (
                          <div className="profile-google-calendar-status-email">
                            {connectedEmail}
                          </div>
                        )}
                      </div>
                      <div className="profile-google-calendar-status-badge">
                        <span className="status-dot"></span>
                        Đã kết nối
                      </div>
                    </div>
                    <div className="profile-google-calendar-sync-notice">
                      <span className="sync-icon">✓</span>
                      Đồng bộ hóa tự động đã bật
                    </div>
                    <button 
                      className="profile-google-calendar-disconnect-btn" 
                      onClick={handleDisconnectGoogleCalendar}
                      disabled={googleCalendarLoading}
                    >
                      {googleCalendarLoading ? 'Đang xử lý...' : 'Ngắt kết nối'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Trạng thái chưa kết nối */}
                  <div className="profile-google-calendar-status">
                    <div className="profile-google-calendar-status-header">
                      <SiGooglecalendar className="profile-google-calendar-icon disconnected" />
                      <div className="profile-google-calendar-status-info">
                        <div className="profile-google-calendar-status-title">
                          Chưa kết nối Google Calendar
                        </div>
                        <div className="profile-google-calendar-status-description">
                          Kết nối để đồng bộ lịch họp với Google Calendar
                        </div>
                      </div>
                      <div className="profile-google-calendar-status-badge disconnected">
                        <span className="status-dot"></span>
                        Chưa kết nối
                      </div>
                    </div>
                    {googleCalendarError && (
                      <div className="profile-google-calendar-error">
                        {googleCalendarError}
                      </div>
                    )}
                    <button 
                      className="profile-google-calendar-btn" 
                      onClick={handleConnectGoogleCalendar}
                      disabled={googleCalendarLoading}
                    >
                      <SiGooglecalendar className="profile-google-calendar-icon" />
                      <span>{googleCalendarLoading ? 'Đang kết nối...' : 'Kết nối Google Calendar'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {!isOAuth2Account && (
            <div className="profile-btn-row">
              <button 
                className="profile-reset-btn" 
                onClick={handleResetPassword}
              >
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}