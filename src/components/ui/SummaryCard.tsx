import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color = '#10B981' }) => (
  <div className="bg-white dark:bg-dark-surface rounded-[1.5rem] p-4 shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4 transition-all hover:shadow-md dark:hover:bg-dark-card">
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${color}15` }}
    >
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-gray-900 dark:text-emerald-50 leading-none tracking-tight">{value}</p>
      <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1.5 truncate tracking-wider">{title}</p>
    </div>
  </div>
);
