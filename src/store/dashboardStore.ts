import { create } from 'zustand';

interface DashboardState {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  loading: boolean;
  setStats: (stats: { total: number; pending: number; approved: number; rejected: number }) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  loading: true,
  setStats: (stats) => set({ ...stats, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
