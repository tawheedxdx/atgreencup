import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const maxVal = Math.max(...stats.map(s => activeTab === 'box' ? s.box : s.pcs), 1);

  if (loading) return <LoadingView message="Analyzing trends..." />;

  return (
    <PageTransition className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 pt-12 pb-20 rounded-b-[3rem] shadow-xl">
        <h1 className="text-white text-3xl font-black tracking-tight mb-2">Production Trends</h1>
        <p className="text-emerald-100 text-sm font-medium opacity-80">Your performance over the last 7 days</p>
      </div>

      <div className="px-6 -mt-10">
        {/* Tab Switcher */}
        <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 flex gap-1 mb-8 max-w-xs mx-auto">
          {(['box', 'pcs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-emerald-700' : 'text-gray-400'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-trend-tab"
                  className="absolute inset-0 bg-emerald-50 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab === 'box' ? 'BOX (Unit 1)' : 'PCS (Unit 2)'}</span>
            </button>
          ))}
        </div>

        {/* Chart Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-950/5 border border-gray-100"
        >
          <div className="flex items-end justify-between h-64 gap-2 mb-6">
            {stats.map((day, i) => {
              const val = activeTab === 'box' ? day.box : day.pcs;
              const height = (val / maxVal) * 100;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                  <div className="relative w-full flex justify-center group">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      {val} {activeTab.toUpperCase()}
                    </div>
                    
                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 15,
                        delay: i * 0.1 
                      }}
                      className={`w-full max-w-[32px] rounded-t-xl rounded-b-md ${
                        activeTab === 'box' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-blue-500 shadow-blue-100'
                      } shadow-lg relative overflow-hidden`}
                    >
                      <motion.div 
                        animate={{ y: ["0%", "-100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-white/10 w-full h-[200%] -translate-y-full skew-y-12"
                      />
                    </motion.div>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase rotate-45 mt-2 origin-left">
                    {day.date.split(' ')[0]} {day.date.split(' ')[1]}
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
            className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100"
          >
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Weekly Avg</p>
            <h3 className="text-2xl font-black text-emerald-900">
              {Math.round(stats.reduce((acc, curr) => acc + (activeTab === 'box' ? curr.box : curr.pcs), 0) / 7)}
            </h3>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100"
          >
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Peak Day</p>
            <h3 className="text-2xl font-black text-blue-900">{maxVal}</h3>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};
