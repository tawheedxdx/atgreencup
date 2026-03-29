import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

export const PastEntriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { entries, loading, error, setEntries, setLoading, setError } = useEntriesStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const FILTER_OPTIONS = [
    { value: 'all', label: t('history.filter_all') || 'All' },
    { value: 'pending', label: t('history.filter_pending') || 'Pending' },
    { value: 'approved', label: t('history.filter_approved') || 'Approved' },
    { value: 'rejected', label: t('history.filter_rejected') || 'Rejected' },
    { value: 'correction_requested', label: t('history.filter_correction') || 'Correction' },
  ];

  const fetchEntries = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await getEntriesByOperator(profile.uid);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || t('common.error'));
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader title={t('history.title')} />

      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('history.search_placeholder') || "Search productions..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-xl pl-11 pr-4 text-sm font-medium text-gray-900 dark:text-emerald-50 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/20 shadow-sm transition-all"
          />
        </div>

        {/* Date Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input 
              type="date" 
              label={t('entry.date_from') || "From Date"} 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
            />
          </div>
          <div className="flex-1">
            <Input 
              type="date" 
              label={t('entry.date_to') || "To Date"} 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`
                flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all
                ${filter === opt.value
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-white dark:bg-dark-surface text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-dark-border'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Productions List */}
        <div className="mt-4">
          {loading ? (
            <LoadingView message={t('common.loading')} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchEntries} />
          ) : filteredEntries.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? t('history.no_matching') : t('history.no_entries')}
              message={hasActiveFilters ? t('history.no_matching_msg') : t('history.no_entries_msg')}
              action={
                !hasActiveFilters ? (
                  <Button size="sm" onClick={() => navigate('/entries/new')}>{t('entry.new_title')}</Button>
                ) : (
                  <Button size="sm" variant="secondary" className="dark:bg-dark-surface dark:text-emerald-50" onClick={() => {
                    setFilter('all');
                    setSearchTerm('');
                    setFromDate('');
                    setToDate('');
                  }}>{t('common.clear_filters') || "Clear Filters"}</Button>
                )
              }
            />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 pb-10"
            >
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry) => (
                  <motion.div 
                    key={entry.id} 
                    variants={itemVariants}
                    layout
                  >
                    <EntryCard entry={entry} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
