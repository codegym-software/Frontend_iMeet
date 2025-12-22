// src/Components/main/Main.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

// Import useCallback để sử dụng trong component
import { AuthProvider } from '../../contexts/AuthContext';
import { MeetingProvider, useMeetings } from '../../contexts/MeetingContext';
import { DeviceInventoryProvider } from '../../contexts/DeviceInventoryContext';
import './Home.css';
import TopBar from '../../Components/main/TopBar';
import MiniCalendar from '../../Components/main/MiniCalendar';
import UpcomingMeetings from '../../Components/main/UpcomingMeetings';
import TimeTable from '../../Components/main/MainCalendar/TimeTable';
import RoomFinder from '../../Components/main/RoomFinder/RoomFinder';
import RoomSearchForm from '../../Components/main/RoomFinder/RoomSearchForm';
import RoomResultsList from '../../Components/main/RoomFinder/RoomResultsList';
import { getMyGroups, createGroup, getGroupDetail, inviteToGroup, acceptGroupInvite, validateGroupInvite, declineGroupInvite } from '../../services/groupService';
import { useRoomFinder } from '../../hooks/useRoomFinder';
import RoomDetailModal from './RoomDetailModal';
import Toast from '../../Components/common/Toast';
import EditMeetingForm from '../../Components/main/EditMeetingForm';
import MeetingForm from '../../Components/main/MeetingForm';
import MeetingReminderNotification from '../../Components/common/MeetingReminderNotification';
import { useMeetingReminders } from '../../hooks/useMeetingReminders';
import { calendarAPI } from '../../Components/main/MainCalendar/utils/CalendarAPI';

