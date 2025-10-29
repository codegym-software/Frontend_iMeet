import React from 'react';
import { FaEye, FaTimes } from 'react-icons/fa';

const MeetingTableRow = ({ 
  meeting, 
  statusConfig, 
  formatDateTime, 
  formatDuration, 
  onViewDetail, 
  onCancel, 
  cancellingId
}) => {
  const status = statusConfig[meeting.bookingStatus?.toLowerCase()] || statusConfig.pending;
  const isCancelled = meeting.bookingStatus?.toLowerCase() === 'cancelled';

  return (
    <tr
      style={{
        borderBottom: '1px solid #f0f0f0',
        opacity: isCancelled ? 0.6 : 1
      }}
    >
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

      {/* Actions */}
      <td style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onViewDetail(meeting)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#138496'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
            title="Xem chi tiết"
          >
            <FaEye />
          </button>
          
          {/* Show Cancel button for confirmed meetings */}
          {meeting.bookingStatus?.toLowerCase() === 'confirmed' && onCancel && (
            <button
              onClick={() => onCancel(meeting)}
              disabled={cancellingId === meeting.meetingId}
              style={{
                padding: '8px 12px',
                backgroundColor: cancellingId === meeting.meetingId ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: cancellingId === meeting.meetingId ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px'
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
              title="Hủy cuộc họp"
            >
              {cancellingId === meeting.meetingId ? '...' : <FaTimes />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default MeetingTableRow;
