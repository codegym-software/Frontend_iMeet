// components/EditMeetingForm.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './MeetingForm.css';
import './EditMeetingForm.css';
import { roomAPI } from './MainCalendar/utils/RoomAPI';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';
import DateTimePicker from '../common/DateTimePicker';
import adminService from '../../services/adminService';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';
import { useMeetingWithDevices } from '../../hooks/useMeetingWithDevices';

const normalizeRoomId = (room) => Number(room?.roomId ?? room?.id);

const EditMeetingForm = ({ meeting, onClose, onSubmit, onDelete }) => {
  console.log('EditMeetingForm - Meeting data:', meeting);
  
  // ✅ NEW: Track full meeting details loaded from API
  const [fullMeeting, setFullMeeting] = useState(meeting);
  
  // Get current user ID
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.id || currentUser?.userId || null;
  
  // Get meeting owner ID - check both meeting and fullMeeting
  const meetingOwnerId = fullMeeting?.userId || fullMeeting?.user?.id || fullMeeting?.user?.userId || 
                        meeting?.userId || meeting?.user?.id || meeting?.user?.userId || null;
  
  // Check if current user is the owner
  const isOwner = currentUserId && meetingOwnerId && String(currentUserId) === String(meetingOwnerId);
  
  // Check if meeting is editable - only owner can edit/delete, and meeting must not be CANCELLED or COMPLETED
  const bookingStatus = meeting?.bookingStatus?.toUpperCase() || fullMeeting?.bookingStatus?.toUpperCase();
  const isEditable = isOwner && bookingStatus !== 'CANCELLED' && bookingStatus !== 'COMPLETED';
  
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    startDateTime: meeting?.start ? new Date(meeting.start) : new Date(),
    endDateTime: meeting?.end ? new Date(meeting.end) : new Date(),
    guests: [], // Changed to array to support multiple emails
    room: meeting?.roomId || '',
    devices: meeting?.deviceIds?.map(id => ({ deviceId: id, quantity: 1, deviceName: 'Device' + id })) || [],
    isAllDay: meeting?.allDay || false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [guestSuggestions, setGuestSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [guestInputValue, setGuestInputValue] = useState('');
  const guestInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]); // Available rooms in selected time range
  const [unavailableRooms, setUnavailableRooms] = useState([]); // Unavailable rooms in selected time range
  const [selectedRoomDevices, setSelectedRoomDevices] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [invitees, setInvitees] = useState([]); // List of invitees with status
  const [inviteeFilter, setInviteeFilter] = useState('all'); // 'all', 'PENDING', 'ACCEPTED', 'DECLINED'
  const [loadingInvitees, setLoadingInvitees] = useState(true);

  const normalizeInvitees = useCallback((list = []) => {
    return list.map(inv => ({
      inviteId: inv.inviteId || inv.inviteeId || inv.id,
      id: inv.inviteId || inv.inviteeId || inv.id,
      email: (inv.email || '').trim(),
      fullName: inv.fullName || inv.name || inv.userName || null,
      status: (inv.status || inv.inviteStatus || 'PENDING').toUpperCase(),
      role: inv.role || null,
      invitedAt: inv.invitedAt || null,
      respondedAt: inv.respondedAt || inv.responseAt || inv.updatedAt || null
    }));
  }, []);
  const [deviceSearch, setDeviceSearch] = useState(''); // Tìm kiếm thiết bị
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all'); // Lọc loại thiết bị
  const [showDeviceFilter, setShowDeviceFilter] = useState(false); // Collapse/expand filter
  
  // ✅ USE CACHE - No more slow API calls!
  const { getDevicesWithAvailability, checkAvailability, inventory, loading: inventoryLoading } = useDeviceInventory();
  const { updateMeetingWithDevices, deleteMeetingWithDevices } = useMeetingWithDevices();
  
  // Get devices from cache - INSTANT! (with fallback)
  const allDevices = getDevicesWithAvailability();
  
  // Debug: Log devices when they change
  useEffect(() => {
    console.log('📱 EditMeetingForm - Devices loaded:', allDevices.length, 'devices', allDevices);
    if (allDevices.length === 0) {
      console.warn('⚠️ No devices available from inventory!');
      console.log('  - Inventory loading:', inventoryLoading);
      console.log('  - Inventory state:', Object.keys(inventory).length, 'items');
    }
  }, [allDevices, inventory, inventoryLoading]);
  
  // Update formData when meeting changes - use useMemo to prevent infinite loops
  const baseMeetingId = meeting?.meetingId ?? meeting?.id ?? null;
  const meetingId = fullMeeting?.meetingId ?? fullMeeting?.id ?? baseMeetingId ?? null;
  
  // Cache cho full meeting data
  const fullMeetingCacheRef = useRef(new Map());

  // ✅ NEW: Fetch full meeting details including devices when form opens - với cache
  useEffect(() => {
    if (baseMeetingId) {
      // Kiểm tra cache trước
      const cacheKey = `full_meeting_${baseMeetingId}`;
      const cached = fullMeetingCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) { // Cache 30 giây
        setFullMeeting(cached.data);
        return;
      }

      // Always fetch full details to ensure we have devices data
      console.log('📥 Fetching full meeting details for ID:', baseMeetingId);
      calendarAPI.getMeetingById(baseMeetingId)
        .then(fullMeetingData => {
          if (fullMeetingData) {
            console.log('✅ Full meeting loaded with devices:', fullMeetingData);
            setFullMeeting(fullMeetingData);
            // Lưu vào cache
            fullMeetingCacheRef.current.set(cacheKey, {
              data: fullMeetingData,
              timestamp: Date.now()
            });
          } else if (meeting?.devices || meeting?.deviceIds) {
            // Fallback to meeting prop if API doesn't return data
            console.log('⚠️ Using meeting prop as fallback');
            setFullMeeting(meeting);
          }
        })
        .catch(error => {
          console.error('❌ Error fetching meeting details:', error);
          // Fallback to meeting prop on error
          if (meeting?.devices || meeting?.deviceIds) {
            console.log('⚠️ Using meeting prop as fallback after error');
            setFullMeeting(meeting);
          }
        });
    } else if (meeting?.devices || meeting?.deviceIds) {
      // If no meetingId but meeting prop has device data, use it
      setFullMeeting(meeting);
    }
  }, [baseMeetingId, meeting]);
  
  useEffect(() => {
    if (fullMeeting && (meetingId || meeting)) {
      console.log('🔄 Updating formData with fullMeeting:', fullMeeting);
      console.log('📱 Available devices in inventory:', allDevices.length);
      
      // Convert attendees to guests array format (robust guards)
      const attendeesRaw = Array.isArray(fullMeeting.attendees)
        ? fullMeeting.attendees
        : Array.isArray(fullMeeting.invitees)
            ? fullMeeting.invitees
                .map(inv => (typeof inv === 'string' ? inv : inv?.email))
                .filter(Boolean)
        : (typeof fullMeeting.attendees === 'string'
            ? fullMeeting.attendees.split(/[;,]/).map(s => s.trim()).filter(Boolean)
            : []);
      const guestsArray = attendeesRaw.map(email => ({ email, fullName: null }));
      
      // ✅ FIX: Extract device data from fullMeeting inside useEffect so we use the updated state
      const meetingDevicesData = fullMeeting?.devices;
      const meetingDeviceIdsData = fullMeeting?.deviceIds;
      
      console.log('🔍 Checking device data in meeting:', {
        hasDevices: !!meetingDevicesData,
        devicesLength: meetingDevicesData?.length || 0,
        hasDeviceIds: !!meetingDeviceIdsData,
        deviceIdsLength: meetingDeviceIdsData?.length || 0,
        fullMeetingKeys: Object.keys(fullMeeting || {}),
        devicesSample: meetingDevicesData?.[0],
        fullMeetingDevices: fullMeeting?.devices
      });
      
      // Load devices from meeting - check both deviceIds and devices array
      let meetingDevices = [];
      
      if (meetingDevicesData && Array.isArray(meetingDevicesData) && meetingDevicesData.length > 0) {
        // If devices array exists, use it (from MeetingDeviceResponse)
        console.log('📱 EditForm - Loading devices from meeting.devices array:', meetingDevicesData);
        meetingDevices = meetingDevicesData.map(d => {
          // Handle both numeric and string device IDs
          const deviceId = d.deviceId || d.id;
          const deviceInfo = allDevices.find(ad => {
            // Compare as numbers to handle type mismatches
            return Number(ad.deviceId) === Number(deviceId);
          });
          console.log(`  Device ${deviceId}: found=${!!deviceInfo}, name=${deviceInfo?.name || d.deviceName || d.name}, qty=${d.quantityBorrowed || d.quantity || 1}`);
          return {
            deviceId: Number(deviceId), // Ensure it's a number
            quantity: d.quantityBorrowed || d.quantity || 1,
            deviceName: deviceInfo?.name || d.deviceName || d.name || `Device ${deviceId}`,
            notes: d.notes || null
          };
        });
      } else if (meetingDeviceIdsData && Array.isArray(meetingDeviceIdsData) && meetingDeviceIdsData.length > 0) {
        // Fallback to deviceIds
        console.log('📱 EditForm - Loading devices from meeting.deviceIds array:', meetingDeviceIdsData);
        meetingDevices = meetingDeviceIdsData.map(id => {
          const deviceId = Number(id);
          const device = allDevices.find(d => Number(d.deviceId) === deviceId);
          console.log(`  Device ID ${deviceId}: found=${!!device}, name=${device?.name || 'Unknown'}`);
          return {
            deviceId: deviceId,
            quantity: 1,
            deviceName: device?.name || `Device ${deviceId}`
          };
        });
      } else {
        console.log('⚠️ No device data found in meeting:', {
          hasDevices: !!meetingDevicesData,
          hasDeviceIds: !!meetingDeviceIdsData,
          devicesLength: meetingDevicesData?.length || 0,
          deviceIdsLength: meetingDeviceIdsData?.length || 0,
          fullMeeting: fullMeeting
        });
      }
      
      console.log('✅ EditForm - Final devices array to set:', meetingDevices);
      console.log('📊 Device count:', meetingDevices.length);
      
      setFormData(prev => {
        // Always update devices if we have data, otherwise keep existing
        const finalDevices = meetingDevices.length > 0 ? meetingDevices : (prev.devices || []);
        
        return {
          title: fullMeeting.title || prev.title || '',
          description: fullMeeting.description || prev.description || '',
          startDateTime: fullMeeting.start ? new Date(fullMeeting.start) : prev.startDateTime,
          endDateTime: fullMeeting.end ? new Date(fullMeeting.end) : prev.endDateTime,
          guests: guestsArray.length > 0 ? guestsArray : prev.guests,
          room: fullMeeting.roomId || prev.room || '',
          devices: finalDevices, // Always set devices (even if empty)
          isAllDay: fullMeeting.allDay !== undefined ? fullMeeting.allDay : prev.isAllDay
        };
      });
      
      // Log final state for debugging
      console.log('✅ FormData devices set:', meetingDevices.length, 'devices');

      if (Array.isArray(fullMeeting.invitees) && fullMeeting.invitees.length > 0) {
        setInvitees(normalizeInvitees(fullMeeting.invitees));
        setLoadingInvitees(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, fullMeeting, allDevices.length, normalizeInvitees]); // Add allDevices.length to dependencies

  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load rooms only - devices từ cache rồi!
  useEffect(() => {
    const loadRooms = async () => {
      try {
        if (isMountedRef.current) setLoadingRooms(true);
        const roomsData = await roomAPI.getAvailableRooms();
        if (isMountedRef.current) {
          const sortedRooms = [...roomsData].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setRooms(sortedRooms);
          // Initially, show all rooms as available
          setAvailableRooms(sortedRooms);
          setUnavailableRooms([]);
          
          // Load devices for current room
          if (formData.room) {
            const currentRoom = roomsData.find(r => r.roomId === parseInt(formData.room));
            if (currentRoom?.devices) {
              setSelectedRoomDevices(currentRoom.devices);
            }
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Error loading rooms:', error);
          setErrors(prev => ({ ...prev, room: 'Không thể tải danh sách phòng' }));
        }
      } finally {
        if (isMountedRef.current) setLoadingRooms(false);
      }
    };

    loadRooms();
    // ✅ Devices từ cache - không cần fetch nữa!
  }, []);

  // Fetch available rooms when start/end time changes (for edit form, exclude current meeting's room)
  useEffect(() => {
    let isMounted = true;

    const fetchRoomsAvailability = async () => {
      if (!formData.startDateTime || !formData.endDateTime) return;
      
      try {
        console.log('📡 Checking room availability for:', formData.startDateTime, 'to', formData.endDateTime);
        
        // Get rooms that are FREE (không có meeting) trong khoảng thời gian được chọn
        const availableData = await roomAPI.getAvailableRoomsInRange(
          formData.startDateTime,
          formData.endDateTime
        );
        
        if (isMounted) {
          // Map room IDs từ availableData - phòm trống
          const availableIds = availableData.map(r => normalizeRoomId(r));
          
          console.log('🔍 All rooms:', rooms.map(r => ({ id: r.roomId || r.id, name: r.name })));
          console.log('✅ Available rooms (không có lịch):', availableIds);
          
          // Chia phòm thành 2 nhóm
          let available = rooms
            .filter(r => availableIds.includes(normalizeRoomId(r)))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          
          let unavailable = rooms
            .filter(r => !availableIds.includes(normalizeRoomId(r)))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          // Nếu đang edit, giữ phòm hiện tại ở nhóm available (ở đầu)
          const currentRoomId = formData.room ? Number(formData.room) : null;
          if (currentRoomId) {
            const currentRoomInAvailable = available.some(r => {
              const id = normalizeRoomId(r);
              return id === currentRoomId;
            });
            
            if (!currentRoomInAvailable) {
              // Phòm hiện tại bị unavailable, cần move nó lên available
              const currentRoom = rooms.find(r => {
                const id = normalizeRoomId(r);
                return id === currentRoomId;
              });
              
              if (currentRoom) {
                // Remove từ unavailable
                unavailable = unavailable.filter(r => {
                  const id = normalizeRoomId(r);
                  return id !== currentRoomId;
                });
                // Add vào đầu available
                available = [currentRoom, ...available];
              }
            }
          }
          
          setAvailableRooms(available);
          setUnavailableRooms(unavailable);
          console.log('📊 Result:', available.length, 'available,', unavailable.length, 'unavailable, currentRoomId=', currentRoomId);

          if (formData.room && !available.some(r => normalizeRoomId(r) === Number(formData.room))) {
            setFormData(prev => ({
              ...prev,
              room: ''
            }));
            setErrors(prev => ({
              ...prev,
              room: 'Phòng đã có lịch trong khoảng thời gian này. Vui lòng chọn phòng khác.'
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error fetching room availability:', error);
        // Fallback: show all rooms as available
        if (isMounted) {
          setAvailableRooms(rooms);
          setUnavailableRooms([]);
        }
      }
    };

    fetchRoomsAvailability();

    return () => {
      isMounted = false;
    };
  }, [formData.startDateTime, formData.endDateTime, rooms, formData.room]);

  // Load room devices when room changes
  useEffect(() => {
    const loadRoomDevices = async () => {
    if (formData.room) {
        try {
          const roomDevices = await roomAPI.getRoomDevices(parseInt(formData.room));
          if (isMountedRef.current) {
            setSelectedRoomDevices(roomDevices || []);
          }
        } catch (error) {
          console.error('Error loading room devices:', error);
          if (isMountedRef.current) {
            setSelectedRoomDevices([]);
          }
        }
      } else {
        if (isMountedRef.current) {
        setSelectedRoomDevices([]);
        }
      }
    };
    
    loadRoomDevices();
  }, [formData.room]);

  // Cache cho invitees
  const inviteesCacheRef = useRef(new Map());

  // Load invitees when meeting changes - với cache
  useEffect(() => {
    const loadInvitees = async () => {
      if (!meetingId) {
        setInvitees([]);
        if (isMountedRef.current) setLoadingInvitees(false);
        return;
      }

      // Kiểm tra cache trước
      const cacheKey = `edit_invitees_${meetingId}`;
      const cached = inviteesCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) { // Cache 1 phút
        if (isMountedRef.current) {
          setInvitees(cached.data);
          setLoadingInvitees(false);
        }
        return;
      }

          if (isMountedRef.current) setLoadingInvitees(true);
      try {
          const inviteesData = await calendarAPI.getMeetingInvitees(meetingId);
        const normalized = normalizeInvitees(inviteesData || []);
        
          if (isMountedRef.current) {
          setInvitees(normalized);
          
          // Lưu vào cache
          inviteesCacheRef.current.set(cacheKey, {
            data: normalized,
            timestamp: Date.now()
          });
          }
        } catch (error) {
          console.error('Error loading invitees:', error);
          if (isMountedRef.current) {
            setInvitees([]);
          }
        } finally {
          if (isMountedRef.current) setLoadingInvitees(false);
      }
    };
    
    loadInvitees();
  }, [meetingId, normalizeInvitees]);

  const filteredInvitees = useMemo(() => {
    if (inviteeFilter === 'all') return invitees;
    return invitees.filter(inv => inv.status === inviteeFilter);
  }, [invitees, inviteeFilter]);

  const handleRoomChange = (e) => {
    const { value } = e.target;
    const roomId = value ? Number(value) : '';

    if (roomId) {
      const isRoomAvailable = availableRooms.some(room => normalizeRoomId(room) === roomId);
      if (!isRoomAvailable) {
        setErrors(prev => ({
          ...prev,
          room: 'Phòng đã có lịch trong khoảng thời gian này. Vui lòng chọn phòng khác.'
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      room: roomId
    }));

    if (errors.room) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.room;
        return newErrors;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Search users for guest autocomplete
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setGuestSuggestions([]);
      return [];
    }

    try {
      setIsLoading(true);
      // Call getUsers with individual parameters, not an object
      const response = await adminService.getUsers(0, 10, 'email', 'asc', query.trim());
      
      // Response structure: { users: [...] } or { data: { content: [...] } }
      let users = [];
      if (response && response.users && Array.isArray(response.users)) {
        users = response.users;
      } else if (response && response.data && response.data.content && Array.isArray(response.data.content)) {
        users = response.data.content;
      } else if (response && response.data && Array.isArray(response.data)) {
        users = response.data;
      }
      
      const mappedUsers = users.map(user => ({
        id: user.userId || user.id,
        email: user.email,
        fullName: user.fullName || user.name || null
      }));
      
      return mappedUsers;
    } catch (error) {
      console.warn('⚠️ Error searching users:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Validate email format - more lenient to allow various email formats
  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    const trimmed = email.trim();
    if (trimmed.length === 0) return false;
    
    // More lenient email regex - allows most valid email formats
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return emailRegex.test(trimmed);
  };

  // Handle guest input change
  const handleGuestChange = async (e) => {
    const value = e.target.value;
    setGuestInputValue(value);

    // Clear error when user starts typing
    if (errors.guests) {
      setErrors(prev => ({
        ...prev,
        guests: ''
      }));
    }

    // Show suggestions if query is not empty and doesn't contain comma
    if (value.trim().length > 1 && !value.includes(',')) {
      const suggestions = await searchUsers(value.trim());
      setGuestSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setGuestSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle guest input key press (Enter, Comma)
  const handleGuestKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addGuest(guestInputValue.trim());
    } else if (e.key === 'Backspace' && guestInputValue === '' && formData.guests.length > 0) {
      // Remove last guest if input is empty and backspace is pressed
      removeGuest(formData.guests.length - 1);
    }
  };

  // Add guest (from suggestion or manual input)
  const addGuest = (emailOrUser) => {
    let email = '';
    let fullName = null;

    if (typeof emailOrUser === 'string') {
      email = emailOrUser.trim();
    } else if (emailOrUser && emailOrUser.email) {
      email = emailOrUser.email.trim();
      fullName = emailOrUser.fullName || emailOrUser.name || null;
    }

    if (!email) {
      setErrors(prev => ({
        ...prev,
        guests: 'Vui lòng nhập email'
      }));
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setErrors(prev => ({
        ...prev,
        guests: `Email không hợp lệ: "${email}". Vui lòng kiểm tra lại định dạng email.`
      }));
      return;
    }

    // Check if email already exists
    if (formData.guests.some(g => g.email.toLowerCase() === email.toLowerCase())) {
      setErrors(prev => ({
        ...prev,
        guests: `Email "${email}" đã được thêm rồi`
      }));
      setGuestInputValue('');
      return;
    }
    
    // Add to guests list
    setFormData(prev => ({
      ...prev,
      guests: [...prev.guests, { email, fullName }]
    }));

    setGuestInputValue('');
    setShowSuggestions(false);
    setGuestSuggestions([]);
    
    // Clear any previous errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.guests;
      return newErrors;
    });
  };

  // Handle guest selection from suggestions
  const handleGuestSelect = (user) => {
    addGuest(user);
  };

  // Remove guest
  const removeGuest = (index) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Resolve meeting ID once to avoid shadowing errors
      const currentMeetingId = meetingId;
      if (!currentMeetingId) {
        throw new Error('Không tìm thấy ID của cuộc họp. Vui lòng thử lại.');
      }
      // Validate
      if (!formData.title.trim()) {
        setErrors({ title: 'Tiêu đề không được để trống' });
        setIsLoading(false);
        return;
      }

      if (!formData.room) {
        setErrors({ room: 'Vui lòng chọn phòng họp' });
        setIsLoading(false);
        return;
      }

      // Pre-check room availability before updating (exclude current meeting to avoid self-conflict)
      try {
        const isAvailable = await calendarAPI.checkRoomAvailability(
          parseInt(formData.room),
          formData.startDateTime,
          formData.endDateTime,
          currentMeetingId
        );
        if (!isAvailable) {
          throw new Error('Phòng đã có lịch trong khoảng thời gian này. Vui lòng chọn phòng khác.');
        }
      } catch (availErr) {
        throw availErr;
      }

      // Format dates
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      // Get current attendees from invitees, not meeting
      const currentInvitees = invitees || [];
      const currentAttendeeEmails = currentInvitees.map(invitee => invitee.email.toLowerCase().trim());
      
      // Get all guest emails from form
      const allGuestEmails = formData.guests
        .map(g => g.email)
        .filter(email => email && email.trim().length > 0 && isValidEmail(email.trim()))
        .map(email => email.trim().toLowerCase());
      
      // Only invite NEW emails that are not already invited
      const inviteEmails = allGuestEmails.filter(email => !currentAttendeeEmails.includes(email));
      
      console.log('📧 Current invitees:', currentAttendeeEmails);
      console.log('📧 All guest emails:', allGuestEmails); 
      console.log('📧 New invite emails:', inviteEmails);

      // Prepare meeting data
      const meetingData = {
        title: formData.title,
        description: formData.description || '',
        startTime: formatLocalDateTime(formData.startDateTime),
        endTime: formatLocalDateTime(formData.endDateTime),
        isAllDay: formData.isAllDay,
        roomId: parseInt(formData.room)
      };
      
      // Only add devices if there are any
      if (formData.devices && formData.devices.length > 0) {
        meetingData.devices = formData.devices.map(d => ({
          deviceId: d.deviceId,
          quantityBorrowed: d.quantity || 1,
          notes: d.notes || null
        }));
      }
      
      // Handled earlier with invitees list instead of meeting.attendees
      
      // Don't send inviteEmails in updateMeeting - backend doesn't handle it
      // We'll call invite API separately after update
      
      // Log meeting data before sending
      console.log('📤 Sending update meeting data:', JSON.stringify(meetingData, null, 2));
      console.log('📧 Current attendees:', currentAttendeeEmails);
      console.log('📧 All guest emails:', allGuestEmails);
      console.log('📧 New invite emails to add:', inviteEmails);
      
      console.log('📝 Updating meeting with ID:', currentMeetingId);
      
      // Call API to update meeting (without inviteEmails)
      const { meeting: updatedMeeting, message: updateMessage } = await calendarAPI.updateMeeting(currentMeetingId, meetingData);
      
      if (!updatedMeeting) {
        throw new Error('Không nhận được dữ liệu meeting sau khi cập nhật');
      }
      
      console.log('✅ Meeting updated successfully:', updatedMeeting);
      
      // If there are new invite emails, call invite API separately
      if (inviteEmails.length > 0) {
        try {
          console.log('📧 Inviting additional participants:', inviteEmails);
          const inviteResult = await calendarAPI.inviteParticipants(currentMeetingId, {
            emails: inviteEmails,
            message: null
          });
          console.log('✅ Successfully invited additional participants:', inviteResult);
        } catch (inviteError) {
          console.warn('⚠️ Failed to invite additional participants:', inviteError);
          // Show warning but don't fail the whole update
          setErrors(prev => ({ 
            ...prev, 
            invite: `Cập nhật meeting thành công nhưng không thể mời một số người tham gia: ${inviteError.message || 'Unknown error'}` 
          }));
        }
      }
      
      // ✅ OPTIMISTIC UPDATE - Return old devices, borrow new ones
      try {
        updateMeetingWithDevices(meeting, updatedMeeting);
      } catch (deviceError) {
        console.warn('⚠️ Error updating device inventory:', deviceError);
        // Don't fail the whole update if device update fails
      }
      
      // Call parent onSubmit callback
      if (isMountedRef.current && onSubmit) {
        onSubmit(updatedMeeting, updateMessage || 'Cập nhật cuộc họp thành công!');
      }
      
      // Close form after success
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current && onClose) {
            onClose();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      if (isMountedRef.current) {
        setErrors({ submit: error.message || 'Không thể cập nhật cuộc họp. Vui lòng thử lại.' });
        // Thông báo lỗi lên parent để hiển thị Toast
        if (onSubmit) {
          onSubmit(null, error.message || 'Không thể cập nhật cuộc họp. Vui lòng thử lại.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="create-meeting-modal-overlay">
      <div className="google-calendar-form">
        {/* Header */}
        <div className="google-calendar-header">
          <div className="google-calendar-header-left">
            <button className="google-calendar-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="google-calendar-header-right">
            <button
              type="button"
              className="google-calendar-save-btn"
              onClick={handleSubmit}
              disabled={isLoading || !isEditable}
            >
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
        
        {/* Notice for non-editable meetings */}
        {!isEditable && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: !isOwner ? '#e3f2fd' : '#fff3cd',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span style={{ color: !isOwner ? '#1565c0' : '#856404', fontSize: '14px', fontWeight: '500' }}>
              {!isOwner 
                ? 'Chỉ người tạo cuộc họp mới có thể chỉnh sửa hoặc xóa cuộc họp này. Bạn chỉ có thể xem thông tin.'
                : 'Cuộc họp này đã bị hủy hoặc đã hoàn thành. Bạn chỉ có thể xem thông tin.'}
            </span>
          </div>
        )}
        
        {/* Body - Google Calendar style display */}
        <div className="google-calendar-body" style={{ padding: '0' }}>
          <div className="google-calendar-main" style={{ 
            padding: '24px 32px',
            maxWidth: '100%',
            borderRight: 'none'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Title - Large, bold */}
              <div style={{ marginBottom: '16px' }}>
                {isEditable ? (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Thêm tiêu đề"
                    className="meeting-title-display"
                  style={{ 
                    fontSize: '22px', 
                    fontWeight: '400', 
                      padding: '8px 0', 
                    border: 'none', 
                    borderBottom: '1px solid transparent',
                      width: '100%',
                      outline: 'none',
                      color: '#202124'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#1a73e8'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
              />
                ) : (
                  <h1 style={{ 
                    fontSize: '22px', 
                    fontWeight: '400', 
                    margin: 0,
                    color: '#202124',
                    padding: '8px 0'
                  }}>
                    {formData.title || 'Không có tiêu đề'}
                  </h1>
                )}
                {errors.title && <span style={{ color: '#d93025', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.title}</span>}
            </div>

              {/* Chi tiết sự kiện heading */}
              <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#202124', margin: 0 }}>Chi tiết sự kiện</h3>
          </div>

              {/* Date & Time - Separate fields: Date, Start Time, End Time */}
              <div className="google-calendar-field">
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  {/* Date Picker - Only date */}
              <DateTimePicker
                value={formData.startDateTime}
                onChange={(date) => {
                  // Update both start and end date, keeping the time
                  const newStart = new Date(date);
                  newStart.setHours(formData.startDateTime.getHours(), formData.startDateTime.getMinutes());
                  
                  const newEnd = new Date(date);
                  newEnd.setHours(formData.endDateTime.getHours(), formData.endDateTime.getMinutes());
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    startDateTime: newStart,
                    endDateTime: newEnd
                  }));
                }}
                showTime={false}
                showDate={true}
                    placeholder="Chọn ngày"
                    className="google-calendar-input"
                displayFormat="date"
                disabled={!isEditable}
                    style={{ minWidth: '150px', flexShrink: 0 }}
              />
              
                  {/* Start Time Picker */}
              <DateTimePicker
                value={formData.startDateTime}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, startDateTime: date }));
                      // Automatically set end time 1 hour later if end time is before start
                  if (date >= formData.endDateTime) {
                    const endDate = new Date(date.getTime() + 60 * 60 * 1000);
                    setFormData(prev => ({ ...prev, endDateTime: endDate }));
                  }
                }}
                showTime={true}
                    showDate={false}
                mode="start"
                    placeholder="9:00 AM"
                    className="google-calendar-input"
                displayFormat="time"
                    disabled={!isEditable}
                    style={{ minWidth: '100px', textAlign: 'center', flexShrink: 0 }}
              />
              
                  <span style={{ color: '#5f6368', fontSize: '14px', flexShrink: 0 }}>tới</span>
              
                  {/* End Time Picker */}
              <DateTimePicker
                value={formData.endDateTime}
                onChange={(date) => setFormData(prev => ({ ...prev, endDateTime: date }))}
                showTime={true}
                    showDate={false}
                mode="end"
                baseDate={formData.startDateTime}
                    placeholder="10:00 AM"
                    className="google-calendar-input"
                displayFormat="time"
                    disabled={!isEditable}
                    style={{ minWidth: '100px', textAlign: 'center', flexShrink: 0 }}
              />
              
              {/* All Day Checkbox - Inline */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', cursor: isEditable ? 'pointer' : 'default', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isAllDay: e.target.checked }));
                    if (e.target.checked) {
                      const startDate = new Date(formData.startDateTime);
                      startDate.setHours(0, 0, 0, 0);
                      const endDate = new Date(formData.endDateTime);
                      endDate.setHours(23, 59, 59, 999);
                      setFormData(prev => ({ 
                        ...prev, 
                        startDateTime: startDate,
                        endDateTime: endDate
                      }));
                    }
                  }}
                  disabled={!isEditable}
                  style={{ width: '18px', height: '18px', cursor: isEditable ? 'pointer' : 'default' }}
                />
                    <span style={{ fontSize: '14px', color: '#202124' }}>Cả ngày</span>
              </label>
            </div>
          </div>

              {/* Room Selection */}
              <div className="google-calendar-field">
                <div className="google-calendar-field-label">
                  <span className="google-calendar-field-icon">🏛️</span>
              <select
                name="room"
                value={formData.room}
                onChange={handleRoomChange}
                    className="google-calendar-input"
                disabled={loadingRooms || !isEditable}
                    style={{ flex: 1 }}
              >
                    <option value="">Chọn phòng họp</option>
                {/* ✅ Available rooms - normal styling */}
                {availableRooms.length > 0 && (
                  <optgroup label="✅ Phòng trống (có thể đặt)">
                    {availableRooms.map(room => (
                      <option
                        key={room.roomId || room.id}
                        value={normalizeRoomId(room)}
                      >
                        {room.name} - Sức chứa: {room.capacity || 10} người
                      </option>
                    ))}
                  </optgroup>
                )}
                {/* ❌ Unavailable rooms - disabled */}
                {unavailableRooms.length > 0 && (
                  <optgroup label="❌ Phòng đã có lịch (không thể chọn)" disabled>
                    {unavailableRooms.map(room => (
                      <option
                        key={room.roomId || room.id}
                        value={normalizeRoomId(room)}
                        disabled
                        style={{ color: '#9e9e9e' }}
                      >
                        {room.name} - Sức chứa: {room.capacity || 10} người
                      </option>
                    ))}
                  </optgroup>
                )}
                {/* Fallback to show all rooms if no data */}
                {availableRooms.length === 0 && unavailableRooms.length === 0 && (
                  <>
                    {rooms.map(room => (
                      <option
                        key={room.roomId || room.id}
                        value={normalizeRoomId(room)}
                      >
                        {room.name} - Sức chứa: {room.capacity || 10} người
                      </option>
                    ))}
                  </>
                )}
              </select>
                </div>
              </div>

              {/* Location */}
              <div className="google-calendar-field">
                <div className="google-calendar-field-label">
                  <span className="google-calendar-field-icon">📍</span>
                  <input
                    type="text"
                    placeholder="Thêm vị trí"
                    className="google-calendar-input"
                    value={formData.room ? rooms.find(r => r.roomId === parseInt(formData.room))?.location || '' : ''}
                    readOnly
                  />
            </div>
          </div>

          {/* Room Devices Display */}
          {formData.room && selectedRoomDevices.length > 0 && (
                <div className="google-calendar-field">
                  <div className="google-calendar-field-label">
                    <span className="google-calendar-field-icon">🔧</span>
                    <span style={{ fontWeight: '500', marginBottom: '8px' }}>Thiết bị trong phòng:</span>
                  </div>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    marginTop: '8px'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedRoomDevices.map(device => (
                        <span
                          key={device.deviceId}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e7f3ff',
                            color: '#0056b3',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            border: '1px solid #b3d9ff'
                          }}
                        >
                            {device.deviceName || device.name} {(device.deviceType || device.type) ? `- ${device.deviceType || device.type}` : ''} (SL: {device.quantityAssigned || device.quantity || 1})
                        </span>
                      ))}
                </div>
              </div>
            </div>
          )}

              {/* Borrowed Devices Display & Management */}
              <div className="google-calendar-field">
                <div className="google-calendar-field-label">
                  <span className="google-calendar-field-icon">💻</span>
                  <span style={{ fontWeight: '500' }}>Thiết bị mượn:</span>
                </div>

                {/* Hiển thị thiết bị được mượn dạng tags */}
                  <div style={{
                    marginTop: '12px',
                    marginBottom: '16px',
                  padding: formData.devices.length > 0 ? '12px' : '8px',
                  backgroundColor: formData.devices.length > 0 ? '#e8f5e9' : '#f5f5f5',
                    borderRadius: '8px',
                  border: formData.devices.length > 0 ? '1px solid #4caf50' : '1px solid #dadce0',
                  minHeight: '40px'
                  }}>
                  {formData.devices.length > 0 ? (
                    <>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32', marginBottom: '10px' }}>
                        Thiết bị đã mượn ({formData.devices.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.devices.map((device, index) => {
                          // Compare as numbers to handle type mismatches
                          const deviceInfo = allDevices.find(d => Number(d.deviceId) === Number(device.deviceId));
                        const displayName = device.deviceName || deviceInfo?.name || `Device ${device.deviceId}`;
                          const deviceType = deviceInfo?.deviceType || deviceInfo?.type || 'Khác';
                          const typeMap = {
                            'MIC': 'Microphone',
                            'CAM': 'Camera',
                            'LAPTOP': 'Laptop',
                            'BANG': 'Bảng',
                            'MAN_HINH': 'Màn hình',
                            'KHAC': 'Khác',
                            'MAY_CHIEU': 'Máy chiếu'
                          };
                          const typeDisplay = typeMap[deviceType] || deviceType;
                          
                        return (
                          <div
                              key={`${device.deviceId}-${index}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                                padding: '8px 14px',
                              backgroundColor: '#fff',
                                border: '2px solid #4caf50',
                              borderRadius: '20px',
                                fontSize: '13px',
                              fontWeight: '500',
                                color: '#2e7d32',
                                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)'
                            }}
                          >
                              <span style={{ fontWeight: '600' }}>{displayName}</span>
                              <span style={{ 
                                fontSize: '11px', 
                                color: '#666',
                                padding: '2px 6px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '10px'
                              }}>
                                {typeDisplay}
                              </span>
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#1a73e8',
                                fontWeight: '600'
                              }}>
                                SL: {device.quantity || 1}
                              </span>
                            {isEditable && (
                              <button
                                type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  const newDevices = formData.devices.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, devices: newDevices }));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                    color: '#d32f2f',
                                  cursor: 'pointer',
                                    fontSize: '18px',
                                  padding: '0',
                                    width: '20px',
                                    height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '50%',
                                    transition: 'background-color 0.2s',
                                    fontWeight: 'bold'
                                }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(211, 47, 47, 0.1)';
                                    e.target.style.color = '#b71c1c';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = '#d32f2f';
                                  }}
                                  title="Xóa thiết bị"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    </>
                  ) : (
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#5f6368', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '8px'
                    }}>
                      Chưa có thiết bị nào được mượn. Vui lòng chọn thiết bị từ bảng bên dưới.
                  </div>
                )}
                </div>

                {/* Search & Filter */}
                {isEditable && (
                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                    {/* Tìm kiếm */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="🔍 Tìm kiếm thiết bị..."
                        value={deviceSearch}
                        onChange={(e) => setDeviceSearch(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                        onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                      />
                      
                      {/* Nút gấp/mở filter */}
                      <button
                        type="button"
                        onClick={() => setShowDeviceFilter(!showDeviceFilter)}
                        style={{
                          padding: '10px 16px',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          background: showDeviceFilter ? '#e3f2fd' : 'white',
                          color: showDeviceFilter ? '#1a73e8' : '#5f6368',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          minWidth: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {showDeviceFilter ? '▼ Ẩn lọc' : '▶ Lọc loại'}
                      </button>
                    </div>

                    {/* Lọc loại thiết bị - Collapse/Expand */}
                    {showDeviceFilter && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#202124', marginBottom: '10px' }}>
                          🏷️ Chọn loại thiết bị:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setDeviceTypeFilter('all')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '16px',
                              border: '1px solid #dadce0',
                              background: deviceTypeFilter === 'all' ? '#1a73e8' : 'white',
                              color: deviceTypeFilter === 'all' ? 'white' : '#5f6368',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontWeight: '500'
                            }}
                          >
                            Tất cả
                          </button>
                          {[...new Set(allDevices.map(d => {
                            const type = d.deviceType || d.type || 'Khác';
                            // Dịch sang tiếng Việt
                            const typeMap = {
                              'MIC': 'Microphone',
                              'CAM': 'Camera',
                              'LAPTOP': 'Laptop',
                              'BANG': 'Bảng',
                              'MAN_HINH': 'Màn hình',
                              'KHAC': 'Khác',
                              'MAY_CHIEU': 'Máy chiếu'
                            };
                            return typeMap[type] || type;
                          }))].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                // Map back to original type
                                const typeMapReverse = {
                                  'Microphone': 'MIC',
                                  'Camera': 'CAM',
                                  'Laptop': 'LAPTOP',
                                  'Bảng': 'BANG',
                                  'Màn hình': 'MAN_HINH',
                                  'Khác': 'KHAC',
                                  'Máy chiếu': 'MAY_CHIEU'
                                };
                                setDeviceTypeFilter(typeMapReverse[type] || type);
                              }}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '16px',
                                border: '1px solid #dadce0',
                                background: (() => {
                                  const typeMapReverse = {
                                    'Microphone': 'MIC',
                                    'Camera': 'CAM',
                                    'Laptop': 'LAPTOP',
                                    'Bảng': 'BANG',
                                    'Màn hình': 'MAN_HINH',
                                    'Khác': 'KHAC',
                                    'Máy chiếu': 'MAY_CHIEU'
                                  };
                                  return deviceTypeFilter === (typeMapReverse[type] || type) ? '#1a73e8' : 'white';
                                })(),
                                color: (() => {
                                  const typeMapReverse = {
                                    'Microphone': 'MIC',
                                    'Camera': 'CAM',
                                    'Laptop': 'LAPTOP',
                                    'Bảng': 'BANG',
                                    'Màn hình': 'MAN_HINH',
                                    'Khác': 'KHAC',
                                    'Máy chiếu': 'MAY_CHIEU'
                                  };
                                  return deviceTypeFilter === (typeMapReverse[type] || type) ? 'white' : '#5f6368';
                                })(),
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: '500'
                              }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Device Table */}
                {isEditable && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    maxHeight: '350px',
                    overflowY: 'auto'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px'
                    }}>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr style={{
                          backgroundColor: '#e9ecef',
                          borderBottom: '1px solid #dee2e6'
                        }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#202124' }}>Chọn</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#202124' }}>Tên thiết bị</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#202124' }}>Loại</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#202124' }}>SL mượn</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#202124' }}>Còn lại</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allDevices
                          .filter(device => {
                            // Filter by search
                            const searchMatch = !deviceSearch || 
                              device.name.toLowerCase().includes(deviceSearch.toLowerCase());
                            // Filter by type
                            const typeMatch = deviceTypeFilter === 'all' || 
                              (device.deviceType || device.type || 'Khác') === deviceTypeFilter;
                            return searchMatch && typeMatch;
                          })
                          .map((device, index) => {
                            // Compare deviceId as numbers to handle type mismatches
                            const selected = formData.devices.find(d => Number(d.deviceId) === Number(device.deviceId));
                            const selectedQuantity = selected ? (selected.quantity || 1) : 0;
                            const typeMap = {
                              'MIC': 'Microphone',
                              'CAM': 'Camera',
                              'LAPTOP': 'Laptop',
                              'BANG': 'Bảng',
                              'MAN_HINH': 'Màn hình',
                              'KHAC': 'Khác',
                              'MAY_CHIEU': 'Máy chiếu'
                            };
                            const deviceType = typeMap[device.deviceType || device.type] || (device.deviceType || device.type || 'Khác');
                            
                            return (
                              <tr
                                key={device.deviceId}
                                style={{
                                  borderBottom: '1px solid #e9ecef',
                                  backgroundColor: selected ? '#e8f5e9' : (index % 2 === 0 ? 'white' : '#f8f9fa'),
                                  borderLeft: selected ? '4px solid #4caf50' : '4px solid transparent',
                                  transition: 'all 0.2s',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  // Click anywhere on row to toggle selection
                                  if (selected) {
                                    setFormData(prev => ({
                                      ...prev,
                                      devices: prev.devices.filter(d => Number(d.deviceId) !== Number(device.deviceId))
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      devices: [...prev.devices, {
                                        deviceId: Number(device.deviceId), // Ensure it's a number
                                        quantity: 1,
                                        deviceName: device.name
                                      }]
                                    }));
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (!selected) {
                                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                                  } else {
                                    e.currentTarget.style.backgroundColor = '#d4edda';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = selected ? '#e8f5e9' : (index % 2 === 0 ? 'white' : '#f8f9fa');
                                }}
                              >
                                <td style={{ padding: '10px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={!!selected}
                                    onChange={() => {}}
                                    style={{ 
                                      cursor: 'pointer',
                                      width: '18px',
                                      height: '18px',
                                      accentColor: '#4caf50'
                                    }}
                                  />
                                </td>
                                <td style={{ 
                                  padding: '10px', 
                                  color: selected ? '#2e7d32' : '#202124', 
                                  fontWeight: selected ? '600' : '500'
                                }}>
                                  {device.name}
                                  {selected && (
                                    <span style={{
                                      marginLeft: '8px',
                                      fontSize: '11px',
                                      color: '#4caf50',
                                      fontWeight: '600'
                                    }}>
                                      ✓ Đã mượn
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    backgroundColor: '#e7f3ff',
                                    color: '#0056b3',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {deviceType}
                                  </span>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  {selected ? (
                                    <input
                                      type="number"
                                      min="1"
                                      max={device.available || 1}
                                      value={selected.quantity}
                                      onChange={(e) => {
                                        const newQuantity = Math.min(parseInt(e.target.value) || 1, device.available || 1);
                                        setFormData(prev => ({
                                          ...prev,
                                          devices: prev.devices.map(d =>
                                            Number(d.deviceId) === Number(device.deviceId)
                                              ? { ...d, quantity: newQuantity }
                                              : d
                                          )
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        width: '50px',
                                        padding: '4px 6px',
                                        border: '1px solid #dadce0',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        color: '#202124'
                                      }}
                                    />
                                  ) : (
                                    <span style={{ color: '#5f6368' }}>-</span>
                                  )}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    backgroundColor: device.available > 0 ? '#e8f5e9' : '#ffebee',
                                    color: device.available > 0 ? '#2e7d32' : '#c62828',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                  }}>
                                    {device.available}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    {allDevices.filter(device => {
                      const searchMatch = !deviceSearch || 
                        device.name.toLowerCase().includes(deviceSearch.toLowerCase());
                      const typeMatch = deviceTypeFilter === 'all' || 
                        (device.deviceType || device.type || 'Khác') === deviceTypeFilter;
                      return searchMatch && typeMatch;
                    }).length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#5f6368' }}>
                        Không tìm thấy thiết bị nào
                      </div>
                    )}
                  </div>
                )}

                {/* Reset button */}
                {isEditable && formData.devices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, devices: [] }));
                      setDeviceSearch('');
                      setDeviceTypeFilter('all');
                      setShowDeviceFilter(false);
                    }}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#da190b'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
                  >
                    🔄 Đặt lại
                  </button>
                )}
          </div>

              {/* Description */}
              <div className="google-calendar-field">
                <div className="google-calendar-field-label">
                  <span className="google-calendar-field-icon">📝</span>
                  <span style={{ fontWeight: '500' }}>Mô tả</span>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Thêm nội dung mô tả"
                  className="google-calendar-textarea"
                  disabled={!isEditable}
                />
              </div>

          {/* Error message */}
          {errors.submit && (
                <div style={{ color: '#d93025', fontSize: '14px', marginTop: '16px', padding: '12px', backgroundColor: '#fce8e6', borderRadius: '4px' }}>
              {errors.submit}
            </div>
          )}
            </form>
          </div>

          {/* Sidebar - Right (Guests) - Google Calendar Style */}
          <div className="google-calendar-sidebar">
            <div className="google-calendar-guest-section">
              <div className="google-calendar-guest-section-title">Khách</div>
              
              {/* Guest Input with Tags - Google Calendar Style */}
              <div style={{ position: 'relative', marginBottom: '16px' }} ref={guestInputRef}>
                {/* Guest Tags - Display above input like Google Calendar */}
                {formData.guests.length > 0 && (
                  <div className="google-calendar-guest-tags" style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {formData.guests.map((guest, index) => (
                      <div key={index} className="google-calendar-guest-tag" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#e8f0fe',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: '#1a73e8'
                      }}>
                        <span style={{ fontWeight: '500' }}>{guest.fullName ? guest.fullName : guest.email}</span>
                        {isEditable && (
                          <button
                            type="button"
                            className="google-calendar-guest-tag-remove"
                            onClick={() => removeGuest(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#1a73e8',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(26, 115, 232, 0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Guest Input */}
                <input
                  type="email"
                  value={guestInputValue}
                  onChange={handleGuestChange}
                  onKeyDown={handleGuestKeyDown}
                  placeholder={formData.guests.length === 0 ? "Thêm khách" : "Thêm email khác..."}
                  className="google-calendar-guest-input"
                  autoComplete="off"
                  disabled={!isEditable}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />

                {/* Suggestions dropdown */}
                {showSuggestions && guestSuggestions.length > 0 && (
                  <div className="suggestions-dropdown" ref={suggestionsRef} style={{ 
                    position: 'absolute', 
                    zIndex: 1000, 
                    backgroundColor: 'white', 
                    border: '1px solid #dadce0', 
                    borderRadius: '4px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    width: '100%', 
                    top: '100%', 
                    marginTop: '4px'
                  }}>
                    {guestSuggestions.map(user => (
                      <div
                        key={user.id || user.email}
                        className="suggestion-item"
                        onClick={() => handleGuestSelect(user)}
                        style={{ 
                          padding: '10px 12px', 
                          cursor: 'pointer', 
                          borderBottom: '1px solid #f1f3f4',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: '500', color: '#202124' }}>{user.email}</div>
                        {user.fullName && (
                          <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>{user.fullName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Show option to add email if not found */}
                {showSuggestions && guestInputValue.trim().length > 1 && guestSuggestions.length === 0 && isValidEmail(guestInputValue.trim()) && (
                  <div className="suggestions-dropdown" style={{ 
                    position: 'absolute', 
                    zIndex: 1000, 
                    backgroundColor: 'white', 
                    border: '1px solid #dadce0', 
                    borderRadius: '4px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                    width: '100%', 
                    top: '100%', 
                    marginTop: '4px'
                  }}>
                    <div
                      className="suggestion-item no-results clickable"
                      onClick={() => addGuest(guestInputValue.trim())}
                      style={{ 
                        padding: '10px 12px', 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div style={{ fontWeight: '500', color: '#1a73e8' }}>Thêm "{guestInputValue.trim()}"</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error message */}
              {errors.guests && (
                <div style={{ color: '#d93025', fontSize: '12px', marginTop: '8px', marginBottom: '16px' }}>
                  {errors.guests}
                </div>
              )}

              {/* Invitees List with Status */}
              {loadingInvitees ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#5f6368' }}>Đang tải...</div>
            ) : (
              <>
                  {invitees.length > 0 && (
                    <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>Lọc theo trạng thái:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['all', 'PENDING', 'ACCEPTED', 'DECLINED'].map(status => (
                <button
                            key={status}
                  type="button"
                            onClick={() => setInviteeFilter(status)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '16px',
                              border: '1px solid #dadce0',
                              background: inviteeFilter === status ? '#1a73e8' : 'white',
                              color: inviteeFilter === status ? 'white' : '#5f6368',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {status === 'all' ? 'Tất cả' : 
                             status === 'PENDING' ? 'Đang chờ' :
                             status === 'ACCEPTED' ? 'Đồng ý' : 'Từ chối'}
                </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {invitees.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#202124', marginBottom: '12px' }}>
                        Danh sách khách mời ({filteredInvitees.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredInvitees.map(invitee => {
                            const statusConfig = {
                              'PENDING': { label: 'Đang chờ', color: '#ff9800', bg: '#fff3e0' },
                              'ACCEPTED': { label: 'Đồng ý', color: '#4caf50', bg: '#e8f5e9' },
                              'DECLINED': { label: 'Từ chối', color: '#f44336', bg: '#ffebee' },
                              'CANCELLED': { label: 'Đã hủy', color: '#9e9e9e', bg: '#f5f5f5' }
                            };
                            const config = statusConfig[invitee.status] || statusConfig['PENDING'];
                            
                            return (
                              <div
                                key={invitee.inviteId || invitee.email}
                                style={{
                                  padding: '10px 12px',
                                  backgroundColor: 'white',
                                  borderRadius: '6px',
                                  border: '1px solid #e0e0e0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                                    {invitee.email}
                                  </div>
                                </div>
                                <div
                    style={{ 
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    backgroundColor: config.bg,
                                    color: config.color,
                                    border: `1px solid ${config.color}`
                                  }}
                                >
                                  {config.label}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {invitees.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#5f6368', fontSize: '14px' }}>
                      Chưa có khách mời
                    </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMeetingForm;
