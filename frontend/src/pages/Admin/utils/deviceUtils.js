// Normalize backend device object to frontend shape
export function normalizeDevice(d, deviceTypes = []) {
  if (!d) return null;
  const id = d.deviceId ?? d.id ?? d.device_id ?? null;
  const name = d.name ?? '';
  const quantity = d.quantity ?? 0;
  const description = d.description ?? '';
  
  // deviceType may be provided in different forms
  let deviceTypeName = '';
  let deviceTypeId = d.deviceTypeId ?? null;
  
  if (d.deviceType) {
    if (typeof d.deviceType === 'string') {
      // Backend may return enum name (e.g., "MIC", "MAY_CHIEU") or display name ("Mic", "Máy chiếu")
      const enumVal = d.deviceType;
      // Map ALL known enum keys to display names - EXPANDED to include all types
      const enumToDisplay = {
        MIC: 'Mic', 
        CAM: 'Cam', 
        LAPTOP: 'Laptop', 
        BANG: 'Bảng', 
        MAN_HINH: 'Màn hình', 
        MAY_CHIEU: 'Máy chiếu', 
        KHAC: 'Khác',
        // Add more mappings to be safe
        'MAN HINH': 'Màn hình',
        'MAY CHIEU': 'Máy chiếu'
      };
      // Try to map, but if not found, use the original value (this ensures all types show)
      deviceTypeName = enumToDisplay[enumVal] || enumToDisplay[String(enumVal).toUpperCase()] || enumVal;
    } else if (typeof d.deviceType === 'object') {
      deviceTypeName = d.deviceType.displayName ?? d.deviceType.name ?? String(d.deviceType);
      // If deviceType is an object, it might have an id
      if (d.deviceType.id) {
        deviceTypeId = d.deviceType.id;
      }
    } else {
      deviceTypeName = String(d.deviceType);
    }
  } else if (d.deviceTypeName) {
    deviceTypeName = d.deviceTypeName;
  }

  // Try to find a matching device type in local list by name (case-insensitive)
  const typeObj = deviceTypes.find(t => 
    String(t.name).toLowerCase() === String(deviceTypeName).toLowerCase()
  );
  
  // Use typeObj.id if found, otherwise use existing deviceTypeId
  if (typeObj) {
    deviceTypeId = typeObj.id;
    deviceTypeName = typeObj.name; // Use the exact name from deviceTypes
  }
  
  // IMPORTANT: If deviceTypeName is still empty, use a fallback
  if (!deviceTypeName && deviceTypeId) {
    // Try to find by ID
    const typeById = deviceTypes.find(t => String(t.id) === String(deviceTypeId));
    if (typeById) {
      deviceTypeName = typeById.name;
    }
  }
  
  // If still no deviceTypeName, use a placeholder to ensure device is visible
  if (!deviceTypeName) {
    deviceTypeName = 'Chưa phân loại';
    console.warn('Device without type name:', { id, name, deviceTypeId, rawDeviceType: d.deviceType });
  }
  
  const createdAt = d.createdAt ?? d.createdAtString ?? d.created_at ?? new Date().toISOString();
  return { 
    id, 
    name, 
    deviceTypeId, 
    deviceTypeName: deviceTypeName || 'Chưa phân loại', 
    quantity, 
    description, 
    createdAt 
  };
}

// Map display name to enum value
export function mapToEnum(displayName) {
  const map = {
    'Mic': 'MIC',
    'Cam': 'CAM',
    'Laptop': 'LAPTOP',
    'Bảng': 'BANG',
    'Màn hình': 'MAN_HINH',
    'Máy chiếu': 'MAY_CHIEU',
    'Khác': 'KHAC'
  };
  return map[displayName] || 'KHAC';
}

// Validate device form
export function validateDeviceForm(formData) {
  const errors = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Tên thiết bị là bắt buộc';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Tên thiết bị không được quá 100 ký tự';
  }
  
  if (!formData.deviceTypeId) {
    errors.deviceTypeId = 'Vui lòng chọn loại thiết bị';
  }
  
  if (!formData.quantity) {
    errors.quantity = 'Số lượng là bắt buộc';
  } else if (parseInt(formData.quantity) < 1) {
    errors.quantity = 'Số lượng phải lớn hơn 0';
  } else if (parseInt(formData.quantity) > 1000) {
    errors.quantity = 'Số lượng không được quá 1000';
  }
  
  if (!formData.description.trim()) {
    errors.description = 'Mô tả là bắt buộc';
  } else if (formData.description.trim().length > 500) {
    errors.description = 'Mô tả không được quá 500 ký tự';
  }
  
  return errors;
}
