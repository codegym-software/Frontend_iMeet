import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { FaRegCalendarAlt, FaCog, FaEdit, FaCheck, FaTimes, FaCamera } from 'react-icons/fa';
import ChangePassword from './ChangePassword';
import './Profile.css';
import calendarLogo from '../public/calendar-logo.png';

export default function Profile({ onSave }) {
  const history = useHistory();
  const { user, updateUser } = useAuth();
  
  // Simplified state management
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('https://placehold.co/180x180');
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [message, setMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
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
        
        // Avatar
        setAvatar(userData.avatarUrl || 'https://placehold.co/180x180');
      } else {
        // Fallback dummy data
        setName('User');
        setUsername('user');
        setEmail('user@example.com');
        setAvatar('https://placehold.co/180x180');
      }
    };
    fetchProfile();
  }, [user]);
  
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
    history.goBack();
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


  if (showChangePassword) {
    return <ChangePassword onBack={handleBackFromChangePassword} />;
  }
  
  // Remove the userData check since we're using fallback data
  
  return (
    <div className="profile-main-container">
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
        
        {/* Settings button */}
        <div className="profile-settings-button">
          <FaCog className="profile-settings-icon" />
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
            <img className="profile-avatar" src={avatar} alt="Avatar" />
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