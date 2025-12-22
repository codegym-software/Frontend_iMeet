import React, { useEffect } from 'react';

const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Prevent click propagation to elements behind modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Prevent all events from propagating outside the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Prevent keyboard events from propagating
  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    >
      <div 
        onClick={handleModalClick}
        onKeyDown={handleKeyDown}
        style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        width: '500px',
        maxWidth: '90vw',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#fee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '32px'
        }}>
          ⚠️
        </div>

        {/* Title */}
        <h3 style={{ 
          fontSize: '22px', 
          fontWeight: '600', 
          color: '#2c3e50', 
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Xác nhận xóa người dùng
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '16px',
          color: '#666',
          textAlign: 'center',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          Bạn có chắc chắn muốn xóa người dùng{' '}
          <strong style={{ color: '#2c3e50' }}>"{user?.fullName}"</strong>?
        </p>

        {/* User Info Card */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>📧 Email: </span>
            <span style={{ fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
              {user?.email}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#666' }}>🎭 Vai trò: </span>
            <span style={{ fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#856404'
        }}>
          ⚠️ Hành động này không thể hoàn tác!
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{ 
              padding: '12px 32px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm}
            style={{ 
              padding: '12px 32px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
          >
            Xóa
          </button>
        </div>

        {/* Animation */}
        <style>
          {`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
