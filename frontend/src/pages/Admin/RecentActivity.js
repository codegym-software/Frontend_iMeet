import React, { useEffect, useState } from 'react';
import { useActivity } from './ActivityContext';

const RecentActivity = () => {
  const [filter, setFilter] = useState('all'); // all, room, device, user, meeting
  
  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .activity-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .activity-scroll::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .activity-scroll::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 10px;
      }
      .activity-scroll::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const { getRecentActivities, clearActivities } = useActivity();
  const allActivities = getRecentActivities(20); // Show up to 20 activities
  
  // Filter activities based on selected filter
  const recentActivities = filter === 'all' 
    ? allActivities 
    : allActivities.filter(activity => activity.type === filter);

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử hoạt động?')) {
      clearActivities();
    }
  };

  // Helper function to get activity icon and color
  const getActivityStyle = (type, action) => {
    const styles = {
      room: {
        add: { color: '#28a745', icon: '🏢', label: 'Thêm phòng', bgColor: '#d4edda' },
        update: { color: '#ffc107', icon: '🏢', label: 'Cập nhật phòng', bgColor: '#fff3cd' },
        delete: { color: '#dc3545', icon: '🏢', label: 'Xóa phòng', bgColor: '#f8d7da' }
      },
      device: {
        add: { color: '#28a745', icon: '💻', label: 'Thêm thiết bị', bgColor: '#d4edda' },
        update: { color: '#ffc107', icon: '💻', label: 'Cập nhật thiết bị', bgColor: '#fff3cd' },
        delete: { color: '#dc3545', icon: '💻', label: 'Xóa thiết bị', bgColor: '#f8d7da' }
      },
      user: {
        add: { color: '#28a745', icon: '👥', label: 'Thêm người dùng', bgColor: '#d4edda' },
        update: { color: '#ffc107', icon: '👥', label: 'Cập nhật người dùng', bgColor: '#fff3cd' },
        delete: { color: '#dc3545', icon: '👥', label: 'Xóa người dùng', bgColor: '#f8d7da' }
      },
      meeting: {
        add: { color: '#28a745', icon: '📅', label: 'Tạo cuộc họp', bgColor: '#d4edda' },
        update: { color: '#ffc107', icon: '📅', label: 'Cập nhật cuộc họp', bgColor: '#fff3cd' },
        delete: { color: '#dc3545', icon: '📅', label: 'Hủy cuộc họp', bgColor: '#f8d7da' }
      }
    };

    return styles[type]?.[action] || { color: '#6c757d', icon: '📋', label: 'Hoạt động', bgColor: '#e9ecef' };
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filters = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'room', label: 'Rooms Management', icon: '🏢' },
    { value: 'device', label: 'Equipments', icon: '💻' },
    { value: 'user', label: 'Users', icon: '👥' },
    { value: 'meeting', label: 'Meeting List', icon: '📅' }
  ];

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>Recent Activity</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6c757d', backgroundColor: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
            {recentActivities.length} hoạt động
          </span>
          {allActivities.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                fontSize: '11px',
                color: '#dc3545',
                backgroundColor: 'transparent',
                border: '1px solid #dc3545',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc3545';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#dc3545';
              }}
            >
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        paddingBottom: '16px',
        borderBottom: '1px solid #e9ecef'
      }}>
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              border: filter === f.value ? '2px solid #007bff' : '1px solid #dee2e6',
              borderRadius: '20px',
              backgroundColor: filter === f.value ? '#e7f3ff' : 'white',
              color: filter === f.value ? '#007bff' : '#6c757d',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (filter !== f.value) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#adb5bd';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f.value) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#dee2e6';
              }
            }}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      {allActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p style={{ fontSize: '14px', margin: 0 }}>Chưa có hoạt động nào</p>
          <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#adb5bd' }}>
            Các hoạt động thêm, sửa, xóa phòng, thiết bị và người dùng sẽ hiển thị ở đây
          </p>
        </div>
      ) : recentActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ fontSize: '14px', margin: 0 }}>Không tìm thấy hoạt động nào</p>
          <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#adb5bd' }}>
            Thử chọn bộ lọc khác
          </p>
        </div>
      ) : (
        <div 
          className="activity-scroll"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '8px'
          }}
        >
          {recentActivities.map((activity) => {
          const style = getActivityStyle(activity.type, activity.action);
          
          return (
            <div 
              key={activity.id} 
              style={{ 
                padding: '12px', 
                backgroundColor: style.bgColor,
                borderRadius: '8px', 
                borderLeft: `4px solid ${style.color}`,
                transition: 'all 0.2s ease',
                border: `1px solid ${style.color}40`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px', marginTop: '2px', flexShrink: 0 }}>{style.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      {style.label}
                    </p>
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#adb5bd',
                      backgroundColor: '#f8f9fa',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p style={{ 
                    margin: '0 0 6px 0', 
                    fontSize: '13px', 
                    fontWeight: '500',
                    color: '#495057',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {activity.itemName}
                  </p>
                  {activity.details && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '12px', 
                      color: '#495057',
                      lineHeight: '1.5',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${style.color}30`
                    }}>
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
