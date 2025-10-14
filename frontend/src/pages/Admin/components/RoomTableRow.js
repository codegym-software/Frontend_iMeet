import React from 'react';
import { FaEdit, FaTrash, FaPlus, FaLaptop } from 'react-icons/fa';

const RoomTableRow = ({ 
  room, 
  devices, 
  statusInfo, 
  onAssignDevice, 
  onEdit, 
  onDelete,
  RoomDevicesList 
}) => {
  return (
    <tr 
      style={{ 
        borderBottom: '1px solid #dee2e6',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <td style={{ padding: '16px', fontWeight: '600', color: '#2c3e50' }}>
        {room.name}
      </td>
      <td style={{ padding: '16px', color: '#666' }}>
        {room.location}
      </td>
      <td style={{ padding: '16px', color: '#666' }}>
        {room.capacity} người
      </td>
      <td style={{ padding: '16px' }}>
        {(room.selectedDevices || []).length > 0 ? (
          <RoomDevicesList room={room} devices={devices} />
        ) : (
          <span style={{ color: '#999', fontSize: '13px' }}>Không có</span>
        )}
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: statusInfo.bgColor,
          color: statusInfo.color,
          display: 'inline-block'
        }}>
          {statusInfo.label}
        </span>
      </td>
      <td style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button 
            onClick={() => onAssignDevice(room)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
            title="Gắn thiết bị"
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <FaLaptop style={{ fontSize: '16px' }} />
              <FaPlus style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-6px', 
                fontSize: '10px',
                backgroundColor: '#28a745',
                borderRadius: '50%',
                padding: '1px'
              }} />
            </div>
          </button>
          <button 
            onClick={() => onEdit(room)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            title="Chỉnh sửa"
          >
            <FaEdit />
          </button>
          <button 
            onClick={() => onDelete(room.id)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
            title="Xóa"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default RoomTableRow;
