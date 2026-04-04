import { create } from 'zustand';
import type { IssueReport } from '../types';

interface IssuesState {
  issues: IssueReport[];
  loading: boolean;
  error: string | null;
  setIssues: (issues: IssueReport[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  removeIssue: (id: string) => void;
}

export const useIssuesStore = create<IssuesState>((set) => ({
  issues: [],
  loading: true,
  error: null,
  setIssues: (issues) => set({ issues, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  removeIssue: (id) =>
    set((state) => ({ issues: state.issues.filter((i) => i.id !== id) })),
}));
