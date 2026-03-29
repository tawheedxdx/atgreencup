import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  query, where, orderBy, getDocs, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ProductionEntry, Product, Machine, Unit, Shift } from '../types';

const entriesCol = collection(db, 'entries');

// ─── Create ──────────────────────────────────────────────────
export const createEntry = async (
  data: Omit<ProductionEntry, 'id' | 'status' | 'submittedAt' | 'updatedAt' | 'approvedAt' | 'approvedBy' | 'rejectionReason' | 'correctionMessage'>
): Promise<string> => {
  const ref = await addDoc(entriesCol, {
    ...data,
    status: 'pending',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    approvedAt: null,
    approvedBy: '',
    rejectionReason: '',
    correctionMessage: '',
  });
  return ref.id;
};

// ─── Read ────────────────────────────────────────────────────
export const getEntriesByOperator = async (uid: string): Promise<ProductionEntry[]> => {
  const q = query(entriesCol, where('operatorUid', '==', uid), orderBy('submittedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionEntry));
};

export const getEntryById = async (id: string): Promise<ProductionEntry | null> => {
  const snap = await getDoc(doc(db, 'entries', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ProductionEntry;
};

export const getTodayProductionStats = async (uid: string): Promise<{ 
  boxTotal: number; 
  pcsTotal: number; 
  approvedBox: number; 
  approvedPcs: number; 
}> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = Timestamp.fromDate(todayStart);

  const q = query(
    entriesCol,
    where('operatorUid', '==', uid),
    where('submittedAt', '>=', todayTs),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map(d => d.data() as ProductionEntry);
  
  const approvedEntries = entries.filter(e => e.status === 'approved');

  return {
    boxTotal: entries.reduce((acc, curr) => acc + (curr.quantity || 0), 0),
    pcsTotal: entries.reduce((acc, curr) => acc + (curr.quantity2 || 0), 0),
    approvedBox: approvedEntries.reduce((acc, curr) => acc + (curr.quantity || 0), 0),
    approvedPcs: approvedEntries.reduce((acc, curr) => acc + (curr.quantity2 || 0), 0),
  };
};

// ─── Update ──────────────────────────────────────────────────
export const updateEntry = async (id: string, data: Partial<ProductionEntry>): Promise<void> => {
  await updateDoc(doc(db, 'entries', id), { ...data, updatedAt: serverTimestamp() });
};

// ─── Delete ──────────────────────────────────────────────────
export const deleteEntry = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'entries', id));
};

// ─── Reference data ──────────────────────────────────────────
export const getProducts = async (): Promise<Product[]> => {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Product))
    .filter(p => p.active !== false);
};

export const getMachines = async (): Promise<Machine[]> => {
  const snap = await getDocs(collection(db, 'machines'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Machine))
    .filter(m => m.active !== false);
};

export const getUnits = async (): Promise<Unit[]> => {
  const snap = await getDocs(collection(db, 'units'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Unit))
    .filter(u => u.active !== false);
};

export const getShifts = async (): Promise<Shift[]> => {
  const snap = await getDocs(collection(db, 'shifts'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Shift))
    .filter(s => s.active !== false);
};

