// ─── Firebase / Firestore Types ──────────────────────────────
import type { Timestamp } from 'firebase/firestore';

// ─── Status ──────────────────────────────────────────────────
export type EntryStatus = 'pending' | 'approved' | 'rejected' | 'correction_requested';

export const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string }> = {
  pending:              { label: 'Pending',              color: '#F59E0B', bg: '#FEF3C7' },
  approved:             { label: 'Approved',             color: '#10B981', bg: '#D1FAE5' },
  rejected:             { label: 'Rejected',             color: '#EF4444', bg: '#FEE2E2' },
  correction_requested: { label: 'Correction Requested', color: '#8B5CF6', bg: '#EDE9FE' },
};

// ─── User ────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  active: boolean;
  assignedMachines: string[];
  assignedProducts: string[];
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}

// ─── Production Entry ────────────────────────────────────────
export interface ProductionEntry {
  id?: string;
  operatorUid: string;
  operatorName: string;
  employeeId: string;
  machineNo: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  quantity2?: number;
  unit2?: string;
  shift: string;
  productionDate: string; // ISO date string YYYY-MM-DD
  notes: string;
  imageUrl: string;
  imagePath: string;
  status: EntryStatus;
  submittedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  approvedAt: Timestamp | null;
  approvedBy: string;
  rejectionReason: string;
  correctionMessage: string;
}

// ─── Reference Data ──────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  defaultUnit: string;
  active: boolean;
}

export interface Machine {
  id: string;
  machineNo: string;
  label: string;
  active: boolean;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  active: boolean;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

// ─── Auth ────────────────────────────────────────────────────
export interface AuthState {
  user: import('firebase/auth').User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export * from './chat.types';
