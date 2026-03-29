import { create } from 'zustand';

interface DashboardState {
  boxTotal: number;
  pcsTotal: number;
  approvedBox: number;
  approvedPcs: number;
  monthBoxTotal: number;
  monthPcsTotal: number;
  loading: boolean;
  setStats: (stats: { 
    boxTotal: number; 
    pcsTotal: number; 
    approvedBox: number; 
    approvedPcs: number;
    monthBoxTotal: number;
    monthPcsTotal: number;
  }) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  boxTotal: 0,
  pcsTotal: 0,
  approvedBox: 0,
  approvedPcs: 0,
  monthBoxTotal: 0,
  monthPcsTotal: 0,
  loading: true,
  setStats: (stats) => set({ ...stats, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
