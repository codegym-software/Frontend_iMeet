import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const UserTableRow = ({ user, roleInfo, userIdInfo, formatDate, onEdit, onDelete }) => {
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '16px', color: '#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.fullName || user.email}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #e9ecef'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{ 
            display: user.avatarUrl ? 'none' : 'flex',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: user.googleId ? '#4285f4' : '#6c757d',
            color: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ 
              fontSize: '12px', 
              color: userIdInfo.color, 
              marginBottom: '2px',
              fontWeight: '500',
              backgroundColor: userIdInfo.bgColor,
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              {userIdInfo.id}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: userIdInfo.color, 
              fontWeight: '500',
              marginTop: '2px'
            }}>
              {userIdInfo.type}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{ fontWeight: '500', color: '#2c3e50' }}>
          {user.email}
        </span>
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{ fontWeight: '600', color: '#2c3e50' }}>
          {user.fullName}
        </span>
      </td>
      <td style={{ padding: '16px' }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: roleInfo.bgColor,
          color: roleInfo.color
        }}>
          {roleInfo.label}
        </span>
      </td>
      <td style={{ padding: '16px', color: '#666' }}>
        {formatDate(user.createdAt)}
      </td>
      <td style={{ padding: '16px', textAlign: 'center' }}>
        {!user.googleId && (
          <button 
            onClick={() => onEdit(user)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              marginRight: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Chỉnh sửa"
          >
            <FaEdit />
          </button>
        )}
        <button 
          onClick={() => onDelete(user.id)}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Xóa"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default UserTableRow;
