import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile, AuthState } from '../types';
import { subscribeAuthState } from '../services/auth.service';
import { getUserProfile, updateLastLogin } from '../services/users.service';
import { loginWithEmail, logout as logoutService } from '../services/auth.service';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => () => void;
  setError: (error: string | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  initialized: false,

  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),

  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const cred = await loginWithEmail(email, password);
      const profile = await getUserProfile(cred.user.uid);

      if (!profile) {
        await logoutService();
        set({ loading: false, error: 'Account not found. Contact your administrator.' });
        return;
      }

      if (!profile.active) {
        await logoutService();
        set({ loading: false, error: 'Account is inactive. Contact your administrator.' });
        return;
      }

      if (!['operator', 'employee'].includes(profile.role)) {
        await logoutService();
        set({ loading: false, error: 'Access denied. This app is for operators only.' });
        return;
      }

      await updateLastLogin(cred.user.uid);
      set({ user: cred.user, profile, loading: false, error: null });
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err?.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please wait and try again.'
        : 'Login failed. Please try again.';
      set({ loading: false, error: msg });
    }
  },

  logout: async () => {
    await logoutService();
    set({ user: null, profile: null, error: null });
  },

  init: () => {
    const unsub = subscribeAuthState(async (user: User | null) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile && profile.active && ['operator', 'employee'].includes(profile.role)) {
            set({ user, profile, loading: false, initialized: true });
          } else {
            await logoutService();
            set({ user: null, profile: null, loading: false, initialized: true });
          }
        } catch {
          set({ user: null, profile: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    });
    return unsub;
  },
}));
