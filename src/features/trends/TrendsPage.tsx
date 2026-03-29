import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { getWeeklyProductionStats } from '../../services/entries.service';
import { PageTransition } from '../../components/layout/PageTransition';
import { LoadingView } from '../../components/feedback/LoadingView';

interface WeeklyStat {
  date: string;
  box: number;
  pcs: number;
}

export const TrendsPage: React.FC = () => {
  const { profile } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'box' | 'pcs'>('box');

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      try {
        const weekly = await getWeeklyProductionStats(profile.uid);
        setStats(weekly);
      } catch (err) {
        console.error('Failed to fetch weekly stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [profile]);

  const processedStats = React.useMemo(() => stats, [stats]);
  const maxVal = React.useMemo(() => 
    Math.max(...processedStats.map(s => activeTab === 'box' ? s.box : s.pcs), 1),
    [processedStats, activeTab]
  );

  if (loading) return <LoadingView message={t('common.loading')} />;

  const weeklyTotal = processedStats.reduce((acc, curr) => acc + (activeTab === 'box' ? curr.box : curr.pcs), 0);

  return (
    <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-950 dark:to-dark-bg px-6 pt-12 pb-20 rounded-b-[3.5rem] shadow-xl">
        <h1 className="text-white dark:text-emerald-50 text-3xl font-black tracking-tight mb-2">{t('trends.title')}</h1>
        <p className="text-emerald-100 dark:text-emerald-500/80 text-xs font-black uppercase tracking-[0.2em]">{t('trends.subtitle')}</p>
      </div>

      <div className="px-6 -mt-10">
        {/* Tab Switcher */}
        <div className="bg-white dark:bg-dark-surface p-1.5 rounded-2xl shadow-lg border border-gray-100 dark:border-dark-border flex gap-1 mb-8 max-w-xs mx-auto transition-all">
          {(['box', 'pcs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-emerald-700 dark:text-emerald-50' : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              <AnimatePresence>
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-trend-tab"
                    className="absolute inset-0 bg-emerald-50 dark:bg-emerald-600 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">{tab === 'box' ? t('common.box') : t('common.pcs')}</span>
            </button>
          ))}
        </div>

        {/* Chart Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-dark-surface/60 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl shadow-emerald-950/5 border border-white dark:border-dark-border"
        >
          <div className="flex items-end justify-between h-56 gap-3 mb-6 px-1">
            {processedStats.map((day, i) => {
              const val = activeTab === 'box' ? day.box : day.pcs;
              const height = (val / maxVal) * 100;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="relative w-full flex justify-center group h-full items-end">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-emerald-500 text-white dark:text-emerald-950 text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      {val.toLocaleString()} {t(`common.${activeTab}`).toUpperCase()}
                    </div>
                    
                    {/* Bar container */}
                    <motion.div
                      layout
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 2)}%` }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 120, 
                        damping: 18,
                        delay: i * 0.05 
                      }}
                      className={`w-full max-w-[28px] rounded-t-lg ${
                        val > 0 
                          ? (activeTab === 'box' ? 'bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/40' : 'bg-blue-500 shadow-blue-200 dark:shadow-blue-900/40')
                          : 'bg-gray-100 dark:bg-dark-bg'
                      } shadow-md relative overflow-hidden`}
                    >
                      {val > 0 && (
                        <motion.div 
                          animate={{ y: ["0%", "-100%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-white/10 w-full h-[200%] -translate-y-full skew-y-12"
                        />
                      )}
                    </motion.div>
                  </div>
                  <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase mt-4 whitespace-nowrap text-center w-full">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Weekly Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-emerald-50 dark:bg-dark-surface/40 p-6 rounded-[2rem] border border-emerald-100 dark:border-dark-border shadow-sm"
          >
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">{t('trends.weekly_avg')}</p>
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-50">
              {Math.round(weeklyTotal / 7).toLocaleString()}
            </h3>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 dark:bg-dark-surface/40 p-6 rounded-[2rem] border border-blue-100 dark:border-dark-border shadow-sm"
          >
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-2">{t('trends.peak_day')}</p>
            <h3 className="text-2xl font-black text-blue-900 dark:text-emerald-50">{maxVal.toLocaleString()}</h3>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};
