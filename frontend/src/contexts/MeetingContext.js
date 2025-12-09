// Meeting Context - Shared meeting data cache
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import meetingService from '../services/meetingService';
import { useAuth } from './AuthContext';

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

  // Cache for 2 minutes to avoid unnecessary refetches - tăng cache để giảm API calls
  const CACHE_DURATION = 2 * 60 * 1000; // 2 phút

  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user || auth?.currentUser || null;
  } catch (error) {
    authUser = null;
  }

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('oauth2User');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }, []);

  const contextUser = authUser || storedUser || null;
  const contextUserId = contextUser?.userId || contextUser?.id || contextUser?._id || null;
  const contextUserEmail = contextUser?.email?.toLowerCase?.() || null;

  const normalizeId = (value) => {
    if (value === undefined || value === null) return null;
    return String(value).trim().toLowerCase();
  };

  const normalizeEmail = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.includes('@')) return null;
      return trimmed.toLowerCase();
    }
    if (typeof value === 'object') {
      const emailValue =
        value.email ||
        value.mail ||
        value.userEmail ||
        value.participantEmail ||
        value.value ||
        null;
      return emailValue ? emailValue.toString().trim().toLowerCase() : null;
    }
    const stringValue = String(value).trim();
    return stringValue.includes('@') ? stringValue.toLowerCase() : null;
  };

  const transformMeeting = (meeting) => {
    if (!meeting) return null;

    // ✅ Endpoint /api/meetings/my already filters for current user
    // So we just need to add canEdit and meetingRole flags
    const currentIdNormalized = normalizeId(contextUserId);
    const currentEmailNormalized = normalizeEmail(contextUserEmail);

    const ownerIdNormalized = normalizeId(meeting.userId || meeting.user?.id || meeting.user?.userId);
    const ownerEmailNormalized = normalizeEmail(meeting.userEmail || meeting.user?.email);

    const isOwner =
      (currentIdNormalized && ownerIdNormalized && currentIdNormalized === ownerIdNormalized) ||
      (currentEmailNormalized && ownerEmailNormalized && currentEmailNormalized === ownerEmailNormalized);

    // ✅ IMPORTANT: Don't filter based on ownership anymore!
    // /api/meetings/my returns both owned and invited meetings
    // Just add flags and return
    return {
      ...meeting,
      canEdit: isOwner,
      meetingRole: isOwner ? 'owner' : 'guest'
    };
  };

  const currentUser = contextUser;
  const currentUserId = contextUserId;
  const currentUserEmail = contextUserEmail;

  // Fetch meetings relevant to current user (with cache)
  const fetchMeetings = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // If cache is fresh and not forcing refresh, skip fetch
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log('📦 Using cached meetings data, total:', meetings.length);
      return meetings;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching meetings from API...');
      console.log('📋 Current user info:', { contextUserId, contextUserEmail });
      
      // Get raw token to verify it exists
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token, token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      let data;
      try {
      data = await meetingService.getMeetingsForUser();
      console.log('📨 API Response received, raw data:', data);
        console.log('📊 Data type:', typeof data, 'Is array:', Array.isArray(data));
      } catch (apiError) {
        console.error('❌ Error in meetingService.getMeetingsForUser:', apiError);
        throw apiError; // Re-throw to be caught by outer catch
      }
      
      // ✅ Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('🧹 Component unmounted, skipping state update');
        return [];
      }
      
      const meetingsArray = Array.isArray(data) ? data : (data ? [data] : []);
      console.log('📊 Meetings array length:', meetingsArray.length);
      
      if (meetingsArray.length === 0) {
        console.warn('⚠️ No meetings returned from API. Data:', data);
      }
      
      // ✅ Log raw API data before transform
      if (meetingsArray.length > 0) {
        console.log('📥 Raw API meetings (first 3):', meetingsArray.slice(0, 3).map(m => ({
          meetingId: m.meetingId,
          id: m.id,
          title: m.title,
          startTime: m.startTime,
          endTime: m.endTime,
          userId: m.userId,
          userEmail: m.userEmail,
          bookingStatus: m.bookingStatus
        })));
      }
      
      const transformed = meetingsArray
        .map((meeting, index) => {
          const result = transformMeeting(meeting);
          if (!result && meeting) {
            console.log(`⚠️ Meeting ${index} filtered out by transformMeeting:`, {
              title: meeting.title,
              meetingId: meeting.meetingId || meeting.id,
              userId: meeting.userId,
              userEmail: meeting.userEmail
            });
          }
          return result;
        })
        .filter(Boolean);

      console.log('✅ Meetings fetched and transformed:', {
        rawCount: meetingsArray.length,
        transformedCount: transformed.length,
        filteredOut: meetingsArray.length - transformed.length
      });
      
      // ✅ Log transformed meetings structure
      if (transformed.length > 0) {
        console.log('📋 Transformed meetings (first 3):', transformed.slice(0, 3).map(m => ({
          meetingId: m.meetingId || m.id,
          title: m.title,
          startTime: m.startTime,
          endTime: m.endTime,
          canEdit: m.canEdit,
          meetingRole: m.meetingRole
        })));
      } else {
        console.warn('⚠️ No meetings after transformation!', {
          rawCount: meetingsArray.length,
          contextUserId,
          contextUserEmail
        });
      }
      
      // ✅ Only update state if component is still mounted
      if (!isMountedRef.current) {
        console.log('🧹 Component unmounted before setting meetings state');
        return transformed;
      }
      
      console.log('📤 Setting meetings state:', {
        count: transformed.length,
        willUpdate: transformed.length > 0 || meetings.length === 0
      });
      
      setMeetings(transformed);
      setLastFetch(now);
      setIsDataLoaded(true); // ✅ Mark as loaded
      
      console.log('✅ Meetings state updated successfully');
      
      return transformed;
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      console.error('   Error details:', error.response?.data || error.message);
      return [];
    } finally {
      // ✅ Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [lastFetch, CACHE_DURATION, contextUserId, contextUserEmail]); // ✅ FIX: Remove transformMeeting from deps (it's stable)

  // Optimistic add - add to local state immediately
  const addMeeting = useCallback((newMeeting) => {
    console.log('➕ Optimistically adding meeting:', newMeeting.title);
    const transformed = transformMeeting(newMeeting);
    if (!transformed) {
      return;
    }
    setMeetings(prev => [...prev, transformed]);
    setLastFetch(Date.now()); // Update cache timestamp
  }, [transformMeeting]);

  // Optimistic update - update local state immediately
  const updateMeeting = useCallback((updatedMeeting) => {
    console.log('✏️ Optimistically updating meeting:', updatedMeeting.meetingId);
    const transformed = transformMeeting(updatedMeeting);
    setMeetings(prev => {
      const index = prev.findIndex(m => (m.meetingId || m.id) === (updatedMeeting.meetingId || updatedMeeting.id));
      if (!transformed) {
        if (index === -1) return prev;
        const next = [...prev];
        next.splice(index, 1);
        return next;
      }
      if (index === -1) {
        return [...prev, transformed];
      }
      const next = [...prev];
      next[index] = transformed;
      return next;
    });
    setLastFetch(Date.now()); // Update cache timestamp
  }, [transformMeeting]);

  // Optimistic delete - remove from local state immediately
  const deleteMeeting = useCallback((meetingId) => {
    console.log('🗑️ Optimistically deleting meeting:', meetingId);
    setMeetings(prev => prev.filter(m => (m.meetingId || m.id) !== meetingId));
    setLastFetch(Date.now()); // Update cache timestamp
  }, []);

  // Get filtered meetings by criteria
  const getFilteredMeetings = useCallback((filter) => {
    return meetings.filter(filter);
  }, [meetings]);

  const previousUserRef = useRef({
    id: normalizeId(currentUserId),
    email: currentUserEmail
  });

  useEffect(() => {
    const normalizedId = normalizeId(currentUserId);
    const normalizedEmail = currentUserEmail;

    if (
      previousUserRef.current.id !== normalizedId ||
      previousUserRef.current.email !== normalizedEmail
    ) {
      previousUserRef.current = { id: normalizedId, email: normalizedEmail };
      setLastFetch(null);
      setIsDataLoaded(false);
      setMeetings([]);
    }
  }, [currentUserId, currentUserEmail, normalizeId]);

  // ✅ Initial fetch ONLY ONCE - No refetch when switching pages!
  useEffect(() => {
    console.log('🔄 MeetingContext: Initial fetch useEffect triggered', {
      isDataLoaded,
      meetingsLength: meetings.length,
      contextUserId,
      contextUserEmail,
      fetchMeetingsDefined: typeof fetchMeetings === 'function',
      currentUser: contextUser ? { id: contextUser.id, email: contextUser.email } : null
    });

    // Skip if already loaded
    if (isDataLoaded) {
      console.log('📦 Meetings already loaded from cache - skip fetch');
      return;
    }
    
    // ✅ Wait a bit for AuthContext to be ready (if user info is not available yet)
    // But don't block forever - try to fetch anyway after a short delay
    if (!contextUserId && !contextUserEmail) {
      console.warn('⚠️ MeetingContext: No user info available yet, will retry...', {
        contextUserId,
        contextUserEmail,
        currentUser: contextUser
      });
      
      // Retry after 500ms in case AuthContext is still loading
      const timeoutId = setTimeout(() => {
        if (!isDataLoaded && (contextUserId || contextUserEmail)) {
          console.log('🔄 MeetingContext: Retrying fetch after user info available');
          fetchMeetings().catch(error => {
            console.error('❌ MeetingContext: Error in fetchMeetings (retry):', error);
          });
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
    
    console.log('🚀 MeetingContext: Calling fetchMeetings...');
    fetchMeetings().catch(error => {
      console.error('❌ MeetingContext: Error in fetchMeetings:', error);
    });
    
    // ✅ Cleanup: Mark component as unmounted
    return () => {
      console.log('🧹 MeetingProvider unmounting, canceling state updates');
      isMountedRef.current = false;
    };
  }, [isDataLoaded, fetchMeetings, contextUserId, contextUserEmail, meetings.length, contextUser]);

  const value = {
    meetings,
    currentUser,
    currentUserId,
    currentUserEmail,
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

