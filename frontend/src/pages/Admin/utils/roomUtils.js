// Validate room form
export function validateRoomForm(formData) {
  const errors = {};
  
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Tên phòng là bắt buộc';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Tên phòng không được quá 100 ký tự';
  }
  
  if (!formData.capacity) {
    errors.capacity = 'Sức chứa là bắt buộc';
  } else if (parseInt(formData.capacity) < 1) {
    errors.capacity = 'Sức chứa phải lớn hơn 0';
  } else if (parseInt(formData.capacity) > 1000) {
    errors.capacity = 'Sức chứa không được quá 1000';
  }
  
  if (!formData.location || !formData.location.trim()) {
    errors.location = 'Vị trí là bắt buộc';
  } else if (formData.location.trim().length > 200) {
    errors.location = 'Vị trí không được quá 200 ký tự';
  }
  
  if (!formData.description || !formData.description.trim()) {
    errors.description = 'Mô tả là bắt buộc';
  } else if (formData.description.trim().length > 500) {
    errors.description = 'Mô tả không được quá 500 ký tự';
  }
  
  return errors;
}

// Get status info for room
export function getStatusInfo(status) {
  const statusMap = {
    'AVAILABLE': { label: 'Phòng trống', color: '#28a745', bgColor: '#d4edda' },
    'OCCUPIED': { label: 'Đang sử dụng', color: '#dc3545', bgColor: '#f8d7da' },
    'MAINTENANCE': { label: 'Bảo trì', color: '#ffc107', bgColor: '#fff3cd' },
    'RESERVED': { label: 'Đã đặt', color: '#17a2b8', bgColor: '#d1ecf1' }
  };
  return statusMap[status] || { label: status, color: '#6c757d', bgColor: '#e9ecef' };
}