const MainContent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('day');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'room'
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [quickCreateRange, setQuickCreateRange] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [groups, setGroups] = useState([]);
  const [isGroupCollapsed, setIsGroupCollapsed] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [groupMenuOpenId, setGroupMenuOpenId] = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  
  // Cache cho group detail
  const groupDetailCacheRef = useRef(new Map());
  const GROUP_DETAIL_CACHE_DURATION = 2 * 60 * 1000; // 2 phút
  
  // Debounce cho email sending
  const inviteEmailDebounceRef = useRef(null);

  const addInviteEmail = useCallback((email) => {
    const val = (email || '').trim();
    if (!val) return;
    // simple email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(val)) {
      setToast({ isOpen: true, message: 'Email không hợp lệ', type: 'error' });
      return;
    }
    setInviteEmails(prev => (prev.includes(val) ? prev : [...prev, val]));
    setInviteInput('');
  }, []);
  const history = useHistory();
  const location = useLocation();
  const { addMeeting, fetchMeetings, meetings: allMeetings } = useMeetings(); // Get optimistic update function and fetch
  const [preselectedRoomId, setPreselectedRoomId] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  
  // Meeting reminders - kiểm tra meetings sắp bắt đầu trong 15 phút
  const { upcomingReminders, clearReminder } = useMeetingReminders();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check for pending invite token and validate it
  useEffect(() => {
    const pendingToken = localStorage.getItem('pending_invite_token');
    if (pendingToken && localStorage.getItem('token')) {
      // Validate token to get invite info
      validateGroupInvite(pendingToken)
        .then((res) => {
          // Backend returns: { success: boolean, message: string, data: ValidateInviteResponse }
          // ValidateInviteResponse has: { valid: boolean, groupName, invitedByName, invitedEmail, ... }
          // res is already res.data from axios, so res.data is the ValidateInviteResponse
          const inviteData = res?.data || res;
          
          if (res?.success && inviteData?.valid) {
            setPendingInvite({
              token: pendingToken,
              groupName: inviteData.groupName,
              invitedByName: inviteData.invitedByName,
              invitedEmail: inviteData.invitedEmail,
              groupId: inviteData.groupId,
              role: inviteData.role
            });
          } else {
            // Invalid token, remove it
            const errorMsg = res?.message || inviteData?.message || 'Lời mời không hợp lệ';
            console.warn('Invalid invite token:', errorMsg);
            localStorage.removeItem('pending_invite_token');
            // Optionally show toast
            if (errorMsg && errorMsg !== 'Lời mời không hợp lệ') {
              setToast({ isOpen: true, message: errorMsg, type: 'error' });
            }
          }
        })
        .catch((err) => {
          console.error('Validate pending invite error:', err);
          const errorMsg = err?.response?.data?.message || 
                          err?.response?.data?.data?.message ||
                          err?.message || 
                          'Không thể xác thực lời mời';
          localStorage.removeItem('pending_invite_token');
          setToast({ isOpen: true, message: errorMsg, type: 'error' });
        });
    }
  }, []);

  // Handle accepting pending invite
  const handleAcceptPendingInvite = async () => {
    if (!pendingInvite?.token) return;
    
    setAcceptingInvite(true);
    try {
      // Backend returns: { success: boolean, message: string, data: GroupInviteResponse }
      const res = await acceptGroupInvite(pendingInvite.token);
      
      if (res?.success) {
        setToast({ 
          isOpen: true, 
          message: res?.message || `Đã tham gia nhóm "${pendingInvite.groupName}" thành công!`, 
          type: 'success' 
        });
        localStorage.removeItem('pending_invite_token');
        setPendingInvite(null);
        // Refresh groups list
        fetchGroups();
      } else {
        // Backend returned error response
        const errorMsg = res?.message || 'Không thể tham gia nhóm';
        setToast({ 
          isOpen: true, 
          message: errorMsg, 
          type: 'error' 
        });
        // If email mismatch or other validation error, remove token
        if (errorMsg.includes('Email không khớp') || errorMsg.includes('không hợp lệ')) {
          localStorage.removeItem('pending_invite_token');
          setPendingInvite(null);
        }
      }
    } catch (err) {
      console.error('Accept invite error:', err);
      // Extract error message from axios error response
      const errorMsg = err?.response?.data?.message || 
                      err?.response?.data?.data?.message ||
                      err?.message || 
                      'Không thể tham gia nhóm. Vui lòng thử lại.';
      setToast({ isOpen: true, message: errorMsg, type: 'error' });
      
      // If email mismatch or other validation error, remove token
      if (errorMsg.includes('Email không khớp') || errorMsg.includes('không hợp lệ')) {
        localStorage.removeItem('pending_invite_token');
        setPendingInvite(null);
      }
    } finally {
      setAcceptingInvite(false);
    }
  };

  const handleDeclinePendingInvite = async () => {
    if (!pendingInvite?.token) return;
    
    try {
      // Call decline API (public endpoint, no auth needed)
      await declineGroupInvite(pendingInvite.token);
      setToast({ 
        isOpen: true, 
        message: 'Đã từ chối lời mời', 
        type: 'success' 
      });
    } catch (err) {
      console.error('Decline invite error:', err);
      // Even if API call fails, remove from local storage
      setToast({ 
        isOpen: true, 
        message: 'Đã từ chối lời mời', 
        type: 'info' 
      });
    } finally {
      localStorage.removeItem('pending_invite_token');
      setPendingInvite(null);
    }
  };

  // Hàm xuất lịch ICS cho nhóm
  const handleExportGroupCalendar = async (groupId, groupName) => {
    try {
      setToast({
        isOpen: true,
        message: 'Đang tải toàn bộ lịch họp của nhóm...',
        type: 'info'
      });

      console.log('🔄 Fetching all meetings for group:', groupId);

      // Fetch TẤT CẢ meetings từ API (không giới hạn thời gian)
      const allMeetingsFromAPI = await calendarAPI.getAllMeetings();
      console.log('📥 Total meetings fetched:', allMeetingsFromAPI.length);

      // Debug: Log structure của meetings để kiểm tra
      if (allMeetingsFromAPI.length > 0) {
        console.log('🔍 Sample meeting structure:', {
          meeting: allMeetingsFromAPI[0],
          keys: Object.keys(allMeetingsFromAPI[0]),
          hasGroupId: 'groupId' in allMeetingsFromAPI[0],
          hasGroup: 'group' in allMeetingsFromAPI[0]
        });
      }

      // Filter meetings theo groupId - backend đã trả về groupId trong response
      const groupMeetings = (allMeetingsFromAPI || []).filter(meeting => {
        // Backend trả về groupId trực tiếp trong MeetingResponse
        const meetingGroupId = meeting.groupId || 
                               meeting.group?.id || 
                               (meeting.group && typeof meeting.group === 'object' ? meeting.group.id : null);
        
        const matches = meetingGroupId && String(meetingGroupId) === String(groupId);
        
        if (matches) {
          console.log('✅ Found group meeting:', {
            id: meeting.meetingId || meeting.id,
            title: meeting.title,
            groupId: meetingGroupId
          });
        }
        
        return matches;
      });

      console.log('📊 Group meetings found:', groupMeetings.length, 'out of', allMeetingsFromAPI.length);

      // Nếu vẫn không có, thử lấy từ cache và log để debug
      if (groupMeetings.length === 0) {
        console.log('⚠️ No meetings found from API, checking cache...');
        const cacheMeetings = (allMeetings || []).filter(meeting => {
          const meetingGroupId = meeting.groupId || meeting.group?.id;
          return meetingGroupId && String(meetingGroupId) === String(groupId);
        });
        console.log('📦 Cache meetings:', cacheMeetings.length);
        console.log('📋 Cache sample:', cacheMeetings[0]);
        
        if (cacheMeetings.length === 0) {
          setToast({
            isOpen: true,
            message: 'Nhóm này chưa có lịch họp nào. Vui lòng tạo lịch họp cho nhóm trước.',
            type: 'info'
          });
          return;
        }
        
        // Sử dụng cache nếu có
        groupMeetings.push(...cacheMeetings);
      }

      if (groupMeetings.length === 0) {
        setToast({
          isOpen: true,
          message: 'Nhóm này chưa có lịch họp nào',
          type: 'info'
        });
        return;
      }

      // Generate ICS content từ danh sách meetings
      const icsContent = generateICSFromMeetings(groupMeetings, groupName);
      
      // Tạo blob và download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${groupName.replace(/[^a-z0-9]/gi, '_')}_calendar.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({
        isOpen: true,
        message: `Đã xuất lịch nhóm "${groupName}" (${groupMeetings.length} cuộc họp)`,
        type: 'success'
      });
    } catch (error) {
      console.error('Export group calendar error:', error);
      setToast({
        isOpen: true,
        message: 'Không thể xuất lịch nhóm: ' + (error.message || 'Lỗi không xác định'),
        type: 'error'
      });
    }
  };

  // Hàm generate ICS content từ danh sách meetings
  const generateICSFromMeetings = (meetings, groupName) => {
    const now = new Date();
    const formatICSDate = (date) => {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeICS = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//iMeet//Group Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICS(groupName)}`,
      `X-WR-CALDESC:Lịch họp nhóm ${escapeICS(groupName)}`,
      ''
    ];

    meetings.forEach((meeting) => {
      const startTime = new Date(meeting.startTime || meeting.start);
      const endTime = new Date(meeting.endTime || meeting.end);
      const title = meeting.title || 'Cuộc họp';
      const description = meeting.description || '';
      
      // Ghép room name và location lại
      const roomName = meeting.roomName || meeting.room?.name || '';
      const roomLocation = meeting.roomLocation || meeting.room?.location || '';
      let location = '';
      
      if (roomName && roomLocation) {
        location = `${roomName} - ${roomLocation}`;
      } else if (roomName) {
        location = roomName;
      } else if (roomLocation) {
        location = roomLocation;
      } else {
        location = meeting.location || '';
      }
      
      const meetingId = meeting.meetingId || meeting.id;
      const uid = `meeting-${meetingId}@imeeet.com`;

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTART:${formatICSDate(startTime)}`);
      ics.push(`DTEND:${formatICSDate(endTime)}`);
      ics.push(`DTSTAMP:${formatICSDate(now)}`);
      ics.push(`SUMMARY:${escapeICS(title)}`);
      if (description) {
        ics.push(`DESCRIPTION:${escapeICS(description)}`);
      }
      if (location) {
        ics.push(`LOCATION:${escapeICS(location)}`);
      }
      ics.push(`STATUS:CONFIRMED`);
      ics.push(`SEQUENCE:0`);
      ics.push('END:VEVENT');
      ics.push('');
    });

    ics.push('END:VCALENDAR');

    return ics.join('\r\n');
  };
  
  const toggleTheme = () => { 
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light'); 
  };  

  // Hàm xử lý thay đổi view type
  const handleViewChange = (newViewType) => {
    setViewType(newViewType);
    // Nếu đang ở room mode và chọn month/year/schedule, switch về calendar
    if (viewMode === 'room' && ['month', 'year', 'schedule'].includes(newViewType)) {
      setViewMode('calendar');
    }
  };

  // Hàm xử lý thay đổi ngày - định nghĩa trước để có thể dùng trong hook
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    // Cập nhật currentMonth để MiniCalendar hiển thị đúng tháng
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  }, []);

  // Room finder logic - sử dụng custom hook (sau khi handleDateChange được định nghĩa)
  // Sử dụng useMemo để tránh tạo lại hook mỗi lần render
  const roomFinder = useRoomFinder(selectedDate, handleDateChange);

  // Hàm xử lý khi click vào ngày trong week/month/year view
  // Chuyển sang day view và set ngày
  const handleSelectDay = (newDate) => {
    handleDateChange(newDate);
    setViewType('day');
  };

  // Hàm xử lý thay đổi tháng từ MiniCalendar
  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const handleSelectionRangeChange = useCallback((range) => {
    if (!range) {
      setQuickCreateRange(null);
      return;
    }
    let start = new Date(range.start);
    let end = new Date(range.end);
    if (end < start) {
      const temp = start;
      start = end;
      end = temp;
    }
    setQuickCreateRange({ start, end });
  }, []);

  const handleQuickCreateRange = useCallback((range) => {
    if (!range) return;
    let start = new Date(range.start);
    let end = new Date(range.end);
    if (end < start) {
      const temp = start;
      start = end;
      end = temp;
    }
    const normalized = { start, end };
    handleSelectionRangeChange(normalized);
    setPreselectedRoomId(null);
    setShowMeetingForm(true);
  }, [handleDateChange, handleSelectionRangeChange]);

  // Cache cho groups - tăng cache duration và load ngay từ cache nếu có
  const groupsCacheRef = useRef(null);
  const groupsCacheTimeRef = useRef(0);
  const GROUPS_CACHE_DURATION = 10 * 60 * 1000; // 10 phút - tăng cache duration

  // Load groups với cache - tối ưu: hiển thị cache ngay, fetch background
  const fetchGroups = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Kiểm tra cache trước - hiển thị ngay nếu có
    if (!forceRefresh && groupsCacheRef.current && (now - groupsCacheTimeRef.current) < GROUPS_CACHE_DURATION) {
      console.log('📦 Using cached groups data');
      setGroups(groupsCacheRef.current);
      setGroupLoading(false);
      
      // Fetch background để cập nhật cache (không block UI)
      getMyGroups()
        .then(data => {
          const groupsArray = Array.isArray(data) ? data : [];
          const oldCache = groupsCacheRef.current;
          groupsCacheRef.current = groupsArray;
          groupsCacheTimeRef.current = Date.now();
          // Chỉ update nếu data thay đổi
          if (JSON.stringify(groupsArray) !== JSON.stringify(oldCache)) {
            setGroups(groupsArray);
          }
        })
        .catch(error => {
          console.warn('Background groups fetch failed:', error);
          // Giữ cache cũ nếu fetch fail
        });
      return;
    }

    // Nếu không có cache hoặc force refresh, fetch ngay
    setGroupLoading(true);
    setGroupError('');
    try {
      const data = await getMyGroups();
      const groupsArray = Array.isArray(data) ? data : [];
      
      // Lưu vào cache
      groupsCacheRef.current = groupsArray;
      groupsCacheTimeRef.current = now;
      
      setGroups(groupsArray);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroupError('Không tải được danh sách nhóm');
      // Nếu có cache cũ, giữ lại
      if (groupsCacheRef.current) {
        setGroups(groupsCacheRef.current);
      }
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Load groups ngay khi mount - ưu tiên cache
  useEffect(() => {
    // Kiểm tra cache trong localStorage để load ngay
    try {
      const cachedGroups = localStorage.getItem('groups_cache');
      const cacheTime = localStorage.getItem('groups_cache_time');
      if (cachedGroups && cacheTime) {
        const parsedCache = JSON.parse(cachedGroups);
        const cacheAge = Date.now() - parseInt(cacheTime);
        if (cacheAge < GROUPS_CACHE_DURATION) {
          console.log('📦 Loading groups from localStorage cache');
          setGroups(parsedCache);
          groupsCacheRef.current = parsedCache;
          groupsCacheTimeRef.current = parseInt(cacheTime);
          setGroupLoading(false);
        }
      }
    } catch (e) {
      console.warn('Failed to load groups from localStorage:', e);
    }
    
    // Fetch groups (sẽ dùng cache nếu có)
    fetchGroups();
  }, [fetchGroups]);

  // Lưu groups vào localStorage khi có thay đổi
  useEffect(() => {
    if (groups.length > 0 && groupsCacheRef.current) {
      try {
        localStorage.setItem('groups_cache', JSON.stringify(groups));
        localStorage.setItem('groups_cache_time', String(groupsCacheTimeRef.current));
      } catch (e) {
        console.warn('Failed to save groups to localStorage:', e);
      }
    }
  }, [groups]);

  // Đóng group menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải vào menu button hoặc menu không
      const clickedOnMenuButton = event.target.closest('.group-menu-btn');
      const clickedOnMenu = event.target.closest('.group-menu');
      
      // Nếu click vào button hoặc menu thì không đóng
      if (clickedOnMenuButton || clickedOnMenu) {
        return;
      }
      
      // Nếu click ra ngoài thì đóng menu
      if (groupMenuOpenId !== null) {
        setGroupMenuOpenId(null);
      }
    };

    // Thêm event listener khi menu đang mở
    if (groupMenuOpenId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [groupMenuOpenId]);

  // Hàm xử lý khi tạo meeting - OPTIMISTIC UPDATE
  const handleMeetingCreated = async (meetingData, message) => {
    if (meetingData) {
      console.log('✅ Meeting created - using optimistic update');
      // Add to shared cache immediately - NO API CALL!
      addMeeting(meetingData);
      
      // Force refresh cache to ensure latest data from server
      if (fetchMeetings) {
        console.log('🔄 Force refreshing meetings cache...');
        await fetchMeetings(true); // Force refresh
      }
      
      // Trigger refresh for calendar view - this will force TimeTable to reload
      setRefreshTrigger(prev => prev + 1);
      
      // Show success toast
      if (message) {
        setToast({
          isOpen: true,
          message: message,
          type: 'success'
        });
      }
    } else {
      // Error case - meetingData is null
      console.warn('⚠️ Failed to create meeting');
      
      // Show error toast
      if (message) {
        setToast({
          isOpen: true,
          message: message,
          type: 'error'
        });
      }
    }
  };

  const handleBookRoom = useCallback((room, range) => {
    if (!room) return;
    setPreselectedRoomId(room.id || room.roomId || null);
    if (range?.start && range?.end) {
      handleDateChange(range.start);
      handleSelectionRangeChange({
        start: range.start,
        end: range.end
      });
      setQuickCreateRange({
        start: range.start,
        end: range.end
      });
    } else {
      handleSelectionRangeChange(null);
      setQuickCreateRange(null);
    }
    setShowMeetingForm(true);
  }, [handleDateChange, handleSelectionRangeChange]);

  const handleOpenRoomDetail = useCallback((room) => {
    if (!room) return;
    setRoomDetail(room);
  }, []);

  const handleCloseRoomDetail = useCallback(() => {
    setRoomDetail(null);
  }, []);

  // Handle double click on upcoming meeting to open edit form
  const handleUpcomingMeetingDoubleClick = useCallback((meeting) => {
    console.log('Double click on upcoming meeting:', meeting);
    setEditingMeeting(meeting);
    setShowEditForm(true);
  }, []);

  // Handle update meeting from edit form
  // Note: EditMeetingForm already calls the API, so we just need to refresh and show toast
  const handleUpdateMeeting = useCallback(async (updatedMeeting, message) => {
    try {
      // Validate updatedMeeting
      if (!updatedMeeting) {
        console.error('❌ Updated meeting is null or undefined');
        setToast({
          isOpen: true,
          message: message || 'Lỗi: Không nhận được dữ liệu meeting sau khi cập nhật',
          type: 'error'
        });
        return;
      }
      
      // EditMeetingForm already updated the meeting via API
      // We just need to refresh the UI
      setShowEditForm(false);
      setEditingMeeting(null);
      // Refresh meetings
      setRefreshTrigger(prev => prev + 1);
      // Ensure Day view and jump to meeting date
      const start = updatedMeeting.start || updatedMeeting.startTime;
      if (start) {
        const dateObj = new Date(start);
        setSelectedDate(dateObj);
        setViewType('day');
      } else {
        setViewType('day');
      }
      // Navigate to dashboard route if necessary
      if (history && history.location && history.location.pathname !== '/trang-chu') {
        history.push('/trang-chu');
      }
      setToast({
        isOpen: true,
        message: message || 'Cập nhật lịch họp thành công',
        type: 'success'
      });
    } catch (error) {
      console.error('Error handling meeting update:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi cập nhật lịch họp: ' + (error.message || 'Unknown error'),
        type: 'error'
      });
    }
  }, []);

  // Handle delete meeting from edit form
  const handleDeleteMeeting = useCallback(async (meetingId) => {
    try {
      const { message } = await calendarAPI.deleteMeeting(meetingId);
      setShowEditForm(false);
      setEditingMeeting(null);
      // Refresh meetings
      setRefreshTrigger(prev => prev + 1);
      setToast({
        isOpen: true,
        message: message || 'Xóa lịch họp thành công',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setToast({
        isOpen: true,
        message: 'Lỗi khi xóa lịch họp: ' + (error.message || 'Unknown error'),
        type: 'error'
      });
    }
  }, []);

  return (
    <div className="main">
      <TopBar 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        viewType={viewType}
        onViewChange={handleViewChange}
        viewMode={viewMode}
        theme={theme}
        toggleTheme={toggleTheme}
        history={history}
        onMeetingCreated={handleMeetingCreated}
        onOpenMeetingForm={() => {
          handleSelectionRangeChange(null);
          setPreselectedRoomId(null);
          setShowMeetingForm(true);
        }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Pending Group Invite Notification */}
      {pendingInvite && (
        <div className="pending-invite-notification" style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'white',
          border: '1px solid #e0e6ef',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '400px',
          minWidth: '320px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Bạn được mời vào nhóm
            </h3>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a73e8', marginBottom: '8px' }}>
              {pendingInvite.groupName}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              Người mời: <strong>{pendingInvite.invitedByName || '—'}</strong>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Email: {pendingInvite.invitedEmail}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={handleAcceptPendingInvite}
              disabled={acceptingInvite}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: acceptingInvite ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: acceptingInvite ? 0.6 : 1
              }}
            >
              {acceptingInvite ? 'Đang tham gia...' : 'Tham gia nhóm'}
            </button>
            <button
              onClick={handleDeclinePendingInvite}
              disabled={acceptingInvite}
              style={{
                padding: '10px 16px',
                background: '#f1f3f4',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: acceptingInvite ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Từ chối
            </button>
          </div>
        </div>
      )}
      
      <div className="main-content">
        <div className="container">
          <div className={`left-panel ${isSidebarOpen ? '' : 'collapsed'}`}>
            <div className="view-mode-switcher">
              <button 
                className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
                title="Xem theo lịch cá nhân"
              >
                📅 Lịch
              </button>
              <button 
                className={`view-mode-btn ${viewMode === 'room' ? 'active' : ''}`}
                onClick={() => setViewMode('room')}
                title="Xem theo phòng họp"
              >
                🏢 Phòng
              </button>
            </div>

            {viewMode === 'calendar' ? (
              <>
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button 
                      className="nav-button prev"
                      onClick={() => handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      title="Previous month"
                    >
                      ‹
                    </button>
                    
                    <span className="month-display">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    
                    <button 
                      className="nav-button next"
                      onClick={() => handleMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      title="Next month"
                    >
                      ›
                    </button>
                  </div>
                  
                  <MiniCalendar 
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    currentDate={currentMonth}
                    onMonthChange={handleMonthChange}
                  />
                </div>

                <UpcomingMeetings onMeetingDoubleClick={handleUpcomingMeetingDoubleClick} />

                {/* Group section */}
                <div className="group-section">
                  <div className="group-header">
                    <span className="group-title">Nhóm</span>
                      <span
                        className="group-add-btn"
                        onClick={() => setShowGroupForm(true)}
                        role="button"
                        aria-label="Tạo nhóm"
                      >
                        +
                      </span>
                    {groups.length > 0 && (
                      <span
                        className="group-toggle"
                        onClick={() => setIsGroupCollapsed(!isGroupCollapsed)}
                        role="button"
                        aria-label="Thu gọn nhóm"
                      >
                        {isGroupCollapsed ? '▸' : '▾'}
                      </span>
                    )}
                  </div>
                  {!isGroupCollapsed && groups.length > 0 && (
                    <div className="group-list">
                      {groups.map((g) => {
                        const isMenuOpen = groupMenuOpenId === g.id;
                        return (
                          <div key={g.id} className="group-item">
                            <div className="group-item-row">
                              <div>
                                <div className="group-item-name">{g.name}</div>
                                {g.description && (
                                  <div className="group-item-desc">{g.description}</div>
                                )}
                              </div>
                              <div className="group-item-actions">
                                <span
                                  className="group-menu-btn"
                                  onClick={() => setGroupMenuOpenId(isMenuOpen ? null : g.id)}
                                  role="button"
                                  aria-label="Group menu"
                                >
                                  ⋮
                                </span>
                                {isMenuOpen && (
                                  <div className="group-menu">
                                    <div
                                      className="group-menu-item"
                                      onClick={async () => {
                                        setGroupMenuOpenId(null);
                                        await handleExportGroupCalendar(g.id, g.name);
                                      }}
                                    >
                                      Xuất lịch
                                    </div>
                                    <div
                                      className="group-menu-item"
                                      onClick={async () => {
                                        setGroupMenuOpenId(null);
                                        
                                        // Kiểm tra cache trước
                                        const cacheKey = `group_detail_${g.id}`;
                                        const cached = groupDetailCacheRef.current.get(cacheKey);
                                        const now = Date.now();
                                        
                                        if (cached && (now - cached.timestamp) < GROUP_DETAIL_CACHE_DURATION) {
                                          console.log('📦 Using cached group detail');
                                          setGroupDetail(cached.data);
                                          return;
                                        }
                                        
                                        setGroupDetailLoading(true);
                                        try {
                                          const detail = await getGroupDetail(g.id);
                                          
                                          // Lưu vào cache
                                          groupDetailCacheRef.current.set(cacheKey, {
                                            data: detail,
                                            timestamp: now
                                          });
                                          
                                          setGroupDetail(detail);
                                        } catch (error) {
                                          console.error('Load group detail error:', error);
                                          
                                          // Nếu có cache cũ, dùng cache
                                          if (cached) {
                                            setGroupDetail(cached.data);
                                          } else {
                                            setToast({
                                              isOpen: true,
                                              message: 'Không tải được chi tiết nhóm',
                                              type: 'error'
                                            });
                                          }
                                        } finally {
                                          setGroupDetailLoading(false);
                                        }
                                      }}
                                    >
                                      Xem chi tiết nhóm
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!isGroupCollapsed && groups.length === 0 && (
                    <div className="group-empty">
                      {groupLoading ? 'Đang tải nhóm...' : (groupError || 'Chưa có nhóm')}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <RoomSearchForm
                criteria={roomFinder.criteria}
                onChange={roomFinder.updateCriteria}
                onToggleDeviceType={roomFinder.toggleDeviceType}
                onSubmit={roomFinder.fetchRooms}
                onClear={roomFinder.clearFilters}
                deviceTypeOptions={roomFinder.DEVICE_TYPE_OPTIONS}
                loading={roomFinder.loading}
                formError={roomFinder.formError}
              />
            )}
          </div>

          <div className="right-panel">
            {viewMode === 'calendar' ? (
              groupDetail ? (
                <div className="group-detail-panel">
                  <div className="group-detail-header">
                    <h3>Chi tiết nhóm</h3>
                    <button
                      className="group-detail-close"
                      onClick={() => setGroupDetail(null)}
                      aria-label="Đóng chi tiết nhóm"
                    >
                      ✕
                    </button>
                  </div>
                  {groupDetailLoading ? (
                    <div className="group-detail-loading">Đang tải chi tiết nhóm...</div>
                  ) : (
                    <>
                      <div className="detail-field">
                        <div className="detail-label">Tên nhóm</div>
                        <div className="detail-value">{groupDetail.name}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-label">Mô tả</div>
                        <div className="detail-value">{groupDetail.description || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-label">Trưởng nhóm</div>
                        <div className="detail-value">{groupDetail.ownerName || groupDetail.ownerId || '—'}</div>
                      </div>
                      <div className="detail-field">
                        <div className="detail-label">Thành viên ({groupDetail.members?.length || 0})</div>
                        <div className="detail-value member-list">
                          {(groupDetail.members || []).map((m, idx) => (
                            <div key={m.userId || idx} className="member-item">
                              <span className="member-name">{m.fullName || m.username || m.email || m.userId}</span>
                              <span className="member-role">{m.role}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          className="btn-secondary"
                          style={{ marginTop: '8px' }}
                          onClick={() => setInviteModalOpen(true)}
                        >
                          Thêm thành viên
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
              <TimeTable 
                selectedDate={selectedDate} 
                viewType={viewType}
                refreshTrigger={refreshTrigger}
                onDateSelect={handleSelectDay}
                onMeetingUpdated={handleMeetingCreated}
                onSelectionComplete={handleQuickCreateRange}
                activeSelection={quickCreateRange}
                onSelectionRangeChange={handleSelectionRangeChange}
              />
              )
            ) : (
              <RoomResultsList
                rooms={roomFinder.hasSearched ? roomFinder.rooms : roomFinder.allRooms}
                loading={roomFinder.loading}
                error={roomFinder.apiError}
                hasSearched={roomFinder.hasSearched}
                searchRange={roomFinder.searchRange}
                onRetry={roomFinder.fetchRooms}
                onBookRoom={(room) => {
                  if (!room || !roomFinder.searchRange) return;
                  handleBookRoom(room, roomFinder.searchRange);
                }}
                onViewDetails={handleOpenRoomDetail}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* Meeting Reminder Notifications */}
      {upcomingReminders.map((reminder, index) => {
        const meetingId = reminder.meetingId || reminder.id || reminder._id;
        return (
          <div
            key={meetingId || index}
            style={{
              position: 'fixed',
              top: `${20 + index * 320}px`,
              right: '20px',
              zIndex: 10002 + index
            }}
          >
            <MeetingReminderNotification
              reminder={reminder}
              onClose={() => clearReminder(meetingId)}
              onView={() => {
                // Mở form chỉnh sửa meeting
                setEditingMeeting(reminder);
                setShowEditForm(true);
                // Chuyển sang ngày của meeting
                const startTime = reminder.startTime || reminder.start;
                if (startTime) {
                  const dateObj = new Date(startTime);
                  setSelectedDate(dateObj);
                  setViewType('day');
                }
                // Đóng notification
                clearReminder(meetingId);
              }}
            />
          </div>
        );
      })}

      {/* Create Meeting Form */}
      {showMeetingForm && (
        <MeetingForm
          selectedDate={selectedDate}
          initialStartTime={quickCreateRange?.start || null}
          initialEndTime={quickCreateRange?.end || null}
          initialRoomId={preselectedRoomId}
          groups={groups}
          onClose={() => {
            setShowMeetingForm(false);
            handleSelectionRangeChange(null);
            setPreselectedRoomId(null);
          }}
          onSubmit={async (meetingData) => {
            setShowMeetingForm(false);
            handleSelectionRangeChange(null);
            setPreselectedRoomId(null);
            await handleMeetingCreated(meetingData, 'Tạo lịch họp thành công');
          }}
        />
      )}

      {/* Invite members panel */}
      {inviteModalOpen && (
        <div className="modal-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="modal group-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Mời thành viên vào nhóm</h3>
            <div className="detail-field">
              <div className="detail-label">Nhập email (nhấn Enter để thêm)</div>
              <div className="chip-input">
                {inviteEmails.map((email, idx) => (
                  <span key={idx} className="chip">
                    {email}
                    <button className="chip-remove" onClick={() => {
                      setInviteEmails(prev => prev.filter((_, i) => i !== idx));
                    }}>×</button>
                  </span>
                ))}
                <input
                  type="email"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addInviteEmail(inviteInput);
                    }
                  }}
                  onBlur={() => addInviteEmail(inviteInput)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Lời nhắn (tùy chọn)</div>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                placeholder="Nội dung mời tham gia nhóm"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button className="btn-secondary" onClick={() => setInviteModalOpen(false)}>Hủy</button>
              <button
                className="btn-primary"
                disabled={inviteSubmitting || inviteEmails.length === 0}
                onClick={async () => {
                  if (!groupDetail?.id) {
                    setToast({ isOpen: true, message: 'Chưa chọn nhóm', type: 'error' });
                    return;
                  }
                  setInviteSubmitting(true);
                  
                  // Optimistic update - hiển thị success ngay
                  const successToast = () => {
                    setToast({ isOpen: true, message: 'Đã gửi lời mời', type: 'success' });
                    setInviteEmails([]);
                    setInviteInput('');
                    setInviteMessage('');
                    setInviteModalOpen(false);
                  };
                  
                  try {
                    // Gửi theo batch để tránh quá tải
                    const BATCH_SIZE = 5;
                    const batches = [];
                    for (let i = 0; i < inviteEmails.length; i += BATCH_SIZE) {
                      batches.push(inviteEmails.slice(i, i + BATCH_SIZE));
                    }
                    
                    // Gửi từng batch
                    for (const batch of batches) {
                      await Promise.all(
                        batch.map(email =>
                          inviteToGroup({
                            groupId: groupDetail.id,
                            email,
                            role: 'MEMBER',
                            message: inviteMessage
                          })
                        )
                      );
                    }
                    
                    // Invalidate group detail cache để refresh
                    groupDetailCacheRef.current.delete(`group_detail_${groupDetail.id}`);
                    
                    successToast();
                    
                    // Refresh group detail nếu đang mở
                    if (groupDetail?.id === groupDetail.id) {
                      try {
                        const updatedDetail = await getGroupDetail(groupDetail.id);
                        groupDetailCacheRef.current.set(`group_detail_${groupDetail.id}`, {
                          data: updatedDetail,
                          timestamp: Date.now()
                        });
                        setGroupDetail(updatedDetail);
                      } catch (refreshError) {
                        console.warn('Failed to refresh group detail:', refreshError);
                      }
                    }
                  } catch (err) {
                    console.error('Invite error', err);
                    setToast({ 
                      isOpen: true, 
                      message: err?.response?.data?.message || 'Gửi lời mời thất bại', 
                      type: 'error' 
                    });
                  } finally {
                    setInviteSubmitting(false);
                  }
                }}
              >
                {inviteSubmitting ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meeting Form */}
      {showEditForm && editingMeeting && (
        <EditMeetingForm
          meeting={editingMeeting}
          onClose={() => {
            setShowEditForm(false);
            setEditingMeeting(null);
          }}
          onSubmit={handleUpdateMeeting}
          onDelete={handleDeleteMeeting}
        />
      )}

      {/* Room Detail Modal */}
      {roomDetail && (
        <RoomDetailModal
          room={roomDetail}
          onClose={handleCloseRoomDetail}
          onBookRoom={() => {
            handleBookRoom(roomDetail);
            handleCloseRoomDetail();
          }}
        />
      )}

      {/* Group creation modal */}
      {showGroupForm && (
        <div className="modal-overlay" onClick={() => setShowGroupForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo nhóm</h3>
            <div className="modal-field">
              <label>Tên nhóm</label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên nhóm"
              />
            </div>
            <div className="modal-field">
              <label>Mô tả</label>
              <textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả (tuỳ chọn)"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowGroupForm(false)}>Hủy</button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (!groupForm.name.trim()) return;
                  const payload = {
                    name: groupForm.name.trim(),
                    description: groupForm.description.trim()
                  };
                  createGroup(payload)
                    .then((created) => {
                      setGroups(prev => [created || payload, ...prev]);
                      setGroupForm({ name: '', description: '' });
                      setShowGroupForm(false);
                      setToast({
                        isOpen: true,
                        message: 'Tạo nhóm thành công',
                        type: 'success'
                      });
                      if (isGroupCollapsed) setIsGroupCollapsed(false);
                    })
                    .catch((err) => {
                      console.error('Create group error:', err);
                      setToast({
                        isOpen: true,
                        message: 'Tạo nhóm thất bại',
                        type: 'error'
                      });
                    });
                }}
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Wrap MainContent with providers
const Main = () => {
  return (
    <DeviceInventoryProvider>
      <MeetingProvider>
        <MainContent />
      </MeetingProvider>
    </DeviceInventoryProvider>
  );
};

export default Main;