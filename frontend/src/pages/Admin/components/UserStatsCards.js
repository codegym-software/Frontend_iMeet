import React from 'react';

const UserStatsCards = ({ stats, loading }) => {
  const statsCards = [
    { 
      label: 'Tổng người dùng', 
      value: stats?.totalUsers || 0, 
      color: '#007bff',
      bgColor: '#e7f3ff',
      icon: '👥'
    },
    { 
      label: 'Admin', 
      value: stats?.adminCount || 0, 
      color: '#dc3545',
      bgColor: '#ffe5e5',
      icon: '👑'
    },
    { 
      label: 'User', 
      value: stats?.userCount || 0, 
      color: '#17a2b8',
      bgColor: '#d1ecf1',
      icon: '👤'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px', 
      marginBottom: '30px' 
    }}>
      {statsCards.map((stat, index) => (
        <div 
          key={index}
          style={{ 
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ 
              fontSize: '32px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: stat.bgColor,
              borderRadius: '12px'
            }}>
              {stat.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: stat.color,
                lineHeight: '1'
              }}>
                {loading ? '...' : stat.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatsCards;
