import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import authService from '../services/authService';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import './ChangePassword.css';

const ChangePassword = ({ onBack }) => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuth2User, setIsOAuth2User] = useState(false);

  // Kiểm tra xem user có phải OAuth2 không
  React.useEffect(() => {
    const oauth2User = localStorage.getItem('oauth2User');
    const token = localStorage.getItem('token');
    
    console.log('ChangePassword - OAuth2 User:', oauth2User ? 'Yes' : 'No');
    console.log('ChangePassword - Token:', token ? 'Exists' : 'None');
    
    if (oauth2User) {
      setIsOAuth2User(true);
      setMessage({ 
        text: 'Tài khoản Google không thể đổi mật khẩu tại đây. Vui lòng đổi mật khẩu trên tài khoản Google của bạn.', 
        type: 'error' 
      });
    } else if (!token) {
      setMessage({ 
        text: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.', 
        type: 'error' 
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Check password requirements
  const checkPasswordRequirements = (password) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const passwordRequirements = checkPasswordRequirements(formData.newPassword);

  const validateForm = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ text: 'Vui lòng điền đầy đủ thông tin!', type: 'error' });
      return false;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ text: 'Mật khẩu mới phải có ít nhất 8 ký tự!', type: 'error' });
      return false;
    }

    if (!passwordRequirements.hasUpperCase || !passwordRequirements.hasLowerCase || 
        !passwordRequirements.hasNumber || !passwordRequirements.hasSpecialChar) {
      setMessage({ text: 'Mật khẩu phải đáp ứng tất cả các yêu cầu bên dưới!', type: 'error' });
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp!', type: 'error' });
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({ text: 'Mật khẩu mới phải khác mật khẩu hiện tại!', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ngăn OAuth2 users submit form
    if (isOAuth2User) {
      setMessage({ 
        text: 'Tài khoản Google không thể đổi mật khẩu tại đây.', 
        type: 'error' 
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.success) {
        setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });
        
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Redirect back after 2 seconds
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            history.push('/profile');
          }
        }, 2000);
      } else {
        setMessage({ 
          text: response.message || 'Đổi mật khẩu thất bại!', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('ChangePassword - Full error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu!';
      
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        // Nếu error.response.data là object, lấy message từ đó
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      console.error('ChangePassword - Error message:', errorMessage);
      
      // Nếu token hết hạn (401), redirect về login sau 2 giây
      if (error.response?.status === 401 || errorMessage.includes('Token không hợp lệ') || errorMessage.includes('hết hạn')) {
        setMessage({ 
          text: errorMessage + ' Đang chuyển về trang đăng nhập...', 
          type: 'error' 
        });
        
        // Clear localStorage và redirect
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          history.push('/login');
        }, 2000);
      } else {
        setMessage({ 
          text: errorMessage, 
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      history.push('/profile');
    }
  };

  return (
    <div className="change-password-card">
        <div className="change-password-header">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
          </button>
          <h2>Đổi mật khẩu</h2>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                disabled={isLoading || isOAuth2User}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                disabled={isLoading || isOAuth2User}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Requirements - Always visible */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Yêu cầu mật khẩu mạnh:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: passwordRequirements.minLength ? '#10b981' : '#ef4444' }}>
                    {passwordRequirements.minLength ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordRequirements.minLength ? '#059669' : '#6b7280' }}>
                    Ít nhất 8 ký tự
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: passwordRequirements.hasUpperCase ? '#10b981' : '#ef4444' }}>
                    {passwordRequirements.hasUpperCase ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordRequirements.hasUpperCase ? '#059669' : '#6b7280' }}>
                    Có ít nhất 1 chữ cái viết hoa (A-Z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: passwordRequirements.hasLowerCase ? '#10b981' : '#ef4444' }}>
                    {passwordRequirements.hasLowerCase ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordRequirements.hasLowerCase ? '#059669' : '#6b7280' }}>
                    Có ít nhất 1 chữ cái viết thường (a-z)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: passwordRequirements.hasNumber ? '#10b981' : '#ef4444' }}>
                    {passwordRequirements.hasNumber ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordRequirements.hasNumber ? '#059669' : '#6b7280' }}>
                    Có ít nhất 1 chữ số (0-9)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: passwordRequirements.hasSpecialChar ? '#10b981' : '#ef4444' }}>
                    {passwordRequirements.hasSpecialChar ? '✓' : '✗'}
                  </span>
                  <span style={{ color: passwordRequirements.hasSpecialChar ? '#059669' : '#6b7280' }}>
                    Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                disabled={isLoading || isOAuth2User}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleBack}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading || isOAuth2User}
            >
              {isLoading ? 'Đang xử lý...' : isOAuth2User ? 'Không khả dụng' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default ChangePassword;
