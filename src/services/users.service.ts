import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
};

export const updateLastLogin = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { lastLoginAt: serverTimestamp() });
};

export const updateUserProfilePhoto = async (uid: string, photoUrl: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { photoUrl });
};
