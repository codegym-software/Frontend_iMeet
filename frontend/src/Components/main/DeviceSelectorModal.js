import React, { useState, useEffect } from 'react';
import './DeviceSelectorModal.css';

const DeviceSelectorModal = ({ isOpen, onClose, devices, selectedDevices, onConfirm }) => {
  const [tempSelectedDevices, setTempSelectedDevices] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState({});

  // Khởi tạo tempSelectedDevices khi modal mở
  useEffect(() => {
    if (isOpen) {
      setTempSelectedDevices([...selectedDevices]);
      
      // Mở tất cả accordion
      const devicesByType = groupDevicesByType(devices);
      const allExpanded = {};
      Object.keys(devicesByType).forEach(type => {
        allExpanded[type] = true;
      });
      setExpandedTypes(allExpanded);
    }
  }, [isOpen, selectedDevices, devices]);

  // Nhóm thiết bị theo loại
  const groupDevicesByType = (deviceList) => {
    return deviceList.reduce((acc, device) => {
      const type = device.deviceType || 'Khác';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(device);
      return acc;
    }, {});
  };

  const devicesByType = groupDevicesByType(devices);

  // Toggle accordion
  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Xử lý thay đổi số lượng thiết bị
  const handleQuantityChange = (deviceId, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    
    if (newQuantity === 0) {
      // Xóa thiết bị khỏi danh sách đã chọn
      setTempSelectedDevices(prev => prev.filter(d => d.deviceId !== deviceId));
    } else {
      // Tìm thiết bị trong danh sách
      const device = devices.find(d => d.deviceId === deviceId);
      if (!device) return;

      // Kiểm tra số lượng tối đa
      const maxQuantity = device.quantity || 0;
      const finalQuantity = Math.min(newQuantity, maxQuantity);

      // Cập nhật hoặc thêm thiết bị
      const existingIndex = tempSelectedDevices.findIndex(d => d.deviceId === deviceId);
      
      if (existingIndex >= 0) {
        const newSelected = [...tempSelectedDevices];
        newSelected[existingIndex] = { 
          ...newSelected[existingIndex], 
          quantity: finalQuantity 
        };
        setTempSelectedDevices(newSelected);
      } else {
        setTempSelectedDevices(prev => [
          ...prev, 
          { 
            deviceId, 
            quantity: finalQuantity, 
            deviceName: device.name || device.deviceName 
          }
        ]);
      }
    }
  };

  // Lấy số lượng đã chọn của thiết bị
  const getSelectedQuantity = (deviceId) => {
    const selected = tempSelectedDevices.find(d => d.deviceId === deviceId);
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

  const handleConfirm = () => {
    onConfirm(tempSelectedDevices);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedDevices([...selectedDevices]); // Reset về giá trị ban đầu
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="device-modal-overlay" onClick={handleCancel}>
      <div className="device-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="device-modal-header">
          <div className="device-modal-title">
            <span className="device-modal-icon">💻</span>
            <span>Chọn thiết bị</span>
          </div>
          <button className="device-modal-close" onClick={handleCancel}>×</button>
        </div>

        <div className="device-modal-body">
          {devices.length === 0 ? (
            <div className="device-modal-empty">
              <p>Không có thiết bị nào khả dụng</p>
            </div>
          ) : (
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
                            onClick={() => {
                              // Click vào card để chọn số lượng 1 nếu chưa chọn
                              if (!isSelected && maxQty > 0) {
                                handleQuantityChange(device.deviceId, 1);
                              }
                            }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(device.deviceId, selectedQty - 1);
                                  }}
                                  disabled={selectedQty === 0 || maxQty === 0}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  className="quantity-input"
                                  value={selectedQty}
                                  onChange={(e) => handleQuantityChange(device.deviceId, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  min="0"
                                  max={maxQty}
                                  disabled={maxQty === 0}
                                />
                                <button
                                  type="button"
                                  className="quantity-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(device.deviceId, selectedQty + 1);
                                  }}
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
          )}

          {tempSelectedDevices.length > 0 && (
            <div className="device-modal-summary">
              <div className="summary-title">Thiết bị đã chọn ({tempSelectedDevices.length}):</div>
              <div className="summary-items">
                {tempSelectedDevices.map(selected => (
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

        <div className="device-modal-footer">
          <button type="button" className="device-modal-btn-cancel" onClick={handleCancel}>
            Hủy
          </button>
          <button type="button" className="device-modal-btn-confirm" onClick={handleConfirm}>
            Xác nhận ({tempSelectedDevices.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelectorModal;
