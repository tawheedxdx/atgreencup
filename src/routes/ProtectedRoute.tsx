import React, { useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { LoadingView } from '../components/feedback/LoadingView';
import { AttendanceScreen } from '../features/attendance/AttendanceScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, initialized } = useAuthStore();
  const {
    attendanceChecked,
    attendanceLoading,
    todayRecord,
    checkTodayAttendance,
  } = useAttendanceStore();

  // Once we have a profile, check today's attendance
  useEffect(() => {
    if (profile && !attendanceChecked && !attendanceLoading) {
      checkTodayAttendance(profile.uid);
    }
  }, [profile, attendanceChecked, attendanceLoading, checkTodayAttendance]);

  // ── Not yet initialised ─────────────────────────────────────
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingView message="Checking session..." />
      </div>
    );
  }

  // ── Not authenticated ───────────────────────────────────────
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // ── Checking attendance ─────────────────────────────────────
  if (!attendanceChecked || attendanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingView message="Checking attendance..." />
      </div>
    );
  }

  // ── Attendance not yet marked today ─────────────────────────
  if (!todayRecord) {
    return (
      <AttendanceScreen
        onComplete={() => {
          // The store already has todayRecord set after marking.
          // Force a re-render by re-checking.
          checkTodayAttendance(profile.uid);
        }}
      />
    );
  }

  // ── All good ─────────────────────────────────────────────────
  return <>{children}</>;
};
