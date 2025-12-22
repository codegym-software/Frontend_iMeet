import React, { useCallback, useEffect, useState } from 'react';
import './RoomFinder.css';
import { roomAPI } from '../MainCalendar/utils/RoomAPI';
import RoomSearchForm from './RoomSearchForm';
import RoomResultsList from './RoomResultsList';

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

const RoomFinder = ({ initialDate, onDateChange, onBookRoom, onViewDetails, renderFormInLeftPanel = false, onFormReady }) => {
  const [criteria, setCriteria] = useState(() => createDefaultCriteria(initialDate || new Date()));
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [formError, setFormError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchRange, setSearchRange] = useState(null);

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
      setAllRooms(normalized);
      setRooms(normalized);
      setHasSearched(false);
      setSearchRange(null);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setApiError('Không thể tải danh sách phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [normalizeRooms]);

  useEffect(() => {
    loadAllRooms();
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
        if (typeof onDateChange === 'function') {
          onDateChange(normalizedDate);
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
  }, [onDateChange]);

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
    if (current.endDateTime <= current.startDateTime) {
      return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    }
    if (current.participants && Number(current.participants) <= 0) {
      return 'Số người tham gia phải lớn hơn 0.';
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

    const minCapacity = Number(criteria.participants) > 0 ? Number(criteria.participants) : undefined;

    try {
      const availableRooms = await roomAPI.getAvailableRoomsInRange(
        criteria.startDateTime,
        criteria.endDateTime,
        {
          minCapacity,
          requiredDeviceTypes: criteria.deviceTypes
        }
      );

      const normalizedRooms = normalizeRooms(
        Array.isArray(availableRooms) ? availableRooms : availableRooms?.data || []
      );

      setRooms(normalizedRooms);
      setHasSearched(true);
      setSearchRange({
        start: criteria.startDateTime,
        end: criteria.endDateTime,
        minCapacity,
        deviceTypes: [...criteria.deviceTypes]
      });
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setApiError(error?.message || 'Không thể lấy danh sách phòng trống. Vui lòng thử lại.');
      setRooms([]);
    } finally {
      setLoading(false);
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

  const handleBookRoom = useCallback((room) => {
    if (!room || !searchRange || typeof onBookRoom !== 'function') return;
    onBookRoom(room, searchRange);
  }, [onBookRoom, searchRange]);

  const handleViewDetail = useCallback((room) => {
    if (typeof onViewDetails === 'function') {
      onViewDetails(room);
    }
  }, [onViewDetails]);

  // Expose form component nếu cần render riêng trong left panel
  useEffect(() => {
    if (renderFormInLeftPanel && onFormReady) {
      onFormReady({
        formComponent: (
          <RoomSearchForm
            criteria={criteria}
            onChange={updateCriteria}
            onToggleDeviceType={toggleDeviceType}
            onSubmit={fetchRooms}
            onClear={clearFilters}
            deviceTypeOptions={DEVICE_TYPE_OPTIONS}
            loading={loading}
            formError={formError}
          />
        )
      });
    }
  }, [criteria, loading, formError, renderFormInLeftPanel, onFormReady, updateCriteria, toggleDeviceType, fetchRooms, clearFilters]);

  // Nếu render form riêng, chỉ render results
  if (renderFormInLeftPanel) {
    return (
      <div className="roomfinder">
        <div className="roomfinder__column roomfinder__column--results">
          <RoomResultsList
            rooms={rooms}
            loading={loading}
            error={apiError}
            hasSearched={hasSearched}
            searchRange={searchRange}
            onRetry={fetchRooms}
            onBookRoom={handleBookRoom}
            onViewDetails={handleViewDetail}
          />
        </div>
      </div>
    );
  }

  // Render bình thường (form và results cùng nhau)
  return (
    <div className="roomfinder">
      <div className="roomfinder__column roomfinder__column--form">
        <RoomSearchForm
          criteria={criteria}
          onChange={updateCriteria}
          onToggleDeviceType={toggleDeviceType}
          onSubmit={fetchRooms}
          onClear={clearFilters}
          deviceTypeOptions={DEVICE_TYPE_OPTIONS}
          loading={loading}
          formError={formError}
        />
      </div>
      <div className="roomfinder__column roomfinder__column--results">
        <RoomResultsList
          rooms={rooms}
          loading={loading}
          error={apiError}
          hasSearched={hasSearched}
          searchRange={searchRange}
          onRetry={fetchRooms}
          onBookRoom={handleBookRoom}
          onViewDetails={handleViewDetail}
        />
      </div>
    </div>
  );
};

export default RoomFinder;

