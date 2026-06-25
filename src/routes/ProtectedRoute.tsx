import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoadingView } from '../components/feedback/LoadingView';


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <LoadingView message="Checking session..." />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/operator/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
