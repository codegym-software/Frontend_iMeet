import React, { useState, useEffect } from 'react';
import meetingService from '../../services/meetingService';
import { useActivity } from './ActivityContext';
import { usePreloadedData } from './DataPreloaderContext';
import MeetingFilters from './components/MeetingFilters';
import MeetingTableRow from './components/MeetingTableRow';
import MeetingDetailModal from './components/MeetingDetailModal';

const MeetingList = () => {
  const { addActivity } = useActivity();
  const { meetings: preloadedMeetings, meetingsLoading, loadMeetings, setMeetings: setPreloadedMeetings } = usePreloadedData();
  
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  // Sync with preloaded data
  useEffect(() => {
    setAllMeetings(preloadedMeetings);
    setLoading(meetingsLoading);
  }, [preloadedMeetings, meetingsLoading]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  };

  const handleCancelMeeting = async (meeting) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy cuộc họp "${meeting.title}"?`)) {
      try {
        setCancellingId(meeting.meetingId);
        console.log('Full meeting object:', meeting);
        console.log('Meeting ID:', meeting.meetingId, 'Type:', typeof meeting.meetingId);
        
        // Ensure meetingId is a number
        const meetingId = parseInt(meeting.meetingId);
        console.log('Parsed Meeting ID:', meetingId);
        
        const response = await meetingService.cancelMeeting(meetingId);
        console.log('Cancel response:', response);
        
        // Check if response is successful (could be different formats)
        if (response && (response.success || response.status === 'success' || response.message)) {
          showNotification('success', `Đã hủy cuộc họp "${meeting.title}" thành công!`);
          
          // Log activity
          const startTime = new Date(meeting.startTime).toLocaleString('vi-VN');
          const roomInfo = meeting.roomName ? ` | 🏢 Phòng: ${meeting.roomName}` : '';
          addActivity('meeting', 'delete', meeting.title, `📅 Thời gian: ${startTime}${roomInfo}`);
          
          // Reload meetings
          await loadMeetings();
        } else {
          showNotification('error', `${response?.message || 'Lỗi khi hủy cuộc họp'}`);
        }
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        console.error('Error details:', error.response?.data);
        
        // Check if meeting was already cancelled (backend returns 404 with this message)
        if (error.response?.data?.message === 'Cuộc họp đã được hủy trước đó') {
          showNotification('success', `Cuộc họp "${meeting.title}" đã được hủy!`);
          // Reload meetings to update UI
          await loadMeetings();
        } else {
          const errorMsg = error.response?.data?.message 
            || error.response?.data?.error
            || error.message 
            || 'Không thể kết nối đến server';
          
          showNotification('error', `Lỗi khi hủy cuộc họp: ${errorMsg}`);
        }
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
      <MeetingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        setCurrentPage={setCurrentPage}
        statusConfig={statusConfig}
      />

      {/* Meetings Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        {loading ? (
          // Loading state
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>Đang tải...</div>
            <div style={{ fontSize: '14px', color: '#999' }}>Vui lòng chờ trong giây lát</div>
          </div>
        ) : allMeetings.length === 0 ? (
          // Empty state when no meetings at all
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
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
                {paginatedMeetings.map((meeting, index) => (
                  <MeetingTableRow
                    key={meeting.meetingId || index}
                    meeting={meeting}
                    statusConfig={statusConfig}
                    formatDateTime={formatDateTime}
                    formatDuration={formatDuration}
                    onViewDetail={handleViewDetail}
                    onCancel={handleCancelMeeting}
                    cancellingId={cancellingId}
                  />
                ))}
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
      {showDetailModal && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          statusConfig={statusConfig}
          onClose={() => setShowDetailModal(false)}
          onCancel={handleCancelMeeting}
          formatDateTime={formatDateTime}
          formatDuration={formatDuration}
        />
      )}
    </div>
  );
};

export default MeetingList;
