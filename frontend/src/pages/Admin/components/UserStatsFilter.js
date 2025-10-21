import React from 'react';

const UserStatsFilter = ({ roleFilter, setRoleFilter, stats, loading }) => {
  const filters = [
    { 
      value: 'ALL', 
      label: 'Tất cả', 
      icon: '👥', 
      count: stats?.totalUsers || 0,
      color: '#007bff',
      bgColor: '#e7f3ff'
    },
    { 
      value: 'ADMIN', 
      label: 'Admin', 
      icon: '👑', 
      count: stats?.adminCount || 0,
      color: '#dc3545',
      bgColor: '#ffe5e8'
    },
    { 
      value: 'USER', 
      label: 'User', 
      icon: '👤', 
      count: stats?.userCount || 0,
      color: '#17a2b8',
      bgColor: '#e0f7fa'
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        textAlign: 'center',
        color: '#666'
      }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {filters.map((filter) => {
          const isActive = roleFilter === filter.value;
          
          return (
            <button
              key={filter.value}
              onClick={() => setRoleFilter(filter.value)}
              style={{
                padding: '20px',
                backgroundColor: isActive ? filter.color : 'white',
                color: isActive ? 'white' : '#2c3e50',
                border: `2px solid ${isActive ? filter.color : '#e9ecef'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? `0 4px 12px ${filter.color}40` : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = filter.bgColor;
                  e.currentTarget.style.borderColor = filter.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${filter.color}30`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Icon */}
              <div style={{ 
                fontSize: '32px',
                filter: isActive ? 'brightness(1.2)' : 'none'
              }}>
                {filter.icon}
              </div>
              
              {/* Label */}
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500',
                opacity: isActive ? 1 : 0.8
              }}>
                {filter.label}
              </div>
              
              {/* Count */}
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700',
                color: isActive ? 'white' : filter.color,
                lineHeight: '1'
              }}>
                {filter.count}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UserStatsFilter;
