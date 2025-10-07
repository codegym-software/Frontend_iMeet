import React, { useState, useEffect } from 'react';
import { useDeviceTypes } from './DeviceTypeContext';
import { useDevices } from './DeviceContext';
import adminService from '../../services/adminService';

const DeviceList = () => {
  const { deviceTypes, loading: deviceTypesLoading, getDeviceTypeById, registerOnDeviceTypeAdded } = useDeviceTypes();
  const { devices, loading: devicesLoading, setDevices } = useDevices();
  const [loading, setLoading] = useState(true);
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
  const [actionLoading, setActionLoading] = useState({ add: false, update: false, deletingId: null });

  // Normalize backend device object to frontend shape
  function normalizeDevice(d) {
    if (!d) return null;
    const id = d.deviceId ?? d.id ?? d.device_id ?? null;
    const name = d.name ?? '';
    const quantity = d.quantity ?? 0;
    const description = d.description ?? '';
    // deviceType may be provided in different forms
    let deviceTypeName = '';
    if (d.deviceType) {
      if (typeof d.deviceType === 'string') {
        // Backend may return enum name (e.g., "MIC", "MAY_CHIEU") or display name ("Mic", "Máy chiếu")
        const enumVal = d.deviceType;
        // Map known enum keys to display names
        const enumToDisplay = {
          MIC: 'Mic', CAM: 'Cam', LAPTOP: 'Laptop', BANG: 'Bảng', MAN_HINH: 'Màn hình', MAY_CHIEU: 'Máy chiếu', KHAC: 'Khác'
        };
        deviceTypeName = enumToDisplay[enumVal] || enumToDisplay[String(enumVal).toUpperCase()] || d.deviceType;
      } else if (typeof d.deviceType === 'object') {
        deviceTypeName = d.deviceType.displayName ?? d.deviceType.name ?? String(d.deviceType);
      } else {
        deviceTypeName = String(d.deviceType);
      }
    } else if (d.deviceTypeName) {
      deviceTypeName = d.deviceTypeName;
    }

    // Try to find a matching device type in local list by name (case-insensitive)
    const typeObj = deviceTypes.find(t => String(t.name).toLowerCase() === String(deviceTypeName).toLowerCase() || String(t.name).toLowerCase() === String(deviceTypeName).toLowerCase());
    const deviceTypeId = typeObj ? typeObj.id : (d.deviceTypeId ?? null);
    const createdAt = d.createdAt ?? d.createdAtString ?? d.created_at ?? new Date().toISOString();
    return { id, name, deviceTypeId, deviceTypeName: deviceTypeName || (typeObj ? typeObj.name : ''), quantity, description, createdAt };
  }

  // Sync loading state with context
  useEffect(() => {
    setLoading(deviceTypesLoading || devicesLoading);
  }, [deviceTypesLoading, devicesLoading]);

  // Function để tạo thiết bị mẫu tự động khi có loại thiết bị mới (creates via API)
  const createSampleDevice = async (newDeviceType) => {
    try {
      setActionLoading(prev => ({ ...prev, add: true }));
      // backend expects DeviceRequest.deviceType as enum (e.g., MIC, CAM, LAPTOP, BANG, MAN_HINH, KHAC)
      const mapToEnum = (displayName) => {
        const map = {
          'Mic': 'MIC',
          'Cam': 'CAM',
          'Laptop': 'LAPTOP',
          'Bảng': 'BANG',
          'Màn hình': 'MAN_HINH',
          'Khác': 'KHAC'
        };
        return map[displayName] || map[newDeviceType.name] || 'KHAC';
      };

      const sampleDeviceData = {
        name: `${newDeviceType.name} Mẫu`,
        device_type: mapToEnum(newDeviceType.name),
        quantity: 1,
        description: `Đây là thiết bị mẫu cho loại "${newDeviceType.name}". ${newDeviceType.description}`
      };

  const result = await adminService.createDevice(sampleDeviceData);
      // Refresh devices list from API
  const list = await adminService.getDevices();
  setDevices(Array.isArray(list) ? list.map(normalizeDevice).filter(Boolean) : []);

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

  // Load devices from API on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await adminService.getDevices();
        if (mounted) {
          const normalized = Array.isArray(list) ? list.map(normalizeDevice).filter(Boolean) : [];
          setDevices(normalized);
        }
      } catch (err) {
        console.error('Error loading devices:', err);
        if (mounted) {
          setDevices([]);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [setDevices]);

  // Validation function
  const validateDeviceForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Tên thiết bị là bắt buộc';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Tên thiết bị không được quá 100 ký tự';
    }
    
    if (!formData.deviceTypeId) {
      errors.deviceTypeId = 'Vui lòng chọn loại thiết bị';
    }
    
    if (!formData.quantity) {
      errors.quantity = 'Số lượng là bắt buộc';
    } else if (parseInt(formData.quantity) < 1) {
      errors.quantity = 'Số lượng phải lớn hơn 0';
    } else if (parseInt(formData.quantity) > 1000) {
      errors.quantity = 'Số lượng không được quá 1000';
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
    setFormData({ name: '', deviceTypeId: '', quantity: '', description: '' });
    setFormErrors({});
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingItem(null);
  };

  // Handle Add
  const handleAdd = async () => {
    const errors = validateDeviceForm();
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
        // Refresh list
  const list = await adminService.getDevices();
  setDevices(Array.isArray(list) ? list.map(normalizeDevice).filter(Boolean) : []);
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
    setEditingItem(item);
    setFormData({
      name: item?.name ?? '',
      deviceTypeId: (item && item.deviceTypeId !== undefined && item.deviceTypeId !== null) ? String(item.deviceTypeId) : '',
      quantity: (item && item.quantity !== undefined && item.quantity !== null) ? String(item.quantity) : '1',
      description: item?.description ?? ''
    });
    setFormErrors({});
    setShowEditForm(true);
  };

  // Handle Update
  const handleUpdate = async () => {
    const errors = validateDeviceForm();
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
  const list = await adminService.getDevices();
  setDevices(Array.isArray(list) ? list.map(normalizeDevice).filter(Boolean) : []);
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
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      try {
        setActionLoading(prev => ({ ...prev, deletingId: id }));
        const result = await adminService.deleteDevice(id);
  const list = await adminService.getDevices();
  setDevices(Array.isArray(list) ? list.map(normalizeDevice).filter(Boolean) : []);
  setApiError(null);
      } catch (err) {
        console.error('Error deleting device:', err);
  setApiError(err.message || 'Lỗi khi xóa thiết bị');
      } finally {
        setActionLoading(prev => ({ ...prev, deletingId: null }));
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div>
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
            padding: '12px 24px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Thêm Thiết bị
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '30px', 
            width: '600px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px' }}>
              Thêm Thiết bị Mới
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Tên thiết bị *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.name ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="VD: MacBook Pro 2023"
                />
                {formErrors.name && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.name}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formData.name.length}/100 ký tự
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Loại thiết bị *
                </label>
                <select
                  value={formData.deviceTypeId}
                  onChange={(e) => setFormData({...formData, deviceTypeId: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.deviceTypeId ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                >
                  <option value="">Chọn loại thiết bị</option>
                  {deviceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formErrors.deviceTypeId && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.deviceTypeId}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Số lượng *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                style={{ 
                  width: '200px', 
                  padding: '12px', 
                  border: `2px solid ${formErrors.quantity ? '#dc3545' : '#e9ecef'}`, 
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                placeholder="1"
              />
              {formErrors.quantity && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.quantity}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Mô tả *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: `2px solid ${formErrors.description ? '#dc3545' : '#e9ecef'}`, 
                  borderRadius: '8px',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                placeholder="Mô tả chi tiết về thiết bị này..."
              />
              {formErrors.description && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.description}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {formData.description.length}/500 ký tự
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={resetForm}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Hủy
              </button>
              <button 
                onClick={handleAdd}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: actionLoading.add ? 'wait' : 'pointer',
                  fontSize: '16px'
                }}
                disabled={actionLoading.add}
              >
                {actionLoading.add ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '30px', 
            width: '600px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px' }}>
              Chỉnh sửa Thiết bị
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Tên thiết bị *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.name ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                {formErrors.name && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.name}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formData.name.length}/100 ký tự
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Loại thiết bị *
                </label>
                <select
                  value={formData.deviceTypeId}
                  onChange={(e) => setFormData({...formData, deviceTypeId: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.deviceTypeId ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                >
                  <option value="">Chọn loại thiết bị</option>
                  {deviceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {formErrors.deviceTypeId && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.deviceTypeId}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Số lượng *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                style={{ 
                  width: '200px', 
                  padding: '12px', 
                  border: `2px solid ${formErrors.quantity ? '#dc3545' : '#e9ecef'}`, 
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {formErrors.quantity && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.quantity}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Mô tả *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: `2px solid ${formErrors.description ? '#dc3545' : '#e9ecef'}`, 
                  borderRadius: '8px',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {formErrors.description && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.description}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {formData.description.length}/500 ký tự
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={resetForm}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdate}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: actionLoading.update ? 'wait' : 'pointer',
                  fontSize: '16px'
                }}
                disabled={actionLoading.update}
              >
                {actionLoading.update ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
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
                ID
              </th>
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
                Ngày tạo
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, idx) => (
              <tr key={device?.id ?? `device-${idx}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '16px', color: '#666' }}>
                  {device?.id}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                    {device.name}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {device.deviceTypeName}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: '#e8f5e8',
                    color: '#2e7d32',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {device.quantity}
                  </span>
                </td>
                <td style={{ padding: '16px', maxWidth: '300px', color: '#555' }}>
                  {((device?.description ?? '').length > 60)
                    ? (device.description.substring(0, 60) + '...')
                    : (device?.description ?? '')}
                </td>
                <td style={{ padding: '16px', color: '#666' }}>
                  {device?.createdAt ? new Date(device.createdAt).toLocaleDateString('vi-VN') : ''}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleEdit(device)}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px',
                      marginRight: '8px',
                      cursor: actionLoading.deletingId ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                    disabled={actionLoading.deletingId !== null}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDeviceDelete(device?.id)}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: actionLoading.deletingId === device.id ? 'wait' : 'pointer',
                      fontSize: '14px'
                    }}
                    disabled={actionLoading.deletingId !== null}
                  >
                    {actionLoading.deletingId === device.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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