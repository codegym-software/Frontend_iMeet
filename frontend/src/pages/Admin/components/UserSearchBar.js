import React, { useState, useEffect } from 'react';

const UserSearchBar = ({ searchTerm, setSearchTerm }) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setSearchTerm]);
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo email, tên hoặc vai trò..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            fontSize: '15px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#007bff'}
          onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
        />
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '18px',
          color: '#666'
        }}>
          🔍
        </div>
      </div>
      {searchTerm && (
        <div style={{ 
          marginTop: '12px', 
          fontSize: '14px', 
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>Đang tìm kiếm: <strong>{searchTerm}</strong></span>
          <button
            onClick={() => {
              setLocalSearch('');
              setSearchTerm('');
            }}
            style={{
              padding: '4px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};

export default UserSearchBar;
