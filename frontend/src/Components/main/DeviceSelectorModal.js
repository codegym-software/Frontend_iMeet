import React, { useState, useEffect } from 'react';
import './DeviceSelectorModal.css';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';
import adminService from '../../services/adminService';

const DeviceSelectorModal = ({ isOpen, onClose, devices, selectedDevices, onConfirm }) => {
  const [tempSelectedDevices, setTempSelectedDevices] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' or device type name
  const [fallbackDevices, setFallbackDevices] = useState([]); // Fallback if devices is empty
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State for filter dropdown
  
  // ✅ Get real-time inventory
  const { inventory } = useDeviceInventory();

  // ✅ Load fallback devices if none provided
  useEffect(() => {
    if (isOpen && (!devices || devices.length === 0)) {
      console.warn('⚠️ DeviceSelectorModal: devices prop is empty, fetching fallback...');
      
      const loadFallbackDevices = async () => {
        try {
          setLoadingFallback(true);
          console.log('📥 Calling adminService.getDevices() for fallback...');
          const devicesData = await adminService.getDevices();
          console.log('📥 Fallback response:', devicesData);
          
          // Handle both array and object responses
          let devicesList = [];
          if (Array.isArray(devicesData)) {
            devicesList = devicesData;
          } else if (devicesData?.data && Array.isArray(devicesData.data)) {
            devicesList = devicesData.data;
          }
          
          console.log('✅ Fallback devices loaded:', devicesList.length, devicesList);
          setFallbackDevices(devicesList);
        } catch (error) {
          console.error('❌ Failed to load fallback devices:', error);
          setFallbackDevices([]);
        } finally {
          setLoadingFallback(false);
        }
      };
      
      loadFallbackDevices();
    } else {
      setFallbackDevices([]);
    }
  }, [isOpen, devices]);

  // ✅ Use fallback devices if provided devices is empty
  const displayDevices = (devices && devices.length > 0) ? devices : fallbackDevices;
  
  // Khởi tạo tempSelectedDevices khi modal mở
  useEffect(() => {
    if (isOpen) {
      setTempSelectedDevices([...selectedDevices]);
      
      // Mở tất cả accordion
      const devicesByType = groupDevicesByType(displayDevices);
      const allExpanded = {};
      Object.keys(devicesByType).forEach(type => {
        allExpanded[type] = true;
      });
      setExpandedTypes(allExpanded);
      
      // Reset search and filter
      setSearchQuery('');
      setFilterType('all');
      setIsFilterOpen(false);
    }
  }, [isOpen, selectedDevices, displayDevices]);

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

  // Get all device types for filter
  const getAllDeviceTypes = () => {
    const types = new Set();
    devices.forEach(device => {
      const rawType = device.deviceType || device.deviceTypeName || 'Khác';
      const normalizedType = normalizeDeviceType(rawType);
      types.add(normalizedType);
    });
    return Array.from(types).sort();
  };

  // Filter devices based on search and filter
  const filterDevices = (deviceList) => {
    let filtered = deviceList;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(device => {
        const name = (device.name || device.deviceName || '').toLowerCase();
        const description = (device.description || '').toLowerCase();
        const type = normalizeDeviceType(device.deviceType || device.deviceTypeName || '').toLowerCase();
        return name.includes(query) || description.includes(query) || type.includes(query);
      });
    }
    
    // Filter by device type
    if (filterType !== 'all') {
      filtered = filtered.filter(device => {
        const rawType = device.deviceType || device.deviceTypeName || 'Khác';
        const normalizedType = normalizeDeviceType(rawType);
        return normalizedType === filterType;
      });
    }
    
    return filtered;
  };

  // Get filtered devices - use displayDevices (which includes fallback)
  const filteredDevices = filterDevices(displayDevices);
  const devicesByType = groupDevicesByType(filteredDevices);
  
  // Log grouped result
  if (isOpen && Object.keys(devicesByType).length > 0) {
    console.log('📦 Devices grouped by type:', Object.keys(devicesByType), devicesByType);
  }

  // Reset function
  const handleReset = () => {
    setTempSelectedDevices([...selectedDevices]);
    setSearchQuery('');
    setFilterType('all');
    
    // Mở tất cả accordion
    const devicesByType = groupDevicesByType(devices);
    const allExpanded = {};
    Object.keys(devicesByType).forEach(type => {
      allExpanded[type] = true;
    });
    setExpandedTypes(allExpanded);
  };

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

        {/* Search and Filter Bar - Sticky at top, on same line */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '10px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="tìm kiếm"
              style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
            />
          </div>

          {/* Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: '1px solid #1a73e8',
                background: '#1a73e8',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {filterType === 'all' ? 'tất cả' : filterType}
              <span style={{ fontSize: '11px' }}>{isFilterOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown Menu */}
            {isFilterOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                minWidth: '150px',
                zIndex: 1000
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setIsFilterOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: filterType === 'all' ? '#e8f0fe' : 'transparent',
                    color: filterType === 'all' ? '#1a73e8' : '#202124',
                    fontSize: '13px',
                    fontWeight: filterType === 'all' ? '600' : '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    borderBottom: '1px solid #e0e0e0'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = filterType === 'all' ? '#e8f0fe' : 'transparent'}
                >
                  tất cả
                </button>

                {['Micro', 'Camera', 'Laptop', 'Màn hình', 'Máy chiếu', 'Khác'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFilterType(type);
                      setIsFilterOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: filterType === type ? '#e8f0fe' : 'transparent',
                      color: filterType === type ? '#1a73e8' : '#202124',
                      fontSize: '13px',
                      fontWeight: filterType === type ? '600' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      borderBottom: '1px solid #e0e0e0'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = filterType === type ? '#e8f0fe' : 'transparent'}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="device-modal-body">
          {displayDevices.length === 0 ? (
            <div className="device-modal-empty">
              {loadingFallback ? (
                <p>Đang tải thiết bị...</p>
              ) : (
                <>
                  <p>Không có thiết bị nào khả dụng</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: '#1a73e8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🔄 Tải lại trang
                  </button>
                </>
              )}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="device-modal-empty">
              <p>Không tìm thấy thiết bị nào phù hợp với bộ lọc</p>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Đặt lại bộ lọc
              </button>
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
                              // Click vào card để toggle chọn/bỏ chọn
                              if (e.target.closest('.quantity-btn') || e.target.closest('.quantity-input')) {
                                return; // Ignore if clicking on quantity controls
                              }
                              if (!isOutOfStock) {
                                if (isSelected) {
                                  // ✅ Nếu đã chọn → bỏ chọn (toggle OFF)
                                  handleQuantityChange(device.deviceId, 0);
                                } else {
                                  // ✅ Chưa chọn → chọn 1 (toggle ON)
                                  handleQuantityChange(device.deviceId, 1);
                                }
                              }
                            }}
                            title={isOutOfStock ? 'Hết hàng' : (isSelected ? 'Click để bỏ chọn' : 'Click để chọn')}
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

                            {/* Quantity Controls - Show when selected */}
                            <div className="device-card-footer">
                              {!isOutOfStock ? (
                                <>
                                  {isSelected ? (
                                    // ✅ Show quantity controls when selected
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
                                  ) : (
                                    // ✅ Show placeholder when not selected
                                    <div style={{ 
                                      color: '#999', 
                                      fontSize: '13px',
                                      fontStyle: 'italic'
                                    }}>
                                      Click để chọn
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

        <div className="device-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            className="device-modal-btn-reset"
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: '#f8f9fa',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#5f6368',
              transition: 'all 0.2s',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e8eaed';
              e.target.style.borderColor = '#dadce0';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.borderColor = '#dadce0';
            }}
          >
            🔄 Đặt lại
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="device-modal-btn-cancel" onClick={handleCancel}>
              Hủy
            </button>
            <button type="button" className="device-modal-btn-confirm" onClick={handleConfirm}>
              Xác nhận ({tempSelectedDevices.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelectorModal;
