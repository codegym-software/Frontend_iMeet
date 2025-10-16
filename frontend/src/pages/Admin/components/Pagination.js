import React from 'react';

const Pagination = ({ currentPage, totalPages, totalElements, currentItems, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '20px',
      padding: '16px 20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        style={{
          padding: '10px 20px',
          backgroundColor: currentPage === 0 ? '#e9ecef' : '#007bff',
          color: currentPage === 0 ? '#6c757d' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        ← Trước
      </button>
      
      <div style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
        Trang {currentPage + 1} / {totalPages} • Hiển thị {currentItems.length} / {totalElements} users
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        style={{
          padding: '10px 20px',
          backgroundColor: currentPage >= totalPages - 1 ? '#e9ecef' : '#007bff',
          color: currentPage >= totalPages - 1 ? '#6c757d' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        Sau →
      </button>
    </div>
  );
};

export default Pagination;
