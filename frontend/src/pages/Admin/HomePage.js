import React, { useMemo } from 'react';
import { usePreloadedData } from './DataPreloaderContext';
import RecentActivity from './RecentActivity';

// ✅ Optimized: Use preloaded data from cache (no refetch!)
const HomeStats = () => {
  const {
    userStats,
    rooms,
    devices,
    meetings,
    usersLoading,
    roomsLoading,
    devicesLoading,
    meetingsLoading,
    isPreloading
  } = usePreloadedData();

  // ✅ Calculate overall loading state
  const loading = useMemo(() => {
    return isPreloading || usersLoading || roomsLoading || devicesLoading || meetingsLoading;
  }, [isPreloading, usersLoading, roomsLoading, devicesLoading, meetingsLoading]);

  const formatNumber = (n) => {
    if (n === null || n === undefined) return '0';
    try { return Number(n).toLocaleString(); } catch (e) { return String(n); }
  };

  // ✅ Display helper: show loading state or actual value
  const displayValue = (value, isLoading) => {
    if (isLoading) return <span style={{ color: '#95a5a6' }}>Đang tải...</span>;
    return formatNumber(value || 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Total Users</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{displayValue(userStats?.totalUsers, usersLoading)}</p>
          </div>
          <div style={{ backgroundColor: '#e8f4fd', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '24px' }}>👥</span>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Total Meetings</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{displayValue(meetings?.length, meetingsLoading)}</p>
          </div>
          <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '24px' }}>📅</span>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Total Rooms</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{displayValue(rooms?.length, roomsLoading)}</p>
          </div>
          <div style={{ backgroundColor: '#fff4e6', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '24px' }}>🏢</span>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Total Equipment</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{displayValue(devices?.length, devicesLoading)}</p>
          </div>
          <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '24px' }}>💻</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ fontSize: '16px', color: '#7f8c8d', margin: 0 }}>Welcome to iMeet Admin Dashboard</p>
      </div>

      {/* Stats Cards */}
      <HomeStats />

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/admin/rooms" style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textDecoration: 'none', color: '#2c3e50', transition: 'all 0.2s' }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>🏢</span>
              <span>Rooms</span>
            </a>
            <a href="/admin/users" style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textDecoration: 'none', color: '#2c3e50', transition: 'all 0.2s' }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>👥</span>
              <span>User Management</span>
            </a>
            <a href="/admin/devices" style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', textDecoration: 'none', color: '#2c3e50', transition: 'all 0.2s' }}>
              <span style={{ marginRight: '12px', fontSize: '20px' }}>💻</span>
              <span>Equipments</span>
            </a>
          </div>
        </div>

        <RecentActivity />
      </div>
    </div>
  );
};

export default HomePage;
