import React from 'react';

const MeetingFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, setCurrentPage, statusConfig }) => {
  return (
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
  );
};

export default MeetingFilters;
