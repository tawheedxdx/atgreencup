import React from 'react';
import { motion } from 'framer-motion';
import type { EarningPeriodType } from '../../types';

interface PeriodRestrictedWarningProps {
  assignedPeriod: EarningPeriodType;
}

export const PeriodRestrictedWarning: React.FC<PeriodRestrictedWarningProps> = ({ assignedPeriod }) => {
  const label = assignedPeriod === 'weekly' ? 'weekly' : 'monthly';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex flex-col items-center justify-center text-center px-2 py-8"
    >
      <div className="w-full max-w-xs bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/30 rounded-[1.75rem] p-7 shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shadow-inner">
          <span className="text-2xl select-none" role="img" aria-label="Warning">⚠️</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-amber-900 dark:text-amber-200 tracking-tight mb-2">
          Access Restricted
        </h3>

        {/* Message */}
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
          You are assigned for{' '}
          <span className="font-black capitalize">{label}</span>.{' '}
          If you want to change, contact your admin.
        </p>

        {/* Divider */}
        <div className="mt-5 pt-4 border-t border-amber-200/60 dark:border-amber-700/20">
          <p className="text-[10px] font-black text-amber-500/70 dark:text-amber-500/50 uppercase tracking-widest">
            🔒 Period Locked by Admin
          </p>
        </div>
      </div>
    </motion.div>
  );
};
