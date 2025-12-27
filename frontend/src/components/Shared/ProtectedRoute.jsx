import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.user_type)) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;