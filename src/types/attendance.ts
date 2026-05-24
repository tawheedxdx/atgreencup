import type { Timestamp } from 'firebase/firestore';

// ─── Attendance Status ────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

// ─── Attendance Record ────────────────────────────────────────
export interface AttendanceRecord {
  id?: string;               // {uid}_{yyyy-mm-dd}
  operatorUid: string;
  operatorName: string;
  employeeId: string;
  date: string;              // YYYY-MM-DD
  checkInTime: string | null; // ISO string
  status: AttendanceStatus;
  latitude: number | null;
  longitude: number | null;
  distanceFromFactory: number | null; // metres
  withinAllowedRadius: boolean;
  locationVerified: boolean;
  deviceInfo: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ─── Attendance Settings (from attendanceSettings/default) ───
export interface AttendanceSettings {
  factoryLatitude: number;
  factoryLongitude: number;
  allowedRadiusMeters: number;
  requireLocation: boolean;
}

// ─── GPS Location ─────────────────────────────────────────────
export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// ─── Attendance Store State ───────────────────────────────────
export interface AttendanceState {
  attendanceChecked: boolean;
  attendanceLoading: boolean;
  todayRecord: AttendanceRecord | null;

  locationLoading: boolean;
  locationError: string | null;
  currentLocation: GPSLocation | null;
  withinAllowedRadius: boolean | null;
  distanceFromFactory: number | null;

  settings: AttendanceSettings | null;
  settingsLoading: boolean;
}
