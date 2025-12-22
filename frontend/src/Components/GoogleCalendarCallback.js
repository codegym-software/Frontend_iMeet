import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const GoogleCalendarCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang hoàn tất kết nối Google Calendar...');
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const success = searchParams.get('success') === 'true';
      const error = searchParams.get('error');

      // Clear connecting flag và timestamp ngay lập tức để tránh trigger lại
      localStorage.removeItem('calendar_connecting');
      localStorage.removeItem('calendar_connecting_time');

      if (success) {
        // Set flag để Profile.js biết đã kết nối thành công
        localStorage.setItem('calendar_just_connected', 'true');
        // Redirect về profile thay vì login
        history.replace('/profile');
      } else {
        // If there was an error, redirect to profile với error message
        let errorMessage = 'Kết nối Google Calendar thất bại.';
        if (error === 'access_denied') {
          errorMessage = 'Bạn đã từ chối quyền truy cập Google Calendar. Vui lòng thử lại.';
        }
        localStorage.setItem('calendarConnectError', errorMessage);
        // Vẫn redirect về profile để user có thể thử lại
        history.replace('/profile');
      }
    } catch (e) {
      // Generic error, redirect to profile
      localStorage.removeItem('calendar_connecting');
      localStorage.setItem('calendarConnectError', 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
      history.replace('/profile');
    }
  }, [history, location]);

  // This component will be visible for a very short time while redirecting.
  // We can show a simple processing message.
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner}>
          <div style={styles.loader}></div>
        </div>
        <h2 style={styles.title}>Đang xử lý...</h2>
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
    borderTop: '4px solid #4285f4',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
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
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default GoogleCalendarCallback;
