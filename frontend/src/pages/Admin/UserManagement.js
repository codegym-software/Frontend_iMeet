import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { usePreloadedData } from './DataPreloaderContext';
import { useActivity } from './ActivityContext';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const UserManagement = () => {
  const { addActivity } = useActivity();
  
  // Use preloaded data from context
  const { 
    users: preloadedUsers, 
    userStats: preloadedStats,
    usersTotalPages: preloadedTotalPages,
    usersTotalElements: preloadedTotalElements,
    usersCurrentPage: preloadedCurrentPage,
    usersLoading: preloadedLoading,
    loadUsers: reloadUsers,
    loadUserStats: reloadStats,
    setUsers: setPreloadedUsers,
    setUserStats: setPreloadedStats
  } = usePreloadedData();

  const [allUsers, setAllUsers] = useState(preloadedUsers); // Store all users for client-side filtering
  const [loading, setLoading] = useState(false); // Don't show loading if data is preloaded
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState(preloadedStats);
  
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    rePassword: '',
    role: 'USER' // USER, ADMIN, STAFF
  });
  const [formErrors, setFormErrors] = useState({});

  const roles = [
    { value: 'USER', label: 'User', color: '#17a2b8', bgColor: '#d1ecf1' },
    { value: 'ADMIN', label: 'Admin', color: '#dc3545', bgColor: '#f8d7da' }
  ];

  // Sync with preloaded data
  useEffect(() => {
    setAllUsers(preloadedUsers);
    setStats(preloadedStats);
    // Only show loading if we don't have data yet
    if (preloadedUsers.length === 0 && preloadedLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [preloadedUsers, preloadedLoading, preloadedStats]);

  // Client-side search filter
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) {
      return allUsers;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return allUsers.filter(user => {
      const email = (user.email || '').toLowerCase();
      const fullName = (user.fullName || '').toLowerCase();
      const role = (user.role || '').toLowerCase();
      
      return email.includes(searchLower) || 
             fullName.includes(searchLower) || 
             role.includes(searchLower);
    });
  };

  // Load user stats
  const loadStats = async () => {
    try {
      const response = await reloadStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Get filtered users and apply pagination
  const filteredUsers = getFilteredUsers();
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalElements = filteredUsers.length;
  
  // Get current page items
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredUsers.slice(startIndex, endIndex);

  // Validation helpers
  const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecial;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Unified validation function
  const validateForm = (isEdit = false) => {
    const errors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email là bắt buộc';
    } else if (!isValidEmail(formData.email.trim())) {
      errors.email = 'Email không hợp lệ';
    } else {
      // Check duplicate email
      const duplicateEmail = allUsers.find(user => 
        user.email.toLowerCase() === formData.email.trim().toLowerCase() && 
        (!isEdit || user.id !== editingUser.id)
      );
      if (duplicateEmail) {
        errors.email = 'Email này đã được sử dụng';
      }
    }
    
    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = 'Họ tên không được quá 100 ký tự';
    }
    
    // Password validation (only for add form)
    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Mật khẩu là bắt buộc';
      } else if (!isStrongPassword(formData.password)) {
        errors.password = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
      }
      
      if (!formData.rePassword) {
        errors.rePassword = 'Vui lòng nhập lại mật khẩu';
      } else if (formData.password !== formData.rePassword) {
        errors.rePassword = 'Mật khẩu nhập lại không khớp';
      }
    }
    
    return errors;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      password: '',
      rePassword: '',
      role: 'user'
    });
    setFormErrors({});
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingUser(null);
  };

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Add
  const handleAdd = async () => {
    const errors = validateForm(false);
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      try {
        setActionLoading(true);
        const userData = {
          email: formData.email.trim().toLowerCase(),
          fullName: formData.fullName.trim(),
          password: formData.password,
          role: formData.role
        };
        
        await adminService.createUser(userData);
        showNotification('success', `✨ Đã thêm người dùng "${userData.fullName}" thành công!`);
        
        // Log activity
        const roleLabel = roles.find(r => r.value === userData.role)?.label || userData.role;
        addActivity('user', 'add', userData.fullName, `📧 Email: ${userData.email} | 🎭 Role: ${roleLabel}`);
        
        resetForm();
        setSearchTerm(''); // Clear search term
        
        // Reload all users data
        const response = await reloadUsers(0, 1000, 'createdAt', 'desc', '');
        setAllUsers(response.users || []);
        await loadStats();
        setCurrentPage(0);
      } catch (error) {
        showNotification('error', `❌ Lỗi khi thêm người dùng: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle Edit
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName,
      password: '', // Don't show password in edit form
      rePassword: '',
      role: user.role
    });
    setFormErrors({});
    setShowEditForm(true);
  };

  // Handle Update
  const handleUpdate = async () => {
    const errors = validateForm(true);
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      try {
        setActionLoading(true);
        const userData = {
          email: formData.email.trim().toLowerCase(),
          fullName: formData.fullName.trim(),
          role: formData.role
        };
        
        if (formData.password && formData.password.trim()) {
          userData.password = formData.password;
        }
        
        const userId = editingUser.googleId || editingUser.id;
        await adminService.updateUser(userId, userData);
        showNotification('success', `📝 Đã cập nhật người dùng "${userData.fullName}" thành công!`);
        
        // Log activity - show what changed
        const changes = [];
        if (editingUser.fullName !== userData.fullName) changes.push(`Tên: "${editingUser.fullName}" → "${userData.fullName}"`);
        if (editingUser.email !== userData.email) changes.push(`Email: "${editingUser.email}" → "${userData.email}"`);
        if (editingUser.role !== userData.role) {
          const oldRole = roles.find(r => r.value === editingUser.role)?.label || editingUser.role;
          const newRole = roles.find(r => r.value === userData.role)?.label || userData.role;
          changes.push(`Role: "${oldRole}" → "${newRole}"`);
        }
        if (formData.password && formData.password.trim()) changes.push('Đổi mật khẩu');
        const changeDetail = changes.length > 0 ? changes.join(' | ') : 'Cập nhật thông tin';
        addActivity('user', 'update', userData.fullName, changeDetail);
        
        resetForm();
        setSearchTerm(''); // Clear search term
        
        // Reload all users data
        const response = await reloadUsers(0, 1000, 'createdAt', 'desc', '');
        setAllUsers(response.users || []);
        await loadStats();
      } catch (error) {
        showNotification('error', `❌ Lỗi khi cập nhật người dùng: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    const userToDelete = allUsers.find(user => user.id === id);
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userToDelete?.fullName}"?`)) {
      try {
        setActionLoading(true);
        // Use correct ID for delete (Google ID for Google users, System ID for others)
        const userId = userToDelete?.googleId || userToDelete?.id;
        await adminService.deleteUser(userId);
        showNotification('success', `🗑️ Đã xóa người dùng "${userToDelete?.fullName}" thành công!`);
        
        // Log activity
        const roleLabel = roles.find(r => r.value === userToDelete?.role)?.label || userToDelete?.role;
        addActivity('user', 'delete', userToDelete?.fullName, `📧 Email: ${userToDelete?.email} | 🎭 Role: ${roleLabel}`);
        
        setSearchTerm(''); // Clear search term
        
        // Reload all users data
        const response = await reloadUsers(0, 1000, 'createdAt', 'desc', '');
        setAllUsers(response.users || []);
        await loadStats();
        
        // Adjust current page if needed
        const newFilteredUsers = searchTerm ? response.users.filter(user => {
          const searchLower = searchTerm.toLowerCase().trim();
          return (user.email || '').toLowerCase().includes(searchLower) || 
                 (user.fullName || '').toLowerCase().includes(searchLower) || 
                 (user.role || '').toLowerCase().includes(searchLower);
        }) : response.users;
        const newTotalPages = Math.ceil(newFilteredUsers.length / itemsPerPage);
        if (currentPage >= newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages - 1);
        }
      } catch (error) {
        showNotification('error', `❌ Lỗi khi xóa người dùng: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Utility functions
  const getRoleInfo = (role) => roles.find(r => r.value === role) || roles[0];

  const getUserIdInfo = (user) => ({
    id: user.googleId || user.id,
    type: user.googleId ? 'Google' : '',
    color: user.googleId ? '#4285f4' : '#6c757d',
    bgColor: user.googleId ? '#e8f0fe' : '#f8f9fa'
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`;
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Rất yếu', color: '#dc3545' },
      { strength: 2, label: 'Yếu', color: '#fd7e14' },
      { strength: 3, label: 'Trung bình', color: '#ffc107' },
      { strength: 4, label: 'Mạnh', color: '#20c997' },
      { strength: 5, label: 'Rất mạnh', color: '#28a745' }
    ];
    
    return levels[score];
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
          color: notification.type === 'success' ? '#155724' : '#721c24',
          padding: '16px 20px',
          borderRadius: '8px',
          border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '350px',
          maxWidth: '500px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '10px',
                color: 'inherit'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>
            Quản lý Người Dùng
          </h1>
          <p style={{ fontSize: '16px', color: '#7f8c8d', margin: 0 }}>
            Quản lý tài khoản và phân quyền người dùng trong hệ thống
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          style={{ 
            padding: '12px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px'
          }}
          title="Thêm người dùng mới"
        >
          <FaPlus />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#007bff', marginBottom: '8px' }}>
              {stats.totalUsers || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Tổng Users</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc3545', marginBottom: '8px' }}>
              {stats.adminCount || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Admin</div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#17a2b8', marginBottom: '8px' }}>
              {stats.userCount || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Users</div>
          </div>
          
          {/* Google Users Card - Hidden */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            textAlign: 'center',
            display: 'none' // Ẩn card Google users
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4285f4', marginBottom: '8px' }}>
              #
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Google</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              placeholder="Tìm kiếm theo email, họ tên hoặc vai trò..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: '#666'
            }}>
              🔍
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                padding: '12px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)', 
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Avatar & User ID
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Email
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Họ tên
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Vai trò
              </th>
              <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Ngày tạo
              </th>
              <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              const userIdInfo = getUserIdInfo(user);
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                    {/* Chỉ hiển thị nút Sửa cho Traditional users (không có googleId) */}
                    {!user.googleId && (
                      <button 
                        onClick={() => handleEdit(user)}
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
                    {/* Hiển thị nút Xóa cho tất cả users (trừ admin) */}
                    <button 
                      onClick={() => handleDelete(user.id)}
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
            })}
          </tbody>
        </table>

        {currentItems.length === 0 && !loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>
              {searchTerm ? `Không tìm thấy người dùng nào với từ khóa "${searchTerm}"` : 'Chưa có người dùng nào'}
            </div>
            <div style={{ fontSize: '14px', color: '#999' }}>
              {searchTerm ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Hãy thêm người dùng mới để bắt đầu!'}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '20px',
          marginTop: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: currentPage === 0 ? '#f8f9fa' : 'white',
              color: currentPage === 0 ? '#6c757d' : '#495057',
              cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            ← Trước
          </button>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index;
              const isCurrentPage = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: isCurrentPage ? '#007bff' : 'white',
                    color: isCurrentPage ? 'white' : '#495057',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isCurrentPage ? '600' : 'normal'
                  }}
                >
                  {pageNumber + 1}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              backgroundColor: currentPage >= totalPages - 1 ? '#f8f9fa' : 'white',
              color: currentPage >= totalPages - 1 ? '#6c757d' : '#495057',
              cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Tiếp →
          </button>
          
          <div style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
            Trang {currentPage + 1} / {totalPages} • Hiển thị {currentItems.length} / {totalElements} users
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '30px', 
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                color: '#999',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#999';
              }}
              title="Đóng"
            >
              ×
            </button>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px', paddingRight: '40px' }}>
              Thêm Người Dùng Mới
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.email ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="VD: user@company.com"
                />
                {formErrors.email && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.email}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Họ tên *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.fullName ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="VD: Nguyễn Văn A"
                />
                {formErrors.fullName && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.fullName}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formData.fullName.length}/100 ký tự
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.password ? '#dc3545' : '#e9ecef'}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="Mật khẩu mạnh (ít nhất 8 ký tự)"
                />
                {formData.password && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Độ mạnh mật khẩu:</div>
                    <div style={{ 
                      height: '4px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '2px', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(getPasswordStrength(formData.password).strength / 5) * 100}%`,
                        backgroundColor: getPasswordStrength(formData.password).color,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: getPasswordStrength(formData.password).color,
                      marginTop: '4px',
                      fontWeight: '500'
                    }}>
                      {getPasswordStrength(formData.password).label}
                    </div>
                  </div>
                )}
                {formErrors.password && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.password}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                  Nhập lại mật khẩu *
                </label>
                <input
                  type="password"
                  value={formData.rePassword}
                  onChange={(e) => setFormData({...formData, rePassword: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: `2px solid ${formErrors.rePassword ? '#dc3545' : (formData.rePassword && formData.password === formData.rePassword ? '#28a745' : '#e9ecef')}`, 
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="Nhập lại mật khẩu"
                />
                {formData.rePassword && formData.password === formData.rePassword && (
                  <div style={{ color: '#28a745', fontSize: '14px', marginTop: '4px' }}>
                    ✓ Mật khẩu khớp
                  </div>
                )}
                {formErrors.rePassword && (
                  <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                    {formErrors.rePassword}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Vai trò
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e9ecef', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={resetForm}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Hủy
              </button>
              <button 
                onClick={handleAdd}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '30px', 
            width: '600px',
            maxWidth: '90vw',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowEditForm(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                color: '#999',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#999';
              }}
              title="Đóng"
            >
              ×
            </button>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', marginBottom: '20px', paddingRight: '40px' }}>
              Chỉnh sửa Người Dùng
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: `2px solid ${formErrors.email ? '#dc3545' : '#e9ecef'}`, 
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {formErrors.email && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.email}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Họ tên *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: `2px solid ${formErrors.fullName ? '#dc3545' : '#e9ecef'}`, 
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {formErrors.fullName && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {formErrors.fullName}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {formData.fullName.length}/100 ký tự
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#2c3e50' }}>
                Vai trò
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e9ecef', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={resetForm}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdate}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Loading Overlay */}
      {actionLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px 40px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', color: '#666', marginBottom: '10px' }}>Đang xử lý...</div>
            <div style={{ fontSize: '14px', color: '#999' }}>Vui lòng chờ trong giây lát</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
