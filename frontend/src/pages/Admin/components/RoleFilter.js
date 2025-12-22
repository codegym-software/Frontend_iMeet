import React from 'react';

const RoleFilter = ({ roleFilter, setRoleFilter, stats }) => {
  const filters = [
    { value: 'ALL', label: 'Tất cả', icon: '👥', count: stats?.totalUsers || 0 },
    { value: 'ADMIN', label: 'Admin', icon: '👑', count: stats?.adminCount || 0 },
    { value: 'USER', label: 'User', icon: '👤', count: stats?.userCount || 0 }
  ];

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
        display: 'flex', 
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setRoleFilter(filter.value)}
            style={{
              flex: '1',
              minWidth: '150px',
              padding: '16px 20px',
              backgroundColor: roleFilter === filter.value ? '#007bff' : '#f8f9fa',
              color: roleFilter === filter.value ? 'white' : '#2c3e50',
              border: roleFilter === filter.value ? '2px solid #007bff' : '2px solid #e9ecef',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (roleFilter !== filter.value) {
                e.currentTarget.style.backgroundColor = '#e9ecef';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (roleFilter !== filter.value) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{ fontSize: '28px' }}>{filter.icon}</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>{filter.label}</div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: roleFilter === filter.value ? 'white' : '#007bff'
            }}>
              {filter.count}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleFilter;
