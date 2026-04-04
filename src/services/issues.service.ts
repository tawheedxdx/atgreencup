import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { IssueReport } from '../types';

const issuesCol = collection(db, 'issues');

// ─── Create ──────────────────────────────────────────────────
export const createIssueReport = async (
  data: Omit<
    IssueReport,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'adminNote' | 'resolvedAt' | 'resolvedBy' | 'resolutionType'
  >
): Promise<string> => {
  const ref = await addDoc(issuesCol, {
    ...data,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    adminNote: '',
    resolvedAt: null,
    resolvedBy: '',
    resolutionType: '',
  });
  return ref.id;
};

// ─── Read ────────────────────────────────────────────────────
export const getMyIssues = async (uid: string): Promise<IssueReport[]> => {
  const q = query(issuesCol, where('operatorUid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as IssueReport));
};

export const getIssueById = async (id: string): Promise<IssueReport | null> => {
  const snap = await getDoc(doc(db, 'issues', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as IssueReport;
};

// ─── Update ──────────────────────────────────────────────────
export const updateIssueReport = async (
  id: string,
  data: Partial<IssueReport>
): Promise<void> => {
  await updateDoc(doc(db, 'issues', id), { ...data, updatedAt: serverTimestamp() });
};
export const deleteIssueReport = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'issues', id));
};
