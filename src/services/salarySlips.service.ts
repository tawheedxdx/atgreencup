import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SalarySlip } from '../types';

const salarySlipsCol = collection(db, 'salarySlips');

/**
 * Subscribes to salary slips generated for the logged-in operator.
 * Realtime Firestore listener.
 */
export const subscribeToSalarySlips = (
  uid: string,
  onUpdate: (slips: SalarySlip[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    salarySlipsCol,
    where('operatorUid', '==', uid)
  );

  return onSnapshot(
    q,
    (snap) => {
      const slips = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        } as SalarySlip))
        .filter((s: any) => !s.deleted && !s.isDeleted && s.status !== 'deleted' && s.paymentStatus !== 'deleted');
      
      // Sort newest first by generatedDate, then slipNumber if dates match
      slips.sort((a, b) => {
        const dateCompare = (b.generatedDate || '').localeCompare(a.generatedDate || '');
        if (dateCompare !== 0) return dateCompare;
        return (b.slipNumber || '').localeCompare(a.slipNumber || '');
      });

      onUpdate(slips);
    },
    onError
  );
};

/**
 * Retrieves a single salary slip by ID.
 */
export const getSalarySlipById = async (id: string): Promise<SalarySlip | null> => {
  try {
    const snap = await getDoc(doc(db, 'salarySlips', id));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    if (data.deleted || data.isDeleted || data.status === 'deleted' || data.paymentStatus === 'deleted') {
      return null;
    }
    return { id: snap.id, ...data } as SalarySlip;
  } catch (err) {
    console.error('Error fetching salary slip:', err);
    throw err;
  }
};
