import React from 'react';

// Add custom scrollbar styles
const scrollbarStyles = `
  .device-scroll-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .device-scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .device-scroll-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  
  .device-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

// Move the modal component to module scope so React doesn't treat it as a new
// component on every render of RoomForms (that causes unmount/remount and
// makes inputs lose focus / break IME typing). Keep the same props/behavior.
const FormModal = ({
  title,
  onSubmit,
  buttonText,
  buttonColor,
  isAddForm = false,
  formData,
  setFormData,
  formErrors,
  devices,
  roomStatuses,
  handleDeviceToggle,
  handleQuantityChange,
  onCancel,
  deviceTypeFilter,
  setDeviceTypeFilter,
  getDeviceTypes
}) => (
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
    {/* Inject scrollbar styles */}
    <style>{scrollbarStyles}</style>
    
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '30px', 
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px' }}>
        {title}
      </h3>
      
      {/* Basic Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
            Tên phòng *
          </label>
          <input
            type="text"
            maxLength={100}
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
            placeholder="VD: Phòng họp A1"
          />
          {formErrors.name && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {formErrors.name}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {(formData.name || '').length}/100 ký tự
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
            Sức chứa *
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.capacity ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              // Only allow positive integers (1-1000)
              if (val === '' || (/^[1-9]\d*$/.test(val) && parseInt(val) <= 1000)) {
                setFormData({ ...formData, capacity: val });
              }
            }}
            onKeyDown={(e) => {
              // Prevent: e, E, +, -, .
              if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              // Prevent pasting non-numeric content
              const pasteData = e.clipboardData.getData('text');
              if (!/^[1-9]\d*$/.test(pasteData) || parseInt(pasteData) > 1000) {
                e.preventDefault();
              }
            }}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: `2px solid ${formErrors.capacity ? '#dc3545' : '#e9ecef'}`, 
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            placeholder="VD: 12"
          />
          {formErrors.capacity && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {formErrors.capacity}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
          Vị trí *
        </label>
        <input
          type="text"
          maxLength={200}
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: `2px solid ${formErrors.location ? '#dc3545' : '#e9ecef'}`, 
            borderRadius: '8px',
            fontSize: '16px',
            boxSizing: 'border-box',
            outline: 'none'
          }}
          placeholder="VD: Tầng 1, Tòa nhà A"
        />
        {formErrors.location && (
          <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
            {formErrors.location}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {(formData.location || '').length}/200 ký tự
        </div>
      </div>

      {/* Status */}
      {!isAddForm && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
            Trạng thái phòng
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #e9ecef', 
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          >
            {roomStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      )}
      
      {isAddForm && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
            Trạng thái phòng
          </label>
          <div style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: '#f8f9fa',
            color: '#666'
          }}>
            Phòng trống (mặc định)
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Trạng thái sẽ được thiết lập là "Phòng trống" khi tạo mới
          </div>
        </div>
      )}

      {/* Device Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2c3e50', fontSize: '16px' }}>
          Thiết bị trong phòng
        </label>
        
        {/* Device Type Filter */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={deviceTypeFilter}
              onChange={(e) => setDeviceTypeFilter(e.target.value)}
              style={{
                flex: 1,
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
              <option value="">Tất cả thiết bị ({devices.length})</option>
              {getDeviceTypes().map(type => {
                const count = devices.filter(d => d.deviceTypeName === type).length;
                return (
                  <option key={type} value={type}>
                    {type} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          {devices.length === 0 && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px 12px', 
              backgroundColor: '#fff3cd', 
              color: '#856404',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              ⚠️ Không có thiết bị nào được load. Vui lòng kiểm tra dữ liệu.
            </div>
          )}
        </div>

        <div style={{ 
          border: '2px solid #e9ecef', 
          borderRadius: '12px', 
          padding: '20px', 
          backgroundColor: '#ffffff',
          maxHeight: '450px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        className="device-scroll-container"
        >
          {(() => {
            // SHOW ALL DEVICES - Don't filter by quantity, just show everything
            let availableDevices = [...devices];

            // Apply device type filter (case-insensitive)
            if (deviceTypeFilter) {
              availableDevices = availableDevices.filter(device => {
                const deviceType = (device.deviceTypeName || '').toLowerCase().trim();
                const filterType = deviceTypeFilter.toLowerCase().trim();
                return deviceType === filterType;
              });
            }
            
            // Debug log
            console.log('Total devices:', devices.length);
            console.log('All device types:', devices.map(d => d.deviceTypeName));
            console.log('Available devices after filter:', availableDevices.length);
            console.log('Device type filter:', deviceTypeFilter);
            console.log('Filtered devices:', availableDevices.map(d => ({ name: d.name, type: d.deviceTypeName })));
            
            if (availableDevices.length === 0) {
              return (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px', fontSize: '15px' }}>
                  {deviceTypeFilter 
                    ? `Không có thiết bị loại "${deviceTypeFilter}"`
                    : 'Không có thiết bị nào trong hệ thống'}
                </div>
              );
            }
            
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {availableDevices.map((device, idx) => {
                  const isSelected = (formData.selectedDevices || []).includes(device?.id);
                  const currentQuantity = (formData.deviceQuantities || {})[device?.id] || 1;
                  const maxQuantity = device?.quantity || 0;
                
                  const isOutOfStock = maxQuantity === 0;
                  const canSelect = maxQuantity > 0 || isSelected;
                
                return (
                  <div 
                    key={device?.id ?? `device-${idx}`} 
                    style={{
                      padding: '16px',
                      backgroundColor: isSelected ? '#f0f7ff' : (isOutOfStock ? '#f5f5f5' : '#fafafa'),
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? '#4a90e2' : (isOutOfStock ? '#ddd' : '#e0e0e0')}`,
                      transition: 'all 0.2s ease',
                      cursor: canSelect ? 'pointer' : 'not-allowed',
                      position: 'relative',
                      opacity: isOutOfStock && !isSelected ? 0.6 : 1
                    }}
                    onClick={(e) => {
                      if (e.target.tagName !== 'INPUT' && canSelect) {
                        handleDeviceToggle(device?.id);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!canSelect}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (canSelect) {
                            handleDeviceToggle(device?.id);
                          }
                        }}
                        style={{ 
                          marginTop: '3px',
                          width: '18px',
                          height: '18px',
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          accentColor: '#4a90e2'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '15px', 
                          color: isOutOfStock ? '#999' : '#2c3e50',
                          marginBottom: '4px'
                        }}>
                          {device?.name ?? 'Unknown'}
                          {isOutOfStock && !isSelected && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '11px', 
                              color: '#dc3545',
                              fontWeight: '600',
                              backgroundColor: '#fee',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              HẾT HÀNG
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: isSelected ? '#4a90e2' : (isOutOfStock ? '#999' : '#666'),
                          fontWeight: '500'
                        }}>
                          {(device?.deviceTypeName ?? '')} • Còn lại: {maxQuantity}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '30px', marginTop: '8px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label 
                          style={{ fontSize: '13px', color: '#495057', fontWeight: '500', minWidth: '70px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Số lượng:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={currentQuantity}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(device?.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          style={{
                            width: '80px',
                            padding: '6px 10px',
                            border: '2px solid #4a90e2',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            fontWeight: '500'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>/ {maxQuantity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          display: 'inline-block'
        }}>
          Đã chọn: <strong style={{ color: '#2c3e50' }}>{(formData.selectedDevices || []).length}</strong> thiết bị
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
          Mô tả *
        </label>
        <textarea
          maxLength={500}
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
          placeholder="Mô tả chi tiết về phòng này..."
        />
        {formErrors.description && (
          <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
            {formErrors.description}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {(formData.description || '').length}/500 ký tự
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={onCancel}
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
          onClick={onSubmit}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: buttonColor, 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  </div>
);

const RoomForms = ({ 
  showAddForm, 
  showEditForm, 
  formData, 
  setFormData, 
  formErrors, 
  devices, 
  roomStatuses, 
  onAdd, 
  onUpdate, 
  onCancel 
}) => {
  const [deviceTypeFilter, setDeviceTypeFilter] = React.useState('');

  // Handle device selection with quantity
  const handleDeviceToggle = (deviceId) => {
    const currentDevices = formData.selectedDevices || [];
    const currentQuantities = formData.deviceQuantities || {};
    
    if (currentDevices.includes(deviceId)) {
      // Remove device
      const newQuantities = { ...currentQuantities };
      delete newQuantities[deviceId];
      setFormData({
        ...formData,
        selectedDevices: currentDevices.filter(id => id !== deviceId),
        deviceQuantities: newQuantities
      });
    } else {
      // Add device with default quantity 1
      setFormData({
        ...formData,
        selectedDevices: [...currentDevices, deviceId],
        deviceQuantities: { ...currentQuantities, [deviceId]: 1 }
      });
    }
  };
  
  // Handle quantity change for a device
  const handleQuantityChange = (deviceId, quantity) => {
    const currentQuantities = formData.deviceQuantities || {};
    const device = devices.find(d => d.id === deviceId);
    const maxQuantity = device ? device.quantity : 1000;
    
    // Validate quantity
    let validQuantity = parseInt(quantity) || 1;
    if (validQuantity < 1) validQuantity = 1;
    if (validQuantity > maxQuantity) validQuantity = maxQuantity;
    
    setFormData({
      ...formData,
      deviceQuantities: { ...currentQuantities, [deviceId]: validQuantity }
    });
  };

  // Get unique device types from devices
  const getDeviceTypes = () => {
    const types = new Set();
    devices.forEach(device => {
      if (device.deviceTypeName) {
        types.add(device.deviceTypeName);
      }
    });
    const uniqueTypes = Array.from(types).sort();
    console.log('Unique device types for dropdown:', uniqueTypes);
    console.log('Total devices in RoomForms:', devices.length);
    return uniqueTypes;
  };

  // ...existing code...

  return (
    <>
      {/* Add Form Modal */}
      {showAddForm && (
        <FormModal
          title="Thêm Phòng Mới"
          onSubmit={onAdd}
          buttonText="Thêm"
          buttonColor="#28a745"
          isAddForm={true}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          devices={devices}
          roomStatuses={roomStatuses}
          handleDeviceToggle={handleDeviceToggle}
          handleQuantityChange={handleQuantityChange}
          onCancel={onCancel}
          deviceTypeFilter={deviceTypeFilter}
          setDeviceTypeFilter={setDeviceTypeFilter}
          getDeviceTypes={getDeviceTypes}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <FormModal
          title="Chỉnh sửa Phòng"
          onSubmit={onUpdate}
          buttonText="Cập nhật"
          buttonColor="#007bff"
          isAddForm={false}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          devices={devices}
          roomStatuses={roomStatuses}
          handleDeviceToggle={handleDeviceToggle}
          handleQuantityChange={handleQuantityChange}
          onCancel={onCancel}
          deviceTypeFilter={deviceTypeFilter}
          setDeviceTypeFilter={setDeviceTypeFilter}
          getDeviceTypes={getDeviceTypes}
        />
      )}
    </>
  );
};

export default RoomForms;