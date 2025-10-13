import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const OAuth2Callback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang đăng nhập...');
  const history = useHistory();
  const location = useLocation();
  const { checkAuthStatus, forceRefreshAuth, setUser } = useAuth();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setMessage('Đang xử lý thông tin đăng nhập...');
      
      // Đợi ngắn để Spring Security hoàn tất xử lý
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Lấy thông tin user từ server
      const response = await fetch('http://localhost:8081/api/oauth2/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        if (userData.authenticated) {
          // Lưu user data vào localStorage
          const oauth2User = {
            id: userData.sub,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName || userData.name,
            avatarUrl: userData.picture,
            authType: 'cognito-oauth2-server',
            attributes: userData.attributes
          };
          
          localStorage.setItem('oauth2User', JSON.stringify(oauth2User));
          
          // Cập nhật AuthContext ngay lập tức
          setUser(oauth2User);
          
          setStatus('success');
          setMessage('Đăng nhập thành công!');
          
          // Đợi AuthContext cập nhật xong trước khi chuyển hướng
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Force refresh auth để đảm bảo authentication state được cập nhật
          await forceRefreshAuth();
          
          // Chuyển hướng
          history.replace('/trang-chu');
          return;
        }
      }
      
      throw new Error('Authentication failed');
      
    } catch (error) {
      setStatus('error');
      setMessage('Đăng nhập thất bại. Đang chuyển về trang đăng nhập...');
      
      // Clear any existing auth data
      localStorage.removeItem('oauth2User');
      localStorage.removeItem('user');
      
      setTimeout(() => {
        history.replace('/login');
      }, 2000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner}>
          {status === 'processing' && <div style={styles.loader}></div>}
          {status === 'success' && <div style={styles.success}>✓</div>}
          {status === 'error' && <div style={styles.error}>✗</div>}
        </div>
        <h2 style={styles.title}>
          {status === 'processing' && 'Đang xử lý...'}
          {status === 'success' && 'Thành công!'}
          {status === 'error' && 'Lỗi!'}
        </h2>
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%'
  },
  spinner: {
    marginBottom: '1rem'
  },
  loader: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  },
  success: {
    fontSize: '2rem',
    color: '#27ae60',
    fontWeight: 'bold'
  },
  error: {
    fontSize: '2rem',
    color: '#e74c3c',
    fontWeight: 'bold'
  },
  title: {
    color: '#333',
    marginBottom: '1rem'
  },
  message: {
    color: '#666',
    lineHeight: 1.5
  }
};

// CSS cho animation
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default OAuth2Callback;