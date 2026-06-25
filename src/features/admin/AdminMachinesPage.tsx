import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeMachines, subscribeProducts, saveMachine } from '../../services/admin.service';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import type { Machine, Product } from '../../types';

export const AdminMachinesPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // Form State
  const [machineNo, setMachineNo] = useState('');
  const [label, setLabel] = useState('');
  const [assignedProductId, setAssignedProductId] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubMachines = subscribeMachines((list) => {
      setMachines(list);
      setLoading(false);
    });

    const unsubProducts = subscribeProducts((list) => {
      setProducts(list.filter(p => p.active));
    });

    return () => {
      unsubMachines();
      unsubProducts();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingMachine(null);
    setMachineNo('');
    setLabel('');
    setAssignedProductId('');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mac: Machine) => {
    setEditingMachine(mac);
    setMachineNo(mac.machineNo || '');
    setLabel(mac.label || '');
    setAssignedProductId(mac.assignedProductId || '');
    setActive(mac.active !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (machineId: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete "${label}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'machines', machineId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete machine');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineNo.trim() || !label.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const product = products.find(p => p.id === assignedProductId);
    const assignedProductName = product ? product.name : '';

    try {
      await saveMachine(editingMachine ? editingMachine.id : null, {
        machineNo: machineNo.trim(),
        label: label.trim(),
        active,
        assignedProductId,
        assignedProductName
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save machine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Machine Config" />

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Factory Machines</h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Configuration & Assigned Products</p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="!rounded-2xl"
          >
            + New Machine
          </Button>
        </div>

        {/* Machines List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : machines.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">No machines configured yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {machines.map((mac) => (
              <div
                key={mac.id}
                className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50">{mac.label}</h4>
                    <span className="text-[8px] font-black uppercase tracking-wider bg-gray-50 dark:bg-dark-bg text-gray-400 px-2 py-0.5 rounded-full">
                      M-{mac.machineNo}
                    </span>
                    {!mac.active && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-600 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 font-bold">Product:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {mac.assignedProductName || 'No Product Assigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(mac)}
                    className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400 p-2.5 rounded-2xl active:scale-[0.95] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(mac.id, mac.label)}
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">
                  {editingMachine ? 'Edit Machine' : 'New Machine'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Machine Number / Code*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01, A-02"
                    value={machineNo}
                    onChange={(e) => setMachineNo(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Display Label*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Machine 1 - Paper Cup"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Assigned Product</label>
                  <select
                    value={assignedProductId}
                    onChange={(e) => setAssignedProductId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="">-- No Assigned Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="machine-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="machine-active" className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-emerald-100/70 select-none">
                    Machine Active / Running
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full !rounded-2xl mt-4"
                >
                  {submitting ? 'Saving...' : 'Save Machine'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
