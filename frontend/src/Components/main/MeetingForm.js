// components/CreateMeetingForm.js
import React, { useState, useEffect, useRef } from 'react';
import './MeetingForm.css'; // Import the CSS file for styling
import { roomAPI } from './MainCalendar/utils/RoomAPI';
import { calendarAPI } from './MainCalendar/utils/CalendarAPI';
import DateTimePicker from '../common/DateTimePicker';
import adminService from '../../services/adminService';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';
import { useMeetingWithDevices } from '../../hooks/useMeetingWithDevices';

const normalizeRoomId = (room) => Number(room?.roomId ?? room?.id);

const CreateMeetingForm = ({ selectedDate, onClose, onSubmit, initialStartTime, initialEndTime, initialRoomId, groups = [] }) => {
  const computeInitialDateTimes = () => {
    let start;
    if (initialStartTime) {
      start = new Date(initialStartTime);
    } else if (selectedDate) {
      start = new Date(selectedDate);
      start.setHours(9, 0, 0, 0);
    } else {
      start = new Date();
      start.setHours(9, 0, 0, 0);
    }

    let end;
    if (initialEndTime) {
      end = new Date(initialEndTime);
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    if (end <= start) {
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }

    return { start, end };
  };

  const createInitialFormState = () => {
    const { start, end } = computeInitialDateTimes();
    return {
    title: '',
    description: '',
      startDateTime: start,
      endDateTime: end,
      guests: [],
    room: initialRoomId ? Number(initialRoomId) : '',
    location: '',
      devices: [],
    isAllDay: false,
    groupId: '' // Optional group selection
    };
  };

  const [formData, setFormData] = useState(() => createInitialFormState());

  const [errors, setErrors] = useState({});
  const [guestSuggestions, setGuestSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guestInputValue, setGuestInputValue] = useState(''); // Current input value for guest
  const [rooms, setRooms] = useState([]); // All rooms
  const [availableRooms, setAvailableRooms] = useState([]); // Available rooms in selected time range
  const [unavailableRooms, setUnavailableRooms] = useState([]); // Unavailable rooms in selected time range
  const [selectedRoomDevices, setSelectedRoomDevices] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [currentPickerMonth, setCurrentPickerMonth] = useState(new Date());
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all');
  const [showDeviceFilter, setShowDeviceFilter] = useState(false);
  const [deviceQuantities, setDeviceQuantities] = useState({}); // Track quantity input while browsing
  const guestInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const datePickerRef = useRef(null);
  const isMountedRef = useRef(true);

  // ✅ USE CACHE - No more slow API calls!
  const { getDevicesWithAvailability, checkAvailability, inventory, loading: inventoryLoading } = useDeviceInventory();
  const { createMeetingWithDevices } = useMeetingWithDevices();
  
  // Get devices from cache - INSTANT! (with fallback)
  const allDevices = getDevicesWithAvailability();
  
  // Debug: Log devices when they change
  useEffect(() => {
    console.log('📱 MeetingForm - Devices loaded:', allDevices.length, 'devices', allDevices);
    if (allDevices.length === 0) {
      console.warn('⚠️ No devices available from inventory!');
      console.log('  - Inventory loading:', inventoryLoading);
      console.log('  - Inventory state:', Object.keys(inventory).length, 'items');
    }
  }, [allDevices, inventory, inventoryLoading]);

  const selectedDateKey = selectedDate ? new Date(selectedDate).getTime() : null;
  const initialStartKey = initialStartTime ? new Date(initialStartTime).getTime() : null;
  const initialEndKey = initialEndTime ? new Date(initialEndTime).getTime() : null;
  const initialRoomKey = initialRoomId ? Number(initialRoomId) : null;

  useEffect(() => {
    setFormData(createInitialFormState());
    setErrors({});
    setGuestSuggestions([]);
    setShowSuggestions(false);
    setGuestInputValue('');
    setSelectedRoomDevices([]);
    setDeviceSearch('');
    setDeviceTypeFilter('all');
    setShowDeviceFilter(false);
    setDeviceQuantities({});
  }, [selectedDateKey, initialStartKey, initialEndKey, initialRoomKey]);

  // Cleanup debounce và cache khi unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      userSearchCacheRef.current.clear();
    };
  }, []);

  // Load rooms only - devices từ cache rồi!
  useEffect(() => {
    let isMounted = true;
    isMountedRef.current = true;

    const loadRooms = async () => {
      try {
        if (isMounted) setLoadingRooms(true);
        const roomsData = await roomAPI.getAvailableRooms();
        if (isMounted) {
          const sortedRooms = [...roomsData].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setRooms(sortedRooms);
          // Initially, show all rooms as available
          setAvailableRooms(sortedRooms);
          setUnavailableRooms([]);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading rooms:', error);
          setErrors(prev => ({ ...prev, room: 'Không thể tải danh sách phòng' }));
        }
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    };

    loadRooms();
    // ✅ Devices từ cache - không cần fetch nữa!

    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!initialRoomId) return;
    const normalizedId = Number(initialRoomId);
    setFormData(prev => ({
      ...prev,
      room: normalizedId
    }));
    const loadDevices = async () => {
      try {
        const devices = await roomAPI.getRoomDevices(normalizedId);
        if (isMountedRef.current) {
          setSelectedRoomDevices(devices);
        }
      } catch (error) {
        console.error('Error loading devices for preselected room:', error);
      }
    };
    loadDevices();
  }, [initialRoomId]);

  useEffect(() => {
    if (!initialRoomId || rooms.length === 0) return;
    const normalizedId = Number(initialRoomId);
    const selectedRoom = rooms.find(r => normalizeRoomId(r) === normalizedId);
    if (!selectedRoom) return;
    setFormData(prev => {
      const sameRoom = prev.room === normalizedId;
      const locationMatches = (prev.location || '') === (selectedRoom.location || '');
      if (sameRoom && locationMatches) {
        return prev;
      }
      if (!sameRoom && prev.room && prev.room !== normalizedId) {
        return prev;
      }
      return {
        ...prev,
        room: normalizedId,
        location: selectedRoom.location || ''
      };
    });
  }, [initialRoomId, rooms]);

  // Fetch available rooms when start/end time changes
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
          const available = rooms
            .filter(r => availableIds.includes(normalizeRoomId(r)))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          
          const unavailable = rooms
            .filter(r => !availableIds.includes(normalizeRoomId(r)))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          
          setAvailableRooms(available);
          setUnavailableRooms(unavailable);

          if (formData.room) {
            const selectedRoomId = Number(formData.room);
            const stillAvailable = available.some(r => normalizeRoomId(r) === selectedRoomId);
            if (!stillAvailable) {
              setFormData(prev => ({
                ...prev,
                room: '',
                location: '',
                devices: []
              }));
              setSelectedRoomDevices([]);
              setErrors(prev => ({
                ...prev,
                room: 'Phòng đã có lịch trong khoảng thời gian này. Vui lòng chọn phòng khác.'
              }));
            }
          }
          console.log('📊 Result:', available.length, 'available,', unavailable.length, 'unavailable');
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

  // Load thiết bị khi chọn phòng
  const handleRoomChange = async (e) => {
    const { value } = e.target;
    const roomId = value ? Number(value) : '';

    if (roomId) {
      const isRoomAvailable = availableRooms.some((room) => normalizeRoomId(room) === roomId);
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
      room: roomId,
      location: '', // Reset location
      devices: [] // Reset devices
    }));

    if (errors.room) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.room;
        return next;
      });
    }

    if (roomId) {
      try {
        // Tìm room được chọn để lấy location
        const selectedRoom = rooms.find(r => normalizeRoomId(r) === roomId);
        if (selectedRoom && isMountedRef.current) {
          setFormData(prev => ({
            ...prev,
            location: selectedRoom.location || ''
          }));
        }

        // Load thiết bị của phòng
        const devices = await roomAPI.getRoomDevices(roomId);
        if (isMountedRef.current) {
          setSelectedRoomDevices(devices);
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

  // Format date to dd/mm/yyyy
  function formatDateToDisplay(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Convert dd/mm/yyyy to yyyy-mm-dd for submission
  function formatDateForSubmission(dateString) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  }

  // Validate date format (dd/mm/yyyy)
  function validateDate(dateString) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return false;
    }
    
    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return false;
    }
    
    return true;
  }

  // Validate time format (hh:mm AM/PM)
  function validateTime(timeString) {
    const regex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    return regex.test(timeString);
  }

  // Cache cho user search
  const userSearchCacheRef = useRef(new Map());
  const searchDebounceRef = useRef(null);

  // Search users by email or name using real API - với cache và debounce
  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const trimmedQuery = query.trim().toLowerCase();
    
    // Kiểm tra cache trước
    const cached = userSearchCacheRef.current.get(trimmedQuery);
    if (cached && Date.now() - cached.timestamp < 300000) { // Cache 5 phút
      return cached.data;
    }
    
    setIsLoading(true);
    try {
      const response = await adminService.getUsers(0, 10, 'email', 'asc', trimmedQuery);
      const users = response.users || [];
      
      // Map to format: { id, email, fullName }
      const mappedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.name || null
      }));
      
      // Lưu vào cache
      userSearchCacheRef.current.set(trimmedQuery, {
        data: mappedUsers,
        timestamp: Date.now()
      });
      
      setIsLoading(false);
      return mappedUsers;
    } catch (error) {
      console.warn('⚠️ Error searching users:', error);
      setIsLoading(false);
      return [];
    }
  };

  // Validate email format - more lenient to allow various email formats
  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    const trimmed = email.trim();
    if (trimmed.length === 0) return false;
    
    // More lenient email regex - allows most valid email formats
    // Allows: user@domain.com, user.name@domain.co.uk, user+tag@domain.com, etc.
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return emailRegex.test(trimmed);
  };

  // Handle guest input change - với debounce
  const handleGuestChange = (e) => {
    const value = e.target.value;
    setGuestInputValue(value);

    // Clear error when user starts typing
    if (errors.guests) {
      setErrors(prev => ({
        ...prev,
        guests: ''
      }));
    }

    // Clear previous debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Show suggestions if query is not empty and doesn't contain comma
    if (value.trim().length > 1 && !value.includes(',')) {
      // Debounce: chỉ search sau 300ms khi user ngừng gõ
      searchDebounceRef.current = setTimeout(async () => {
      const suggestions = await searchUsers(value.trim());
        if (isMountedRef.current) {
      setGuestSuggestions(suggestions);
      setShowSuggestions(true);
        }
      }, 300);
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
      // Don't clear input so user can fix it
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

  // Close suggestions and date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        guestInputRef.current && 
        !guestInputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Date picker functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };
  
  const handleDateSelect = (day) => {
    const { year, month } = getDaysInMonth(currentPickerMonth);
    const selectedDate = new Date(year, month, day);
    const formattedDate = formatDateToDisplay(selectedDate);
    
    setFormData(prev => ({
      ...prev,
      date: formattedDate
    }));
    
    setShowDatePicker(false);
    
    // Clear error
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };
  
  const handlePrevMonth = () => {
    setCurrentPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Skip guest field as it has its own handler
    if (name === 'guests') return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Convert time from "hh:mm AM/PM" to "HH:mm:ss"
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    // Validate form
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }
    
    // Validate start and end datetime
    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Vui lòng chọn thời gian bắt đầu';
    }
    
    if (!formData.endDateTime) {
      newErrors.endDateTime = 'Vui lòng chọn thời gian kết thúc';
    }
    
    if (formData.startDateTime && formData.endDateTime) {
      if (formData.endDateTime <= formData.startDateTime) {
        newErrors.endDateTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }

    if (!formData.room) {
      newErrors.room = 'Vui lòng chọn phòng';
    }
    
    // ✅ VALIDATE DEVICE AVAILABILITY
    const deviceErrors = [];
    formData.devices.forEach(device => {
      if (!checkAvailability(device.deviceId, device.quantity)) {
        const available = allDevices.find(d => d.deviceId === device.deviceId)?.available || 0;
        deviceErrors.push(`${device.deviceName}: chỉ còn ${available} (yêu cầu ${device.quantity})`);
      }
    });
    
    if (deviceErrors.length > 0) {
      newErrors.devices = 'Không đủ thiết bị:\n' + deviceErrors.join('\n');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pre-check room availability before submitting
      try {
        const isAvailable = await calendarAPI.checkRoomAvailability(
          parseInt(formData.room),
          formData.startDateTime,
          formData.endDateTime
        );
        if (!isAvailable) {
          throw new Error('Phòng đã có lịch trong khoảng thời gian này. Vui lòng chọn phòng khác.');
        }
      } catch (availErr) {
        throw availErr;
      }
      // Helper function to format date as LocalDateTime string (without timezone)
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        description: formData.description || '',
        startTime: formatLocalDateTime(formData.startDateTime),
        endTime: formatLocalDateTime(formData.endDateTime),
        isAllDay: formData.isAllDay,
        roomId: parseInt(formData.room)
      };
      
      // Add groupId if selected (optional)
      if (formData.groupId && formData.groupId !== '') {
        meetingData.groupId = parseInt(formData.groupId);
      }
      
      // Only add devices if there are any
      if (formData.devices && formData.devices.length > 0) {
        meetingData.devices = formData.devices.map(d => ({
          deviceId: d.deviceId,
          quantityBorrowed: d.quantity || 1,
          notes: d.notes || null
        }));
      }
      
      // Only add inviteEmails if there are any - filter out empty emails and validate
      const inviteEmails = formData.guests
        .map(g => g.email)
        .filter(email => email && email.trim().length > 0 && isValidEmail(email.trim()));
      
      if (inviteEmails.length > 0) {
        meetingData.inviteEmails = inviteEmails.map(email => email.trim().toLowerCase());
      }
      
      // Call API to create meeting
      console.log('📤 Sending meeting data:', meetingData);
      const createdMeeting = await calendarAPI.createMeeting(meetingData);
      
      console.log('✅ Meeting created successfully:', createdMeeting);
      
      // ✅ If there are invite emails, send invitations after meeting is created
      if (createdMeeting && inviteEmails.length > 0) {
        try {
          console.log('📧 Inviting participants:', inviteEmails);
          // Use meetingId (not id) from response
          const meetingId = createdMeeting.meetingId || createdMeeting.id;
          if (!meetingId) {
            console.warn('⚠️ No meeting ID found in response:', createdMeeting);
            throw new Error('Không tìm thấy ID cuộc họp');
          }
          const inviteResult = await calendarAPI.inviteParticipants(meetingId, {
            emails: inviteEmails,
            message: null
          });
          console.log('✅ Successfully invited participants:', inviteResult);
        } catch (inviteError) {
          console.warn('⚠️ Failed to invite participants:', inviteError);
          // Show warning but don't fail the whole creation
          setErrors(prev => ({ 
            ...prev, 
            invite: `Tạo meeting thành công nhưng không thể mời một số người tham gia: ${inviteError.message || 'Unknown error'}` 
          }));
        }
      }
      
      // ✅ OPTIMISTIC UPDATE - Instant UI refresh!
      if (createdMeeting) {
        createMeetingWithDevices(createdMeeting);
        
        // Call parent onSubmit callback
        if (isMountedRef.current && onSubmit) {
          onSubmit(createdMeeting, 'Tạo cuộc họp thành công!');
        }
        
        // Close form
        if (isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && onClose) {
              onClose();
            }
          }, 100);
        }
      } else {
        throw new Error('Không nhận được dữ liệu meeting từ server');
      }
    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      const errorMessage = error.message || error.toString() || 'Không thể tạo cuộc họp. Vui lòng thử lại.';
      if (isMountedRef.current) {
        setErrors({ submit: errorMessage });
        
        // Gọi onSubmit với error message để hiển thị toast
        if (onSubmit) {
          onSubmit(null, errorMessage);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="create-meeting-modal-wrapper">
      <div className="create-meeting-modal simple-style">
              <div className="modal-header">
        <h2>Thêm tiêu đề</h2>
        <button type="button" className="close-btn" onClick={onClose}>✕</button>
      </div>

      <form className="meeting-form simple-form" onSubmit={handleSubmit}>
        <div style={{ padding: '16px 20px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Title Section */}
          {errors.submit && (
            <div className="error-banner" style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: '#fee', 
              color: '#c00', 
              borderRadius: '4px',
              border: '1px solid #fcc'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Title Input */}
          <div className="form-group">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Thêm tiêu đề"
              className={`title-input ${errors.title ? 'error' : ''}`}
              autoFocus
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Date & Time Section */}
          <div className="form-row">
            <div className="form-icon">🕐</div>
            <div className="form-row-content time-inputs-row">
              {/* Date Input */}
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
                className="date-picker-input"
                displayFormat="date"
                disablePastDates={true}
                showCalendarHeader={true}
              />
              
              {/* Start Time Input */}
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
                className="time-picker-input"
                displayFormat="time"
              />
              
              <span className="time-separator">—</span>
              
              {/* End Time Input */}
              <DateTimePicker
                value={formData.endDateTime}
                onChange={(date) => setFormData(prev => ({ ...prev, endDateTime: date }))}
                showTime={true}
                showDate={false}
                mode="end"
                baseDate={formData.startDateTime}
                placeholder="10:00 AM"
                className="time-picker-input"
                displayFormat="time"
              />
              
              {/* All Day Checkbox - Inline */}
              <label className="checkbox-wrapper inline-checkbox">
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, isAllDay: e.target.checked }));
                    if (e.target.checked) {
                      // Set to all day (start of day to end of day)
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
                />
                <span className="checkbox-label">Cả ngày</span>
              </label>
              
              {errors.startDateTime && <span className="error-message">{errors.startDateTime}</span>}
              {errors.endDateTime && <span className="error-message">{errors.endDateTime}</span>}
            </div>
          </div>
          {(errors.date || errors.startTime || errors.endTime) && (
            <div className="error-message">
              {errors.date || errors.startTime || errors.endTime}
            </div>
          )}

          {/* Guests Section with Autocomplete and Tags */}
          <div className="form-row">
            <div className="form-icon">👤</div>
            <div className="form-row-content guest-autocomplete" ref={guestInputRef}>
              {/* Guest Tags - Display inline with input */}
              {formData.guests.length > 0 && (
                <div className="guest-tags">
                  {formData.guests.map((guest, index) => (
                    <div key={index} className="guest-tag">
                      <span className="guest-tag-name">
                        {guest.fullName ? `${guest.fullName} (${guest.email})` : guest.email}
                      </span>
                      <button
                        type="button"
                        className="guest-tag-remove"
                        onClick={() => removeGuest(index)}
                      >
                        ×
                      </button>
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
                placeholder={formData.guests.length === 0 ? "Thêm khách mời" : "Thêm email khác..."}
                className="inline-input"
                autoComplete="off"
              />
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="suggestions-loading">
                  <div className="loading-spinner"></div>
                  <span>Đang tìm kiếm...</span>
                </div>
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && guestSuggestions.length > 0 && (
                <div className="suggestions-dropdown" ref={suggestionsRef}>
                  {guestSuggestions.map(user => (
                    <div
                      key={user.id || user.email}
                      className="suggestion-item"
                      onClick={() => handleGuestSelect(user)}
                    >
                      <div className="suggestion-email">{user.email}</div>
                      {user.fullName && (
                        <div className="suggestion-name">{user.fullName}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* No results message - allow manual entry */}
              {showSuggestions && !isLoading && guestInputValue.length > 1 && guestSuggestions.length === 0 && isValidEmail(guestInputValue) && (
                <div className="suggestions-dropdown">
                  <div className="suggestion-item no-results clickable" onClick={() => addGuest(guestInputValue)}>
                    ✉️ Không tìm thấy trong hệ thống. Nhấn Enter hoặc click để thêm email: <strong>{guestInputValue}</strong>
                  </div>
                </div>
              )}
              
              {/* Invalid email warning */}
              {guestInputValue.length > 1 && !isValidEmail(guestInputValue) && (
                <div className="suggestions-dropdown">
                  <div className="suggestion-item no-results" style={{ color: '#dc3545' }}>
                    ⚠️ Email không hợp lệ. Vui lòng kiểm tra lại định dạng.
                  </div>
                </div>
              )}
              
              {errors.guests && <span className="error-message">{errors.guests}</span>}
            </div>
          </div>

          {/* Room Section */}
          <div className="form-row">
            <div className="form-icon">🏠</div>
            <div className="form-row-content">
              <select
                name="room"
                value={formData.room}
                onChange={handleRoomChange}
                className="inline-select"
                disabled={loadingRooms}
              >
                <option value="">Chọn phòng</option>
                {/* ✅ Available rooms - normal styling */}
                {availableRooms.length > 0 && (
                  <optgroup label="✅ Phòng trống (có thể đặt)">
                    {availableRooms.map(room => (
                      <option
                        key={room.roomId || room.id}
                        value={normalizeRoomId(room)}
                      >
                        {room.name} - Sức chứa: {room.capacity} người
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
                        {room.name} - Sức chứa: {room.capacity} người
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
                        {room.name} - Sức chứa: {room.capacity} người
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
          {loadingRooms && <div className="loading-text">Đang tải phòng...</div>}
          {errors.room && <div className="error-message">{errors.room}</div>}

          {/* Location Section - Auto-filled */}
          {formData.location && (
            <div className="form-row">
              <div className="form-icon">📍</div>
              <div className="form-row-content">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  readOnly
                  placeholder="vị trí room"
                  className="inline-input"
                  style={{ backgroundColor: 'transparent', cursor: 'not-allowed', border: 'none', color: '#5f6368' }}
                />
              </div>
            </div>
          )}

          {/* Room Devices Display */}
          {formData.room && selectedRoomDevices.length > 0 && (
            <div className="form-row">
              <div className="form-icon">🔧</div>
              <div className="form-row-content">
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                    Thiết bị trong phòng:
                  </div>
                  {selectedRoomDevices.length > 0 ? (
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
                          {device.deviceName} {device.deviceType ? `- ${device.deviceType}` : ''} (SL: {device.quantityAssigned || device.quantity || 1})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '14px' }}>
                      Không có thiết bị sẵn trong phòng
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Device Selection */}
          <div className="form-row">
            <div className="form-icon">💻</div>
            <div className="form-row-content">
              <div style={{ width: '100%' }}>
                {/* Hiển thị thiết bị được chọn dạng tags */}
                {formData.devices.length > 0 && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '10px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '6px',
                    border: '1px solid #4caf50'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32', marginBottom: '8px' }}>
                      Thiết bị được chọn ({formData.devices.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {formData.devices.map((device) => {
                        const displayName = device.name || device.deviceName || 'Thiết bị';
                        return (
                          <div
                            key={device.deviceId}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              backgroundColor: '#fff',
                              border: '1px solid #4caf50',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#2e7d32'
                            }}
                          >
                            <span>{displayName} (x{device.quantity})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newDevices = formData.devices.filter(d => d.deviceId !== device.deviceId);
                                setFormData(prev => ({ ...prev, devices: newDevices }));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2e7d32',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '0',
                                width: '14px',
                                height: '14px'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Search & Filter */}
                <div style={{ marginBottom: '12px' }}>
                  {/* Tìm kiếm + nút lọc dropdown */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="🔍 Tìm kiếm thiết bị..."
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                    
                    {/* Dropdown lọc loại thiết bị */}
                    <select
                      value={deviceTypeFilter}
                      onChange={(e) => setDeviceTypeFilter(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        minWidth: '130px'
                      }}
                    >
                      <option value="all">Tất cả</option>
                      <option value="CAM">Camera</option>
                      <option value="MIC">Microphone</option>
                      <option value="MAY_CHIEU">Máy chiếu</option>
                      <option value="BANG">Bảng</option>
                      <option value="MAN_HINH">Màn hình</option>
                      <option value="LAPTOP">Laptop</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Device Table - Compact */}
                {allDevices && allDevices.length > 0 && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    overflow: 'hidden',
                    maxHeight: '250px',
                    overflowY: 'auto'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '12px'
                    }}>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr style={{
                          backgroundColor: '#e9ecef',
                          borderBottom: '1px solid #dee2e6'
                        }}>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#202124' }}>Chọn</th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#202124' }}>Tên</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#202124', width: '80px' }}>Loại</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#202124', width: '70px' }}>Còn lại</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#202124', width: '60px' }}>Mượn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allDevices
                          .filter(device => {
                            const searchMatch = !deviceSearch || 
                              device.name.toLowerCase().includes(deviceSearch.toLowerCase());
                            const typeMatch = deviceTypeFilter === 'all' || 
                              (device.deviceType || device.type || 'KHAC') === deviceTypeFilter;
                            return searchMatch && typeMatch;
                          })
                          .map((device, index) => {
                            const selected = formData.devices.find(d => d.deviceId === device.deviceId);
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
                                  backgroundColor: selected ? '#fff3e0' : (index % 2 === 0 ? 'white' : '#f8f9fa'),
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                  height: '40px'
                                }}
                                onClick={() => {
                                  if (selected) {
                                    // Deselect
                                    setFormData(prev => ({
                                      ...prev,
                                      devices: prev.devices.filter(d => d.deviceId !== device.deviceId)
                                    }));
                                    setDeviceQuantities(prev => {
                                      const newQtys = { ...prev };
                                      delete newQtys[device.deviceId];
                                      return newQtys;
                                    });
                                  } else {
                                    // Select with default quantity 1
                                    const qty = deviceQuantities[device.deviceId] || 1;
                                    setFormData(prev => ({
                                      ...prev,
                                      devices: [...prev.devices, {
                                        deviceId: device.deviceId,
                                        quantity: qty,
                                        name: device.name
                                      }]
                                    }));
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (!selected) e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = selected ? '#fff3e0' : (index % 2 === 0 ? 'white' : '#f8f9fa');
                                }}
                              >
                                <td style={{ padding: '8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={!!selected}
                                    onChange={() => {}}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                                <td style={{ padding: '8px', color: '#202124', fontWeight: '500' }}>
                                  {device.name}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    backgroundColor: '#e7f3ff',
                                    color: '#0056b3',
                                    borderRadius: '3px',
                                    fontSize: '11px'
                                  }}>
                                    {deviceType}
                                  </span>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    backgroundColor: '#e8f5e9',
                                    color: '#2e7d32',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}>
                                    {device.available || 0}
                                  </span>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  {selected ? (
                                    <input
                                      type="number"
                                      min="1"
                                      max={device.available || 1}
                                      value={selected.quantity || 1}
                                      onChange={(e) => {
                                        const newQuantity = Math.min(parseInt(e.target.value) || 1, device.available || 1);
                                        setFormData(prev => ({
                                          ...prev,
                                          devices: prev.devices.map(d =>
                                            d.deviceId === device.deviceId
                                              ? { ...d, quantity: newQuantity }
                                              : d
                                          )
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        width: '50px',
                                        padding: '4px 6px',
                                        border: '1px solid #4caf50',
                                        borderRadius: '3px',
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#2e7d32',
                                        backgroundColor: '#f1f8e9'
                                      }}
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      min="1"
                                      max={device.available || 1}
                                      value={deviceQuantities[device.deviceId] || 1}
                                      onChange={(e) => {
                                        const newQuantity = Math.min(parseInt(e.target.value) || 1, device.available || 1);
                                        setDeviceQuantities(prev => ({
                                          ...prev,
                                          [device.deviceId]: newQuantity
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="1"
                                      style={{
                                        width: '50px',
                                        padding: '4px 6px',
                                        border: '1px solid #dadce0',
                                        borderRadius: '3px',
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        backgroundColor: '#f8f9fa'
                                      }}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
                {errors.devices && <div className="error-message" style={{ whiteSpace: 'pre-line', marginTop: '8px' }}>{errors.devices}</div>}
              </div>
            </div>
          </div>

          {/* Group Selection Section (Optional) */}
          {groups && groups.length > 0 && (
            <div className="form-row">
              <div className="form-icon">👥</div>
              <div className="form-row-content">
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  className="inline-select"
                >
                  <option value="">Không chọn nhóm (lịch cá nhân)</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {formData.groupId && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: '#5f6368',
                    fontStyle: 'italic'
                  }}>
                    Tất cả thành viên trong nhóm sẽ được mời tham gia cuộc họp này
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="form-row">
            <div className="form-icon">📋</div>
            <div className="form-row-content">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Thêm mô tả"
                className="description-textarea"
                rows="3"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions simple-actions" style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: '#ffffff',
            padding: '16px 0',
            borderTop: '2px solid #e9ecef',
            marginTop: '20px',
            zIndex: 100,
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isLoading} style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '4px',
              border: '1px solid #dadce0',
              backgroundColor: '#f8f9fa',
              color: '#5f6368',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}>
              Hủy
            </button>
            <button type="submit" className="save-btn" disabled={isLoading} style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#1e88e5',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default CreateMeetingForm;