import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ProductionEntry } from '../../types';
import { StatusChip } from './StatusChip';
import { formatDate } from '../../utils/helpers';

interface EntryCardProps {
  entry: ProductionEntry;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const localizedShift = entry.shift.toLowerCase().includes('day') ? t('shift.day') : t('shift.night');

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/entries/${entry.id}`)}
      className="bg-white dark:bg-dark-surface rounded-[1.5rem] p-5 shadow-sm shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-dark-border cursor-pointer overflow-hidden relative transition-all hover:border-emerald-200 dark:hover:border-emerald-900/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 dark:text-emerald-50 text-sm truncate tracking-tight">{entry.productName}</h3>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 mt-1.5 uppercase tracking-widest">
            ID: {entry.machineNo} · {formatDate(entry.submittedAt)}
          </p>
        </div>
        <StatusChip status={entry.status} />
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 relative z-10 font-bold uppercase tracking-widest">
          <span className="text-emerald-700 dark:text-emerald-400">
            {entry.quantity} {t(`common.${entry.unit.toLowerCase()}`) || entry.unit}
            {entry.quantity2 && entry.unit2 && ` + ${entry.quantity2} ${t(`common.${entry.unit2.toLowerCase()}`) || entry.unit2}`}
          </span>
          <span className="opacity-40">{localizedShift}</span>
        </div>
        {entry.imageUrl && (
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-bg flex-shrink-0 relative z-10 border border-gray-100 dark:border-dark-border">
            <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
