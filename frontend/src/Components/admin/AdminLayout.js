import React from 'react';
import { Switch, Route, useHistory } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserManagement from './UserManagement';
import DeviceList from './DeviceList';
// DeviceTypeManagement page removed
import RoomManagement from './RoomManagement';
import HomePage from './HomePage';
import { DeviceProvider } from './DeviceContext';
import { DeviceTypeProvider } from './DeviceTypeContext';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <DeviceTypeProvider>
      <DeviceProvider>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar onLogout={handleLogout} user={user} />
          <div style={{ flex: 1, backgroundColor: '#f5f5f5', marginLeft: '250px' }}>
            {/* Top bar */}
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem 2rem',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 100
            }}>
              <h1 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: '600' }}>
                Admin Dashboard
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#007bff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    Welcome, {user?.fullName || user?.username || 'Admin'}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                  }}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Content area */}
            <div style={{ padding: '2rem' }}>
              <Switch>
                <Route exact path="/admin" component={HomePage} />
                <Route path="/admin/users" component={UserManagement} />
                <Route path="/admin/devices" component={DeviceList} />
                {/* Device types page removed */}
                <Route path="/admin/rooms" component={RoomManagement} />
                <Route path="/admin/schedule">
                  <div style={{ 
                    padding: '60px', 
                    textAlign: 'center', 
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>
                      Schedule Meeting
                    </h2>
                    <p style={{ fontSize: '16px', color: '#666' }}>
                      Tính năng đang được phát triển
                    </p>
                  </div>
                </Route>
                <Route path="/admin/meetings">
                  <div style={{ 
                    padding: '60px', 
                    textAlign: 'center', 
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>
                      Meeting List
                    </h2>
                    <p style={{ fontSize: '16px', color: '#666' }}>
                      Tính năng đang được phát triển
                    </p>
                  </div>
                </Route>
                <Route path="/admin/notifications">
                  <div style={{ 
                    padding: '60px', 
                    textAlign: 'center', 
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔔</div>
                    <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>
                      Notifications
                    </h2>
                    <p style={{ fontSize: '16px', color: '#666' }}>
                      Tính năng đang được phát triển
                    </p>
                  </div>
                </Route>
              </Switch>
            </div>
          </div>
        </div>
      </DeviceProvider>
    </DeviceTypeProvider>
  );
};

export default AdminLayout;