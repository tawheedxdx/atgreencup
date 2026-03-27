import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color = '#10B981' }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${color}18` }}
    >
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{title}</p>
    </div>
  </div>
);
