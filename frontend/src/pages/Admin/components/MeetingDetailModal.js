import React from 'react';

const MeetingDetailModal = ({ meeting, statusConfig, onClose, onCancel, formatDateTime, formatDuration }) => {
  if (!meeting) return null;

  return (
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
      onClick={onClose}
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
            onClick={onClose}
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
                #{meeting.meetingId}
              </p>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                Tiêu đề
              </label>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                {meeting.title}
              </p>
            </div>

            {meeting.description && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                  Mô tả
                </label>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0, lineHeight: '1.6' }}>
                  {meeting.description}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                  Thời gian bắt đầu
                </label>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  📅 {formatDateTime(meeting.startTime)}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                  Thời gian kết thúc
                </label>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  📅 {formatDateTime(meeting.endTime)}
                </p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                Thời lượng
              </label>
              <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                ⏱️ {formatDuration(meeting.startTime, meeting.endTime)}
              </p>
            </div>

            {meeting.roomName && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                  Phòng họp
                </label>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  🏢 {meeting.roomName}
                  {meeting.roomLocation && (
                    <span style={{ color: '#6c757d', fontSize: '12px', marginLeft: '8px' }}>
                      📍 {meeting.roomLocation}
                    </span>
                  )}
                </p>
              </div>
            )}

            {meeting.userName && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                  Người tạo
                </label>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  👤 {meeting.userName}
                  {meeting.userEmail && (
                    <span style={{ color: '#6c757d', fontSize: '12px', marginLeft: '8px' }}>
                      📧 {meeting.userEmail}
                    </span>
                  )}
                </p>
              </div>
            )}

            {meeting.createdAt && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
                  Ngày tạo
                </label>
                <p style={{ fontSize: '14px', color: '#495057', margin: 0 }}>
                  📅 {formatDateTime(meeting.createdAt)}
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
                color: statusConfig[meeting.bookingStatus]?.color || '#6c757d',
                backgroundColor: statusConfig[meeting.bookingStatus]?.bgColor || '#e9ecef'
              }}>
                {statusConfig[meeting.bookingStatus]?.label || 'Không xác định'}
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
            onClick={onClose}
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
          {meeting.bookingStatus !== 'cancelled' && (
            <button
              onClick={() => {
                onClose();
                onCancel(meeting);
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
  );
};

export default MeetingDetailModal;
