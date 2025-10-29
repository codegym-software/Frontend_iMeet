// Meeting Context - Shared meeting data cache
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import meetingService from '../services/meetingService';

const MeetingContext = createContext();

export const useMeetings = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeetings must be used within MeetingProvider');
  }
  return context;
};

export const MeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  
  // ✅ Track if data has been loaded - ONLY LOAD ONCE!
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // ✅ Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cache for 30 seconds to avoid unnecessary refetches
  const CACHE_DURATION = 30000;

  // Fetch all meetings (with cache)
  const fetchMeetings = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // If cache is fresh and not forcing refresh, skip fetch
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log('📦 Using cached meetings data');
      return meetings;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching meetings from API...');
      const data = await meetingService.getAllMeetings();
      
      // ✅ Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('🧹 Component unmounted, skipping state update');
        return [];
      }
      
      const meetingsArray = Array.isArray(data) ? data : [];
      setMeetings(meetingsArray);
      setLastFetch(now);
      setIsDataLoaded(true); // ✅ Mark as loaded
      console.log('✅ Meetings fetched:', meetingsArray.length);
      return meetingsArray;
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      return [];
    } finally {
      // ✅ Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [lastFetch, meetings, CACHE_DURATION]);

  // Optimistic add - add to local state immediately
  const addMeeting = useCallback((newMeeting) => {
    console.log('➕ Optimistically adding meeting:', newMeeting.title);
    setMeetings(prev => [...prev, newMeeting]);
    setLastFetch(Date.now()); // Update cache timestamp
  }, []);

  // Optimistic update - update local state immediately
  const updateMeeting = useCallback((updatedMeeting) => {
    console.log('✏️ Optimistically updating meeting:', updatedMeeting.meetingId);
    setMeetings(prev => 
      prev.map(m => m.meetingId === updatedMeeting.meetingId ? updatedMeeting : m)
    );
    setLastFetch(Date.now()); // Update cache timestamp
  }, []);

  // Optimistic delete - remove from local state immediately
  const deleteMeeting = useCallback((meetingId) => {
    console.log('🗑️ Optimistically deleting meeting:', meetingId);
    setMeetings(prev => prev.filter(m => m.meetingId !== meetingId));
    setLastFetch(Date.now()); // Update cache timestamp
  }, []);

  // Get filtered meetings by criteria
  const getFilteredMeetings = useCallback((filter) => {
    return meetings.filter(filter);
  }, [meetings]);

  // ✅ Initial fetch ONLY ONCE - No refetch when switching pages!
  useEffect(() => {
    // Skip if already loaded
    if (isDataLoaded) {
      console.log('📦 Meetings already loaded from cache - skip fetch');
      return;
    }
    
    fetchMeetings();
    
    // ✅ Cleanup: Mark component as unmounted
    return () => {
      console.log('🧹 MeetingProvider unmounting, canceling state updates');
      isMountedRef.current = false;
    };
  }, [isDataLoaded, fetchMeetings]);

  const value = {
    meetings,
    loading,
    isDataLoaded,
    fetchMeetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    getFilteredMeetings
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};

export default MeetingContext;

