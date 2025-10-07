import React, { useState, useEffect } from 'react';
import { useDevices } from './DeviceContext';
import RoomForms from './RoomForms';
import roomService from '../../services/roomService';

const RoomManagement = () => {
  const { devices } = useDevices();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [notification, setNotification] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    status: 'available', // available, booked, in-use, maintenance
    selectedDevices: [], // Array of device IDs
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const roomStatuses = [
    { value: 'available', label: 'Phòng trống', color: '#28a745', bgColor: '#d4edda' },
    { value: 'booked', label: 'Đã đặt', color: '#ffc107', bgColor: '#fff3cd' },
    { value: 'in-use', label: 'Đang sử dụng', color: '#dc3545', bgColor: '#f8d7da' },
    { value: 'maintenance', label: 'Bảo trì', color: '#6c757d', bgColor: '#e2e3e5' }
  ];

  // Load rooms from API (accepts mountedRef to avoid updating state after unmount)
  const loadRooms = async (mountedRef) => {
    // Ensure we only set component-level loading state (not a property on a primitive)
    if (!mountedRef || mountedRef.current) setLoading(true);
    setApiError(null);
    try {
      const result = await roomService.getAllRooms();
      if (!mountedRef || mountedRef.current) {
        if (result && result.success) {
          setRooms(result.data || []);
          setFilteredRooms(result.data || []);
        } else {
          setApiError((result && (result.error || result.message)) || 'Lỗi khi tải danh sách phòng');
          setRooms([]);
          setFilteredRooms([]);
        }
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

  useEffect(() => {
    // Use mounted ref to avoid state updates after unmount
    const mountedRef = { current: true };
    loadRooms(mountedRef);
    return () => { mountedRef.current = false; };
  }, []);

  // Filter effect
  useEffect(() => {
    const filtered = rooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
    setCurrentPage(1);
  }, [searchTerm, rooms]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

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
      description: ''
    });
    setFormErrors({});
    setShowAddForm(false);
    setShowEditForm(false);
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
      setLoading(true);
      
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
          // Reload rooms to get updated list
          await loadRooms();
          showNotification('success', `✨ ${result.message || 'Đã thêm phòng thành công!'}`);
          resetForm();
        } else {
          showNotification('error', result.error || 'Lỗi khi thêm phòng');
        }
      } catch (error) {
        console.error('Error creating room:', error);
        showNotification('error', 'Lỗi kết nối đến server');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle Edit
  const handleEdit = (room) => {
    setEditingItem(room);
    setFormData({
      name: room.name,
      location: room.location,
      capacity: room.capacity.toString(),
      status: room.status,
      selectedDevices: room.selectedDevices,
      description: room.description
    });
    setFormErrors({});
    setShowEditForm(true);
  };

  // Handle Update
  const handleUpdate = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setLoading(true);
      
      try {
  const capacityNum2 = Number(String(formData.capacity).trim());
  const payload = {
    ...formData,
    capacity: Number.isFinite(capacityNum2) && Number.isInteger(capacityNum2) ? capacityNum2 : null,
    selectedDevices: Array.isArray(formData.selectedDevices) ? formData.selectedDevices : []
  };

  const result = await roomService.updateRoom(editingItem.id, payload);
        
        if (result.success) {
          // Reload rooms to get updated list
          await loadRooms();
          showNotification('success', `📝 ${result.message || 'Đã cập nhật phòng thành công!'}`);
          resetForm();
        } else {
          showNotification('error', result.error || 'Lỗi khi cập nhật phòng');
        }
      } catch (error) {
        console.error('Error updating room:', error);
        showNotification('error', 'Lỗi kết nối đến server');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const roomToDelete = rooms.find(room => room.id === id);
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng "${roomToDelete?.name}"?`)) {
      setLoading(true);
      
      try {
        const result = await roomService.deleteRoom(id);
        
        if (result.success) {
          // Reload rooms to get updated list
          await loadRooms();
          showNotification('success', `🗑️ ${result.message || `Đã xóa phòng "${roomToDelete?.name}" thành công!`}`);
        } else {
          showNotification('error', result.error || 'Lỗi khi xóa phòng');
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        showNotification('error', 'Lỗi kết nối đến server');
      } finally {
        setLoading(false);
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
            Thêm Phòng
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

      {/* Room Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {currentItems.map((room) => {
          const statusInfo = getStatusInfo(room.status);
          return (
            <div key={room.id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                  {room.name}
                </h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: statusInfo.bgColor,
                  color: statusInfo.color
                }}>
                  {statusInfo.label}
                </span>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', marginRight: '8px' }}>📍</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>{room.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', marginRight: '8px' }}>👥</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>Sức chứa: {room.capacity} người</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <p style={{ color: '#666', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>
                  {((room.description || '').length > 100) 
                    ? (room.description.substring(0, 100) + '...') 
                    : (room.description || '')}
                </p>
              </div>
              
              {(room.selectedDevices || []).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '6px' }}>
                    🔧 Thiết bị ({room.selectedDevices.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(room.selectedDevices || []).slice(0, 3).map(deviceId => (
                      <span key={deviceId} style={{
                        padding: '2px 8px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#495057'
                      }}>
                        {getDeviceName(deviceId)}
                      </span>
                    ))}
                    {room.selectedDevices.length > 3 && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        +{room.selectedDevices.length - 3} thiết bị khác
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  onClick={() => handleEdit(room)}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleDelete(room.id)}
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
              </div>
            </div>
          );
        })}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '20px',
          marginTop: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? '#f8f9fa' : 'white',
              color: currentPage === 1 ? '#6c757d' : '#495057',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            ← Trước
          </button>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              const isCurrentPage = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: isCurrentPage ? '#007bff' : 'white',
                    color: isCurrentPage ? 'white' : '#495057',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isCurrentPage ? '600' : 'normal'
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: currentPage === totalPages ? '#f8f9fa' : 'white',
              color: currentPage === totalPages ? '#6c757d' : '#495057',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Tiếp →
          </button>
          
          <div style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
            Trang {currentPage} / {totalPages} • Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRooms.length)} / {filteredRooms.length}
          </div>
        </div>
      )}

      {/* Room Forms */}
      <RoomForms
        showAddForm={showAddForm}
        showEditForm={showEditForm}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        devices={devices}
        roomStatuses={roomStatuses}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onCancel={resetForm}
      />
    </div>
  );
};

export default RoomManagement;
