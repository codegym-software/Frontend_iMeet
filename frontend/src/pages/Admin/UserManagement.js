import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { usePreloadedData } from './DataPreloaderContext';
import { useActivity } from './ActivityContext';
import { FaPlus } from 'react-icons/fa';
import UserFormModal from './components/UserFormModal';
import UserTableRow from './components/UserTableRow';
import UserStatsFilter from './components/UserStatsFilter';
import UserSearchBar from './components/UserSearchBar';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import './styles/UserManagement.css';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, USER, ADMIN
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState(preloadedStats);

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

  // Client-side search and role filter
  const getFilteredUsers = () => {
    let filtered = allUsers;
    
    // Apply role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const email = (user.email || '').toLowerCase();
        const fullName = (user.fullName || '').toLowerCase();
        const role = (user.role || '').toLowerCase();
        
        return email.includes(searchLower) || 
               fullName.includes(searchLower) || 
               role.includes(searchLower);
      });
    }
    
    return filtered;
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

  // Get filtered users (no pagination)
  const filteredUsers = getFilteredUsers();

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
        
        const result = await adminService.createUser(userData);
        
        // ✅ Optimistic update - add to local state immediately
        if (result && result.data) {
          const newUser = result.data;
          const updatedUsers = [newUser, ...allUsers];
          setAllUsers(updatedUsers);
          setPreloadedUsers(updatedUsers);
          
          // Update stats optimistically
          const updatedStats = {
            ...stats,
            totalUsers: (stats?.totalUsers || 0) + 1
          };
          setStats(updatedStats);
          setPreloadedStats(updatedStats);
        }
        
        showNotification('success', `✨ Đã thêm người dùng "${userData.fullName}" thành công!`);
        
        // Log activity
        const roleLabel = roles.find(r => r.value === userData.role)?.label || userData.role;
        addActivity('user', 'add', userData.fullName, `📧 Email: ${userData.email} | 🎭 Role: ${roleLabel}`);
        
        resetForm();
        setSearchTerm(''); // Clear search term
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
      email: user.email || '',
      fullName: user.fullName || '',
      password: '', // Don't show password in edit form
      rePassword: '',
      role: user.role || 'USER'
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
        const result = await adminService.updateUser(userId, userData);
        
        // ✅ Optimistic update - update in local state immediately
        if (result && result.data) {
          const updatedUser = result.data;
          const updatedUsers = allUsers.map(u => 
            (u.id === editingUser.id || u.googleId === editingUser.googleId) ? updatedUser : u
          );
          setAllUsers(updatedUsers);
          setPreloadedUsers(updatedUsers);
        }
        
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
      } catch (error) {
        showNotification('error', `❌ Lỗi khi cập nhật người dùng: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Handle Delete
  const handleDelete = (id) => {
    const user = allUsers.find(u => u.id === id);
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    try {
      setActionLoading(true);
      setShowDeleteConfirm(false);
      
      // Use correct ID for delete (Google ID for Google users, System ID for others)
      const userId = userToDelete?.googleId || userToDelete?.id;
      await adminService.deleteUser(userId);
      
      // ✅ Optimistic update - remove from local state immediately
      const updatedUsers = allUsers.filter(u => 
        u.id !== userToDelete?.id && u.googleId !== userToDelete?.googleId
      );
      setAllUsers(updatedUsers);
      setPreloadedUsers(updatedUsers);
      
      // Update stats optimistically
      const updatedStats = {
        ...stats,
        totalUsers: Math.max(0, (stats?.totalUsers || 0) - 1)
      };
      setStats(updatedStats);
      setPreloadedStats(updatedStats);
      
      showNotification('success', `🗑️ Đã xóa người dùng "${userToDelete?.fullName}" thành công!`);
      
      // Log activity
      const roleLabel = roles.find(r => r.value === userToDelete?.role)?.label || userToDelete?.role;
      addActivity('user', 'delete', userToDelete?.fullName, `📧 Email: ${userToDelete?.email} | 🎭 Role: ${roleLabel}`);
      
      setSearchTerm(''); // Clear search term
    } catch (error) {
      showNotification('error', `❌ Lỗi khi xóa người dùng: ${error.message}`);
    } finally {
      setActionLoading(false);
      setUserToDelete(null);
    }
  };

  // Cancel Delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
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
    <div className="user-management-container">
      {/* Notification */}
      {notification && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <div className="notification-message">
              {notification.message}
            </div>
            <button onClick={() => setNotification(null)} className="notification-close">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Người Dùng</h1>
          <p className="page-subtitle">Quản lý tài khoản và phân quyền người dùng trong hệ thống</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="add-button" title="Thêm người dùng mới">
          <FaPlus />
        </button>
      </div>

      {/* Stats & Filter */}
      <UserStatsFilter 
        roleFilter={roleFilter} 
        setRoleFilter={setRoleFilter} 
        stats={stats} 
        loading={loading} 
      />

      {/* Search Bar */}
      <UserSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th className="center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                roleInfo={getRoleInfo(user.role)}
                userIdInfo={getUserIdInfo(user)}
                formatDate={formatDate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">
              {searchTerm ? `Không tìm thấy người dùng nào với từ khóa "${searchTerm}"` : 'Chưa có người dùng nào'}
            </div>
            <div className="empty-state-subtitle">
              {searchTerm ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Hãy thêm người dùng mới để bắt đầu!'}
            </div>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <UserFormModal
          isEdit={false}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          roles={roles}
          onSubmit={handleAdd}
          onCancel={resetForm}
          getPasswordStrength={getPasswordStrength}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <UserFormModal
          isEdit={true}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          roles={roles}
          onSubmit={handleUpdate}
          onCancel={resetForm}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Action Loading Overlay */}
      {actionLoading && (
        <div className="action-loading-overlay">
          <div className="action-loading-content">
            <div className="action-loading-title">Đang xử lý...</div>
            <div className="action-loading-subtitle">Vui lòng chờ trong giây lát</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
