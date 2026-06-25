import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import type { ProductionEntry, Product, Machine, IssueReport, UserProfile, Earning, IssueStatus, PaymentStatus } from '../types';

// Collections refs
const entriesCol = collection(db, 'entries');
const issuesCol = collection(db, 'issues');
const usersCol = collection(db, 'users');
const earningsCol = collection(db, 'earnings');
const attendanceCol = collection(db, 'attendance');
const salaryRulesCol = collection(db, 'salaryRules');
const productsCol = collection(db, 'products');
const machinesCol = collection(db, 'machines');

// Helper to format today's date YYYY-MM-DD
const getTodayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ─── Period Key Helper ───
const getPeriodKey = (dateStr: string, periodType: 'weekly' | 'monthly'): string => {
  if (periodType === 'monthly') {
    return dateStr.substring(0, 7); // YYYY-MM
  }
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
};

// ─── Real-time Dashboard Stats Listener ───
export const subscribeDashboardStats = (callback: (stats: any) => void) => {
  const today = getTodayDateStr();

  // Listeners to various parameters
  let pendingCount = 0;
  let todayPcs = 0;
  let openIssues = 0;
  let checkInsCount = 0;
  let todayEarnings = 0;
  let pendingPaymentsAmount = 0;
  let activeOpsCount = 0;

  const triggerCallback = () => {
    callback({
      pendingApprovals: pendingCount,
      todayProductionPcs: todayPcs,
      openIssues,
      todayAttendanceCount: checkInsCount,
      todayEarningsAmount: todayEarnings,
      pendingSalaryPaymentsAmount: pendingPaymentsAmount,
      activeOperators: activeOpsCount
    });
  };

  // 1. Pending Approvals count
  const qPending = query(entriesCol, where('status', '==', 'pending'));
  const unsubPending = onSnapshot(qPending, (snap) => {
    pendingCount = snap.size;
    triggerCallback();
  });

  // 2. Today's Production Pcs
  const qTodayProd = query(entriesCol, where('productionDate', '==', today));
  const unsubTodayProd = onSnapshot(qTodayProd, (snap) => {
    let sum = 0;
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'approved' || data.status === 'pending') {
        sum += data.pcs || data.quantity2 || 0;
      }
    });
    todayPcs = sum;
    triggerCallback();
  });

  // 3. Open Issues count
  const qOpenIssues = query(issuesCol, where('status', 'in', ['open', 'in_review']));
  const unsubOpenIssues = onSnapshot(qOpenIssues, (snap) => {
    openIssues = snap.size;
    triggerCallback();
  });

  // 4. Today's Attendance count
  const qTodayAttendance = query(attendanceCol, where('date', '==', today));
  const unsubAttendance = onSnapshot(qTodayAttendance, (snap) => {
    checkInsCount = snap.size;
    triggerCallback();
  });

  // 5. Today's Earnings
  const qTodayEarnings = query(earningsCol, where('productionDate', '==', today));
  const unsubTodayEarnings = onSnapshot(qTodayEarnings, (snap) => {
    let sum = 0;
    snap.docs.forEach((doc) => {
      sum += doc.data().calculatedAmount || 0;
    });
    todayEarnings = sum;
    triggerCallback();
  });

  // 6. Pending Salary Payments amount
  const qPendingPayments = query(earningsCol, where('paymentStatus', '==', 'pending_payment'));
  const unsubPendingPayments = onSnapshot(qPendingPayments, (snap) => {
    let sum = 0;
    snap.docs.forEach((doc) => {
      sum += doc.data().calculatedAmount || 0;
    });
    pendingPaymentsAmount = sum;
    triggerCallback();
  });

  // 7. Active Operators count (where role is 'operator' or 'employee' and active is true)
  const qActiveOps = query(usersCol, where('active', '==', true));
  const unsubActiveOps = onSnapshot(qActiveOps, (snap) => {
    const ops = snap.docs.filter(d => ['operator', 'employee'].includes(d.data().role));
    activeOpsCount = ops.length;
    triggerCallback();
  });

  // Return combined unsubscribe
  return () => {
    unsubPending();
    unsubTodayProd();
    unsubOpenIssues();
    unsubAttendance();
    unsubTodayEarnings();
    unsubPendingPayments();
    unsubActiveOps();
  };
};

// ─── Real-time Subscriptions ───
export const subscribePendingEntries = (callback: (entries: ProductionEntry[]) => void) => {
  const q = query(entriesCol, where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionEntry));
    callback(entries);
  });
};

