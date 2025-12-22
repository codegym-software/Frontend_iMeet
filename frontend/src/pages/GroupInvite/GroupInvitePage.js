import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { validateGroupInvite, acceptGroupInvite } from '../../services/groupService';
import './GroupInvitePage.css';

const GroupInvitePage = () => {
  const { token: rawToken } = useParams();
  // Decode token if it's URL encoded
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const hasAuth = !!localStorage.getItem('token');

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      const res = await acceptGroupInvite(token);
      if (res?.success) {
        setData((prev) => prev ? { ...prev, joined: true } : prev);
        // B5: Thành công → xóa token + redirect group
        localStorage.removeItem('pending_invite_token');
        history.push('/trang-chu');
      } else {
        const errorMsg = res?.message || 'Không thể tham gia nhóm';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Accept invite error:', err);
      // Extract error message from axios error response
      const errorMsg = err?.response?.data?.message || 
                      err?.response?.data?.data?.message ||
                      err?.message || 
                      'Không thể tham gia nhóm. Vui lòng thử lại.';
      setError(errorMsg);
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError('Token không hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // B1: Lưu token vào localStorage
        localStorage.setItem('pending_invite_token', token);
        
        // Validate token
        const res = await validateGroupInvite(token);
        
        // Backend returns: { success: boolean, message: string, data: ValidateInviteResponse }
        // ValidateInviteResponse has: { valid: boolean, groupName, invitedByName, invitedEmail, ... }
        if (res?.success && res?.data?.valid) {
          // Extract data from response
          const inviteData = res.data;
          setData({
            groupName: inviteData.groupName,
            invitedByName: inviteData.invitedByName,
            invitedEmail: inviteData.invitedEmail,
            groupId: inviteData.groupId,
            role: inviteData.role,
            userExists: inviteData.userExists
          });
          
          // Nếu đã login → redirect về trang chủ để xác nhận
          if (hasAuth) {
            // Redirect to home page where user can confirm joining
            history.push('/trang-chu');
            return;
          }
          // Nếu chưa logged in → hiển thị UI để chuyển sang login/signup (đã có trong render)
        } else {
          // Handle error response - backend may return 400 but with message
          const errorMsg = res?.message || res?.data?.message || 'Link mời không hợp lệ hoặc đã hết hạn';
          setError(errorMsg);
          // Remove invalid token
          localStorage.removeItem('pending_invite_token');
        }
      } catch (err) {
        console.error('Validate invite error:', err);
        // Extract error message from axios error response
        const errorMsg = err?.response?.data?.message || 
                        err?.response?.data?.data?.message ||
                        err?.message || 
                        'Không thể xác thực lời mời. Vui lòng kiểm tra lại link.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasAuth]);

  const savePendingAndRedirect = (path) => {
    // Token đã được lưu trong useEffect, chỉ cần redirect
    history.push(path || '/login');
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">Đang xác thực lời mời...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-title">Lời mời không hợp lệ</div>
          <div className="invite-desc">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-title">Bạn được mời vào nhóm</div>
        <div className="invite-group">{data?.groupName}</div>
        <div className="invite-desc">
          Người mời: {data?.invitedByName || '—'}
          <br />
          Email được mời: {data?.invitedEmail}
        </div>

        <div className="invite-actions">
          {hasAuth ? (
            <button className="btn-primary" disabled={accepting} onClick={handleAccept}>
              {accepting ? 'Đang tham gia...' : 'Tham gia nhóm'}
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={() => savePendingAndRedirect('/login')}>
                Đăng nhập để tham gia
              </button>
              <button className="btn-secondary" onClick={() => savePendingAndRedirect('/signup')}>
                Tạo tài khoản
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInvitePage;

