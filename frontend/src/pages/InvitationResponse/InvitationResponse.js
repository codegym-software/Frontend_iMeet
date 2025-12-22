import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import invitationService from '../../services/invitationService';
import './InvitationResponse.css';

const InvitationResponse = () => {
  const location = useLocation();
  const history = useHistory();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [token, setToken] = useState(null);
  const [action, setAction] = useState(null);

  useEffect(() => {
    // Extract query parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    const actionParam = searchParams.get('action');

    setToken(tokenParam);
    setAction(actionParam);

    if (!tokenParam || !actionParam) {
      setStatus('error');
      setMessage('Token hoặc action không hợp lệ');
      return;
    }

    const handleInvitation = async () => {
      try {
        setStatus('loading');
        
        let response;
        if (actionParam === 'accept') {
          response = await invitationService.acceptInvitation(tokenParam);
        } else if (actionParam === 'decline') {
          response = await invitationService.declineInvitation(tokenParam);
        } else {
          throw new Error('Action không hợp lệ');
        }

        if (response.success) {
          setStatus('success');
          setMessage(response.message || (actionParam === 'accept' ? 'Bạn đã chấp nhận lời mời thành công!' : 'Bạn đã từ chối lời mời!'));
          // If response contains meeting info, store it
          if (response.data && typeof response.data === 'object') {
            setMeetingInfo(response.data);
          }
        } else {
          setStatus('error');
          setMessage(response.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Có lỗi xảy ra, vui lòng thử lại sau');
        console.error('Error handling invitation:', error);
      }
    };

    handleInvitation();
  }, [location]);

  return (
    <div className="invitation-response-container">
      <div className="invitation-response-card">
        {status === 'loading' && (
          <div className="invitation-loading">
            <div className="spinner"></div>
            <p>Đang xử lý lời mời...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="invitation-success">
            <div className="success-icon">✓</div>
            <h1>{action === 'accept' ? '✅ Chấp nhận thành công' : '✅ Từ chối thành công'}</h1>
            <p className="invitation-message">{message}</p>
            
            {meetingInfo && (
              <div className="meeting-info">
                <h2>Thông tin cuộc họp</h2>
                <div className="info-item">
                  <span className="label">Tiêu đề:</span>
                  <span className="value">{meetingInfo.title || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Mô tả:</span>
                  <span className="value">{meetingInfo.description || 'Không có mô tả'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Thời gian bắt đầu:</span>
                  <span className="value">{new Date(meetingInfo.startTime).toLocaleString('vi-VN')}</span>
                </div>
                <div className="info-item">
                  <span className="label">Thời gian kết thúc:</span>
                  <span className="value">{new Date(meetingInfo.endTime).toLocaleString('vi-VN')}</span>
                </div>
                {meetingInfo.roomName && (
                  <div className="info-item">
                    <span className="label">Phòng họp:</span>
                    <span className="value">{meetingInfo.roomName}</span>
                  </div>
                )}
                {meetingInfo.roomLocation && (
                  <div className="info-item">
                    <span className="label">Địa điểm:</span>
                    <span className="value">{meetingInfo.roomLocation}</span>
                  </div>
                )}
              </div>
            )}

            <div className="invitation-actions">
              <button 
                className="btn-primary" 
                onClick={() => history.push('/')}
              >
                Về trang chủ
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => history.push('/meetings')}
              >
                Xem lịch họp
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="invitation-error">
            <div className="error-icon">✗</div>
            <h1>⚠️ Có lỗi xảy ra</h1>
            <p className="invitation-message error">{message}</p>
            
            <div className="invitation-actions">
              <button 
                className="btn-primary" 
                onClick={() => history.push('/')}
              >
                Về trang chủ
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => history.goBack()}
              >
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationResponse;
