import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { getTodayProductionStats, getMonthProductionStats, getEntriesByOperator } from '../../services/entries.service';
import { getMyIssues } from '../../services/issues.service';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { EntryCard } from '../../components/ui/EntryCard';
import { IssueCard } from '../../components/ui/IssueCard';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/feedback/LoadingView';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PageTransition } from '../../components/layout/PageTransition';
import type { ProductionEntry, IssueReport } from '../../types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { 
    boxTotal, pcsTotal, approvedBox, approvedPcs, 
    monthBoxTotal, monthPcsTotal,
    loading: statsLoading, setStats, setLoading 
  } = useDashboardStore();
  const [recentEntries, setRecentEntries] = useState<ProductionEntry[]>([]);
  const [activeIssues, setActiveIssues] = useState<IssueReport[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      setLoading(true);
      setLoadingRecent(true);
      try {
        // 1. Fetch production data
        const [todayStats, monthStats, entries] = await Promise.all([
          getTodayProductionStats(profile.uid),
          getMonthProductionStats(profile.uid),
          getEntriesByOperator(profile.uid),
        ]);
        setStats({ ...todayStats, ...monthStats });
        setRecentEntries(entries.slice(0, 5));

        // 2. Fetch issues (decoupled so failure doesn't block dashboard)
        try {
          const issues = await getMyIssues(profile.uid);
          setActiveIssues(issues.filter(i => i.status === 'open' || i.status === 'in_review').slice(0, 2));
        } catch (issueErr) {
          console.warn('Issues fetch failed (check indexes):', issueErr);
        }
      } catch (err) {
        console.error('Dashboard production fetch error:', err);
      } finally {
        setLoading(false);
        setLoadingRecent(false);
      }
    };
    fetchData();
  }, [profile, setStats, setLoading]);

  const firstName = profile?.name?.split(' ')[0] || 'Operator';

  return (
    <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-emerald-900 dark:via-[#0B251D] dark:to-dark-bg px-5 pt-12 pb-12 rounded-b-[3rem] shadow-xl relative z-10"
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-emerald-100/80 dark:text-emerald-500/80 text-xs font-black uppercase tracking-widest mb-1">{t('dashboard.welcome')}</p>
              <h1 className="text-white dark:text-emerald-50 text-2xl font-black tracking-tight">{firstName} 👋</h1>
            </motion.div>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              className="w-12 h-12 bg-white/10 dark:bg-emerald-500/10 backdrop-blur-md rounded-2xl flex items-center justify-center ring-1 ring-white/20 dark:ring-emerald-500/20 shadow-inner"
            >
              <svg className="w-6 h-6 text-white dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </motion.button>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            <Button
              onClick={() => navigate('/entries/new')}
              className="flex-[2] !bg-white dark:!bg-emerald-500 !text-emerald-800 dark:!text-emerald-950 !font-black !rounded-2xl shadow-xl shadow-emerald-900/20"
              size="lg"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t('entry.new_title')}
            </Button>
            <Button
              onClick={() => navigate('/issues/new')}
              className="flex-1 !bg-red-500/10 backdrop-blur-md !text-white dark:!text-red-400 !font-black !rounded-2xl border-2 border-white/20 dark:border-red-500/20"
              size="lg"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001c-.77 1.332.192 2.999 1.732 2.999z" />
                </svg>
              }
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="px-5 max-w-lg mx-auto -mt-6 relative z-20">
        {/* Stats Grid */}
        <section className="mt-10">
          <motion.h2 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-4 px-1"
          >
            {t('dashboard.today_sum')}
          </motion.h2>
          
          {statsLoading ? (
            <LoadingView message={t('common.loading')} />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4"
            >
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title={t('dashboard.today_box')}
                  value={boxTotal}
                  color="#10B981"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title={t('dashboard.today_pcs')}
                  value={pcsTotal}
                  color="#3B82F6"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title={t('dashboard.approved_box')}
                  value={approvedBox}
                  color="#059669"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title={t('dashboard.approved_pcs')}
                  value={approvedPcs}
                  color="#8B5CF6"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                />
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* Monthly Summary */}
        <section className="mt-10">
          <motion.h2 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-4 px-1"
          >
            {t('dashboard.monthly_sum')}
          </motion.h2>
          
          {statsLoading ? (
            <LoadingView message={t('common.loading')} />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4"
            >
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title={t('dashboard.monthly_box')}
                  value={monthBoxTotal}
                  color="#6366F1"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title={t('dashboard.monthly_pcs')}
                  value={monthPcsTotal}
                  color="#EC4899"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* Active Issues Section */}
        {activeIssues.length > 0 && (
          <section className="mt-10">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="flex items-center justify-between mb-5 px-1"
            >
              <h2 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">{t('issue.title')}</h2>
              <button onClick={() => navigate('/issues')} className="text-[10px] text-red-600 font-black uppercase tracking-widest active:opacity-70 transition-opacity">
                {t('dashboard.view_all')}
              </button>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {activeIssues.map((issue) => (
                <motion.div key={issue.id} variants={itemVariants}>
                  <IssueCard issue={issue} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Recent Productions */}
        <section className="mt-10 mb-8">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center justify-between mb-5 px-1"
          >
            <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">{t('dashboard.recent')}</h2>
            <button onClick={() => navigate('/entries')} className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest active:opacity-70 transition-opacity">
              {t('dashboard.view_all')}
            </button>
          </motion.div>

          {loadingRecent ? (
            <LoadingView message={t('common.loading')} />
          ) : recentEntries.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <EmptyState
                title="No productions yet"
                message="Create your first production to get started."
                action={
                  <Button size="sm" onClick={() => navigate('/entries/new')}>
                    Create Production
                  </Button>
                }
              />
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {recentEntries.map((entry) => (
                <motion.div key={entry.id} variants={itemVariants}>
                  <EntryCard entry={entry} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </PageTransition>
  );
};
