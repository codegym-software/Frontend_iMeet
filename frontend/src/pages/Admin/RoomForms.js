import React from 'react';
import AssignDeviceModal from './components/AssignDeviceModal';
import RoomFormModal from './components/RoomFormModal';
import { useDeviceInventory } from '../../contexts/DeviceInventoryContext';

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
  onCancel,
  roomDeviceMappings // ✅ Receive mappings
}) => {
  const [deviceTypeFilter, setDeviceTypeFilter] = React.useState('');
  const { inventory } = useDeviceInventory();

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
      // ✅ CHECK AVAILABILITY before adding
      const deviceInfo = inventory[deviceId];
      const available = deviceInfo?.available || 0;
      
      if (available === 0) {
        alert(`🚫 HẾT HÀNG!\n\nThiết bị này hiện không còn sẵn trong kho.`);
        return;
      }
      
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
    const deviceInfo = inventory[deviceId];
    const available = deviceInfo?.available || 0;
    const total = deviceInfo?.total || device?.quantity || 0;
    
    // ✅ KHÔNG CHO CHỌN NẾU HẾT HÀNG
    if (available === 0) {
      alert(`🚫 HẾT HÀNG!\n\nThiết bị: ${device?.name || 'N/A'}\nHiện tại: 0 có sẵn`);
      return;
    }
    
    // Validate quantity
    let validQuantity = parseInt(quantity) || 1;
    if (validQuantity < 1) validQuantity = 1;
    
    // ✅ KHÔNG CHO CHỌN QUÁ SỐ LƯỢNG CÓ SẴN
    if (validQuantity > available) {
      alert(`❌ Không đủ thiết bị!\n\nThiết bị: ${device?.name || 'N/A'}\nYêu cầu: ${validQuantity}\nCòn lại: ${available}\n\n💡 Vui lòng chọn tối đa ${available}`);
      validQuantity = available;
    }
    
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
          inventory={inventory} // ✅ Pass inventory
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
          inventory={inventory} // ✅ Pass inventory
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
          inventory={inventory} // ✅ Pass inventory
        />
      )}
    </>
  );
};

export default RoomForms;