export const subscribeAllEntries = (callback: (entries: ProductionEntry[]) => void) => {
  const q = query(entriesCol, orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionEntry));
    callback(entries);
  });
};

export const subscribeOpenIssues = (callback: (issues: IssueReport[]) => void) => {
  const q = query(issuesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const issues = snap.docs.map(d => ({ id: d.id, ...d.data() } as IssueReport));
    callback(issues);
  });
};

export const subscribeEmployees = (callback: (employees: UserProfile[]) => void) => {
  const q = query(usersCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const employees = snap.docs
      .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
      .filter(u => ['operator', 'employee'].includes(u.role));
    callback(employees);
  });
};

export const subscribeSalaryRules = (callback: (rules: any[]) => void) => {
  const q = query(salaryRulesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeProducts = (callback: (products: Product[]) => void) => {
  return onSnapshot(productsCol, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
  });
};

export const subscribeMachines = (callback: (machines: Machine[]) => void) => {
  return onSnapshot(machinesCol, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Machine)));
  });
};

// ─── Production Entry Approval Actions ───
export const approveEntry = async (entryId: string, adminUid: string) => {
  const entryRef = doc(db, 'entries', entryId);
  const entrySnap = await getDoc(entryRef);
  if (!entrySnap.exists()) throw new Error('Entry not found');

  const entry = { id: entrySnap.id, ...entrySnap.data() } as ProductionEntry;
  if (entry.status === 'approved') return;

  // 1. Fetch operator's profile to check earningsPeriodType
  const userRef = doc(db, 'users', entry.operatorUid);
  const userSnap = await getDoc(userRef);
  const userProfile = userSnap.exists() ? (userSnap.data() as UserProfile) : null;
  const periodType = userProfile?.earningsPeriodType || 'monthly';
  const periodKey = getPeriodKey(entry.productionDate, periodType);

  // 2. Lookup matching salary rate rule
  // Rule priorities:
  // a) Specific operator + Specific product
  // b) Default for product (operatorUid: 'all' + Specific product)
  // c) Fallback global default (operatorUid: 'all' + productId: 'all')
  const rulesSnap = await getDocs(salaryRulesCol);
  const rules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  let matchedRule = rules.find(r => r.operatorUid === entry.operatorUid && r.productId === entry.productId);
  if (!matchedRule) {
    matchedRule = rules.find(r => r.operatorUid === 'all' && r.productId === entry.productId);
  }
  if (!matchedRule) {
    matchedRule = rules.find(r => r.operatorUid === 'all' && r.productId === 'all');
  }

  // Fallback defaults if no rule found at all
  const rateAmount = matchedRule ? Number(matchedRule.rateAmount) : 1.0;
  const ratePerQuantity = matchedRule ? Number(matchedRule.ratePerQuantity) : 1000;

  // Compute earnings calculatedAmount
  const calculatedAmount = (entry.pcs / ratePerQuantity) * rateAmount;

  // 3. Write earning record
  const earningData: Earning = {
    entryId,
    operatorUid: entry.operatorUid,
    operatorName: entry.operatorName,
    employeeId: entry.employeeId,
    machineNo: entry.machineNo,
    productName: entry.productName,
    quantity: entry.pcs,
    unit: 'PCS',
    productionDate: entry.productionDate,
    approvedAt: Timestamp.now(),
    rateAmount,
    ratePerQuantity,
    calculatedAmount,
    currency: 'INR',
    periodType,
    periodKey,
    paymentStatus: 'pending_payment'
  };

  const earningQuery = query(earningsCol, where('entryId', '==', entryId));
  const existingEarnings = await getDocs(earningQuery);

  if (existingEarnings.empty) {
    await addDoc(earningsCol, earningData);
  }

  // 4. Update entry state to approved
  await updateDoc(entryRef, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    rejectionReason: '',
    correctionMessage: '',
    updatedAt: serverTimestamp()
  });
};

export const rejectEntry = async (entryId: string, reason: string, adminUid: string) => {
  await updateDoc(doc(db, 'entries', entryId), {
    status: 'rejected',
    rejectionReason: reason,
    approvedAt: null,
    approvedBy: adminUid,
    updatedAt: serverTimestamp()
  });

  // Delete matching earnings record if any exists
  const earningQuery = query(earningsCol, where('entryId', '==', entryId));
  const snap = await getDocs(earningQuery);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
};

