import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FactorySettings {
  factoryName: string;
  factoryAddress: string;
  contactNumber: string;
  managerEmail: string;
  shiftStartTime: string;
  shiftEndTime: string;
  gracePeriodMinutes: number;
}

interface AdminSettingsState {
  settings: FactorySettings;
  updateSettings: (updates: Partial<FactorySettings>) => void;
}

const defaultSettings: FactorySettings = {
  factoryName: 'At GreenCup HQ',
  factoryAddress: 'Plot 42, Green Energy Park, Industrial Zone',
  contactNumber: '+91 98765 43210',
  managerEmail: 'admin@greencup.com',
  shiftStartTime: '08:00',
  shiftEndTime: '17:00',
  gracePeriodMinutes: 15,
};

export const useAdminSettingsStore = create<AdminSettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    {
      name: 'greencup-admin-settings',
    }
  )
);
