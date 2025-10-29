import React, { useState, useEffect } from 'react';
import './DeviceSelectorModal.css';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';

const DeviceSelectorModal = ({ isOpen, onClose, devices, selectedDevices, onConfirm }) => {
  const [tempSelectedDevices, setTempSelectedDevices] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState({});
  
  // ✅ Get real-time inventory
  const { inventory } = useDeviceInventory();

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

  // ✅ Map backend enum to Vietnamese display names
  const normalizeDeviceType = (type) => {
    if (!type) return 'Khác';
    
    const typeUpper = type.toUpperCase();
    // Backend enum values: MIC, CAM, LAPTOP, BANG, MAN_HINH, MAY_CHIEU, KHAC
    const mapping = {
      'MIC': 'Micro',
      'MICRO': 'Micro',
      'CAM': 'Camera',
      'CAMERA': 'Camera',
      'LAPTOP': 'Laptop',
      'BANG': 'Bảng điện tử',
      'MAN_HINH': 'Màn hình',
      'MAY_CHIEU': 'Máy chiếu',
      'KHAC': 'Khác',
      // Legacy mappings
      'PROJECTOR': 'Máy chiếu',
      'WHITEBOARD': 'Bảng điện tử',
      'SCREEN': 'Màn hình',
      'MONITOR': 'Màn hình'
    };
    
    return mapping[typeUpper] || type;
  };

  // Nhóm thiết bị theo loại
  const groupDevicesByType = (deviceList) => {
    // Log để debug (chỉ log sample, không log từng device)
    if (deviceList.length > 0) {
      const sampleDevice = deviceList[0];
      const rawType = sampleDevice?.deviceType || sampleDevice?.deviceTypeName || 'Unknown';
      console.log('📦 Grouping', deviceList.length, 'devices');
      console.log('📦 Sample mapping:', rawType, '→', normalizeDeviceType(rawType));
    }
    
    const grouped = deviceList.reduce((acc, device) => {
      const rawType = device.deviceType || device.deviceTypeName || 'Khác';
      const normalizedType = normalizeDeviceType(rawType);
      
      if (!acc[normalizedType]) {
        acc[normalizedType] = [];
      }
      acc[normalizedType].push(device);
      return acc;
    }, {});
    
    console.log('📦 Result groups:', Object.keys(grouped));
    return grouped;
  };

  const devicesByType = groupDevicesByType(devices);
  
  // Log grouped result
  if (isOpen && Object.keys(devicesByType).length > 0) {
    console.log('📦 Devices grouped by type:', Object.keys(devicesByType), devicesByType);
  }

  // Toggle accordion
  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Xử lý thay đổi số lượng thiết bị - WITH REAL-TIME CHECK
  const handleQuantityChange = (deviceId, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    
    if (newQuantity === 0) {
      // Xóa thiết bị khỏi danh sách đã chọn
      setTempSelectedDevices(prev => prev.filter(d => d.deviceId !== deviceId));
    } else {
      // Tìm thiết bị trong danh sách
      const device = devices.find(d => d.deviceId === deviceId);
      if (!device) return;

      // ✅ CHECK AVAILABILITY from real-time inventory
      const deviceInfo = inventory[deviceId];
      const available = deviceInfo?.available ?? device.quantity ?? 0;
      
      // ✅ KHÔNG CHO MƯỢN NẾU HẾT HÀNG
      if (available === 0) {
        alert(`🚫 HẾT HÀNG!\n\nThiết bị: ${device.deviceName || device.name}\nHiện tại: 0 có sẵn`);
        return;
      }
      
      // ✅ KHÔNG CHO MƯỢN QUÁ SỐ LƯỢNG CÓ SẴN
      if (newQuantity > available) {
        alert(`❌ Không đủ thiết bị!\n\nThiết bị: ${device.deviceName || device.name}\nYêu cầu: ${newQuantity}\nCòn lại: ${available}\n\n💡 Vui lòng chọn tối đa ${available}`);
        return;
      }

      const finalQuantity = newQuantity;

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

  // Icon cho từng loại thiết bị (Vietnamese normalized names)
  const getDeviceIcon = (type) => {
    const icons = {
      'Micro': '🎤',
      'Camera': '📷',
      'Laptop': '💻',
      'Bảng điện tử': '📋',
      'Máy chiếu': '📽️',
      'Màn hình': '🖥️',
      'Loa': '🔊',
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
                      <span className="device-type-name" style={{ display: 'inline-block', minWidth: '100px' }}>
                        {type}
                      </span>
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
                        
                        // ✅ GET AVAILABILITY FROM INVENTORY
                        const deviceInfo = inventory[device.deviceId];
                        const available = deviceInfo?.available ?? device.quantity ?? 0;
                        const total = deviceInfo?.total ?? device.quantity ?? 0;
                        const isOutOfStock = available === 0;
                        
                        const isSelected = selectedQty > 0;

                        // ✅ Backend returns 'name' field (tên từ database)
                        const deviceDisplayName = device.name || device.deviceName || 'Thiết bị';
                        if (!device.name) {
                          console.warn('⚠️ Device missing name from backend:', device);
                        }
                        
                        return (
                          <div 
                            key={device.deviceId} 
                            className={`device-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'unavailable' : ''}`}
                            onClick={(e) => {
                              // Click vào card (ngoài buttons) để toggle +1
                              if (e.target.closest('.quantity-btn') || e.target.closest('.quantity-input')) {
                                return; // Ignore if clicking on quantity controls
                              }
                              if (!isOutOfStock) {
                                if (isSelected) {
                                  // Nếu đã chọn, tăng thêm 1
                                  if (selectedQty < available) {
                                    handleQuantityChange(device.deviceId, selectedQty + 1);
                                  }
                                } else {
                                  // Chưa chọn, chọn 1
                                  handleQuantityChange(device.deviceId, 1);
                                }
                              }
                            }}
                            title={isOutOfStock ? 'Hết hàng' : (isSelected ? 'Click để thêm số lượng' : 'Click để chọn')}
                          >
                            <div className="device-card-header">
                              <div className="device-card-name" style={{ 
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#2c3e50',
                                display: 'block',
                                minHeight: '20px'
                              }}>
                                {deviceDisplayName}
                                {isOutOfStock && <span style={{ marginLeft: '8px', color: '#ef4444', fontWeight: 'bold' }}>❌ Hết</span>}
                              </div>
                              <div className="device-card-available" style={{ color: isOutOfStock ? '#ef4444' : '#10b981' }}>
                                {isOutOfStock ? (
                                  <strong>Hết hàng</strong>
                                ) : (
                                  <>Còn: <strong>{available}/{total}</strong></>
                                )}
                              </div>
                            </div>

                            {device.description && (
                              <div className="device-card-description">
                                {device.description}
                              </div>
                            )}

                            {/* Quantity Controls - Always show */}
                            <div className="device-card-footer">
                              {!isOutOfStock ? (
                                <>
                                  <div className="device-card-quantity">
                                    <button
                                      type="button"
                                      className="quantity-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(device.deviceId, selectedQty - 1);
                                      }}
                                      disabled={selectedQty === 0}
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
                                      max={available}
                                      placeholder="0"
                                    />
                                    <button
                                      type="button"
                                      className="quantity-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(device.deviceId, selectedQty + 1);
                                      }}
                                      disabled={selectedQty >= available}
                                    >
                                      +
                                    </button>
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="device-card-selected-badge">
                                      ✓ Đã chọn {selectedQty}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="out-of-stock-message">
                                  🚫 Tạm hết hàng
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
