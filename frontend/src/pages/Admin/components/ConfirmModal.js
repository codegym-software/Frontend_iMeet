import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', type = 'confirm' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
        return '#17a2b8';
      default:
        return '#007bff';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '32px' }}>{getIcon()}</span>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <div style={{
          fontSize: '15px',
          color: '#495057',
          lineHeight: '1.6',
          marginBottom: '24px',
          paddingLeft: '44px'
        }}>
          {message}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#6c757d',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#dee2e6';
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: getColor(),
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
