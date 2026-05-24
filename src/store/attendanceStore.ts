import { create } from 'zustand';
import type { AttendanceState, GPSLocation, AttendanceRecord, AttendanceSettings } from '../types/attendance';
import {
  getTodayAttendance,
  getAttendanceSettings,
  requestGPSLocation,
  calculateDistance,
  markAttendance as markAttendanceService,
  markAbsent as markAbsentService,
} from '../services/attendance.service';

interface AttendanceStore extends AttendanceState {
  // Actions
  checkTodayAttendance: (uid: string) => Promise<void>;
  fetchLocation: (settings: AttendanceSettings) => Promise<void>;
  markPresent: (uid: string, name: string, employeeId: string) => Promise<void>;
  markAbsent: (uid: string, name: string, employeeId: string) => Promise<void>;
  reset: () => void;
}

const initialState: AttendanceState = {
  attendanceChecked: false,
  attendanceLoading: false,
  todayRecord: null,

  locationLoading: false,
  locationError: null,
  currentLocation: null,
  withinAllowedRadius: null,
  distanceFromFactory: null,

  settings: null,
  settingsLoading: false,
};

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  ...initialState,

  checkTodayAttendance: async (uid) => {
    set({ attendanceLoading: true, settingsLoading: true });
    try {
      const [record, settings] = await Promise.all([
        getTodayAttendance(uid),
        getAttendanceSettings(),
      ]);
      set({
        todayRecord: record,
        settings,
        attendanceChecked: true,
        attendanceLoading: false,
        settingsLoading: false,
      });
    } catch {
      set({
        attendanceChecked: true,
        attendanceLoading: false,
        settingsLoading: false,
      });
    }
  },

  fetchLocation: async (settings) => {
    set({ locationLoading: true, locationError: null });
    try {
      const location = await requestGPSLocation();
      const distance = settings.factoryLatitude && settings.factoryLongitude
        ? calculateDistance(
            location.latitude, location.longitude,
            settings.factoryLatitude, settings.factoryLongitude
          )
        : 0;
      const within = !settings.requireLocation || distance <= settings.allowedRadiusMeters;
      set({
        currentLocation: location,
        distanceFromFactory: Math.round(distance),
        withinAllowedRadius: within,
        locationLoading: false,
        locationError: null,
      });
    } catch (err: any) {
      set({
        locationLoading: false,
        locationError: err.message || 'Failed to get location.',
        currentLocation: null,
        withinAllowedRadius: false,
      });
    }
  },

  markPresent: async (uid, name, employeeId) => {
    const { currentLocation, distanceFromFactory, withinAllowedRadius, settings } = get();
    if (!currentLocation) throw new Error('Location not available.');
    if (settings?.requireLocation && !withinAllowedRadius) {
      throw new Error('You are outside the allowed attendance area.');
    }
    set({ attendanceLoading: true });
    try {
      const record = await markAttendanceService(
        uid, name, employeeId,
        currentLocation,
        distanceFromFactory ?? 0,
        withinAllowedRadius ?? false,
      );
      set({ todayRecord: record, attendanceLoading: false });
    } catch (err) {
      set({ attendanceLoading: false });
      throw err;
    }
  },

  markAbsent: async (uid, name, employeeId) => {
    set({ attendanceLoading: true });
    try {
      const record = await markAbsentService(uid, name, employeeId);
      set({ todayRecord: record, attendanceLoading: false });
    } catch (err) {
      set({ attendanceLoading: false });
      throw err;
    }
  },

  reset: () => set(initialState),
}));
