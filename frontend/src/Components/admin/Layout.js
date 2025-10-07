import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { usePreloadedData } from './DataPreloaderContext';

const Layout = ({ children }) => {
  const { isPreloading } = usePreloadedData();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const layoutStyle = {
    display: 'flex',
    minHeight: '100vh'
  };

  const mainContentStyle = {
    marginLeft: isCollapsed ? '80px' : '250px',
    flex: 1,
    backgroundColor: '#f5f6fa',
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh'
  };

  const contentAreaStyle = {
    padding: '20px',
    maxWidth: '100%',
    overflowX: 'auto'
  };

  // Show loading overlay while preloading data
  if (isPreloading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f6fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>
            ⚙️
          </div>
          <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>
            Đang tải dữ liệu...
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Đang đồng bộ phòng, thiết bị và người dùng
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={layoutStyle}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div style={mainContentStyle}>
        <div style={contentAreaStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;