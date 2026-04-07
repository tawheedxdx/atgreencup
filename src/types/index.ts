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

// ─── Issue Types ─────────────────────────────────────────────
export type IssueType =
  | 'machine_issue'
  | 'production_defect'
  | 'raw_material_shortage'
  | 'maintenance_need';

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export type IssueStatus =
  | 'open'
  | 'in_review'
  | 'resolved'
  | 'closed'
  | 'needs_more_info';

export const ISSUE_TYPE_CONFIG: Record<
  IssueType,
  { label: string; color: string; bg: string; icon: string }
> = {
  machine_issue:         { label: 'Machine Issue',         color: '#F59E0B', bg: '#FEF3C7', icon: '⚙️' },
  production_defect:     { label: 'Production Defect',     color: '#EF4444', bg: '#FEE2E2', icon: '⚠️' },
  raw_material_shortage: { label: 'Raw Material Shortage', color: '#8B5CF6', bg: '#EDE9FE', icon: '📦' },
  maintenance_need:      { label: 'Maintenance Need',      color: '#3B82F6', bg: '#DBEAFE', icon: '🔧' },
};

export const ISSUE_PRIORITY_CONFIG: Record<
  IssuePriority,
  { label: string; color: string; bg: string }
> = {
  low:    { label: 'Low',    color: '#6B7280', bg: '#F3F4F6' },
  medium: { label: 'Medium', color: '#F59E0B', bg: '#FEF3C7' },
  high:   { label: 'High',   color: '#EF4444', bg: '#FEE2E2' },
  urgent: { label: 'Urgent', color: '#DC2626', bg: '#FFE4E6' },
};

export const ISSUE_STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; color: string; bg: string }
> = {
  open:            { label: 'Open',       color: '#3B82F6', bg: '#DBEAFE' },
  in_review:       { label: 'In Review',  color: '#F59E0B', bg: '#FEF3C7' },
  resolved:        { label: 'Resolved',   color: '#10B981', bg: '#D1FAE5' },
  closed:          { label: 'Closed',     color: '#6B7280', bg: '#F3F4F6' },
  needs_more_info: { label: 'Needs Info', color: '#8B5CF6', bg: '#EDE9FE' },
};

// ─── Issue Report ─────────────────────────────────────────────
export interface IssueReport {
  id?: string;
  operatorUid: string;
  operatorName: string;
  employeeId: string;
  issueType: IssueType;
  machineNo: string;
  description: string;
  photoUrl: string;
  photoPath: string;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  adminNote: string;
  resolvedAt: Timestamp | null;
  resolvedBy: string;
  resolutionType: string;
}

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
  photoUrl?: string;
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
