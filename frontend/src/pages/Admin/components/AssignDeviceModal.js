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

const AssignDeviceModal = ({
  title,
  onSubmit,
  buttonText,
  buttonColor,
  formData,
  setFormData,
  devices,
  handleDeviceToggle,
  handleQuantityChange,
  onCancel,
  getDeviceTypes
}) => {
  const [expandedTypes, setExpandedTypes] = React.useState({});
  
  const toggleType = (typeName) => {
    setExpandedTypes(prev => ({
      ...prev,
      [typeName]: !prev[typeName]
    }));
  };

  return (
    <div 
      style={{ 
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
      }}
      onClick={onCancel}
    >
      <style>{scrollbarStyles}</style>
      
      <div 
        style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div style={{ marginBottom: '20px' }}>
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

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
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

export default AssignDeviceModal;
