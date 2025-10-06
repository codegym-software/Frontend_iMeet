import React from 'react';

const HomePage = () => {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ fontSize: '16px', color: '#7f8c8d', margin: 0 }}>Welcome to iMeet Admin Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Total Users</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>1,247</p>
            </div>
            <div style={{ backgroundColor: '#e8f4fd', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '24px' }}>👥</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Active Meetings</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>24</p>
            </div>
            <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '24px' }}>📅</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Available Rooms</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>12</p>
            </div>
            <div style={{ backgroundColor: '#fff4e6', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '24px' }}>🏢</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Equipment Status</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>98%</p>
            </div>
            <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '24px' }}>💻</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/admin/schedule" style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textDecoration: 'none', color: '#2c3e50', transition: 'all 0.2s' }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>📅</span>
              <span>Schedule New Meeting</span>
            </a>
            <a href="/admin/devices" style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textDecoration: 'none', color: '#2c3e50', transition: 'all 0.2s' }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>💻</span>
              <span>Manage Equipment</span>
            </a>
            <a href="/admin/users" style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textDecoration: 'none', color: '#2c3e50', transition: 'all 0.2s' }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>👥</span>
              <span>User Management</span>
            </a>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500' }}>New meeting scheduled</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>Conference Room A - 2:00 PM</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500' }}>Equipment maintenance completed</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>Projector in Room B updated</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500' }}>New user registered</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>John Smith added to system</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🟢</div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#28a745', margin: '0 0 4px 0' }}>All Systems Operational</p>
            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>Last updated: 2 minutes ago</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#007bff', margin: '0 0 4px 0' }}>Server Load: 23%</p>
            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>Optimal performance</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💾</div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#17a2b8', margin: '0 0 4px 0' }}>Storage: 67% Used</p>
            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>2.3 GB available</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#6f42c1', margin: '0 0 4px 0' }}>Last Backup</p>
            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>Today at 3:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
