import React from 'react';
import DeviceAccordion from './DeviceAccordion';

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

const RoomFormModal = ({
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
  onCancel
}) => {
  const [expandedTypes, setExpandedTypes] = React.useState({});
  
  const toggleType = (typeName) => {
    setExpandedTypes(prev => ({
      ...prev,
      [typeName]: !prev[typeName]
    }));
  };

  return (
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
    <style>{scrollbarStyles}</style>
    
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '30px', 
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative'
    }}>
      <button
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '28px',
          color: '#999',
          cursor: 'pointer',
          padding: '0',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'all 0.2s ease',
          zIndex: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
          e.currentTarget.style.color = '#333';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#999';
        }}
        title="Đóng"
      >
        ×
      </button>
      <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px', paddingRight: '40px' }}>
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
              if (val === '' || (/^[1-9]\d*$/.test(val) && parseInt(val) <= 1000)) {
                setFormData({ ...formData, capacity: val });
              }
            }}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
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

      {/* Device Selection - Only show in Add Form */}
      {isAddForm && (
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#2c3e50', fontSize: '16px' }}>
          Thiết bị trong phòng
        </label>
        
        {devices.length === 0 && (
          <div style={{ 
            marginTop: '8px', 
            padding: '12px 16px', 
            backgroundColor: '#fff3cd', 
            color: '#856404',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            ⚠️ Không có thiết bị nào được load. Vui lòng kiểm tra dữ liệu.
          </div>
        )}

        <div style={{ 
          border: '2px solid #e9ecef', 
          borderRadius: '12px', 
          backgroundColor: '#ffffff',
          maxHeight: '500px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        className="device-scroll-container"
        >
          {(() => {
            const devicesByType = {};
            devices.forEach(device => {
              const typeName = device.deviceTypeName || 'Khác';
              if (!devicesByType[typeName]) {
                devicesByType[typeName] = [];
              }
              devicesByType[typeName].push(device);
            });

            const deviceTypes = Object.keys(devicesByType).sort();
            
            if (deviceTypes.length === 0) {
              return (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px', fontSize: '15px' }}>
                  Không có thiết bị nào trong hệ thống
                </div>
              );
            }
            
            return deviceTypes.map(typeName => {
              const typeDevices = devicesByType[typeName];
              const isExpanded = expandedTypes[typeName];
              
              return (
                <DeviceAccordion
                  key={typeName}
                  typeName={typeName}
                  typeDevices={typeDevices}
                  isExpanded={isExpanded}
                  onToggle={() => toggleType(typeName)}
                  formData={formData}
                  handleDeviceToggle={handleDeviceToggle}
                  handleQuantityChange={handleQuantityChange}
                />
              );
            });
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
      )}

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
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
};

export default RoomFormModal;
