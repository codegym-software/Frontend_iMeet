import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const DeviceTableRow = ({ 
  device, 
  onEdit, 
  onDelete, 
  actionLoading,
  DeviceQuantityDisplay,
  DeviceRoomsList 
}) => {
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '16px' }}>
        <span style={{ fontWeight: '600', color: '#2c3e50' }}>
          {device.name}
        </span>
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: '#e3f2fd',
          color: '#1565c0',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {device.deviceTypeName}
        </span>
      </td>
      <td style={{ padding: '16px', textAlign: 'center' }}>
        <DeviceQuantityDisplay device={device} />
      </td>
      <td style={{ padding: '16px', maxWidth: '300px', color: '#555' }}>
        {((device?.description ?? '').length > 60)
          ? (device.description.substring(0, 60) + '...')
          : (device?.description ?? '')}
      </td>
      <td style={{ padding: '16px' }}>
        <DeviceRoomsList device={device} />
      </td>
      <td style={{ padding: '16px', textAlign: 'center' }}>
        <button 
          onClick={() => onEdit(device)}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            marginRight: '8px',
            cursor: actionLoading.deletingId ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          disabled={actionLoading.deletingId !== null}
          title="Chỉnh sửa"
        >
          <FaEdit />
        </button>
        <button 
          onClick={() => onDelete(device?.id)}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: actionLoading.deletingId === device.id ? 'wait' : 'pointer',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px'
          }}
          disabled={actionLoading.deletingId !== null}
          title="Xóa"
        >
          {actionLoading.deletingId === device.id ? '...' : <FaTrash />}
        </button>
      </td>
    </tr>
  );
};

export default DeviceTableRow;
