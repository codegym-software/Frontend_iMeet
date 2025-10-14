import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const layoutStyle = {
    display: 'flex',
    minHeight: '100vh'
  };

  const mainContentStyle = {
    marginLeft: '250px',
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

  return (
    <div style={layoutStyle}>
      <Sidebar />
      <div style={mainContentStyle}>
        <div style={contentAreaStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;