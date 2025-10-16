import React from 'react';

const DeviceAccordion = ({ 
  typeName, 
  typeDevices, 
  isExpanded, 
  onToggle, 
  formData, 
  handleDeviceToggle, 
  handleQuantityChange 
}) => {
  const selectedCount = typeDevices.filter(d => (formData.selectedDevices || []).includes(d.id)).length;

  return (
    <div style={{ borderBottom: '1px solid #e9ecef' }}>
      {/* Accordion Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isExpanded ? '#f8f9fa' : 'white',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '18px',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: '#666'
          }}>
            ▶
          </span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px', color: '#2c3e50' }}>
              {typeName}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
              {typeDevices.length} thiết bị
              {selectedCount > 0 && (
                <span style={{ 
                  marginLeft: '8px', 
                  color: '#007bff', 
                  fontWeight: '600' 
                }}>
                  • Đã chọn: {selectedCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Content - Table Format */}
      {isExpanded && (
        <div style={{ padding: '0', backgroundColor: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057', width: '50px' }}>
                  Chọn
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#495057' }}>
                  Tên thiết bị
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#495057', width: '150px' }}>
                  Số lượng
                </th>
              </tr>
            </thead>
            <tbody>
              {typeDevices.map((device, idx) => {
                const isSelected = (formData.selectedDevices || []).includes(device?.id);
                const currentQuantity = (formData.deviceQuantities || {})[device?.id] || 1;
                const maxQuantity = device?.quantity || 0;
              
                const isOutOfStock = maxQuantity === 0;
                const canSelect = maxQuantity > 0 || isSelected;
              
                return (
                  <tr 
                    key={device?.id ?? `device-${idx}`}
                    style={{
                      backgroundColor: isSelected ? '#f0f7ff' : 'white',
                      borderBottom: '1px solid #e9ecef',
                      opacity: isOutOfStock && !isSelected ? 0.5 : 1,
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && canSelect) {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
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
                          width: '18px',
                          height: '18px',
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          accentColor: '#007bff'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ 
                        fontWeight: '500', 
                        fontSize: '14px', 
                        color: isOutOfStock ? '#999' : '#2c3e50'
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
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {isSelected ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                            style={{
                              width: '60px',
                              padding: '6px 8px',
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              fontSize: '14px',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#ced4da'}
                          />
                          <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                            / {maxQuantity}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '14px', color: '#999' }}>
                          {maxQuantity} có sẵn
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeviceAccordion;
