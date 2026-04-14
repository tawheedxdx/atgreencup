import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Earning, EarningPeriodType } from '../types';

const earningsCol = collection(db, 'earnings');

// ─── Fetch All Earnings for Operator ───────────────────────────
export const getMyEarnings = async (uid: string): Promise<Earning[]> => {
  // Query all earnings for the operator
  const q = query(
    earningsCol,
    where('operatorUid', '==', uid)
  );
  
  const snap = await getDocs(q);
  // Sort descending by productionDate (doing it locally to avoid index reqs if not created yet)
  const earnings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Earning));
  return earnings.sort((a, b) => b.productionDate.localeCompare(a.productionDate));
};

// ─── Fetch Earnings by Period ──────────────────────────────────
export const getEarningsByPeriod = async (uid: string, periodType: EarningPeriodType, periodKey: string): Promise<Earning[]> => {
  const q = query(
    earningsCol,
    where('operatorUid', '==', uid),
    where('periodType', '==', periodType),
    where('periodKey', '==', periodKey)
  );

  const snap = await getDocs(q);
  const earnings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Earning));
  return earnings.sort((a, b) => b.productionDate.localeCompare(a.productionDate));
};

// ─── Fetch Summary for Period ──────────────────────────────────
export const getEarningsSummary = async (uid: string, periodType: EarningPeriodType, periodKey: string): Promise<{
  forecasted: number;
  paid: number;
  unpaid: number;
}> => {
  const earnings = await getEarningsByPeriod(uid, periodType, periodKey);
  
  let forecasted = 0;
  let paid = 0;
  let unpaid = 0;

  earnings.forEach(earning => {
    // Only approved entries have earnings docs basically, but just in case sum them all
    forecasted += earning.calculatedAmount;
    
    if (earning.paymentStatus === 'paid') {
      paid += earning.calculatedAmount;
    } else if (earning.paymentStatus === 'pending_payment') {
      unpaid += earning.calculatedAmount;
    }
  });

  return { forecasted, paid, unpaid };
};

// ─── Fetch Single Earning by Entry ID ──────────────────────────
export const getEntryEarning = async (entryId: string): Promise<Earning | null> => {
  const q = query(
    earningsCol,
    where('entryId', '==', entryId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Earning;
};
