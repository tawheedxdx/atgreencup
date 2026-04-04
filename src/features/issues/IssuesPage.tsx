import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useIssuesStore } from '../../store/issuesStore';
import { getMyIssues } from '../../services/issues.service';
import { Button } from '../../components/ui/Button';
import { IssueCard } from '../../components/ui/IssueCard';
import { LoadingView } from '../../components/feedback/LoadingView';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PageTransition } from '../../components/layout/PageTransition';
import type { IssueStatus } from '../../types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

type FilterKey = 'all' | IssueStatus;

export const IssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { issues, loading, error, setIssues, setLoading, setError } = useIssuesStore();
  const [filter, setFilter] = useState<FilterKey>('all');

  const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
    { value: 'all',            label: t('issue.filter_all') },
    { value: 'open',           label: t('issue.status_open') },
    { value: 'in_review',      label: t('issue.status_in_review') },
    { value: 'resolved',       label: t('issue.status_resolved') },
    { value: 'closed',         label: t('issue.status_closed') },
  ];

  const fetchIssues = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await getMyIssues(profile.uid);
      setIssues(data);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [profile]);

  const filtered = filter === 'all'
    ? issues
    : issues.filter(i => i.status === filter);

  const hasFilter = filter !== 'all';

  return (
    <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-red-600 via-rose-700 to-red-900 dark:from-red-950 dark:via-[#1A0A0A] dark:to-dark-bg px-5 pt-12 pb-12 rounded-b-[3rem] shadow-xl relative z-10"
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-red-100/80 dark:text-red-400/80 text-xs font-black uppercase tracking-widest mb-1">
                {t('issue.page_label')}
              </p>
              <h1 className="text-white dark:text-red-50 text-2xl font-black tracking-tight">
                {t('issue.title')}
              </h1>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-12 h-12 bg-white/10 dark:bg-red-500/10 backdrop-blur-md rounded-2xl flex items-center justify-center ring-1 ring-white/20"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001c-.77 1.332.192 2.999 1.732 2.999z" />
              </svg>
            </motion.div>
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={() => navigate('/issues/new')}
              fullWidth
              size="lg"
              className="!bg-white dark:!bg-red-500 !text-red-800 dark:!text-red-950 !font-black !rounded-2xl shadow-xl shadow-red-900/20"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t('issue.report_new')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-5 max-w-lg mx-auto -mt-6 relative z-20">
        {/* Stats summary */}
        {!loading && issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 mb-6 flex items-center gap-3"
          >
            {[
              { label: t('issue.filter_all'), count: issues.length, color: '#6B7280' },
              { label: t('issue.status_open'), count: issues.filter(i => i.status === 'open').length, color: '#3B82F6' },
              { label: t('issue.status_in_review'), count: issues.filter(i => i.status === 'in_review').length, color: '#F59E0B' },
              { label: t('issue.status_resolved'), count: issues.filter(i => i.status === 'resolved').length, color: '#10B981' },
            ].map(s => s.count > 0 ? (
              <div key={s.label} className="flex-1 bg-white dark:bg-dark-surface rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-dark-border">
                <p className="text-lg font-black" style={{ color: s.color }}>{s.count}</p>
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ) : null)}
          </motion.div>
        )}

        {/* Filter chips */}
        {!loading && issues.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 mt-4">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                  ${filter === opt.value
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-white dark:bg-dark-surface text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-dark-border'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <section className="mt-4 mb-8">
          {loading ? (
            <LoadingView message={t('common.loading')} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchIssues} />
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <EmptyState
                title={hasFilter ? t('issue.no_matching') : t('issue.no_issues')}
                message={hasFilter ? t('issue.no_matching_msg') : t('issue.no_issues_msg')}
                action={
                  !hasFilter ? (
                    <Button size="sm" onClick={() => navigate('/issues/new')}>
                      {t('issue.report_new')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
                      {t('common.clear_filters')}
                    </Button>
                  )
                }
              />
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 pb-10"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((issue) => (
                  <motion.div key={issue.id} variants={itemVariants} layout>
                    <IssueCard issue={issue} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>
    </PageTransition>
  );
};
