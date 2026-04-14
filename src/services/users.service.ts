import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, EarningPeriodType } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
};

/** Returns the admin-assigned earningsPeriodType for the operator, or null if not set. */
export const getUserEarningsPeriod = async (uid: string): Promise<EarningPeriodType | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return (snap.data().earningsPeriodType as EarningPeriodType) ?? null;
};

export const updateLastLogin = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { lastLoginAt: serverTimestamp() });
};

export const updateUserProfilePhoto = async (uid: string, photoUrl: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { photoUrl });
};

export const updateEarningsPreference = async (uid: string, earningsViewPreference: 'weekly' | 'monthly'): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { earningsViewPreference });
};

