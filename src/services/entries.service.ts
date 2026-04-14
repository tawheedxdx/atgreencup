import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc,
  query, where, orderBy, getDocs, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadEntryImage } from './storage.service';
import { compressImage } from '../utils/helpers';
import type { ProductionEntry, Product, Machine, Unit, Shift } from '../types';

const entriesCol = collection(db, 'entries');

// ─── File validation ─────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const validateImageFile = (file: File): void => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isAllowedType =
    ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_IMAGE_EXTS.includes(ext);
  if (!isAllowedType) {
    throw new Error('Unsupported image format. Please use JPG, PNG, WEBP, or HEIC.');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`Image is too large (${sizeMB} MB). Maximum allowed size is 10 MB.`);
  }
};

// ─── Safe orchestrated create: upload FIRST, then write to Firestore ─────────
/**
 * createProductionEntry — the ONLY safe way to create a production entry.
 *
 * Order of operations (atomic-safe):
 *   1. Validate file type & size
 *   2. Pre-generate Firestore doc reference (NO write yet)
 *   3. Compress + upload image to Storage
 *   4. Guard: ensure download URL was returned
 *   5. Write entry to Firestore WITH imageUrl already set
 *
 * If any step before (5) throws, Firestore is NEVER touched.
 */
export const createProductionEntry = async (
  data: Omit<
    ProductionEntry,
    | 'id' | 'status' | 'submittedAt' | 'updatedAt'
    | 'approvedAt' | 'approvedBy' | 'rejectionReason' | 'correctionMessage'
    | 'imageUrl' | 'imagePath'
  >,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> => {
  // 1. Validate file — throws on bad type or size
  validateImageFile(file);

  // 2. Pre-generate doc ref — collection reference only, NO Firestore write
  const entryRef = doc(entriesCol);

  // 3. Compress + upload — Firestore is untouched here
  const compressed = await compressImage(file);
  const { url, path } = await uploadEntryImage(entryRef.id, compressed, onProgress);

  // 4. Guard — belt-and-suspenders check
  if (!url || !path) {
    throw new Error('Image upload failed: could not retrieve download URL.');
  }

  // 5. ONLY NOW write to Firestore — guaranteed to have a valid imageUrl
  await setDoc(entryRef, {
    ...data,
    imageUrl: url,
    imagePath: path,
    status: 'pending',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    approvedAt: null,
    approvedBy: '',
    rejectionReason: '',
    correctionMessage: '',
  });

  return entryRef.id;
};

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
