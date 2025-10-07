import React from 'react';

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
  // Handle device selection
  const handleDeviceToggle = (deviceId) => {
    const currentDevices = formData.selectedDevices || [];
    if (currentDevices.includes(deviceId)) {
      setFormData({
        ...formData,
        selectedDevices: currentDevices.filter(id => id !== deviceId)
      });
    } else {
      setFormData({
        ...formData,
        selectedDevices: [...currentDevices, deviceId]
      });
    }
  };

  const FormModal = ({ title, onSubmit, buttonText, buttonColor, isAddForm = false }) => (
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
              type="number"
              min={1}
              max={1000}
              step={1}
              value={formData.capacity ?? ''}
              onChange={(e) => {
                // Use number input to make typing and IME/paste smoother. Keep as string when empty.
                const val = e.target.value;
                // Allow empty string, or a numeric string (we'll validate on submit)
                if (val === '') {
                  setFormData({...formData, capacity: ''});
                } else {
                  // Prevent non-numeric leading characters but allow user to type normally
                  const numeric = val.replace(/[^0-9]/g, '');
                  setFormData({...formData, capacity: numeric});
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
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: '#2c3e50' }}>
            Thiết bị trong phòng <span style={{ color: '#999', fontSize: '12px', fontWeight: 'normal' }}>(Tính năng sắp có)</span>
          </label>
          <div style={{ 
            border: '2px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px', 
            maxHeight: '200px', 
            overflow: 'auto',
            backgroundColor: '#f8f9fa'
          }}>
            {devices.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Không có thiết bị nào có sẵn
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                {devices.map(device => (
                  <label key={device.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px', 
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                    e.currentTarget.style.borderColor = '#2196f3';
                  }}
                  onMouseLeave={(e) => {
                    const isChecked = (formData.selectedDevices || []).includes(device.id);
                    e.currentTarget.style.backgroundColor = isChecked ? '#e3f2fd' : 'white';
                    e.currentTarget.style.borderColor = isChecked ? '#2196f3' : '#dee2e6';
                  }}>
                    <input
                      type="checkbox"
                      checked={(formData.selectedDevices || []).includes(device.id)}
                      onChange={() => handleDeviceToggle(device.id)}
                      style={{ marginRight: '8px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', color: '#2c3e50' }}>
                        {device.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {device.deviceTypeName} • SL: {device.quantity}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            Đã chọn: {(formData.selectedDevices || []).length} thiết bị
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
        />
      )}
    </>
  );
};

export default RoomForms;