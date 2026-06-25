import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const RoleRedirect: React.FC = () => {
  const { profile } = useAuthStore();

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/operator/dashboard" replace />;
};