export const requestCorrection = async (entryId: string, message: string, adminUid: string) => {
  await updateDoc(doc(db, 'entries', entryId), {
    status: 'correction_requested',
    correctionMessage: message,
    approvedAt: null,
    approvedBy: adminUid,
    updatedAt: serverTimestamp()
  });

  // Delete matching earnings record if any exists
  const earningQuery = query(earningsCol, where('entryId', '==', entryId));
  const snap = await getDocs(earningQuery);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
};

// ─── Attendance Services ───
export const checkInOperator = async (operatorUid: string, shift: string, time?: Date) => {
  const today = getTodayDateStr();

  // Load operator profile
  const userSnap = await getDoc(doc(db, 'users', operatorUid));
  if (!userSnap.exists()) throw new Error('Operator profile not found');
  const user = userSnap.data() as UserProfile;

  // Check if already checked in today
  const q = query(attendanceCol, where('operatorUid', '==', operatorUid), where('date', '==', today));
  const check = await getDocs(q);
  if (!check.empty) throw new Error('Operator already checked in today');

  const checkInTime = time ? Timestamp.fromDate(time) : Timestamp.now();

  await addDoc(attendanceCol, {
    operatorUid,
    operatorName: user.name,
    employeeId: user.employeeId || '',
    checkInTime,
    checkOutTime: null,
    date: today,
    status: 'present',
    shift
  });
};

export const checkOutOperator = async (attendanceId: string, time?: Date) => {
  const checkOutTime = time ? Timestamp.fromDate(time) : Timestamp.now();
  await updateDoc(doc(db, 'attendance', attendanceId), {
    checkOutTime
  });
};

export const getAttendanceLogs = async (dateStr: string) => {
  const q = query(attendanceCol, where('date', '==', dateStr));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── Issue Management Actions ───
export const updateIssueStatus = async (issueId: string, status: IssueStatus, adminNote: string, resolvedBy: string) => {
  const updates: any = {
    status,
    adminNote,
    updatedAt: serverTimestamp()
  };

  if (status === 'resolved' || status === 'closed') {
    updates.resolvedAt = serverTimestamp();
    updates.resolvedBy = resolvedBy;
  }

  await updateDoc(doc(db, 'issues', issueId), updates);
};

// ─── Employee Management ───
export const saveEmployeeProfile = async (uid: string, updates: Partial<UserProfile>) => {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const triggerPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const createEmployeeProfile = async (uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt' | 'lastLoginAt'>) => {
  await setDoc(doc(db, 'users', uid), {
    ...profile,
    createdAt: serverTimestamp(),
    lastLoginAt: null
  });
};

// ─── Salary Rules CRUD ───
export const saveSalaryRule = async (ruleId: string | null, rule: {
  operatorUid: string;
  operatorName: string;
  productId: string;
  productName: string;
  rateAmount: number;
  ratePerQuantity: number;
}) => {
  const data = {
    ...rule,
    createdAt: serverTimestamp()
  };

  if (ruleId) {
    await updateDoc(doc(db, 'salaryRules', ruleId), data);
  } else {
    await addDoc(salaryRulesCol, data);
  }
};

export const deleteSalaryRule = async (ruleId: string) => {
  await deleteDoc(doc(db, 'salaryRules', ruleId));
};

// ─── Salary Payments Actions ───
export const markEarningPaid = async (earningId: string, note?: string) => {
  await updateDoc(doc(db, 'earnings', earningId), {
    paymentStatus: 'paid',
    paidAt: serverTimestamp(),
    paymentNote: note || ''
  });
};

export const getPaymentHistory = async () => {
  const q = query(earningsCol, where('paymentStatus', '==', 'paid'), orderBy('paidAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Earning));
};

// ─── Products CRUD ───
export const saveProduct = async (productId: string | null, product: {
  name: string;
  sku: string;
  defaultUnit: string;
  active: boolean;
  packetsPerBox: number;
}) => {
  if (productId) {
    await updateDoc(doc(db, 'products', productId), product);
  } else {
    await addDoc(productsCol, {
      ...product,
      createdAt: serverTimestamp()
    });
  }
};

// ─── Machines CRUD ───
export const saveMachine = async (machineId: string | null, machine: {
  machineNo: string;
  label: string;
  active: boolean;
  assignedProductId: string;
  assignedProductName: string;
}) => {
  if (machineId) {
    await updateDoc(doc(db, 'machines', machineId), machine);
  } else {
    await addDoc(machinesCol, {
      ...machine,
      createdAt: serverTimestamp()
    });
  }
};
