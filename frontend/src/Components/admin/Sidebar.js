import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const history = useHistory();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: '📊',
      color: '#FF6B6B'
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: '👥',
      color: '#4ECDC4'
    },
    {
      name: 'Rooms Management',
      path: '/admin/rooms',
      icon: '🏢',
      color: '#45B7D1'
    },
    {
      name: 'Equipments',
      path: '/admin/devices',
      icon: '💻',
      color: '#96CEB4'
    },
    {
      name: 'Schedule Meeting',
      path: '/admin/schedule',
      icon: '📅',
      color: '#FECA57'
    },
    {
      name: 'Meeting List',
      path: '/admin/meetings',
      icon: '📋',
      color: '#48CAE4'
    },
    {
      name: 'Notification',
      path: '/admin/notifications',
      icon: '🔔',
      color: '#F38BA8'
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const sidebarStyle = {
    width: isCollapsed ? '80px' : '250px',
    height: '100vh',
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    position: 'fixed',
    left: 0,
    top: 0,
    transition: 'width 0.3s ease',
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
  };

  const logoStyle = {
    padding: '20px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '20px'
  };

  const logoTextStyle = {
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    gap: '10px'
  };

  const menuStyle = {
    flex: 1,
    padding: '0 10px',
    overflowY: 'auto'
  };

  const menuItemStyle = (item) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    margin: '5px 0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    color: 'white',
    backgroundColor: isActiveRoute(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)'
    }
  });

  const iconStyle = {
    fontSize: '20px',
    minWidth: '24px',
    textAlign: 'center'
  };

  const textStyle = {
    marginLeft: '15px',
    fontSize: '16px',
    fontWeight: '500',
    display: isCollapsed ? 'none' : 'block'
  };

  const logoutStyle = {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  };

  const logoutButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    color: 'white',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    fontSize: '16px'
  };

  const toggleButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '-15px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 1001
  };

  return (
    <div style={sidebarStyle}>
      <button 
        style={toggleButtonStyle}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      <div style={logoStyle}>
        <div style={logoTextStyle}>
          <div style={{ 
            width: isCollapsed ? '40px' : '50px', 
            height: isCollapsed ? '40px' : '50px', 
            borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isCollapsed ? '20px' : '24px'
          }}>
            📅
          </div>
          {!isCollapsed && <span style={{ marginLeft: '10px' }}>iMeet</span>}
        </div>
      </div>

      <div style={menuStyle}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => history.push(item.path)}
            style={{
              ...menuItemStyle(item),
              backgroundColor: isActiveRoute(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isActiveRoute(item.path)) {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActiveRoute(item.path)) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={iconStyle}>{item.icon}</span>
            <span style={textStyle}>{item.name}</span>
          </div>
        ))}
      </div>

      <div style={logoutStyle}>
        <button
          onClick={onLogout}
          style={logoutButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <span style={iconStyle}>🚪</span>
          <span style={textStyle}>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;