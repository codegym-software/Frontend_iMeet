import React, { useState, useEffect } from 'react';
import { useDeviceTypes } from './DeviceTypeContext';
import { useDevices } from './DeviceContext';
import { usePreloadedData } from './DataPreloaderContext';
import { useActivity } from './ActivityContext';
import adminService from '../../services/adminService';
import { FaPlus } from 'react-icons/fa';
import DeviceFormModal from './components/DeviceFormModal';
import DeviceTableRow from './components/DeviceTableRow';
import DeviceQuantityDisplay from './components/DeviceQuantityDisplay';
import DeviceRoomsList from './components/DeviceRoomsList';
import { normalizeDevice, mapToEnum, validateDeviceForm } from './utils/deviceUtils';
import './styles/DeviceList.css';

const DeviceList = () => {
  const { addActivity } = useActivity();
  const { deviceTypes, loading: deviceTypesLoading, getDeviceTypeById, registerOnDeviceTypeAdded } = useDeviceTypes();
  const { devices: contextDevices, loading: devicesLoading, setDevices: setContextDevices } = useDevices();
  
  // Use preloaded data
  const { 
    devices: preloadedDevices, 
    devicesLoading: preloadedLoading,
    loadDevices: reloadDevices,
    setDevices: setPreloadedDevices
  } = usePreloadedData();
  
  const [devices, setDevices] = useState(preloadedDevices);
  const [loading, setLoading] = useState(false); // Don't show loading if data is preloaded
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    deviceTypeId: '',
    quantity: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState({ add: false, update: false, deletingId: null });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [filteredDevices, setFilteredDevices] = useState([]);


  // Sync with preloaded data
  useEffect(() => {
    setDevices(preloadedDevices);
    // Only show loading if we don't have data yet
    if (preloadedDevices.length === 0 && (preloadedLoading || deviceTypesLoading)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [preloadedDevices, preloadedLoading, deviceTypesLoading]);

  // Filter devices based on search query and type filter
  useEffect(() => {
    let filtered = [...devices];
    
    // Debug log
    console.log('DeviceList - Total devices:', devices.length);
    console.log('DeviceList - Device types:', devices.map(d => ({ name: d.name, type: d.deviceTypeName, typeId: d.deviceTypeId })));
    console.log('DeviceList - Available deviceTypes:', deviceTypes.map(t => ({ id: t.id, name: t.name })));
    
    // Filter by device type
    if (selectedTypeFilter) {
      filtered = filtered.filter(device => 
        String(device.deviceTypeId) === String(selectedTypeFilter)
      );
      console.log('DeviceList - Filtered by type:', selectedTypeFilter, 'Count:', filtered.length);
    }
    
    // Filter by search query (name or description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(query) ||
        (device.description || '').toLowerCase().includes(query) ||
        (device.deviceTypeName || '').toLowerCase().includes(query)
      );
      console.log('DeviceList - Filtered by search:', searchQuery, 'Count:', filtered.length);
    }
    
    setFilteredDevices(filtered);
  }, [devices, searchQuery, selectedTypeFilter, deviceTypes]);

  // Re-normalize devices when deviceTypes are loaded (only once)
  const [deviceTypesLoaded, setDeviceTypesLoaded] = useState(false);
  useEffect(() => {
    if (deviceTypes.length > 0 && !deviceTypesLoaded && preloadedDevices.length > 0) {
      console.log('Re-normalizing devices with loaded deviceTypes');
      console.log('Raw preloaded devices:', preloadedDevices.length);
      const normalizedDevices = preloadedDevices.map(d => normalizeDevice(d, deviceTypes)).filter(d => d !== null);
      console.log('Normalized devices:', normalizedDevices.length);
      console.log('Device type names:', normalizedDevices.map(d => d.deviceTypeName));
      setDevices(normalizedDevices);
      setContextDevices(normalizedDevices);
      setPreloadedDevices(normalizedDevices);
      setDeviceTypesLoaded(true);
    }
  }, [deviceTypes, deviceTypesLoaded, preloadedDevices]);

  // Function để tạo thiết bị mẫu tự động khi có loại thiết bị mới (creates via API)
  const createSampleDevice = async (newDeviceType) => {
    try {
      setActionLoading(prev => ({ ...prev, add: true }));

      const sampleDeviceData = {
        name: `${newDeviceType.name} Mẫu`,
        device_type: mapToEnum(newDeviceType.name),
        quantity: 1,
        description: `Đây là thiết bị mẫu cho loại "${newDeviceType.name}". ${newDeviceType.description}`
      };

      const result = await adminService.createDevice(sampleDeviceData);
      // Refresh devices list from API and update both contexts
      const list = await reloadDevices(deviceTypes);
      setDevices(list);
      setContextDevices(list);
      setPreloadedDevices(list);

      // Clear API error on success
      setApiError(null);
      return result;
    } catch (error) {
      console.error('Error creating sample device:', error);
      setApiError(error.message || 'Lỗi khi tạo thiết bị mẫu');
      return null;
    } finally {
      setActionLoading(prev => ({ ...prev, add: false }));
    }
  };

  // Đăng ký callback khi có device type mới (register once on mount to avoid loops)
  useEffect(() => {
    let didRegister = false;
    if (registerOnDeviceTypeAdded) {
      registerOnDeviceTypeAdded(createSampleDevice);
      didRegister = true;
    }

    return () => {
      if (didRegister && registerOnDeviceTypeAdded) {
        registerOnDeviceTypeAdded(null);
      }
    };
    // Intentionally run only once on mount/unmount to avoid re-register loops
  }, []);

  
  // Show notification
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', deviceTypeId: '', quantity: '', description: '' });
    setFormErrors({});
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingItem(null);
  };

  // Handle Add
  const handleAdd = async () => {
    const errors = validateDeviceForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        setActionLoading(prev => ({ ...prev, add: true }));
        const selectedType = getDeviceTypeById(formData.deviceTypeId);
        const mapToEnum = (displayName) => {
          const map = {
            'Mic': 'MIC',
            'Cam': 'CAM',
            'Laptop': 'LAPTOP',
            'Bảng': 'BANG',
            'Màn hình': 'MAN_HINH',
            'Máy chiếu': 'MAY_CHIEU',
            'Khác': 'KHAC'
          };
          return map[displayName] || 'KHAC';
        };

        const newDeviceData = {
          name: formData.name.trim(),
          device_type: mapToEnum(selectedType ? selectedType.name : ''),
          quantity: parseInt(formData.quantity),
          description: formData.description.trim()
        };

        const result = await adminService.createDevice(newDeviceData);
        
        // Update local state directly without reloading
        if (result && result.data) {
          const normalizedDevice = normalizeDevice(result.data);
          const updatedList = [normalizedDevice, ...devices];
          setDevices(updatedList);
          setContextDevices(updatedList);
          setPreloadedDevices(updatedList);
          showNotification('success', `✨ Thêm thiết bị "${formData.name}" thành công!`);
          
          // Log activity
          const selectedType = getDeviceTypeById(formData.deviceTypeId);
          addActivity('device', 'add', formData.name, `💻 Loại: ${selectedType?.name || 'N/A'} | 🔢 Số lượng: ${formData.quantity}`);
        }
        
        setApiError(null);
        resetForm();
      } catch (err) {
        console.error('Error adding device:', err);
        setApiError(err.message || 'Lỗi khi thêm thiết bị');
      } finally {
        setActionLoading(prev => ({ ...prev, add: false }));
      }
    }
  };

  // Handle Edit
  const handleEdit = (item) => {
    console.log('Editing device:', item);
    
    // Find deviceTypeId from deviceTypeName if deviceTypeId is not available
    let deviceTypeId = item?.deviceTypeId;
    if (!deviceTypeId && item?.deviceTypeName) {
      const matchingType = deviceTypes.find(t => 
        t.name.toLowerCase() === item.deviceTypeName.toLowerCase()
      );
      if (matchingType) {
        deviceTypeId = matchingType.id;
      }
    }
    
    console.log('Selected deviceTypeId:', deviceTypeId);
    
    setEditingItem(item);
    setFormData({
      name: item?.name ?? '',
      deviceTypeId: deviceTypeId ? String(deviceTypeId) : '',
      quantity: (item && item.quantity !== undefined && item.quantity !== null) ? String(item.quantity) : '1',
      description: item?.description ?? ''
    });
    setFormErrors({});
    setShowEditForm(true);
  };

  // Handle Update
  const handleUpdate = async () => {
    const errors = validateDeviceForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        setActionLoading(prev => ({ ...prev, update: true }));
        const selectedType = getDeviceTypeById(formData.deviceTypeId);
        const mapToEnum = (displayName) => {
          const map = {
            'Mic': 'MIC',
            'Cam': 'CAM',
            'Laptop': 'LAPTOP',
            'Bảng': 'BANG',
            'Màn hình': 'MAN_HINH',
            'Máy chiếu': 'MAY_CHIEU',
            'Khác': 'KHAC'
          };
          return map[displayName] || 'KHAC';
        };

        const updatedData = {
          name: formData.name.trim(),
          device_type: mapToEnum(selectedType ? selectedType.name : ''),
          quantity: parseInt(formData.quantity),
          description: formData.description.trim()
        };

        if (!editingItem || !editingItem.id) {
          throw new Error('Không có thiết bị hợp lệ để cập nhật (id bị thiếu)');
        }
        const result = await adminService.updateDevice(editingItem.id, updatedData);
        
        // Update local state directly without reloading
        if (result && result.data) {
          const normalizedDevice = normalizeDevice(result.data);
          const updatedList = devices.map(d => d.id === editingItem.id ? normalizedDevice : d);
          setDevices(updatedList);
          setContextDevices(updatedList);
          setPreloadedDevices(updatedList);
          showNotification('success', `📝 Cập nhật thiết bị "${formData.name}" thành công!`);
          
          // Log activity - show what changed
          const changes = [];
          if (editingItem.name !== formData.name) changes.push(`Tên: "${editingItem.name}" → "${formData.name}"`);
          if (editingItem.deviceTypeId !== formData.deviceTypeId) {
            const oldType = getDeviceTypeById(editingItem.deviceTypeId)?.name || 'N/A';
            const newType = getDeviceTypeById(formData.deviceTypeId)?.name || 'N/A';
            changes.push(`Loại: "${oldType}" → "${newType}"`);
          }
          if (editingItem.quantity !== parseInt(formData.quantity)) changes.push(`Số lượng: ${editingItem.quantity} → ${formData.quantity}`);
          const changeDetail = changes.length > 0 ? changes.join(' | ') : 'Cập nhật mô tả';
          addActivity('device', 'update', formData.name, changeDetail);
        }
        
        setApiError(null);
        resetForm();
      } catch (err) {
        console.error('Error updating device:', err);
          setApiError(err.message || 'Lỗi khi cập nhật thiết bị');
      } finally {
        setActionLoading(prev => ({ ...prev, update: false }));
      }
    }
  };

  // Handle Delete
  const handleDeviceDelete = async (id) => {
    const deviceToDelete = devices.find(d => d.id === id);
    if (window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${deviceToDelete?.name}"?`)) {
      try {
        setActionLoading(prev => ({ ...prev, deletingId: id }));
        const result = await adminService.deleteDevice(id);
        
        // Update local state directly without reloading
        const updatedList = devices.filter(d => d.id !== id);
        setDevices(updatedList);
        setContextDevices(updatedList);
        setPreloadedDevices(updatedList);
        setApiError(null);
        showNotification('success', `🗑️ Xóa thiết bị "${deviceToDelete?.name}" thành công!`);
        
        // Log activity
        const deviceType = getDeviceTypeById(deviceToDelete?.deviceTypeId)?.name || 'N/A';
        addActivity('device', 'delete', deviceToDelete?.name, `💻 Loại: ${deviceType} | 🔢 Số lượng: ${deviceToDelete?.quantity}`);
      } catch (err) {
        console.error('Error deleting device:', err);
        const errorMsg = err.message || 'Lỗi khi xóa thiết bị';
        setApiError(errorMsg);
        showNotification('error', errorMsg);
      } finally {
        setActionLoading(prev => ({ ...prev, deletingId: null }));
      }
    }
  };

  return (
    <div>
      {/* Notification Toast */}
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

      {/* Inline API error banner */}
      {apiError && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px' }}>{apiError}</div>
            <button onClick={() => setApiError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>
            Quản lý Thiết bị
          </h1>
          <p style={{ fontSize: '16px', color: '#7f8c8d', margin: 0 }}>
            Quản lý và theo dõi tất cả thiết bị trong hệ thống
          </p>
        </div>
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
          title="Thêm thiết bị mới"
        >
          <FaPlus />
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: '1', minWidth: '250px' }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          {/* Device Type Filter */}
          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Tất cả loại thiết bị ({devices.length})</option>
              {deviceTypes.map(type => {
                const count = devices.filter(d => String(d.deviceTypeId) === String(type.id)).length;
                return (
                  <option key={type.id} value={type.id}>
                    {type.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedTypeFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTypeFilter('');
              }}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              Xóa bộ lọc
            </button>
          )}

          {/* Results Count */}
          <div style={{ 
            marginLeft: 'auto', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>
            Hiển thị: <strong>{filteredDevices.length}</strong> / {devices.length} thiết bị
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <DeviceFormModal
          isEdit={false}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          deviceTypes={deviceTypes}
          onSubmit={handleAdd}
          onCancel={resetForm}
          actionLoading={actionLoading}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <DeviceFormModal
          isEdit={true}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          deviceTypes={deviceTypes}
          onSubmit={handleUpdate}
          onCancel={resetForm}
          actionLoading={actionLoading}
        />
      )}

      {/* Devices Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', 
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Tên thiết bị
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Loại thiết bị
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Số lượng
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Mô tả
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Phòng gán thiết bị
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device, idx) => (
              <DeviceTableRow
                key={device?.id ?? `device-${idx}`}
                device={device}
                onEdit={handleEdit}
                onDelete={handleDeviceDelete}
                actionLoading={actionLoading}
                DeviceQuantityDisplay={DeviceQuantityDisplay}
                DeviceRoomsList={DeviceRoomsList}
              />
            ))}
          </tbody>
        </table>

        {filteredDevices.length === 0 && devices.length > 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Không tìm thấy thiết bị nào phù hợp với bộ lọc
          </div>
        )}

        {devices.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Chưa có thiết bị nào. Hãy thêm mới!
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList;