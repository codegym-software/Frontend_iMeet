import React, { useState } from 'react';
import { Switch, Route, useHistory } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserManagement from './UserManagement';
import DeviceList from './DeviceList';
// DeviceTypeManagement page removed
import RoomManagement from './RoomManagement';
import MeetingList from './MeetingList';
import HomePage from './HomePage';
import { DeviceProvider } from './DeviceContext';
import { DeviceTypeProvider } from './DeviceTypeContext';
import { DataPreloaderProvider } from './DataPreloaderContext';
import { ActivityProvider } from './ActivityContext';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const history = useHistory();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ActivityProvider>
      <DataPreloaderProvider>
        <DeviceTypeProvider>
          <DeviceProvider>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar onLogout={handleLogout} user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <div style={{ flex: 1, backgroundColor: '#f5f5f5', marginLeft: isCollapsed ? '80px' : '250px', transition: 'margin-left 0.3s ease' }}>
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
            </div>

            {/* Content area */}
            <div style={{ padding: '2rem' }}>
              <Switch>
                <Route exact path="/admin" component={HomePage} />
                <Route path="/admin/users" component={UserManagement} />
                <Route path="/admin/devices" component={DeviceList} />
                <Route path="/admin/rooms" component={RoomManagement} />
                <Route path="/admin/meetings">
                  <MeetingList />
                </Route>
              </Switch>
            </div>
          </div>
        </div>
        </DeviceProvider>
      </DeviceTypeProvider>
    </DataPreloaderProvider>
    </ActivityProvider>
  );
};

export default AdminLayout;