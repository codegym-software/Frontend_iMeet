import React from 'react';

const DeviceFormModal = ({ 
  isEdit, 
  formData, 
  setFormData, 
  formErrors, 
  deviceTypes, 
  onSubmit, 
  onCancel,
  actionLoading 
}) => {
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
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        width: '600px',
        maxWidth: '90vw',
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
          title="Đóng"
        >
          ×
        </button>
        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px', paddingRight: '40px' }}>
          {isEdit ? 'Chỉnh sửa Thiết bị' : 'Thêm Thiết bị Mới'}
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
              placeholder={isEdit ? '' : 'VD: MacBook Pro 2023'}
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
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^[1-9]\d*$/.test(value)) {
                setFormData({...formData, quantity: value});
              }
            }}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              const pasteData = e.clipboardData.getData('text');
              if (!/^[1-9]\d*$/.test(pasteData)) {
                e.preventDefault();
              }
            }}
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
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              boxSizing: 'border-box',
              outline: 'none'
            }}
            placeholder={isEdit ? '' : 'Mô tả chi tiết về thiết bị này...'}
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
              backgroundColor: isEdit ? '#007bff' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: (isEdit ? actionLoading.update : actionLoading.add) ? 'wait' : 'pointer',
              fontSize: '16px'
            }}
            disabled={isEdit ? actionLoading.update : actionLoading.add}
          >
            {isEdit 
              ? (actionLoading.update ? 'Đang cập nhật...' : 'Cập nhật')
              : (actionLoading.add ? 'Đang thêm...' : 'Thêm')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceFormModal;
