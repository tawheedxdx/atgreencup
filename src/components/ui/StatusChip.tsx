import React from 'react';
import { useTranslation } from 'react-i18next';
import type { EntryStatus } from '../../types';
import { STATUS_CONFIG } from '../../types';

interface StatusChipProps {
  status: EntryStatus;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'sm' }) => {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status];
  
  // Localize the label based on the status key
  const localizedLabel = t(`status.${status === 'correction_requested' ? 'correction' : status}`) || cfg.label;

  return (
    <span
      className={`
        inline-flex items-center font-bold rounded-full uppercase tracking-widest
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}
      `}
      style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
    >
      <span
        className={`rounded-full mr-1.5 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: cfg.color }}
      />
      {localizedLabel}
    </span>
  );
};
