import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AttendanceRecord, AttendanceSettings, GPSLocation, AttendanceStatus } from '../types/attendance';

const attendanceCol = 'attendance';
const settingsDoc = 'attendanceSettings/default';

// ─── Date Helper ──────────────────────────────────────────────
export const getTodayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ─── Document ID ──────────────────────────────────────────────
const getAttendanceId = (uid: string, date: string) => `${uid}_${date}`;

// ─── Get Today's Attendance ───────────────────────────────────
export const getTodayAttendance = async (uid: string): Promise<AttendanceRecord | null> => {
  const date = getTodayDateString();
  const id = getAttendanceId(uid, date);
  const snap = await getDoc(doc(db, attendanceCol, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AttendanceRecord;
};

// ─── Get Attendance Settings ──────────────────────────────────
export const getAttendanceSettings = async (): Promise<AttendanceSettings> => {
  const snap = await getDoc(doc(db, settingsDoc));
  if (!snap.exists()) {
    // Fallback defaults if not configured in Firebase
    return {
      factoryLatitude: 0,
      factoryLongitude: 0,
      allowedRadiusMeters: 200,
      requireLocation: true,
    };
  }
  return snap.data() as AttendanceSettings;
};

// ─── Calculate Distance (Haversine Formula) ───────────────────
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number => {
  const R = 6371000; // Earth radius in metres
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Get Device Info ─────────────────────────────────────────
const getDeviceInfo = (): string => {
  return navigator.userAgent.substring(0, 200);
};

// ─── Mark Present ─────────────────────────────────────────────
export const markAttendance = async (
  uid: string,
  name: string,
  employeeId: string,
  location: GPSLocation,
  distanceFromFactory: number,
  withinAllowedRadius: boolean,
): Promise<AttendanceRecord> => {
  const date = getTodayDateString();
  const id = getAttendanceId(uid, date);
  const now = new Date().toISOString();

  // Guard: prevent double submission
  const existing = await getTodayAttendance(uid);
  if (existing) throw new Error('Attendance already marked for today.');

  const record: Omit<AttendanceRecord, 'id'> = {
    operatorUid: uid,
    operatorName: name,
    employeeId,
    date,
    checkInTime: now,
    status: 'present',
    latitude: location.latitude,
    longitude: location.longitude,
    distanceFromFactory,
    withinAllowedRadius,
    locationVerified: withinAllowedRadius,
    deviceInfo: getDeviceInfo(),
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, attendanceCol, id), record);
  return { id, ...record };
};

// ─── Mark Absent ──────────────────────────────────────────────
export const markAbsent = async (
  uid: string,
  name: string,
  employeeId: string,
): Promise<AttendanceRecord> => {
  const date = getTodayDateString();
  const id = getAttendanceId(uid, date);

  const existing = await getTodayAttendance(uid);
  if (existing) throw new Error('Attendance already marked for today.');

  const record: Omit<AttendanceRecord, 'id'> = {
    operatorUid: uid,
    operatorName: name,
    employeeId,
    date,
    checkInTime: null,
    status: 'absent',
    latitude: null,
    longitude: null,
    distanceFromFactory: null,
    withinAllowedRadius: false,
    locationVerified: false,
    deviceInfo: getDeviceInfo(),
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, attendanceCol, id), record);
  return { id, ...record };
};

// ─── Request GPS Location ─────────────────────────────────────
export const requestGPSLocation = (): Promise<GPSLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is not supported on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please allow location access in your browser settings.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable. Please check your GPS signal.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Failed to get location. Please try again.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};
