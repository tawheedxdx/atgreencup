import React from 'react';
import type { EntryStatus } from '../../types';
import { STATUS_CONFIG } from '../../types';

interface StatusChipProps {
  status: EntryStatus;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full
        ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      `}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span
        className={`rounded-full mr-1.5 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
};
