import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileHeader } from '../../components/layout/MobileHeader';
import {
  subscribeAllEntries,
  subscribeOpenIssues,
  subscribeEmployees,
  subscribeProducts,
  subscribeMachines,
} from '../../services/admin.service';
import type { ProductionEntry, IssueReport, UserProfile, Product, Machine } from '../../types';
import { ISSUE_TYPE_CONFIG } from '../../types';

type SearchCategory = 'all' | 'entries' | 'issues' | 'employees' | 'products' | 'machines';

export const AdminSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  // Local storage state streams
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup subscriptions
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 5) setLoading(false);
    };

    const unsubEntries = subscribeAllEntries((data) => {
      setEntries(data);
      checkLoaded();
    });

    const unsubIssues = subscribeOpenIssues((data) => {
      setIssues(data);
      checkLoaded();
    });

    const unsubEmployees = subscribeEmployees((data) => {
      setEmployees(data);
      checkLoaded();
    });

    const unsubProducts = subscribeProducts((data) => {
      setProducts(data);
      checkLoaded();
    });

    const unsubMachines = subscribeMachines((data) => {
      setMachines(data);
      checkLoaded();
    });

    return () => {
      unsubEntries();
      unsubIssues();
      unsubEmployees();
      unsubProducts();
      unsubMachines();
    };
  }, []);

  // Searching logic
  const queryLower = searchQuery.trim().toLowerCase();

  const filteredEntries = queryLower
    ? entries.filter(
        (e) =>
          e.operatorName?.toLowerCase().includes(queryLower) ||
          e.machineNo?.toLowerCase().includes(queryLower) ||
          e.productName?.toLowerCase().includes(queryLower) ||
          e.status?.toLowerCase().includes(queryLower) ||
          e.productionDate?.includes(queryLower)
      )
    : entries.slice(0, 10); // Show recent 10 if query empty

  const filteredIssues = queryLower
    ? issues.filter(
        (i) =>
          i.issueType?.toLowerCase().includes(queryLower) ||
          i.machineNo?.toLowerCase().includes(queryLower) ||
          i.description?.toLowerCase().includes(queryLower) ||
          i.operatorName?.toLowerCase().includes(queryLower) ||
          i.status?.toLowerCase().includes(queryLower) ||
          i.priority?.toLowerCase().includes(queryLower)
      )
    : issues.slice(0, 10);

  const filteredEmployees = queryLower
    ? employees.filter(
        (u) =>
          u.name?.toLowerCase().includes(queryLower) ||
          u.email?.toLowerCase().includes(queryLower) ||
          u.employeeId?.toLowerCase().includes(queryLower) ||
          u.role?.toLowerCase().includes(queryLower)
      )
    : employees.slice(0, 10);

  const filteredProducts = queryLower
    ? products.filter(
        (p) =>
          p.name?.toLowerCase().includes(queryLower) ||
          p.sku?.toLowerCase().includes(queryLower) ||
          p.id?.toLowerCase().includes(queryLower)
      )
    : products.slice(0, 10);

  const filteredMachines = queryLower
    ? machines.filter(
        (m) =>
          m.machineNo?.toLowerCase().includes(queryLower) ||
          m.assignedProductName?.toLowerCase().includes(queryLower) ||
          (m.active ? 'active' : 'inactive').includes(queryLower)
      )
    : machines.slice(0, 10);

  // Totals mapping
  const categoryCounts = {
    all:
      filteredEntries.length +
      filteredIssues.length +
      filteredEmployees.length +
      filteredProducts.length +
      filteredMachines.length,
    entries: filteredEntries.length,
    issues: filteredIssues.length,
    employees: filteredEmployees.length,
    products: filteredProducts.length,
    machines: filteredMachines.length,
  };

  const categories: { key: SearchCategory; label: string }[] = [
    { key: 'all', label: 'All Results' },
    { key: 'entries', label: 'Entries' },
    { key: 'issues', label: 'Issues' },
    { key: 'employees', label: 'Employees' },
    { key: 'products', label: 'Products' },
    { key: 'machines', label: 'Machines' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 dark:text-emerald-500/60 uppercase font-black tracking-widest mt-4">Indexing database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Global Search" />

      {/* Sticky Search Bar */}
      <div className="sticky top-0 bg-gray-50/95 dark:bg-dark-bg/95 backdrop-blur-md pt-4 pb-2 px-4 z-30">
        <div className="relative shadow-premium rounded-3xl">
          <input
            type="text"
            placeholder="Type machine, operator, product, issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl pl-12 pr-10 py-4 text-sm font-bold text-gray-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-500"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar -mx-4 px-4 mt-2">
          {categories.map((cat) => {
            const count = categoryCounts[cat.key];
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                  active
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                {cat.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  active ? 'bg-white text-emerald-600' : 'bg-gray-100 dark:bg-dark-bg text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-2 space-y-6">
        <AnimatePresence mode="wait">
          {categoryCounts.all === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-black text-gray-900 dark:text-emerald-50 text-sm">No results match your search</h3>
              <p className="text-xs text-gray-400 mt-1">Try another keyword or search target.</p>
            </motion.div>
          )}

          {/* Results List */}
          <div className="space-y-4">
            {/* 1. Production Entries */}
            {(activeCategory === 'all' || activeCategory === 'entries') && filteredEntries.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Production Entries</h4>
                )}
                <div className="space-y-2.5">
                  {filteredEntries.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/admin/production?id=${item.id}`)}
                      className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-premium active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-gray-900 dark:text-emerald-50">{item.operatorName}</span>
                          <span className="text-[10px] font-bold text-gray-400">{item.productionDate}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                          Machine <strong className="text-gray-700 dark:text-emerald-300">{item.machineNo}</strong> • {item.productName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-gray-900 dark:text-emerald-50">{item.pcs} PCS</div>
                        <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'rejected'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Issues */}
            {(activeCategory === 'all' || activeCategory === 'issues') && filteredIssues.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4 mb-2 px-1">Issues Reported</h4>
                )}
                <div className="space-y-2.5">
                  {filteredIssues.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate('/admin/issues')}
                      className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-premium active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-gray-900 dark:text-emerald-50 truncate max-w-[150px]">{ISSUE_TYPE_CONFIG[item.issueType]?.label || item.issueType}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            item.priority === 'high'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                          Machine {item.machineNo} • {item.description}
                        </p>
                      </div>
                      <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        item.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Employees */}
            {(activeCategory === 'all' || activeCategory === 'employees') && filteredEmployees.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4 mb-2 px-1">Employees</h4>
                )}
                <div className="space-y-2.5">
                  {filteredEmployees.map((item) => (
                    <div
                      key={item.uid}
                      onClick={() => navigate('/admin/employees')}
                      className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-premium active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black uppercase">
                          {item.name?.charAt(0) || 'E'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-gray-900 dark:text-emerald-50 truncate">{item.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate">{item.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-900 dark:text-emerald-50 capitalize">{item.role}</div>
                        <span className="text-[9px] font-bold text-gray-400">{item.employeeId || 'No ID'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Products */}
            {(activeCategory === 'all' || activeCategory === 'products') && filteredProducts.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4 mb-2 px-1">Products</h4>
                )}
                <div className="space-y-2.5">
                  {filteredProducts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate('/admin/products')}
                      className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-premium active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-gray-900 dark:text-emerald-50 truncate">{item.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-900 dark:text-emerald-50">{item.packetsPerBox} Packets/Box</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Machines */}
            {(activeCategory === 'all' || activeCategory === 'machines') && filteredMachines.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4 mb-2 px-1">Machines</h4>
                )}
                <div className="space-y-2.5">
                  {filteredMachines.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate('/admin/machines')}
                      className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-premium active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-gray-900 dark:text-emerald-50 truncate">Machine {item.machineNo}</h4>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">Product: {item.assignedProductName || 'None'}</p>
                      </div>
                      <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {item.active ? 'active' : 'inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
};
