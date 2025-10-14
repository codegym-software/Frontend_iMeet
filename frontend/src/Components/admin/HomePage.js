import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import meetingService from '../../services/meetingService';
import RecentActivity from './RecentActivity';

// Small component to fetch and display stats cards (Total Users etc.)
const HomeStats = () => {
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Load all data in parallel
        const results = await Promise.allSettled([
          adminService.getUserStats().catch(e => ({ totalUsers: 0 })),
          adminService.getRooms().catch(e => []),
          adminService.getDevices().catch(e => []),
          meetingService.getAllMeetings().catch(e => ({ data: [] }))
        ]);
        
        const [statsResult, roomsResult, devicesResult, meetingsResult] = results;
        
        console.log('Stats Result:', statsResult);
        console.log('Rooms Result:', roomsResult);
        console.log('Devices Result:', devicesResult);
        console.log('Meetings Result:', meetingsResult);
        
        if (mounted) {
          // Extract values from Promise.allSettled results
          const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : {};
          const roomsRes = roomsResult.status === 'fulfilled' ? roomsResult.value : [];
          const devicesRes = devicesResult.status === 'fulfilled' ? devicesResult.value : [];
          const meetingsRes = meetingsResult.status === 'fulfilled' ? meetingsResult.value : { data: [] };
          
          console.log('Extracted Stats:', statsRes);
          console.log('Extracted Rooms:', roomsRes);
          console.log('Extracted Devices:', devicesRes);
          console.log('Extracted Meetings:', meetingsRes);
          
          // Set state with proper fallbacks
          setStats(statsRes?.data || statsRes || {});
          setRooms(Array.isArray(roomsRes) ? roomsRes : []);
          setDevices(Array.isArray(devicesRes) ? devicesRes : []);
          setMeetings(Array.isArray(meetingsRes?.data) ? meetingsRes.data : []);
        }
      } catch (e) {
        console.error('Failed loading stats', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const formatNumber = (n) => {
    if (n === null || n === undefined) return '0';
    try { return Number(n).toLocaleString(); } catch (e) { return String(n); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#7f8c8d', margin: '0 0 8px 0', fontWeight: '500' }}>Total Users</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{loading ? '...' : formatNumber(stats?.totalUsers || 0)}</p>
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
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{loading ? '...' : formatNumber(meetings.length)}</p>
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
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{loading ? '...' : formatNumber(rooms.length)}</p>
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
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 }}>{loading ? '...' : formatNumber(devices.length)}</p>
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

        <RecentActivity />
      </div>
    </div>
  );
};

export default HomePage;
