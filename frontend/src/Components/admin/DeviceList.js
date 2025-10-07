import React, { useState, useEffect } from 'react';
import { useDeviceTypes } from './DeviceTypeContext';
import { useDevices } from './DeviceContext';

const DeviceList = () => {
  const { deviceTypes, loading: deviceTypesLoading, getDeviceTypeById, registerOnDeviceTypeAdded } = useDeviceTypes();
  const { devices, loading: devicesLoading, addDevice, updateDevice, deleteDevice } = useDevices();
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
  const [notification, setNotification] = useState(null);

  // Sync loading state with context
  useEffect(() => {
    setLoading(deviceTypesLoading || devicesLoading);
  }, [deviceTypesLoading, devicesLoading]);

  // Function để tạo thiết bị mẫu tự động khi có loại thiết bị mới
  const createSampleDevice = (newDeviceType) => {
    const sampleDeviceData = {
      name: `${newDeviceType.name} Mẫu`,
      deviceTypeId: newDeviceType.id,
      deviceTypeName: newDeviceType.name,
      quantity: 1,
      description: `Đây là thiết bị mẫu cho loại "${newDeviceType.name}". ${newDeviceType.description}`
    };
    
    const sampleDevice = addDevice(sampleDeviceData);
    
    // Hiển thị notification
    setNotification({
      type: 'success',
      message: `✨ Đã tự động tạo thiết bị mẫu "${sampleDevice.name}" cho loại "${newDeviceType.name}"!`,
      deviceName: sampleDevice.name
    });
    
    // Tự động ẩn notification sau 5 giây
    setTimeout(() => {
      setNotification(null);
    }, 5000);
    
    return sampleDevice;
  };

  // Đăng ký callback khi có device type mới
  useEffect(() => {
    if (registerOnDeviceTypeAdded) {
      registerOnDeviceTypeAdded(createSampleDevice);
    }
  }, [registerOnDeviceTypeAdded]); // Removed devices dependency to avoid re-registering

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
  const handleAdd = () => {
    const errors = validateDeviceForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      const selectedType = getDeviceTypeById(formData.deviceTypeId);
      const newDeviceData = {
        name: formData.name.trim(),
        deviceTypeId: parseInt(formData.deviceTypeId),
        deviceTypeName: selectedType ? selectedType.name : '',
        quantity: parseInt(formData.quantity),
        description: formData.description.trim()
      };
      addDevice(newDeviceData);
      resetForm();
    }
  };

  // Handle Edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      deviceTypeId: item.deviceTypeId.toString(),
      quantity: item.quantity.toString(),
      description: item.description
    });
    setFormErrors({});
    setShowEditForm(true);
  };

  // Handle Update
  const handleUpdate = () => {
    const errors = validateDeviceForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      const selectedType = getDeviceTypeById(formData.deviceTypeId);
      const updatedData = {
        name: formData.name.trim(),
        deviceTypeId: parseInt(formData.deviceTypeId),
        deviceTypeName: selectedType ? selectedType.name : '',
        quantity: parseInt(formData.quantity),
        description: formData.description.trim()
      };
      updateDevice(editingItem.id, updatedData);
      resetForm();
    }
  };

  // Handle Delete
  const handleDeviceDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      deleteDevice(id);
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
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
          color: notification.type === 'success' ? '#155724' : '#721c24',
          padding: '16px 20px',
          borderRadius: '8px',
          border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '350px',
          maxWidth: '500px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                🎉 Thêm thiết bị thành công!
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {notification.message}
              </div>
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
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Thêm
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
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cập nhật
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
            {devices.map((device) => (
              <tr key={device.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '16px', color: '#666' }}>
                  {device.id}
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
                  {device.description.length > 60 
                    ? device.description.substring(0, 60) + '...' 
                    : device.description}
                </td>
                <td style={{ padding: '16px', color: '#666' }}>
                  {new Date(device.createdAt).toLocaleDateString('vi-VN')}
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
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDeviceDelete(device.id)}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Xóa
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