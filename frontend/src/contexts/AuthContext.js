import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authType, setAuthType] = useState(null); // 'traditional' hoặc 'oauth2'
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'user' hoặc 'admin'

  // Kiểm tra authentication status khi component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    let isMounted = true;
    
    try {
      if (isMounted) setLoading(true);
      
      const authStatus = await authService.isAuthenticated();
      
      if (isMounted) {
        if (authStatus.authenticated) {
          setUser(authStatus.user);
          setIsAuthenticated(true);
          setAuthType(authStatus.type);
          setUserRole(authStatus.user?.role || 'user'); // Mặc định là 'user'
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setAuthType(null);
          setUserRole(null);
        }
      }
    } catch (error) {
      if (isMounted) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthType(null);
        setUserRole(null);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  };

  // Đăng nhập truyền thống
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        const userData = {
          id: response.userId,
          username: response.username,
          fullName: response.fullName,
          email: response.email || email, // Sử dụng email từ server, fallback về email đầu vào
          token: response.token,
          avatarUrl: response.avatarUrl,
          role: response.role ? response.role.toLowerCase() : 'user' // Chuyển role về lowercase để phù hợp với frontend
        };
        
        authService.saveUserToStorage(userData);
        setUser(userData);
        setIsAuthenticated(true);
        setAuthType('traditional');
        setUserRole(userData.role);
        return { success: true, message: response.message, user: userData };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Đăng nhập thất bại' 
      };
    }
  };

  // Đăng nhập bằng Cognito Server-side
  const loginWithCognito = () => {
    authService.initiateCognitoLogin();
  };

  // Đăng nhập bằng Cognito Hosted UI
  const loginWithCognitoHostedUI = () => {
    try {
      authService.initiateCognitoHostedUILogin();
    } catch (error) {
      // Silent error handling
    }
  };

  // Đăng ký
  const signup = async (username, email, password, fullName) => {
    try {
      const response = await authService.signup(username, email, password, fullName);
      return { 
        success: response.success, 
        message: response.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Đăng ký thất bại' 
      };
    }
  };

  // Force refresh authentication status
  const forceRefreshAuth = async () => {
    await checkAuthStatus();
  };

  // Clear all user data and refresh auth
  const clearAndRefreshAuth = async () => {
    authService.clearAllUserData();
    await checkAuthStatus();
  };

  // Update user information (for profile updates)
  const updateUser = (updatedUserData) => {
    if (user) {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      
      // Cập nhật localStorage tương ứng
      if (authType === 'oauth2-server') {
        localStorage.setItem('oauth2User', JSON.stringify(newUserData));
      } else {
        localStorage.setItem('user', JSON.stringify(newUserData));
      }
    }
  };

  // Set user directly (for OAuth2 callback)
  const setUserDirectly = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setUserRole(userData.role || 'user');
    
    // Determine auth type based on user data
    if (userData.authType === 'cognito-oauth2-server') {
      setAuthType('oauth2-server');
    } else {
      setAuthType('traditional');
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setAuthType(null);
      setUserRole(null);
      // Chuyển hướng về trang login
      window.location.href = '/login';
    } catch (error) {
      // Vẫn clear state local dù có lỗi
      setUser(null);
      setIsAuthenticated(false);
      setAuthType(null);
      setUserRole(null);
    }
  };

  // Helper function để kiểm tra admin role
  const isAdmin = () => userRole === 'admin';
  const isUser = () => userRole === 'user';

  const value = {
    user,
    setUser: setUserDirectly,
    isAuthenticated,
    authType,
    loading,
    userRole,
    isAdmin,
    isUser,
    login,
    loginWithCognito,
    loginWithCognitoHostedUI,
    signup,
    logout,
    checkAuthStatus,
    forceRefreshAuth,
    clearAndRefreshAuth,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};