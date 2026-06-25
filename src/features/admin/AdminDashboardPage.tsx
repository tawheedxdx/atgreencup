import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeDashboardStats } from '../../services/admin.service';
import { MobileHeader } from '../../components/layout/MobileHeader';

interface DashboardStats {
  pendingApprovals: number;
  todayProductionPcs: number;
  openIssues: number;
  todayAttendanceCount: number;
  todayEarningsAmount: number;
  pendingSalaryPaymentsAmount: number;
  activeOperators: number;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeDashboardStats((newStats) => {
      setStats(newStats);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-400 dark:text-emerald-500/60 uppercase font-black tracking-widest mt-4">Loading stats...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Production",
      value: `${stats.todayProductionPcs.toLocaleString()} pcs`,
      desc: 'Sum of approved/pending logs today',
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: () => navigate('/admin/production'),
      color: 'border-emerald-500/20 bg-emerald-500/5',
    },
    {
      title: 'Pending Approvals',
      value: `${stats.pendingApprovals}`,
      desc: 'Awaiting image verification',
      badge: stats.pendingApprovals > 0 ? 'Action Needed' : null,
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      onClick: () => navigate('/admin/production?status=pending'),
      color: stats.pendingApprovals > 0 ? 'border-amber-500/40 bg-amber-500/10' : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface',
    },
    {
      title: "Today's Attendance",
      value: `${stats.todayAttendanceCount} Active`,
      desc: 'Check-ins logged today',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/attendance'),
      color: 'border-blue-500/20 bg-blue-500/5',
    },
    {
      title: 'Open Issues',
      value: `${stats.openIssues}`,
      desc: 'Machine & material issues',
      badge: stats.openIssues > 0 ? 'Critical' : null,
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001c-.77 1.332.192 2.999 1.732 2.999z" />
        </svg>
      ),
      onClick: () => navigate('/admin/issues'),
      color: stats.openIssues > 0 ? 'border-red-500/40 bg-red-500/10' : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface',
    },
    {
      title: "Today's Earnings",
      value: `₹${stats.todayEarningsAmount.toFixed(2)}`,
      desc: 'Approved earnings total today',
      icon: (
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/salary'),
      color: 'border-purple-500/20 bg-purple-500/5',
    },
    {
      title: 'Active Operators',
      value: `${stats.activeOperators} Active`,
      desc: 'Staff in system directory',
      icon: (
        <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/employees'),
      color: 'border-teal-500/20 bg-teal-500/5',
    },
    {
      title: 'Pending Payments',
      value: `₹${stats.pendingSalaryPaymentsAmount.toFixed(2)}`,
      desc: 'Unpaid approved earnings',
      icon: (
        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: () => navigate('/admin/salary?tab=payments'),
      color: 'border-rose-500/20 bg-rose-500/5',
    },
    {
      title: 'Machine Management',
      value: 'Configure',
      desc: 'Assigned products & state config',
      icon: (
        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
      onClick: () => navigate('/admin/machines'),
      color: 'border-indigo-500/20 bg-indigo-500/5',
    },
  ];

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Admin Portal" />
      
      <div className="px-4 mt-6">
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50">Operational Metrics</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Real-time indicators from the factory floor</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={card.onClick}
              className={`p-4 border rounded-3xl text-left shadow-premium transition-all active:scale-[0.97] flex flex-col justify-between min-h-[140px] relative overflow-hidden group ${card.color}`}
            >
              {card.badge && (
                <span className="absolute top-3 right-3 text-[8px] font-black tracking-wider uppercase bg-amber-500 dark:bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  {card.badge}
                </span>
              )}
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-dark-bg/40 border border-gray-100 dark:border-dark-border flex items-center justify-center flex-shrink-0 shadow-sm">
                {card.icon}
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-gray-900 dark:text-emerald-50 tracking-tight leading-none truncate">{card.value}</h3>
                <h4 className="text-xs font-black text-gray-700 dark:text-emerald-100/60 uppercase tracking-widest mt-2">{card.title}</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-tight group-hover:text-emerald-500/80 transition-colors">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
