import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { ...snap.data(), uid: snap.id } as UserProfile;
};

export const updateLastLogin = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { lastLoginAt: serverTimestamp() });
};

export const getChatEligibleUsers = async (currentUid: string): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('active', '==', true));
  const snap = await getDocs(q);
  const users: UserProfile[] = [];
  
  snap.forEach(doc => {
    const data = doc.data() as UserProfile;
    // Client-side filtering for roles and excluding current user since Firestore IN queries are limited
    if (doc.id !== currentUid && (data.role === 'operator' || data.role === 'employee')) {
      users.push({ ...data, uid: doc.id });
    }
  });
  
  return users;
};
