import React from 'react';
import AssignDeviceModal from './components/AssignDeviceModal';
import RoomFormModal from './components/RoomFormModal';

const RoomForms = ({ 
  showAddForm, 
  showEditForm,
  showAssignDeviceForm,
  formData, 
  setFormData, 
  formErrors, 
  devices, 
  roomStatuses, 
  onAdd, 
  onUpdate, 
  onCancel 
}) => {
  const [deviceTypeFilter, setDeviceTypeFilter] = React.useState('');

  // Handle device selection with quantity
  const handleDeviceToggle = (deviceId) => {
    const currentDevices = formData.selectedDevices || [];
    const currentQuantities = formData.deviceQuantities || {};
    
    if (currentDevices.includes(deviceId)) {
      // Remove device
      const newQuantities = { ...currentQuantities };
      delete newQuantities[deviceId];
      setFormData({
        ...formData,
        selectedDevices: currentDevices.filter(id => id !== deviceId),
        deviceQuantities: newQuantities
      });
    } else {
      // Add device with default quantity 1
      setFormData({
        ...formData,
        selectedDevices: [...currentDevices, deviceId],
        deviceQuantities: { ...currentQuantities, [deviceId]: 1 }
      });
    }
  };
  
  // Handle quantity change for a device
  const handleQuantityChange = (deviceId, quantity) => {
    const currentQuantities = formData.deviceQuantities || {};
    const device = devices.find(d => d.id === deviceId);
    const maxQuantity = device ? device.quantity : 1000;
    
    // Validate quantity
    let validQuantity = parseInt(quantity) || 1;
    if (validQuantity < 1) validQuantity = 1;
    if (validQuantity > maxQuantity) validQuantity = maxQuantity;
    
    setFormData({
      ...formData,
      deviceQuantities: { ...currentQuantities, [deviceId]: validQuantity }
    });
  };

  // Get unique device types from devices
  const getDeviceTypes = () => {
    const types = new Set();
    devices.forEach(device => {
      if (device.deviceTypeName) {
        types.add(device.deviceTypeName);
      }
    });
    const uniqueTypes = Array.from(types).sort();
    console.log('Unique device types for dropdown:', uniqueTypes);
    console.log('Total devices in RoomForms:', devices.length);
    return uniqueTypes;
  };

  // ...existing code...

  return (
    <>
      {/* Add Form Modal */}
      {showAddForm && (
        <RoomFormModal
          title="Thêm Phòng Mới"
          onSubmit={onAdd}
          buttonText="Thêm"
          buttonColor="#28a745"
          isAddForm={true}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          devices={devices}
          roomStatuses={roomStatuses}
          handleDeviceToggle={handleDeviceToggle}
          handleQuantityChange={handleQuantityChange}
          onCancel={onCancel}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <RoomFormModal
          title="Chỉnh sửa Phòng"
          onSubmit={onUpdate}
          buttonText="Cập nhật"
          buttonColor="#007bff"
          isAddForm={false}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          devices={devices}
          roomStatuses={roomStatuses}
          handleDeviceToggle={handleDeviceToggle}
          handleQuantityChange={handleQuantityChange}
          onCancel={onCancel}
        />
      )}

      {/* Assign Device Form Modal */}
      {showAssignDeviceForm && (
        <AssignDeviceModal
          title="Thiết bị trong phòng"
          onSubmit={onUpdate}
          buttonText="Lưu"
          buttonColor="#28a745"
          formData={formData}
          setFormData={setFormData}
          devices={devices}
          handleDeviceToggle={handleDeviceToggle}
          handleQuantityChange={handleQuantityChange}
          onCancel={onCancel}
          getDeviceTypes={getDeviceTypes}
        />
      )}
    </>
  );
};

export default RoomForms;