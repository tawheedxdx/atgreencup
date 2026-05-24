import React, { useEffect, useState, useCallback } from 'react';
import { useAttendanceStore } from '../../store/attendanceStore';
import { useAuthStore } from '../../store/authStore';

// ─── Sub-components ───────────────────────────────────────────

const LeafIcon = () => (
  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LocationPinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Live Clock ───────────────────────────────────────────────
const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedDate = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="text-center">
      <p className="text-4xl font-black text-gray-900 tracking-tight tabular-nums">{formattedTime}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{formattedDate}</p>
    </div>
  );
};

// ─── GPS Status Badge ─────────────────────────────────────────
const GPSStatusBadge: React.FC<{
  loading: boolean;
  error: string | null;
  within: boolean | null;
  distance: number | null;
}> = ({ loading, error, within, distance }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <svg className="animate-spin w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-semibold text-blue-700">Getting your location...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-bold text-red-700">Location Error</span>
        </div>
        <p className="text-xs text-red-600 ml-6">{error}</p>
      </div>
    );
  }
  if (within === null) return null;

  if (!within && distance !== null && distance > 0) {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <LocationPinIcon className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm font-bold text-orange-700">Outside Allowed Area</span>
        </div>
        <p className="text-xs text-orange-600 ml-6">
          You are <strong>{distance}m</strong> away from the factory. Move closer and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
      <LocationPinIcon className="w-4 h-4 text-emerald-600 shrink-0" />
      <span className="text-sm font-bold text-emerald-700">
        Location Verified {distance !== null && distance > 0 ? `· ${distance}m from factory` : ''}
      </span>
    </div>
  );
};

// ─── Success Screen ───────────────────────────────────────────
const AttendanceSuccessScreen: React.FC<{ status: 'present' | 'absent'; checkInTime: string | null }> = ({ status, checkInTime }) => {
  const time = checkInTime ? new Date(checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckIcon />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {status === 'present' ? 'Attendance Marked' : 'Noted — Rest Well'}
        </h2>
        {status === 'present' && time && (
          <div className="flex items-center justify-center gap-2 mt-3 mb-1">
            <span className="text-sm font-medium text-gray-500">Check-in time:</span>
            <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{time}</span>
          </div>
        )}
        {status === 'present' && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <LocationPinIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Location Verified</span>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard…</p>
      </div>
    </div>
  );
};

// ─── Confirm Absent Dialog ────────────────────────────────────
const ConfirmAbsentDialog: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
      <h3 className="text-xl font-black text-gray-900 mb-2">Not Working Today?</h3>
      <p className="text-sm text-gray-500 mb-6">This will mark your attendance as <strong>Absent</strong> for today. This cannot be undone.</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-12 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Confirm Absent
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Attendance Screen ───────────────────────────────────
export const AttendanceScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { profile } = useAuthStore();
  const {
    attendanceLoading,
    todayRecord,
    locationLoading,
    locationError,
    currentLocation,
    withinAllowedRadius,
    distanceFromFactory,
    settings,
    fetchLocation,
    markPresent,
    markAbsent,
  } = useAttendanceStore();

  const [showAbsentConfirm, setShowAbsentConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successStatus, setSuccessStatus] = useState<'present' | 'absent'>('present');
  const [successTime, setSuccessTime] = useState<string | null>(null);

  // Auto-fetch location on mount if required
  useEffect(() => {
    if (settings && !currentLocation && !locationLoading && !locationError) {
      fetchLocation(settings);
    }
  }, [settings, currentLocation, locationLoading, locationError, fetchLocation]);

  // If success screen is showing, redirect after delay
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => onComplete(), 2500);
      return () => clearTimeout(t);
    }
  }, [showSuccess, onComplete]);

  const handleMarkPresent = useCallback(async () => {
    if (!profile) return;
    setActionError(null);
    try {
      await markPresent(profile.uid, profile.name, profile.employeeId || '');
      setSuccessStatus('present');
      setSuccessTime(new Date().toISOString());
      setShowSuccess(true);
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark attendance. Please try again.');
    }
  }, [profile, markPresent]);

  const handleMarkAbsent = useCallback(async () => {
    if (!profile) return;
    setActionError(null);
    try {
      await markAbsent(profile.uid, profile.name, profile.employeeId || '');
      setSuccessStatus('absent');
      setSuccessTime(null);
      setShowAbsentConfirm(false);
      setShowSuccess(true);
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark attendance. Please try again.');
      setShowAbsentConfirm(false);
    }
  }, [profile, markAbsent]);

  // If already marked today (e.g. completed mid-session), redirect
  useEffect(() => {
    if (todayRecord && !showSuccess) {
      onComplete();
    }
  }, [todayRecord, showSuccess, onComplete]);

  if (showSuccess) {
    return <AttendanceSuccessScreen status={successStatus} checkInTime={successTime} />;
  }

  const canMarkPresent =
    !locationLoading &&
    !attendanceLoading &&
    currentLocation !== null &&
    (!(settings?.requireLocation) || withinAllowedRadius === true);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-emerald-600 px-6 pt-12 pb-8 text-center">
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LeafIcon />
        </div>
        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">At GreenCup</p>
        <h1 className="text-2xl font-black text-white">Daily Attendance</h1>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-6 max-w-sm mx-auto w-full space-y-5">
        {/* Clock */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <LiveClock />
        </div>

        {/* Operator Info */}
        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shrink-0">
            {profile?.name?.charAt(0).toUpperCase() || 'O'}
          </div>
          <div>
            <p className="font-black text-gray-900 text-base leading-tight">{profile?.name}</p>
            {profile?.employeeId && (
              <p className="text-xs text-gray-400 font-medium mt-0.5">ID: {profile.employeeId}</p>
            )}
          </div>
        </div>

        {/* GPS Status */}
        <GPSStatusBadge
          loading={locationLoading}
          error={locationError}
          within={withinAllowedRadius}
          distance={distanceFromFactory}
        />

        {/* Retry GPS */}
        {(locationError || (withinAllowedRadius === false && distanceFromFactory !== null)) && settings && (
          <button
            onClick={() => fetchLocation(settings)}
            disabled={locationLoading}
            className="w-full h-11 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Location
          </button>
        )}

        {/* Action Error */}
        {actionError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleMarkPresent}
            disabled={!canMarkPresent}
            className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-sm transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none flex items-center justify-center gap-3"
          >
            {attendanceLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            Mark Present
          </button>

          <button
            onClick={() => setShowAbsentConfirm(true)}
            disabled={attendanceLoading}
            className="w-full h-12 border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Not Working Today
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Attendance can only be marked once per day.
        </p>
      </div>

      {/* Absent Confirm Dialog */}
      {showAbsentConfirm && (
        <ConfirmAbsentDialog
          onConfirm={handleMarkAbsent}
          onCancel={() => setShowAbsentConfirm(false)}
          loading={attendanceLoading}
        />
      )}
    </div>
  );
};
