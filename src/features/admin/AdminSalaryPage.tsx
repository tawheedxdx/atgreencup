import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  subscribeSalaryRules,
  saveSalaryRule,
  deleteSalaryRule,
  subscribeEmployees,
  subscribeProducts,
  markEarningPaid
} from '../../services/admin.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import type { UserProfile, Product, Earning } from '../../types';

export const AdminSalaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'unpaid' | 'history'>('rules');
  
  // Data lists
  const [rules, setRules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unpaidEarnings, setUnpaidEarnings] = useState<Earning[]>([]);
  const [paidHistory, setPaidHistory] = useState<Earning[]>([]);

  // Loading states
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingUnpaid, setLoadingUnpaid] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Modal State for Rule Add/Edit
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [selectedOperatorUid, setSelectedOperatorUid] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [rateAmount, setRateAmount] = useState<number>(1.0);
  const [ratePerQuantity, setRatePerQuantity] = useState<number>(1000);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);

  // Modal State for Payment Processing
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [earningToPay, setEarningToPay] = useState<Earning | null>(null);
  const [paymentNote, setPaymentNote] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Subscriptions
  useEffect(() => {
    // 1. Subscribe to Rules
    const unsubRules = subscribeSalaryRules((list) => {
      setRules(list);
      setLoadingRules(false);
    });

    // 2. Subscribe to Employees (to populate dropdown)
    const unsubEmployees = subscribeEmployees((list) => {
      setEmployees(list);
    });

    // 3. Subscribe to Products (to populate dropdown)
    const unsubProducts = subscribeProducts((list) => {
      setProducts(list);
    });

    // 4. Subscribe to Unpaid Earnings
    const qUnpaid = query(
      collection(db, 'earnings'),
      where('paymentStatus', '==', 'pending_payment'),
      orderBy('productionDate', 'desc')
    );
    const unsubUnpaid = onSnapshot(qUnpaid, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Earning));
      setUnpaidEarnings(list);
      setLoadingUnpaid(false);
    }, (err) => {
      console.error('Error fetching unpaid earnings:', err);
      setLoadingUnpaid(false);
    });

    // 5. Subscribe to Paid Earnings
    const qPaid = query(
      collection(db, 'earnings'),
      where('paymentStatus', '==', 'paid'),
      orderBy('paidAt', 'desc')
    );
    const unsubPaid = onSnapshot(qPaid, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Earning));
      setPaidHistory(list);
      setLoadingHistory(false);
    }, (err) => {
      console.error('Error fetching paid history:', err);
      setLoadingHistory(false);
    });

    return () => {
      unsubRules();
      unsubEmployees();
      unsubProducts();
      unsubUnpaid();
      unsubPaid();
    };
  }, []);

  // ─── Rules CRUD Handlers ───
  const handleOpenAddRule = () => {
    setEditingRule(null);
    setSelectedOperatorUid('all');
    setSelectedProductId('all');
    setRateAmount(1.0);
    setRatePerQuantity(1000);
    setRuleError(null);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: any) => {
    setEditingRule(rule);
    setSelectedOperatorUid(rule.operatorUid);
    setSelectedProductId(rule.productId);
    setRateAmount(rule.rateAmount);
    setRatePerQuantity(rule.ratePerQuantity);
    setRuleError(null);
    setIsRuleModalOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this salary rule? This will fallback calculations to defaults.')) return;
    try {
      await deleteSalaryRule(ruleId);
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateAmount <= 0 || ratePerQuantity <= 0) {
      setRuleError('Rate amount and quantity must be greater than zero.');
      return;
    }

    setRuleError(null);
    setRuleSubmitting(true);

    try {
      // Find names for stored references
      const operatorName = selectedOperatorUid === 'all' 
        ? 'All Operators' 
        : (employees.find(e => e.uid === selectedOperatorUid)?.name || 'Unknown Operator');
      const productName = selectedProductId === 'all' 
        ? 'All Products' 
        : (products.find(p => p.id === selectedProductId)?.name || 'Unknown Product');

      await saveSalaryRule(editingRule ? editingRule.id : null, {
        operatorUid: selectedOperatorUid,
        operatorName,
        productId: selectedProductId,
        productName,
        rateAmount,
        ratePerQuantity
      });
      setIsRuleModalOpen(false);
    } catch (err: any) {
      setRuleError(err.message || 'Failed to save rule');
    } finally {
      setRuleSubmitting(false);
    }
  };

  // ─── Payment Processing Handlers ───
  const handleOpenPay = (earning: Earning) => {
    setEarningToPay(earning);
    setPaymentNote('');
    setPayError(null);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earningToPay?.id) return;

    setPayError(null);
    setPaySubmitting(true);

    try {
      await markEarningPaid(earningToPay.id, paymentNote.trim());
      setIsPayModalOpen(false);
    } catch (err: any) {
      setPayError(err.message || 'Failed to process payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Salary & Earnings" />

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-1 shadow-sm flex mb-6">
          {(['rules', 'unpaid', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white shadow-premium'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-emerald-400'
              }`}
            >
              {tab === 'rules' ? 'Salary Rules' : tab === 'unpaid' ? 'Unpaid Earnings' : 'Paid History'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="px-4">
        {activeTab === 'rules' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Rate Rules</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Define payout rates for production pieces</p>
              </div>
              <Button size="sm" onClick={handleOpenAddRule} className="!rounded-2xl">
                + Add Rule
              </Button>
            </div>

            {loadingRules ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : rules.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">No salary rules defined yet.</p>
                <p className="text-[10px] mt-1">Default backup rate is ₹1.00 per 1000 PCS.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-gray-900 dark:text-emerald-50">{rule.operatorName}</span>
                        <span className="text-[9px] font-black uppercase text-gray-300 dark:text-gray-600">→</span>
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg px-2 py-0.5 rounded-lg border border-gray-100/50 dark:border-dark-border">{rule.productName}</span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span>Rate:</span>
                        <span className="font-black text-sm">₹{rule.rateAmount.toFixed(2)}</span>
                        <span className="text-gray-400 dark:text-gray-500 font-normal">per</span>
                        <span className="font-black">{rule.ratePerQuantity} PCS</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditRule(rule)}
                        className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400 p-2.5 rounded-2xl active:scale-[0.95] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2.5 rounded-2xl active:scale-[0.95] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'unpaid' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Unpaid Ledger</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Approved production waiting for settlement</p>
            </div>

            {loadingUnpaid ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : unpaidEarnings.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">All approved earnings have been settled!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpaidEarnings.map((earn) => (
                  <div
                    key={earn.id}
                    className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50">{earn.operatorName}</h4>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          ID: {earn.employeeId || 'N/A'} • {earn.productionDate}
                        </p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{earn.calculatedAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 bg-gray-50 dark:bg-dark-bg p-3 rounded-2xl flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border border-gray-100/50 dark:border-dark-border/40">
                      <div>
                        <div className="font-bold text-gray-800 dark:text-emerald-100">{earn.productName}</div>
                        <div className="text-[10px] mt-0.5">Qty: {earn.quantity} PCS (Machine: {earn.machineNo})</div>
                      </div>
                      <div className="text-[10px] text-right">
                        <div>Rate: ₹{earn.rateAmount}</div>
                        <div>per {earn.ratePerQuantity} PCS</div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center gap-2">
                      <span className="text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-600 px-2 py-0.5 rounded-full tracking-wider">
                        Pending Period: {earn.periodKey}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenPay(earn)}
                        className="!h-8 !px-3 !text-[11px] !rounded-xl"
                      >
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Payout History</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Logs of settled operator payments</p>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : paidHistory.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">No paid history available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paidHistory.map((earn) => (
                  <div
                    key={earn.id}
                    className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm opacity-85 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50">{earn.operatorName}</h4>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          Production: {earn.productionDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900 dark:text-emerald-100">
                          ₹{earn.calculatedAmount.toFixed(2)}
                        </span>
                        <div className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-wider bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full inline-block">
                          Paid
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-50 dark:bg-dark-bg p-3 rounded-2xl text-[10px] text-gray-400 dark:text-gray-500 space-y-1 border border-gray-100/50 dark:border-dark-border/40">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-600 dark:text-gray-400">Product/Qty:</span>
                        <span className="text-gray-700 dark:text-emerald-100">{earn.productName} ({earn.quantity} PCS)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-600 dark:text-gray-400">Paid On:</span>
                        <span className="text-gray-700 dark:text-emerald-100">
                          {earn.paidAt ? new Date(earn.paidAt.seconds * 1000).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {earn.paymentNote && (
                        <div className="mt-1 pt-1 border-t border-gray-100 dark:border-dark-border/50 text-emerald-600 dark:text-emerald-400 font-bold italic">
                          Note: "{earn.paymentNote}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Salary Rule Modal */}
      <AnimatePresence>
        {isRuleModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">
                  {editingRule ? 'Edit Salary Rule' : 'New Salary Rule'}
                </h3>
                <button
                  onClick={() => setIsRuleModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRuleSubmit} className="space-y-4">
                {ruleError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
                    {ruleError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Operator / Employee</label>
                  <select
                    value={selectedOperatorUid}
                    onChange={(e) => setSelectedOperatorUid(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="all">All Operators (Default)</option>
                    {employees.map(emp => (
                      <option key={emp.uid} value={emp.uid}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="all">All Products (Default)</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rate (INR)*</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min={0.01}
                      value={rateAmount}
                      onChange={(e) => setRateAmount(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Per Qty (PCS)*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={ratePerQuantity}
                      onChange={(e) => setRatePerQuantity(Number(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    fullWidth
                    loading={ruleSubmitting}
                    className="!rounded-2xl"
                  >
                    {editingRule ? 'Save Changes' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pay Confirmation Modal */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">
                  Process Payout
                </h3>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                {payError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
                    {payError}
                  </div>
                )}

                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  <div className="flex justify-between font-black text-sm mb-2 border-b border-emerald-200/50 dark:border-emerald-800/30 pb-2">
                    <span>Operator:</span>
                    <span>{earningToPay?.operatorName}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="opacity-75">Product:</span>
                      <span>{earningToPay?.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Production Qty:</span>
                      <span>{earningToPay?.quantity} PCS</span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-300 pt-1 text-sm">
                      <span>Payout Amount:</span>
                      <span>₹{earningToPay?.calculatedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Payment Note / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Transfer #TXN12345"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    fullWidth
                    loading={paySubmitting}
                    className="!rounded-2xl"
                  >
                    Confirm Paid
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
