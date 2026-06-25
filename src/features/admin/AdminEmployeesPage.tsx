import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  subscribeEmployees, 
  saveEmployeeProfile, 
  triggerPasswordReset, 
  createEmployeeProfile, 
  subscribeProducts, 
  subscribeMachines 
} from '../../services/admin.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import type { UserProfile, Product, Machine } from '../../types';

export const AdminEmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal/Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<UserProfile | null>(null);

  // Form Fields
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('operator');
  const [active, setActive] = useState(true);
  const [earningsPeriodType, setEarningsPeriodType] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubEmployees = subscribeEmployees((list) => {
      setEmployees(list);
      setLoading(false);
    });

    const unsubProducts = subscribeProducts((list) => {
      setProducts(list.filter(p => p.active));
    });

    const unsubMachines = subscribeMachines((list) => {
      setMachines(list.filter(m => m.active));
    });

    return () => {
      unsubEmployees();
      unsubProducts();
      unsubMachines();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setUid('');
    setName('');
    setEmail('');
    setEmployeeId('');
    setRole('operator');
    setActive(true);
    setEarningsPeriodType('monthly');
    setSelectedMachines([]);
    setSelectedProducts([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: UserProfile) => {
    setEditingEmployee(emp);
    setUid(emp.uid);
    setName(emp.name || '');
    setEmail(emp.email || '');
    setEmployeeId(emp.employeeId || '');
    setRole(emp.role || 'operator');
    setActive(emp.active !== false);
    setEarningsPeriodType(emp.earningsPeriodType || 'monthly');
    setSelectedMachines(emp.assignedMachines || []);
    setSelectedProducts(emp.assignedProducts || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (emp: UserProfile) => {
    try {
      await saveEmployeeProfile(emp.uid, { active: !emp.active });
    } catch (err: any) {
      alert(err.message || 'Failed to update active state');
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!email) return;
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    try {
      await triggerPasswordReset(email);
      alert('Password reset email sent successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to send reset email');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !employeeId) {
      setFormError('Please fill out all required fields.');
      return;
    }
    
    setFormError(null);
    setSubmitting(true);

    const profileData = {
      name,
      email,
      employeeId,
      role,
      active,
      earningsPeriodType,
      assignedMachines: selectedMachines,
      assignedProducts: selectedProducts
    };

    try {
      if (editingEmployee) {
        // Edit Mode
        await saveEmployeeProfile(editingEmployee.uid, profileData);
      } else {
        // Add Mode
        if (!uid.trim()) {
          setFormError('User UID is required for adding new operator profile.');
          setSubmitting(false);
          return;
        }
        await createEmployeeProfile(uid.trim(), profileData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMachineToggle = (machineNo: string) => {
    setSelectedMachines(prev =>
      prev.includes(machineNo)
        ? prev.filter(m => m !== machineNo)
        : [...prev, machineNo]
    );
  };

  const handleProductToggle = (prodId: string) => {
    setSelectedProducts(prev =>
      prev.includes(prodId)
        ? prev.filter(p => p !== prodId)
        : [...prev, prodId]
    );
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Employee Directory" />

      <div className="px-4 mt-6">
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50 shadow-sm"
          />
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="!rounded-2xl shrink-0"
          >
            + Add Operator
          </Button>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">No employees found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.uid}
                className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50">{emp.name}</h4>
                      <span className="text-[8px] font-black uppercase tracking-wider bg-gray-100 dark:bg-dark-bg text-gray-500 px-2 py-0.5 rounded-full">
                        {emp.role}
                      </span>
                      {!emp.active && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-600 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">Emp ID: {emp.employeeId || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{emp.email}</p>
                  </div>
                  
                  {/* Status Toggle & Edit Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(emp)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                        emp.active
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-600'
                      }`}
                    >
                      {emp.active ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400 p-2 rounded-xl active:scale-[0.95] transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-50 dark:border-dark-border/40 pt-3 flex flex-wrap gap-2 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                  <div className="w-full mb-1">
                    <span className="text-[8px] uppercase tracking-wider text-gray-400">Assigned Machines: </span>
                    <span className="text-gray-700 dark:text-emerald-100/60 font-black">{emp.assignedMachines?.join(', ') || 'None'}</span>
                  </div>
                  <div className="w-full">
                    <span className="text-[8px] uppercase tracking-wider text-gray-400">Period Preference: </span>
                    <span className="text-gray-700 dark:text-emerald-100/60 font-black uppercase tracking-wider">{emp.earningsPeriodType || 'monthly'}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-dark-border/40">
                  <button
                    onClick={() => handlePasswordReset(emp.email)}
                    className="text-[9px] font-black text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 uppercase tracking-widest transition-colors"
                  >
                    Reset Password
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
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-y-auto max-h-[90vh] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">
                  {editingEmployee ? 'Edit Profile' : 'New Operator Profile'}
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

                {!editingEmployee && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Firebase User UID*</label>
                    <input
                      type="text"
                      required
                      placeholder="Auth User Unique Identifier (UID)"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                    />
                    <span className="text-[8px] text-gray-400 dark:text-gray-500 leading-tight">Must match the UID from Firebase Authentication database.</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Full Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Address*</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. operator@greencup.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee Code / ID*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GC-OP-04"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="operator">Operator (op)</option>
                    <option value="employee">Employee (emp)</option>
                    <option value="admin">Administrator (admin)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Earnings Payment Cycle</label>
                  <select
                    value={earningsPeriodType}
                    onChange={(e) => setEarningsPeriodType(e.target.value as 'weekly' | 'monthly')}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="weekly">Weekly Cycle</option>
                    <option value="monthly">Monthly Cycle</option>
                  </select>
                </div>

                {/* Machines checklist */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Assign Machines</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-dark-bg p-3 rounded-2xl border border-gray-100 dark:border-dark-border max-h-32 overflow-y-auto">
                    {machines.map((mac) => (
                      <label key={mac.id} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-emerald-100/70 select-none">
                        <input
                          type="checkbox"
                          checked={selectedMachines.includes(mac.machineNo)}
                          onChange={() => handleMachineToggle(mac.machineNo)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        M-{mac.machineNo}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Products checklist */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Assign Products</label>
                  <div className="grid grid-cols-1 gap-2 bg-gray-50 dark:bg-dark-bg p-3 rounded-2xl border border-gray-100 dark:border-dark-border max-h-32 overflow-y-auto">
                    {products.map((prod) => (
                      <label key={prod.id} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-emerald-100/70 select-none truncate">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(prod.id)}
                          onChange={() => handleProductToggle(prod.id)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        {prod.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="active-chk"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="active-chk" className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-emerald-100/70 select-none">
                    Profile Active / Enable login
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full !rounded-2xl mt-4"
                >
                  {submitting ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
