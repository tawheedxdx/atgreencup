import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ProductionEntry } from '../../types';
import { StatusChip } from './StatusChip';
import { formatDate } from '../../utils/helpers';

interface EntryCardProps {
  entry: ProductionEntry;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/entries/${entry.id}`)}
      className="bg-white rounded-2xl p-4 shadow-sm shadow-gray-200/50 border border-gray-100 cursor-pointer overflow-hidden relative"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{entry.productName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Machine {entry.machineNo} · {formatDate(entry.submittedAt)}
          </p>
        </div>
        <StatusChip status={entry.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500 relative z-10">
          <span className="font-medium text-gray-700">
            {entry.quantity} {entry.unit}
            {entry.quantity2 && entry.unit2 && ` + ${entry.quantity2} ${entry.unit2}`}
          </span>
          <span>Shift: {entry.shift}</span>
        </div>
        {entry.imageUrl && (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative z-10">
            <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
