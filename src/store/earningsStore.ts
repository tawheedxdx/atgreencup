import { create } from 'zustand';
import { getEarningsByPeriod } from '../services/earnings.service';
import type { Earning, EarningPeriodType } from '../types';
import { getCurrentPeriodKey } from '../utils/helpers';

interface EarningsState {
  /** What the admin assigned to this operator */
  assignedPeriod: EarningPeriodType | null;
  /** What the operator has currently selected in the UI */
  selectedPeriod: EarningPeriodType;
  /** True when selectedPeriod !== assignedPeriod */
  isRestricted: boolean;

  // Legacy alias kept for backwards-compat with any store reads in other components
  periodType: EarningPeriodType;
  periodKey: string;

  earnings: Earning[];
  loading: boolean;
  error: string | null;
  forecasted: number;
  paid: number;
  unpaid: number;

  /**
   * Called once on page mount.
   * Sets the assigned period and immediately fetches earnings for it.
   */
  initPeriod: (assigned: EarningPeriodType | null | undefined, uid: string) => Promise<void>;

  /**
   * Called when the operator taps a period option in the toggle.
   * Enforces the restriction: only fetches data if the selected period matches assigned.
   */
  selectPeriod: (type: EarningPeriodType) => Promise<void>;

  /**
   * @internal — kept so existing usages in components that passed uid still compile.
   * Prefer initPeriod / selectPeriod going forward.
   */
  setPeriodType: (type: EarningPeriodType, uid?: string) => Promise<void>;

  fetchEarnings: (uid: string) => Promise<void>;

  /** The uid stored after initPeriod so selectPeriod can refetch without prop-drilling */
  _uid: string | null;
}

const EMPTY_SUMMARY = { earnings: [] as Earning[], forecasted: 0, paid: 0, unpaid: 0 };

export const useEarningsStore = create<EarningsState>((set, get) => ({
  assignedPeriod: null,
  selectedPeriod: 'weekly',
  isRestricted: false,
  periodType: 'weekly',
  periodKey: '',
  earnings: [],
  loading: false,
  error: null,
  forecasted: 0,
  paid: 0,
  unpaid: 0,
  _uid: null,

  // ─── Init ────────────────────────────────────────────────────────
  initPeriod: async (assigned, uid) => {
    const effectivePeriod: EarningPeriodType = assigned ?? 'weekly';
    set({
      assignedPeriod: effectivePeriod,
      selectedPeriod: effectivePeriod,
      periodType: effectivePeriod,
      isRestricted: false,
      _uid: uid,
    });
    await get().fetchEarnings(uid);
  },

  // ─── Select (enforces restriction) ───────────────────────────────
  selectPeriod: async (type) => {
    const { assignedPeriod, _uid } = get();

    set({ selectedPeriod: type, periodType: type });

    if (type !== assignedPeriod) {
      // Wrong period — block and clear data
      set({ isRestricted: true, ...EMPTY_SUMMARY });
      return;
    }

    // Correct period — fetch normally
    set({ isRestricted: false });
    if (_uid) {
      await get().fetchEarnings(_uid);
    }
  },

  // ─── Legacy setPeriodType (backwards-compat) ──────────────────────
  setPeriodType: async (type, uid) => {
    set({ periodType: type, selectedPeriod: type });
    if (uid) {
      await get().fetchEarnings(uid);
    }
  },

  // ─── Fetch ───────────────────────────────────────────────────────
  fetchEarnings: async (uid) => {
    const { periodType } = get();
    const periodKey = getCurrentPeriodKey(periodType);
    set({ loading: true, error: null, periodKey });

    try {
      const data = await getEarningsByPeriod(uid, periodType, periodKey);

      let forecasted = 0;
      let paid = 0;
      let unpaid = 0;

      data.forEach(earning => {
        forecasted += earning.calculatedAmount;
        if (earning.paymentStatus === 'paid') {
          paid += earning.calculatedAmount;
        } else if (earning.paymentStatus === 'pending_payment') {
          unpaid += earning.calculatedAmount;
        }
      });

      set({ earnings: data, forecasted, paid, unpaid });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch earnings' });
    } finally {
      set({ loading: false });
    }
  },
}));
