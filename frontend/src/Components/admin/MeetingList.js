import React, { useState, useEffect } from 'react';
import meetingService from '../../services/meetingService';
import { useActivity } from './ActivityContext';

const MeetingList = () => {
  const { addActivity } = useActivity();
  const [allMeetings, setAllMeetings] = useState([]); // Store all meetings
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, booked, confirmed, cancelled
  const [currentPage, setCurrentPage] = useState(0);
  const [notification, setNotification] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const itemsPerPage = 10;

  const statusConfig = {
    booked: { label: 'Đã đặt', color: '#17a2b8', bgColor: '#d1ecf1' },
    confirmed: { label: 'Đã xác nhận', color: '#28a745', bgColor: '#d4edda' },
    cancelled: { label: 'Đã hủy', color: '#dc3545', bgColor: '#f8d7da' }
  };

  // Load all meetings once on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingService.getAllMeetings();

      if (response && response.success) {
        const meetingsData = response.data || [];
        setAllMeetings(meetingsData);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
      showNotification('error', 'Lỗi khi tải danh sách cuộc họp');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCancelMeeting = async (meeting) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy cuộc họp "${meeting.title}"?`)) {
      try {
        setCancellingId(meeting.meetingId);
        const response = await meetingService.cancelMeeting(meeting.meetingId);
        
        if (response && response.success) {
          showNotification('success', `✅ Đã hủy cuộc họp "${meeting.title}" thành công!`);
          
          // Log activity
          const startTime = new Date(meeting.startTime).toLocaleString('vi-VN');
          const roomInfo = meeting.roomName ? ` | 🏢 Phòng: ${meeting.roomName}` : '';
          addActivity('meeting', 'delete', meeting.title, `📅 Thời gian: ${startTime}${roomInfo}`);
          
          // Reload meetings
          await loadMeetings();
        } else {
          showNotification('error', `❌ ${response.message || 'Lỗi khi hủy cuộc họp'}`);
        }
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        showNotification('error', `❌ Lỗi khi hủy cuộc họp: ${error.message}`);
      } finally {
        setCancellingId(null);
      }
    }
  };

  const handleViewDetail = (meeting) => {
    setSelectedMeeting(meeting);
    setShowDetailModal(true);
  };

  // Filter meetings by status first, then by search term
  const statusFilteredMeetings = filterStatus === 'all' 
    ? allMeetings 
    : allMeetings.filter(meeting => meeting.bookingStatus?.toLowerCase() === filterStatus.toLowerCase());

  const filteredMeetings = statusFilteredMeetings.filter(meeting => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (meeting.title || '').toLowerCase().includes(search) ||
      (meeting.description || '').toLowerCase().includes(search) ||
      (meeting.roomName || '').toLowerCase().includes(search) ||
      (meeting.roomLocation || '').toLowerCase().includes(search) ||
      (meeting.userName || '').toLowerCase().includes(search) ||
      (meeting.userEmail || '').toLowerCase().includes(search) ||
      String(meeting.meetingId || '').includes(search)
    );
  });

  // Paginate filtered meetings
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);
  
  // Update total pages based on filtered results
  const calculatedTotalPages = Math.ceil(filteredMeetings.length / itemsPerPage);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  if (loading && allMeetings.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>Đang tải...</div>
        <div style={{ fontSize: '14px', color: '#999' }}>Vui lòng chờ trong giây lát</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>
          📅 Meeting List
        </h1>
        <p style={{ fontSize: '14px', color: '#7f8c8d', margin: 0 }}>
          Quản lý và theo dõi các cuộc họp
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
          color: notification.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              color: 'inherit'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm cuộc họp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'booked', 'confirmed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(0);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: filterStatus === status ? '2px solid #007bff' : '1px solid #dee2e6',
                  borderRadius: '20px',
                  backgroundColor: filterStatus === status ? '#e7f3ff' : 'white',
                  color: filterStatus === status ? '#007bff' : '#6c757d',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {status === 'all' ? '📋 Tất cả' : statusConfig[status]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        {allMeetings.length === 0 ? (
          // Empty state when no meetings at all
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', width: '80px' }}>ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Tiêu đề</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Thời gian</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Phòng họp</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Người tạo</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Ngày tạo</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Trạng thái</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Thao tác</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#adb5bd' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>Chưa có cuộc họp nào. Hãy thêm mới!</p>
            </div>
          </div>
        ) : paginatedMeetings.length === 0 ? (
          // Empty state when filtered results are empty
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', width: '80px' }}>ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Tiêu đề</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Thời gian</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Phòng họp</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Người tạo</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Ngày tạo</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Trạng thái</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Thao tác</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#adb5bd' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>Không tìm thấy cuộc họp nào phù hợp</p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057', width: '80px' }}>ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Tiêu đề & Mô tả</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Thời gian</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Phòng họp</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Người tạo</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Ngày tạo</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Trạng thái</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMeetings.map((meeting, index) => {
                  const status = statusConfig[meeting.bookingStatus] || statusConfig.booked;
                  const isCancelled = meeting.bookingStatus === 'cancelled';
                  
                  return (
                    <tr
                      key={meeting.meetingId || index}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        opacity: isCancelled ? 0.6 : 1
                      }}
                    >
                      {/* Meeting ID */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#6c757d',
                          backgroundColor: '#f8f9fa',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          #{meeting.meetingId}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px', fontSize: '14px' }}>
                          {meeting.title}
                        </div>
                        {meeting.description && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6c757d', 
                            maxWidth: '250px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            lineHeight: '1.4'
                          }}>
                            {meeting.description}
                          </div>
                        )}
                      </td>

                      {/* Start Time + End Time */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#495057', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#28a745' }}>▶</span> {formatDateTime(meeting.startTime)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#495057' }}>
                          <span style={{ fontWeight: '600', color: '#dc3545' }}>■</span> {formatDateTime(meeting.endTime)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                          ⏱️ {formatDuration(meeting.startTime, meeting.endTime)}
                        </div>
                      </td>

                      {/* Room Name */}
                      <td style={{ padding: '16px' }}>
                        {meeting.roomName ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                              🏢 {meeting.roomName}
                            </div>
                            {meeting.roomLocation && (
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                📍 {meeting.roomLocation}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#adb5bd' }}>-</span>
                        )}
                      </td>

                      {/* Creator (User Name) */}
                      <td style={{ padding: '16px' }}>
                        {meeting.userName ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                              👤 {meeting.userName}
                            </div>
                            {meeting.userEmail && (
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                📧 {meeting.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#adb5bd' }}>-</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#495057' }}>
                          {formatDateTime(meeting.createdAt)}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: status.color,
                          backgroundColor: status.bgColor
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleViewDetail(meeting)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#138496'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                          >
                            Chi tiết
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => handleCancelMeeting(meeting)}
                              disabled={cancellingId === meeting.meetingId}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: cancellingId === meeting.meetingId ? '#6c757d' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: cancellingId === meeting.meetingId ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (cancellingId !== meeting.meetingId) {
                                  e.currentTarget.style.backgroundColor = '#c82333';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (cancellingId !== meeting.meetingId) {
                                  e.currentTarget.style.backgroundColor = '#dc3545';
                                }
                              }}
                            >
                              {cancellingId === meeting.meetingId ? 'Đang hủy...' : 'Hủy'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {calculatedTotalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: currentPage === 0 ? '#e9ecef' : '#007bff',
              color: currentPage === 0 ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Trước
          </button>
          <span style={{ fontSize: '14px', color: '#495057' }}>
            Trang {currentPage + 1} / {calculatedTotalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(calculatedTotalPages - 1, prev + 1))}
            disabled={currentPage >= calculatedTotalPages - 1}
            style={{
              padding: '8px 16px',
              backgroundColor: currentPage >= calculatedTotalPages - 1 ? '#e9ecef' : '#007bff',
              color: currentPage >= calculatedTotalPages - 1 ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage >= calculatedTotalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Sau →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMeeting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                Chi tiết cuộc họp
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    Meeting ID
                  </label>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                    #{selectedMeeting.meetingId}
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    Tiêu đề
                  </label>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                    {selectedMeeting.title}
                  </p>
                </div>

                {selectedMeeting.description && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      Mô tả
                    </label>
                    <p style={{ fontSize: '14px', color: '#495057', margin: 0, lineHeight: '1.6' }}>
                      {selectedMeeting.description}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      Thời gian bắt đầu
                    </label>
                    <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                      📅 {formatDateTime(selectedMeeting.startTime)}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      Thời gian kết thúc
                    </label>
                    <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                      📅 {formatDateTime(selectedMeeting.endTime)}
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    Thời lượng
                  </label>
                  <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                    ⏱️ {formatDuration(selectedMeeting.startTime, selectedMeeting.endTime)}
                  </p>
                </div>

                {selectedMeeting.roomName && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      Phòng họp
                    </label>
                    <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                      🏢 {selectedMeeting.roomName}
                      {selectedMeeting.roomLocation && (
                        <span style={{ color: '#6c757d', fontSize: '12px', marginLeft: '8px' }}>
                          📍 {selectedMeeting.roomLocation}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {selectedMeeting.userName && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      Người tạo
                    </label>
                    <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                      👤 {selectedMeeting.userName}
                      {selectedMeeting.userEmail && (
                        <span style={{ color: '#6c757d', fontSize: '12px', marginLeft: '8px' }}>
                          📧 {selectedMeeting.userEmail}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {selectedMeeting.createdAt && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                      Ngày tạo
                    </label>
                    <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                      📅 {formatDateTime(selectedMeeting.createdAt)}
                    </p>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                    Trạng thái
                  </label>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: statusConfig[selectedMeeting.bookingStatus]?.color || '#6c757d',
                    backgroundColor: statusConfig[selectedMeeting.bookingStatus]?.bgColor || '#e9ecef'
                  }}>
                    {statusConfig[selectedMeeting.bookingStatus]?.label || 'Không xác định'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Đóng
              </button>
              {selectedMeeting.bookingStatus !== 'cancelled' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCancelMeeting(selectedMeeting);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Hủy cuộc họp
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
