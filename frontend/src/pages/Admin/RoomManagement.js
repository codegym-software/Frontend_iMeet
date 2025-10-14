import React, { useState, useEffect } from 'react';
import { usePreloadedData } from './DataPreloaderContext';
import { useActivity } from './ActivityContext';
import RoomForms from './RoomForms';
import roomService from '../../services/roomService';
import { FaEdit, FaTrash, FaPlus, FaLaptop } from 'react-icons/fa';

// Component to display devices in a room with quantities
const RoomDevicesList = ({ room, devices }) => {
  const [deviceInfo, setDeviceInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const MAX_VISIBLE_DEVICES = 3;

  useEffect(() => {
    let isMounted = true;

    const loadDeviceInfo = async () => {
      try {
        const resp = await roomService.getDevicesByRoom(room.id);
        if (isMounted && resp && resp.success && Array.isArray(resp.data)) {
          const deviceMap = {};
          resp.data.forEach(rd => {
            const device = devices.find(d => d.id === rd.deviceId);
            deviceMap[rd.deviceId] = {
              name: device ? device.name : `Device #${rd.deviceId}`,
              quantity: rd.quantityAssigned || 1
            };
          });
          setDeviceInfo(deviceMap);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading device info:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (room.id) {
      loadDeviceInfo();
    }

    return () => {
      isMounted = false;
    };
  }, [room.id, devices]);

  if (loading) {
    return (
      <span style={{ fontSize: '13px', color: '#999' }}>Đang tải...</span>
    );
  }

  const deviceIds = Object.keys(deviceInfo);
  if (deviceIds.length === 0) return null;

  const visibleDevices = deviceIds.slice(0, MAX_VISIBLE_DEVICES);
  const hasMore = deviceIds.length > MAX_VISIBLE_DEVICES;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {visibleDevices.map(deviceId => {
          const info = deviceInfo[deviceId];
          return (
            <span key={deviceId} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #bbdefb'
            }}>
              {info.name}
              <span style={{
                backgroundColor: '#1976d2',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {info.quantity}
              </span>
            </span>
          );
        })}
        {hasMore && (
          <span 
            onClick={() => setShowAllDevices(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#666';
            }}
            title={`Xem thêm ${deviceIds.length - MAX_VISIBLE_DEVICES} thiết bị`}
          >
            +{deviceIds.length - MAX_VISIBLE_DEVICES}
          </span>
        )}
      </div>

      {/* Modal to show all devices */}
      {showAllDevices && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setShowAllDevices(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '12px'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Thiết bị của {room.name}
              </h3>
              <button
                onClick={() => setShowAllDevices(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deviceIds.map(deviceId => {
                const info = deviceInfo[deviceId];
                return (
                  <div 
                    key={deviceId} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <span style={{
                      fontSize: '14px',
                      color: '#2c3e50',
                      fontWeight: '500'
                    }}>
                      {info.name}
                    </span>
                    <span style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Số lượng: {info.quantity}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ 
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #f0f0f0',
              textAlign: 'right'
            }}>
              <button
                onClick={() => setShowAllDevices(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const RoomManagement = () => {
  const { addActivity } = useActivity();
  
  // Use devices from DataPreloaderContext instead of DeviceContext
  const { 
    devices: preloadedDevices,
    loadDevices: reloadDevices,
    setDevices: setPreloadedDevices
  } = usePreloadedData();
  const devices = preloadedDevices || [];
  
  // Use preloaded data
  const { 
    rooms: preloadedRooms, 
    roomsLoading: preloadedLoading,
    loadRooms: reloadRooms,
    setRooms: setPreloadedRooms
  } = usePreloadedData();
  
  const [rooms, setRooms] = useState(preloadedRooms);
  const [filteredRooms, setFilteredRooms] = useState(preloadedRooms);
  const [loading, setLoading] = useState(false); // Don't show loading if data is preloaded
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignDeviceForm, setShowAssignDeviceForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    status: 'available', // available, maintenance
    selectedDevices: [], // Array of device IDs
    deviceQuantities: {}, // Object mapping deviceId to quantity
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const roomStatuses = [
    { value: 'available', label: 'Có thể sử dụng', color: '#28a745', bgColor: '#d4edda' },
    { value: 'maintenance', label: 'Bảo trì', color: '#6c757d', bgColor: '#e2e3e5' }
  ];

  // Sync with preloaded data
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      setRooms(preloadedRooms);
      setFilteredRooms(preloadedRooms);
      // Only show loading if we don't have data yet
      if (preloadedRooms.length === 0 && preloadedLoading) {
        setLoading(true);
      } else {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [preloadedRooms, preloadedLoading]);

  // Load rooms from API (for refresh after CRUD operations)
  const loadRooms = async (mountedRef) => {
    // Ensure we only set component-level loading state (not a property on a primitive)
    if (!mountedRef || mountedRef.current) setLoading(true);
    setApiError(null);
    try {
      const enrichedRooms = await reloadRooms();
      if (!mountedRef || mountedRef.current) {
        setRooms(enrichedRooms);
        setFilteredRooms(enrichedRooms);
        setPreloadedRooms(enrichedRooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      if (!mountedRef || mountedRef.current) {
        setApiError('Lỗi kết nối đến server');
        setRooms([]);
        setFilteredRooms([]);
      }
    } finally {
      if (!mountedRef || mountedRef.current) setLoading(false);
    }
  };

  // Filter effect
  useEffect(() => {
    if (searchTerm) {
      const filtered = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms(rooms);
    }
  }, [searchTerm, rooms]);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Tên phòng là bắt buộc';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Tên phòng không được quá 100 ký tự';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Vị trí là bắt buộc';
    } else if (formData.location.trim().length > 200) {
      errors.location = 'Vị trí không được quá 200 ký tự';
    }
    
    // Capacity: must be a numeric integer between 1 and 1000
    const rawCapacity = formData.capacity;
    if (rawCapacity === '' || rawCapacity === null || rawCapacity === undefined) {
      errors.capacity = 'Sức chứa là bắt buộc';
    } else {
      const num = Number(String(rawCapacity).trim());
      if (!Number.isFinite(num) || Number.isNaN(num)) {
        errors.capacity = 'Sức chứa phải là một số hợp lệ';
      } else if (!Number.isInteger(num)) {
        errors.capacity = 'Sức chứa phải là một số nguyên';
      } else if (num < 1) {
        errors.capacity = 'Sức chứa phải lớn hơn 0';
      } else if (num > 1000) {
        errors.capacity = 'Sức chứa không được quá 1000';
      }
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Mô tả là bắt buộc';
    } else if (formData.description.trim().length > 500) {
      errors.description = 'Mô tả không được quá 500 ký tự';
    }
    
    return errors;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      capacity: '',
      status: 'available',
      selectedDevices: [],
      deviceQuantities: {},
      description: ''
    });
    setFormErrors({});
    setShowAddForm(false);
    setShowEditForm(false);
    setShowAssignDeviceForm(false);
    setEditingItem(null);
  };

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Add
  const handleAdd = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setActionLoading(true);
      
      try {
  // Coerce capacity to number and ensure selectedDevices is an array
  // Safely coerce capacity to integer or null
  const capacityNum = Number(String(formData.capacity).trim());
  const payload = {
    ...formData,
    capacity: Number.isFinite(capacityNum) && Number.isInteger(capacityNum) ? capacityNum : null,
    selectedDevices: Array.isArray(formData.selectedDevices) ? formData.selectedDevices : []
  };

  const result = await roomService.createRoom(payload);
        
        if (result.success) {
          // Sync device assignments for the new room (if any selected)
          const newRoom = result.data;
          const selected = Array.isArray(payload.selectedDevices) ? payload.selectedDevices : [];
          let deviceSyncSuccess = true;
          let deviceSyncMessage = '';
          
          if (selected.length > 0) {
            try {
              const newRoomId = newRoom.id;
              const quantities = payload.deviceQuantities || {};
              // Assign each selected device with specified quantity
              const assignResults = await Promise.all(
                selected.map(devId => {
                  const quantity = quantities[devId] || 1;
                  return roomService.assignDeviceToRoom(newRoomId, devId, quantity, '');
                })
              );
              
              // Check if all assignments succeeded
              const failedAssignments = assignResults.filter(r => !r.success);
              if (failedAssignments.length > 0) {
                deviceSyncSuccess = false;
                deviceSyncMessage = ` Tuy nhiên, ${failedAssignments.length}/${selected.length} thiết bị không thể gán.`;
              } else {
                deviceSyncMessage = ` Đã gán ${selected.length} thiết bị thành công.`;
              }
              
              // Reflect assigned devices locally
              newRoom.selectedDevices = selected.map(id => Number(id));
            } catch (syncErr) {
              console.warn('Device sync after create failed:', syncErr);
              deviceSyncSuccess = false;
              deviceSyncMessage = ` Lỗi khi gán thiết bị: ${syncErr.message || 'Không xác định'}`;
              newRoom.selectedDevices = [];
            }
          } else {
            newRoom.selectedDevices = [];
          }

          // Insert new room into local state so UI updates immediately
          const updatedRoomsList = [newRoom, ...(preloadedRooms || [])];
          setRooms(updatedRoomsList);
          setPreloadedRooms(updatedRoomsList);
          // filteredRooms will be updated by the useEffect that watches rooms

          // Reload devices to update quantities after assignment
          if (selected.length > 0) {
            try {
              await reloadDevices();
            } catch (err) {
              console.warn('Failed to reload devices:', err);
            }
          }

          showNotification(
            deviceSyncSuccess ? 'success' : 'warning',
            `✨ ${result.message || 'Đã thêm phòng thành công!'}${deviceSyncMessage}`
          );
          
          // Log activity
          const deviceCount = formData.selectedDevices.length;
          const deviceInfo = deviceCount > 0 ? `, ${deviceCount} thiết bị` : '';
          addActivity('room', 'add', formData.name, `🏛️ Vị trí: ${formData.location} | 👥 Sức chứa: ${formData.capacity} người${deviceInfo}`);
          
          resetForm();
        } else {
          showNotification('error', result.error || 'Lỗi khi thêm phòng');
        }
      } catch (error) {
        console.error('Error creating room:', error);
        showNotification('error', 'Lỗi kết nối đến server');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle Assign Device - Open form to assign devices only
  const handleAssignDevice = async (room) => {
    setEditingItem(room);
    setFormData({
      name: room.name,
      location: room.location,
      capacity: room.capacity.toString(),
      status: room.status,
      selectedDevices: room.selectedDevices,
      deviceQuantities: {}, // Will be loaded async
      description: room.description
    });
    setFormErrors({});
    setShowAssignDeviceForm(true);
    
    // Load current device assignments with quantities
    try {
      const resp = await roomService.getDevicesByRoom(room.id);
      if (resp && resp.success && Array.isArray(resp.data)) {
        const deviceQuantities = {};
        resp.data.forEach(rd => {
          deviceQuantities[rd.deviceId] = rd.quantityAssigned || 1;
        });
        
        setFormData(prev => ({
          ...prev,
          deviceQuantities: deviceQuantities
        }));
      }
    } catch (err) {
      console.warn('Failed to load device quantities:', err);
    }
  };

  // Handle Edit
  const handleEdit = async (room) => {
    // Immediately show form with current data
    setEditingItem(room);
    setFormData({
      name: room.name,
      location: room.location,
      capacity: room.capacity.toString(),
      status: room.status,
      selectedDevices: room.selectedDevices,
      deviceQuantities: {}, // Will be loaded async
      description: room.description
    });
    setFormErrors({});
    setShowEditForm(true);
    
    // Load current device assignments with quantities in background
    try {
      const resp = await roomService.getDevicesByRoom(room.id);
      if (resp && resp.success && Array.isArray(resp.data)) {
        // Build deviceQuantities map from current assignments
        const deviceQuantities = {};
        resp.data.forEach(rd => {
          deviceQuantities[rd.deviceId] = rd.quantityAssigned || 1;
        });
        
        // Update form data with loaded quantities
        setFormData(prev => ({
          ...prev,
          deviceQuantities: deviceQuantities
        }));
      }
    } catch (err) {
      console.warn('Failed to load device quantities:', err);
    }
  };

  // Handle Update
  const handleUpdate = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setActionLoading(true);
      
      try {
  const capacityNum2 = Number(String(formData.capacity).trim());
  const payload = {
    ...formData,
    capacity: Number.isFinite(capacityNum2) && Number.isInteger(capacityNum2) ? capacityNum2 : null,
    selectedDevices: Array.isArray(formData.selectedDevices) ? formData.selectedDevices : []
  };

  const result = await roomService.updateRoom(editingItem.id, payload);
        
        if (result.success) {
          // Sync device assignments: compare existing assignments and selected devices
          let deviceSyncSuccess = true;
          let deviceSyncMessage = '';
          let hasDeviceChanges = false;
          
          try {
            const roomId = editingItem.id;
            const existingResp = await roomService.getDevicesByRoom(roomId);
            if (existingResp && existingResp.success) {
              const existing = existingResp.data || [];
              const quantities = payload.deviceQuantities || {};
              
              // existing items are RoomDeviceResponse with deviceId, roomDeviceId, and quantityAssigned
              const existingDeviceIds = existing.map(x => Number(x.deviceId));
              const selectedDeviceIds = (payload.selectedDevices || []).map(id => Number(id));
              
              const toAdd = selectedDeviceIds.filter(id => !existingDeviceIds.includes(id));
              const toRemove = existing.filter(x => !selectedDeviceIds.includes(Number(x.deviceId)));
              const toUpdate = existing.filter(x => {
                const deviceId = Number(x.deviceId);
                if (!selectedDeviceIds.includes(deviceId)) return false;
                const newQuantity = quantities[deviceId] || 1;
                const oldQuantity = x.quantityAssigned || 1;
                return newQuantity !== oldQuantity;
              });

              hasDeviceChanges = toAdd.length > 0 || toRemove.length > 0 || toUpdate.length > 0;

              // Add new assignments with specified quantities
              if (toAdd.length > 0) {
                const addResults = await Promise.all(
                  toAdd.map(devId => {
                    const quantity = quantities[devId] || 1;
                    return roomService.assignDeviceToRoom(roomId, devId, quantity, '');
                  })
                );
                const failedAdds = addResults.filter(r => !r.success);
                if (failedAdds.length > 0) {
                  deviceSyncSuccess = false;
                  deviceSyncMessage += ` ${failedAdds.length}/${toAdd.length} thiết bị không thể thêm.`;
                }
              }
              
              // Update quantities for existing assignments
              if (toUpdate.length > 0) {
                const updateResults = await Promise.all(
                  toUpdate.map(rd => {
                    const newQuantity = quantities[rd.deviceId] || 1;
                    return roomService.updateRoomDevice(rd.roomDeviceId, {
                      roomId: roomId,
                      deviceId: rd.deviceId,
                      quantityAssigned: newQuantity,
                      notes: rd.notes || ''
                    });
                  })
                );
                const failedUpdates = updateResults.filter(r => !r.success);
                if (failedUpdates.length > 0) {
                  deviceSyncSuccess = false;
                  deviceSyncMessage += ` ${failedUpdates.length}/${toUpdate.length} thiết bị không thể cập nhật số lượng.`;
                }
              }
              
              // Remove unselected assignments by roomDeviceId
              if (toRemove.length > 0) {
                const removeResults = await Promise.all(
                  toRemove.map(rd => roomService.removeRoomDevice(rd.roomDeviceId))
                );
                const failedRemoves = removeResults.filter(r => !r.success);
                if (failedRemoves.length > 0) {
                  deviceSyncSuccess = false;
                  deviceSyncMessage += ` ${failedRemoves.length}/${toRemove.length} thiết bị không thể xóa.`;
                }
              }
              
              if (deviceSyncSuccess && hasDeviceChanges) {
                deviceSyncMessage = ` Đã cập nhật ${toAdd.length + toRemove.length + toUpdate.length} thiết bị.`;
              }
            }
          } catch (syncErr) {
            console.warn('Device sync after update failed:', syncErr);
            deviceSyncSuccess = false;
            deviceSyncMessage = ` Lỗi khi đồng bộ thiết bị: ${syncErr.message || 'Không xác định'}`;
          }

          // Update the specific room in local state so UI updates immediately without a full reload
          const updatedRoom = result.data;
          // Ensure selectedDevices reflect the current selection
          updatedRoom.selectedDevices = Array.isArray(payload.selectedDevices) ? payload.selectedDevices.map(id => Number(id)) : [];

          const updatedRoomsList = (preloadedRooms || []).map(r => (r.id === editingItem.id ? updatedRoom : r));
          setRooms(updatedRoomsList);
          setPreloadedRooms(updatedRoomsList);
          // filteredRooms will be updated by the useEffect that watches rooms

          // Reload devices to update quantities after any device changes
          if (hasDeviceChanges) {
            try {
              await reloadDevices();
              // Also reload rooms to get updated device assignments
              await reloadRooms();
            } catch (err) {
              console.warn('Failed to reload devices/rooms:', err);
            }
          }

          showNotification(
            deviceSyncSuccess ? 'success' : 'warning',
            `📝 ${result.message || 'Đã cập nhật phòng thành công!'}${deviceSyncMessage}`
          );
          
          // Log activity - show what changed
          const changes = [];
          if (editingItem.name !== formData.name) changes.push(`Tên: "${editingItem.name}" → "${formData.name}"`);
          if (editingItem.location !== formData.location) changes.push(`Vị trí: "${editingItem.location}" → "${formData.location}"`);
          if (editingItem.capacity !== parseInt(formData.capacity)) changes.push(`Sức chứa: ${editingItem.capacity} → ${formData.capacity} người`);
          if (editingItem.status !== formData.status) {
            const oldStatus = roomStatuses.find(s => s.value === editingItem.status)?.label || editingItem.status;
            const newStatus = roomStatuses.find(s => s.value === formData.status)?.label || formData.status;
            changes.push(`Trạng thái: "${oldStatus}" → "${newStatus}"`);
          }
          const changeDetail = changes.length > 0 ? changes.join(' | ') : 'Cập nhật thiết bị';
          addActivity('room', 'update', formData.name, changeDetail);
          
          resetForm();
        } else {
          showNotification('error', result.error || 'Lỗi khi cập nhật phòng');
        }
      } catch (error) {
        console.error('Error updating room:', error);
        showNotification('error', 'Lỗi kết nối đến server');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const roomToDelete = rooms.find(room => room.id === id);
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${roomToDelete?.name}"?`)) {
      setActionLoading(true);
      
      try {
        // First remove any assigned devices (room_device entries) to avoid FK constraint
        let hasDevices = false;
        try {
          const resp = await roomService.getDevicesByRoom(id);
          if (resp && resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
            hasDevices = true;
            // Remove all room-device assignments
            await Promise.all(resp.data.map(rd => roomService.removeRoomDevice(rd.roomDeviceId)));
          }
        } catch (cleanupErr) {
          console.warn('Failed to cleanup room-device assignments before deleting room:', cleanupErr);
          // Continue to attempt delete; backend may still fail but we attempted cleanup
        }

        const result = await roomService.deleteRoom(id);

        if (result && result.success) {
          // Remove deleted room from local state so UI updates immediately
          const updatedRoomsList = (preloadedRooms || []).filter(r => r.id !== id);
          setRooms(updatedRoomsList);
          setPreloadedRooms(updatedRoomsList);
          // filteredRooms will be updated by the useEffect that watches rooms
          
          // Reload devices to update quantities after removal
          if (hasDevices) {
            try {
              await reloadDevices();
            } catch (err) {
              console.warn('Failed to reload devices:', err);
            }
          }
          
          showNotification('success', `🗑️ ${result.message || `Đã xóa phòng "${roomToDelete?.name}" thành công!`}`);
          
          // Log activity
          addActivity('room', 'delete', roomToDelete?.name, `🏛️ ${roomToDelete?.location} | 👥 Sức chứa: ${roomToDelete?.capacity} người`);
        } else {
          // If backend returns error object, show message
          const errMsg = (result && result.error) || 'Lỗi khi xóa phòng';
          showNotification('error', errMsg);
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        // Try to extract a helpful message from backend error
        const msg = (error && error.message) ? error.message : 'Lỗi kết nối đến server';
        showNotification('error', `Lỗi khi xóa phòng: ${msg}. Bạn có thể thử xóa các thiết bị gán cho phòng trước khi xóa.`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Get device name by ID
  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : `Device #${deviceId}`;
  };

  // Get status info
  const getStatusInfo = (status) => {
    return roomStatuses.find(s => s.value === status) || roomStatuses[0];
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>Đang xử lý...</div>
        <div style={{ fontSize: '14px', color: '#999' }}>Vui lòng chờ trong giây lát</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'success' ? '#d4edda' : (notification.type === 'warning' ? '#fff3cd' : '#f8d7da'),
          color: notification.type === 'success' ? '#155724' : (notification.type === 'warning' ? '#856404' : '#721c24'),
          padding: '16px 20px',
          borderRadius: '8px',
          border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : (notification.type === 'warning' ? '#ffeaa7' : '#f5c6cb')}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          minWidth: '350px',
          maxWidth: '500px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '10px',
                color: 'inherit'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '350px',
          maxWidth: '500px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '14px', lineHeight: '1.4', marginBottom: '10px' }}>
              ⚠️ {apiError}
            </div>
            <button
              onClick={() => setApiError(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '10px',
                color: 'inherit',
                position: 'absolute',
                top: '8px',
                right: '8px'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <button
              onClick={() => {
                setApiError(null);
                loadRooms();
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>
            Quản lý Phòng
          </h1>
          <p style={{ fontSize: '16px', color: '#7f8c8d', margin: 0 }}>
            Quản lý và theo dõi tất cả phòng họp, hội thảo trong hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ 
              padding: '12px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px'
            }}
            title="Thêm phòng mới"
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên phòng hoặc vị trí..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: '#666'
            }}>
              🔍
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                padding: '12px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Room Table */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        overflow: 'auto',
        marginBottom: '30px'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px',
          minWidth: '900px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#495057', minWidth: '150px' }}>
                Tên Phòng
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#495057', minWidth: '120px' }}>
                Vị trí
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#495057', minWidth: '100px' }}>
                Sức chứa
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#495057', minWidth: '200px' }}>
                Thiết bị
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#495057', minWidth: '120px' }}>
                Trạng thái
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600', color: '#495057', minWidth: '120px' }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => {
              const statusInfo = getStatusInfo(room.status);
              return (
                <tr 
                  key={room.id} 
                  style={{ 
                    borderBottom: '1px solid #dee2e6',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px', fontWeight: '600', color: '#2c3e50' }}>
                    {room.name}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {room.location}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {room.capacity} người
                  </td>
                  <td style={{ padding: '16px' }}>
                    {(room.selectedDevices || []).length > 0 ? (
                      <RoomDevicesList room={room} devices={devices} />
                    ) : (
                      <span style={{ color: '#999', fontSize: '13px' }}>Không có</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: statusInfo.bgColor,
                      color: statusInfo.color,
                      display: 'inline-block'
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleAssignDevice(room)}
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#28a745', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        title="Gắn thiết bị"
                      >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <FaLaptop style={{ fontSize: '16px' }} />
                          <FaPlus style={{ 
                            position: 'absolute', 
                            top: '-4px', 
                            right: '-6px', 
                            fontSize: '10px',
                            backgroundColor: '#28a745',
                            borderRadius: '50%',
                            padding: '1px'
                          }} />
                        </div>
                      </button>
                      <button 
                        onClick={() => handleEdit(room)}
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                        title="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(room.id)}
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRooms.length === 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '60px 40px', 
          textAlign: 'center', 
          color: '#666',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            {searchTerm ? `Không tìm thấy phòng nào với từ khóa "${searchTerm}"` : 'Chưa có phòng nào'}
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            {searchTerm ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Hãy thêm phòng mới để bắt đầu!'}
          </div>
        </div>
      )}


      {/* Room Forms */}
      <RoomForms
        showAddForm={showAddForm}
        showEditForm={showEditForm}
        showAssignDeviceForm={showAssignDeviceForm}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        devices={devices}
        roomStatuses={roomStatuses}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onCancel={resetForm}
      />

      {/* Action Loading Overlay */}
      {actionLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px 40px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>Đang xử lý...</div>
            <div style={{ fontSize: '14px', color: '#999' }}>Vui lòng chờ trong giây lát</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
