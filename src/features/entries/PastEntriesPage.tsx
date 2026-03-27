import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { getEntriesByOperator } from '../../services/entries.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { EntryCard } from '../../components/ui/EntryCard';
import { LoadingView } from '../../components/feedback/LoadingView';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { EntryStatus } from '../../types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'correction_requested', label: 'Correction' },
];

export const PastEntriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { entries, loading, error, setEntries, setLoading, setError } = useEntriesStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchEntries = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await getEntriesByOperator(profile.uid);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load entries');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [profile]);

  const filteredEntries = entries.filter(e => {
    const matchesFilter = filter === 'all' || e.status === filter;
    const matchesSearch = !searchTerm ||
      e.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.machineNo.toLowerCase().includes(searchTerm.toLowerCase());
      
    const entryDate = e.productionDate || '';
    const matchesFrom = !fromDate || entryDate >= fromDate;
    const matchesTo = !toDate || entryDate <= toDate;

    return matchesFilter && matchesSearch && matchesFrom && matchesTo;
  });

  const hasActiveFilters = filter !== 'all' || searchTerm !== '' || fromDate !== '' || toDate !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Past Productions" />

      <div className="px-5 py-4 max-w-lg mx-auto">
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search productions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Date Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input 
              type="date" 
              label="From Date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <Input 
              type="date" 
              label="To Date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${filter === opt.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Productions List */}
        {loading ? (
          <LoadingView message="Loading productions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEntries} />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No matching productions' : 'No productions yet'}
            message={hasActiveFilters ? 'Try clearing your search or date filters.' : 'Create your first production.'}
            action={
              !hasActiveFilters ? (
                <Button size="sm" onClick={() => navigate('/entries/new')}>Create Production</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => {
                  setFilter('all');
                  setSearchTerm('');
                  setFromDate('');
                  setToDate('');
                }}>Clear Filters</Button>
              )
            }
          />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 pb-4"
          >
            {filteredEntries.map((entry) => (
              <motion.div key={entry.id} variants={itemVariants}>
                <EntryCard entry={entry} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
