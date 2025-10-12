import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRoute = ({ 
  children, 
  requiredRole = null, // 'admin' or 'user' or null (any authenticated user)
  adminOnly = false, // shortcut for requiredRole='admin'
  redirectTo = '/login',
  fallbackComponent = null,
  ...rest 
}) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  // Hiển thị loading nếu đang kiểm tra authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Kiểm tra authenticated
  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }

  // Kiểm tra role nếu được yêu cầu
  const roleToCheck = adminOnly ? 'admin' : requiredRole;
  
  if (roleToCheck && userRole !== roleToCheck) {
    // Nếu user không đúng role, redirect hoặc hiển thị fallback
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    // Redirect based on user role (kiểm tra cả lowercase và uppercase)
    if (userRole === 'admin' || userRole === 'ADMIN') {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/trang-chu" />;
    }
  }

  return (
    <Route {...rest}>
      {children}
    </Route>
  );
};

// Unauthorized Access Component
export const UnauthorizedAccess = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', color: '#dc3545' }}>
      403
    </h1>
    <h2 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
      Access Denied
    </h2>
    <p style={{ fontSize: '1.1rem', margin: '0 0 2rem 0' }}>
      You don't have permission to access this page.
    </p>
    <button
      onClick={() => window.history.back()}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
      }}
    >
      Go Back
    </button>
  </div>
);

export default RoleBasedRoute;