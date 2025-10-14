import React, { createContext, useContext, useState, useEffect } from 'react';

const ActivityContext = createContext();

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);

  // Load activities from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('adminActivities');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActivities(parsed);
      } catch (e) {
        console.error('Failed to parse activities from localStorage', e);
      }
    }
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('adminActivities', JSON.stringify(activities));
    }
  }, [activities]);

  // Add a new activity
  const addActivity = (type, action, itemName, details = '') => {
    const newActivity = {
      id: Date.now() + Math.random(), // Unique ID
      type, // 'room' or 'device'
      action, // 'add', 'update', 'delete'
      itemName,
      details,
      timestamp: new Date().toISOString()
    };

    setActivities(prev => {
      // Keep only the 20 most recent activities
      const updated = [newActivity, ...prev].slice(0, 20);
      return updated;
    });
  };

  // Get recent activities (default: 3)
  const getRecentActivities = (count = 3) => {
    return activities.slice(0, count);
  };

  // Clear all activities
  const clearActivities = () => {
    setActivities([]);
    localStorage.removeItem('adminActivities');
  };

  const value = {
    activities,
    addActivity,
    getRecentActivities,
    clearActivities
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
