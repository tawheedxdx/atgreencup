import { create } from 'zustand';
import type { ProductionEntry } from '../types';

interface EntriesState {
  entries: ProductionEntry[];
  loading: boolean;
  error: string | null;
  setEntries: (entries: ProductionEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  removeEntry: (id: string) => void;
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  loading: true,
  error: null,
  setEntries: (entries) => set({ entries, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  removeEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
}));
