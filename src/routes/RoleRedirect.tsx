import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const RoleRedirect: React.FC = () => {
  const { profile } = useAuthStore();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'admin') {
    if (location.pathname === '/dashboard') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (location.pathname.startsWith('/issues')) {
      const subpath = location.pathname.substring(7);
      return <Navigate to={`/admin/issues${subpath}${location.search}`} replace />;
    }
    if (location.pathname.startsWith('/entries')) {
      return <Navigate to={`/admin/production${location.search}`} replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  // For operator / employee, prepend /operator
  return <Navigate to={`/operator${location.pathname}${location.search}`} replace />;
};
