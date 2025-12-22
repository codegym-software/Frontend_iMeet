import { useState, useEffect, useCallback, useRef } from 'react';
import { roomAPI } from '../Components/main/MainCalendar/utils/RoomAPI';

const DEVICE_TYPE_OPTIONS = [
  { id: 'CAM', label: 'Camera' },
  { id: 'MIC', label: 'Micro' },
  { id: 'MAY_CHIEU', label: 'Máy chiếu' },
  { id: 'MAN_HINH', label: 'Màn hình' },
  { id: 'LAPTOP', label: 'Laptop' },
  { id: 'BANG', label: 'Bảng viết' },
  { id: 'KHAC', label: 'Khác' }
];

const normalizeRoom = (room) => ({
  id: room.id || room.roomId,
  name: room.name,
  location: room.location,
  floor: room.floor,
  building: room.building,
  capacity: room.capacity ?? room.seat ?? null,
  devices: room.devices || [],
  description: room.description || ''
});

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const createDefaultCriteria = (baseDate = new Date()) => {
  const date = startOfDay(baseDate);
  const startTime = new Date(date);
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  return {
    selectedDate: date,
    startDateTime: startTime,
    endDateTime: endTime,
    participants: '',
    deviceTypes: []
  };
};

export const useRoomFinder = (initialDate, onDateChange) => {
  const [criteria, setCriteria] = useState(() => createDefaultCriteria(initialDate || new Date()));
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [formError, setFormError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchRange, setSearchRange] = useState(null);
  const isMountedRef = useRef(true);
  const onDateChangeRef = useRef(onDateChange);
  
  // Cập nhật ref khi onDateChange thay đổi
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);

  const normalizeRooms = useCallback((data = []) => {
    return (data || [])
      .map(normalizeRoom)
      .sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
  }, []);

  const loadAllRooms = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await roomAPI.getAllRooms();
      const normalized = normalizeRooms(Array.isArray(data) ? data : data?.data || []);
      if (isMountedRef.current) {
        setAllRooms(normalized);
        setRooms(normalized);
        setHasSearched(false);
        setSearchRange(null);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      if (isMountedRef.current) {
        setApiError('Không thể tải danh sách phòng. Vui lòng thử lại.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [normalizeRooms]);

  useEffect(() => {
    isMountedRef.current = true;
    loadAllRooms();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadAllRooms]);

  useEffect(() => {
    if (!initialDate) return;
    setCriteria(prev => {
      const next = createDefaultCriteria(initialDate);
      return {
        ...prev,
        selectedDate: next.selectedDate,
        startDateTime: next.startDateTime,
        endDateTime: next.endDateTime
      };
    });
  }, [initialDate]);

  const syncTimeWithDate = (targetDate, dateTime) => {
    if (!dateTime) return null;
    const next = new Date(targetDate);
    next.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0);
    return next;
  };

  const updateCriteria = useCallback((field, value) => {
    setCriteria(prev => {
      if (field === 'selectedDate') {
        const normalizedDate = startOfDay(value || new Date());
        // Sử dụng ref để tránh lỗi "Cannot access before initialization"
        if (onDateChangeRef.current && typeof onDateChangeRef.current === 'function') {
          try {
            onDateChangeRef.current(normalizedDate);
          } catch (error) {
            console.warn('Error calling onDateChange:', error);
          }
        }
        return {
          ...prev,
          selectedDate: normalizedDate,
          startDateTime: syncTimeWithDate(normalizedDate, prev.startDateTime) || normalizedDate,
          endDateTime: syncTimeWithDate(normalizedDate, prev.endDateTime) || normalizedDate
        };
      }

      if (field === 'startDateTime') {
        const base = prev.selectedDate || new Date();
        const next = syncTimeWithDate(base, value || prev.startDateTime);
        if (!next) return prev;

        let updatedEnd = prev.endDateTime;
        if (!prev.endDateTime || next >= prev.endDateTime) {
          updatedEnd = new Date(next.getTime() + 60 * 60 * 1000);
        }

        return { ...prev, startDateTime: next, endDateTime: updatedEnd };
      }

      if (field === 'endDateTime') {
        const base = prev.selectedDate || new Date();
        const next = syncTimeWithDate(base, value || prev.endDateTime);
        if (!next) return prev;
        return { ...prev, endDateTime: next };
      }

      if (field === 'participants') {
        return { ...prev, participants: value };
      }

      return prev;
    });
  }, []); // Không cần onDateChange trong dependency array vì đã dùng ref

  const toggleDeviceType = useCallback((typeId) => {
    setCriteria(prev => {
      const exists = prev.deviceTypes.includes(typeId);
      return {
        ...prev,
        deviceTypes: exists
          ? prev.deviceTypes.filter(id => id !== typeId)
          : [...prev.deviceTypes, typeId]
      };
    });
  }, []);

  const validateCriteria = useCallback((current) => {
    if (!current.startDateTime || !current.endDateTime) {
      return 'Vui lòng chọn thời gian bắt đầu và kết thúc.';
    }
    
    // Kiểm tra thời gian hợp lệ
    const start = new Date(current.startDateTime);
    const end = new Date(current.endDateTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Thời gian không hợp lệ.';
    }
    
    if (end <= start) {
      return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    }
    
    // Kiểm tra số người tham gia
    if (current.participants && current.participants.trim() !== '') {
      const participantsNum = Number(current.participants);
      if (isNaN(participantsNum) || participantsNum <= 0) {
        return 'Số người tham gia phải là số lớn hơn 0.';
      }
    }
    
    return '';
  }, []);

  const fetchRooms = useCallback(async () => {
    const validationMessage = validateCriteria(criteria);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormError('');
    setApiError('');
    setLoading(true);

    // Xử lý minCapacity - chỉ gửi nếu có giá trị hợp lệ
    const participantsNum = criteria.participants && criteria.participants.trim() !== '' 
      ? Number(criteria.participants) 
      : null;
    const minCapacity = participantsNum && !isNaN(participantsNum) && participantsNum > 0 
      ? participantsNum 
      : undefined;

    // Xử lý deviceTypes - chỉ gửi nếu có ít nhất 1 loại được chọn
    const requiredDeviceTypes = criteria.deviceTypes && criteria.deviceTypes.length > 0
      ? criteria.deviceTypes.filter(type => type && type.trim() !== '')
      : undefined;

    console.log('🔍 Filtering rooms with criteria:', {
      startTime: criteria.startDateTime,
      endTime: criteria.endDateTime,
      minCapacity,
      requiredDeviceTypes
    });

    try {
      const availableRooms = await roomAPI.getAvailableRoomsInRange(
        criteria.startDateTime,
        criteria.endDateTime,
        {
          minCapacity,
          requiredDeviceTypes
        }
      );

      console.log('📦 Raw API response:', availableRooms);

      const normalizedRooms = normalizeRooms(
        Array.isArray(availableRooms) ? availableRooms : availableRooms?.data || []
      );

      console.log('✅ Normalized rooms:', normalizedRooms.length, 'rooms');

      if (isMountedRef.current) {
        setRooms(normalizedRooms);
        setHasSearched(true);
        setSearchRange({
          start: criteria.startDateTime,
          end: criteria.endDateTime,
          minCapacity,
          deviceTypes: [...criteria.deviceTypes]
        });
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      if (isMountedRef.current) {
        setApiError(error?.message || 'Không thể lấy danh sách phòng trống. Vui lòng thử lại.');
        setRooms([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [criteria, normalizeRooms, validateCriteria]);

  const clearFilters = useCallback(() => {
    const defaults = createDefaultCriteria(criteria.selectedDate || new Date());
    setCriteria(defaults);
    setRooms(allRooms);
    setHasSearched(false);
    setFormError('');
    setApiError('');
    setSearchRange(null);
  }, [allRooms, criteria.selectedDate]);

  return {
    criteria,
    updateCriteria,
    toggleDeviceType,
    fetchRooms,
    clearFilters,
    rooms,
    allRooms,
    loading,
    apiError,
    formError,
    hasSearched,
    searchRange,
    DEVICE_TYPE_OPTIONS
  };
};

