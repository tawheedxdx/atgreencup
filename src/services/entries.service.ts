import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  query, where, orderBy, getDocs, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ProductionEntry, Product, Machine, Unit, Shift } from '../types';

const entriesCol = collection(db, 'entries');

// ─── Helpers ────────────────────────────────────────────────
const getTodayLoc = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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

export const getMonthProductionStats = async (uid: string): Promise<{ 
  monthBoxTotal: number; 
  monthPcsTotal: number; 
}> => {
  const currentMonthPrefix = getTodayLoc().substring(0, 7); // YYYY-MM
  const q = query(entriesCol, where('operatorUid', '==', uid));
  const snap = await getDocs(q);
  const entries = snap.docs
    .map(d => d.data() as ProductionEntry)
    .filter(e => e.productionDate?.startsWith(currentMonthPrefix));
  
  return {
    monthBoxTotal: entries.reduce((acc, curr) => acc + (curr.quantity || 0), 0),
    monthPcsTotal: entries.reduce((acc, curr) => acc + (curr.quantity2 || 0), 0),
  };
};

export const getTodayProductionStats = async (uid: string): Promise<{ 
  boxTotal: number; 
  pcsTotal: number; 
  approvedBox: number; 
  approvedPcs: number; 
}> => {
  const todayStr = getTodayLoc();
  const q = query(entriesCol, where('operatorUid', '==', uid));
  const snap = await getDocs(q);
  const entries = snap.docs
    .map(d => d.data() as ProductionEntry)
    .filter(e => e.productionDate === todayStr);
  
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

// ─── Analytics ───────────────────────────────────────────────
export const getWeeklyProductionStats = async (uid: string): Promise<{ 
  date: string; 
  box: number; 
  pcs: number; 
}[]> => {
  const today = new Date();
  const dateRange: string[] = [];
  const statsMap: Record<string, { label: string; box: number; pcs: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    // Format label based on the specific date d
    const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    statsMap[key] = { label, box: 0, pcs: 0 };
    dateRange.push(key);
  }

  const q = query(entriesCol, where('operatorUid', '==', uid));
  const snap = await getDocs(q);
  const entries = snap.docs.map(d => d.data() as ProductionEntry);

  entries.forEach(entry => {
    const key = entry.productionDate;
    if (key && statsMap[key]) {
      statsMap[key].box += (entry.quantity || 0);
      statsMap[key].pcs += (entry.quantity2 || 0);
    }
  });

  return dateRange.map(key => ({
    date: statsMap[key].label,
    box: Number(statsMap[key].box || 0),
    pcs: Number(statsMap[key].pcs || 0)
  }));
};

export const getEfficiencyStats = async (uid: string): Promise<{
  total: number;
  approved: number;
  rejected: number;
  percentage: number;
}> => {
  const q = query(entriesCol, where('operatorUid', '==', uid));
  const snap = await getDocs(q);
  const entries = snap.docs.map(d => d.data() as ProductionEntry);

  const total = entries.length;
  const approved = entries.filter(e => e.status === 'approved').length;
  const rejected = entries.filter(e => e.status === 'rejected').length;
  const percentage = total > 0 ? Math.round((approved / total) * 100) : 100;

  return { total, approved, rejected, percentage };
};
