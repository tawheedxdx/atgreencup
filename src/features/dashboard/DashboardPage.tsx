import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { getTodayEntriesCount, getEntriesByOperator } from '../../services/entries.service';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { EntryCard } from '../../components/ui/EntryCard';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/feedback/LoadingView';
import { EmptyState } from '../../components/feedback/EmptyState';
import type { ProductionEntry } from '../../types';

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
  const { profile } = useAuthStore();
  const { total, pending, approved, rejected, loading: statsLoading, setStats, setLoading } = useDashboardStore();
  const [recentEntries, setRecentEntries] = useState<ProductionEntry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      setLoading(true);
      setLoadingRecent(true);
      try {
        const [stats, entries] = await Promise.all([
          getTodayEntriesCount(profile.uid),
          getEntriesByOperator(profile.uid),
        ]);
        setStats(stats);
        setRecentEntries(entries.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchData();
  }, [profile, setStats, setLoading]);

  const firstName = profile?.name?.split(' ')[0] || 'Operator';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.div 
        initial={{ y: '-10%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl relative z-10"
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-emerald-200/90 text-sm font-medium">Welcome back,</p>
              <h1 className="text-white text-2xl font-bold tracking-tight">{firstName} 👋</h1>
            </motion.div>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-inner"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </motion.button>
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={() => navigate('/entries/new')}
              fullWidth
              size="lg"
              className="!bg-white !text-emerald-800 !font-bold shadow-xl shadow-emerald-900/20"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              New Production
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-5 max-w-lg mx-auto -mt-4 relative z-20">
        {/* Stats Grid */}
        <section className="mt-8">
          <motion.h2 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1"
          >
            Today's Summary
          </motion.h2>
          
          {statsLoading ? (
            <LoadingView message="Loading stats..." />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3"
            >
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title="Total"
                  value={total}
                  color="#3B82F6"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title="Pending"
                  value={pending}
                  color="#F59E0B"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title="Approved"
                  value={approved}
                  color="#10B981"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SummaryCard
                  title="Rejected"
                  value={rejected}
                  color="#EF4444"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* Recent Productions */}
        <section className="mt-8 mb-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center justify-between mb-4 px-1"
          >
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Productions</h2>
            <button onClick={() => navigate('/entries')} className="text-xs text-emerald-600 font-bold tracking-wide active:opacity-70 transition-opacity">
              VIEW ALL
            </button>
          </motion.div>

          {loadingRecent ? (
            <LoadingView message="Loading productions..." />
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
              className="space-y-3"
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
    </div>
  );
};
