import React, { useState, useEffect } from 'react';
import './DeviceSelector.css';

const DeviceSelector = ({ devices, selectedDevices, onDeviceChange }) => {
  const [expandedTypes, setExpandedTypes] = useState({});
  
  // Nhóm thiết bị theo loại
  const devicesByType = devices.reduce((acc, device) => {
    const type = device.deviceType || 'Khác';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(device);
    return acc;
  }, {});

  // Toggle accordion
  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Mở tất cả accordion khi có thiết bị
  useEffect(() => {
    if (Object.keys(devicesByType).length > 0) {
      const allExpanded = {};
      Object.keys(devicesByType).forEach(type => {
        allExpanded[type] = true;
      });
      setExpandedTypes(allExpanded);
    }
  }, [devices]);

  // Xử lý thay đổi số lượng thiết bị
  const handleQuantityChange = (deviceId, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    
    if (newQuantity === 0) {
      // Xóa thiết bị khỏi danh sách đã chọn
      const newSelected = selectedDevices.filter(d => d.deviceId !== deviceId);
      onDeviceChange(newSelected);
    } else {
      // Tìm thiết bị trong danh sách
      const device = devices.find(d => d.deviceId === deviceId);
      if (!device) return;

      // Kiểm tra số lượng tối đa
      const maxQuantity = device.quantity || 0;
      const finalQuantity = Math.min(newQuantity, maxQuantity);

      // Cập nhật hoặc thêm thiết bị
      const existingIndex = selectedDevices.findIndex(d => d.deviceId === deviceId);
      let newSelected;
      
      if (existingIndex >= 0) {
        newSelected = [...selectedDevices];
        newSelected[existingIndex] = { ...newSelected[existingIndex], quantity: finalQuantity };
      } else {
        newSelected = [...selectedDevices, { deviceId, quantity: finalQuantity, deviceName: device.name || device.deviceName }];
      }
      
      onDeviceChange(newSelected);
    }
  };

  // Lấy số lượng đã chọn của thiết bị
  const getSelectedQuantity = (deviceId) => {
    const selected = selectedDevices.find(d => d.deviceId === deviceId);
    return selected ? selected.quantity : 0;
  };

  // Icon cho từng loại thiết bị
  const getDeviceIcon = (type) => {
    const icons = {
      'Projector': '📽️',
      'Screen': '🖥️',
      'Microphone': '🎤',
      'Speaker': '🔊',
      'Whiteboard': '📋',
      'Camera': '📷',
      'Laptop': '💻',
      'Tablet': '📱',
      'Phone': '☎️',
      'TV': '📺',
      'Monitor': '🖥️',
      'Keyboard': '⌨️',
      'Mouse': '🖱️',
      'Printer': '🖨️',
      'Scanner': '📠',
      'Router': '📡',
      'Switch': '🔌',
      'Cable': '🔌',
      'Adapter': '🔌',
      'Khác': '📦'
    };
    return icons[type] || '📦';
  };

  if (devices.length === 0) {
    return (
      <div className="device-selector-empty">
        <p>Không có thiết bị nào khả dụng</p>
      </div>
    );
  }

  return (
    <div className="device-selector">
      <div className="device-selector-header">
        <span className="device-selector-icon">💻</span>
        <span className="device-selector-title">Chọn thiết bị</span>
        {selectedDevices.length > 0 && (
          <span className="device-selector-badge">{selectedDevices.length}</span>
        )}
      </div>

      <div className="device-types-accordion">
        {Object.entries(devicesByType).map(([type, typeDevices]) => (
          <div key={type} className="device-type-section">
            <div 
              className={`device-type-header ${expandedTypes[type] ? 'expanded' : ''}`}
              onClick={() => toggleType(type)}
            >
              <div className="device-type-header-left">
                <span className="device-type-icon">{getDeviceIcon(type)}</span>
                <span className="device-type-name">{type}</span>
                <span className="device-type-count">({typeDevices.length})</span>
              </div>
              <span className="device-type-arrow">
                {expandedTypes[type] ? '▼' : '▶'}
              </span>
            </div>

            {expandedTypes[type] && (
              <div className="device-cards-container">
                {typeDevices.map(device => {
                  const selectedQty = getSelectedQuantity(device.deviceId);
                  const maxQty = device.quantity || 0;
                  const isSelected = selectedQty > 0;

                  return (
                    <div 
                      key={device.deviceId} 
                      className={`device-card ${isSelected ? 'selected' : ''} ${maxQty === 0 ? 'unavailable' : ''}`}
                    >
                      <div className="device-card-header">
                        <div className="device-card-name">
                          {device.name || device.deviceName}
                        </div>
                        <div className="device-card-available">
                          Còn: <strong>{maxQty}</strong>
                        </div>
                      </div>

                      {device.description && (
                        <div className="device-card-description">
                          {device.description}
                        </div>
                      )}

                      <div className="device-card-footer">
                        <div className="device-card-quantity">
                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(device.deviceId, selectedQty - 1)}
                            disabled={selectedQty === 0 || maxQty === 0}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="quantity-input"
                            value={selectedQty}
                            onChange={(e) => handleQuantityChange(device.deviceId, e.target.value)}
                            min="0"
                            max={maxQty}
                            disabled={maxQty === 0}
                          />
                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(device.deviceId, selectedQty + 1)}
                            disabled={selectedQty >= maxQty || maxQty === 0}
                          >
                            +
                          </button>
                        </div>
                        
                        {isSelected && (
                          <div className="device-card-selected-badge">
                            ✓ Đã chọn
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDevices.length > 0 && (
        <div className="device-selector-summary">
          <div className="summary-title">Thiết bị đã chọn:</div>
          <div className="summary-items">
            {selectedDevices.map(selected => (
              <div key={selected.deviceId} className="summary-item">
                <span className="summary-item-name">{selected.deviceName}</span>
                <span className="summary-item-quantity">x{selected.quantity}</span>
                <button
                  type="button"
                  className="summary-item-remove"
                  onClick={() => handleQuantityChange(selected.deviceId, 0)}
                  title="Xóa"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;
