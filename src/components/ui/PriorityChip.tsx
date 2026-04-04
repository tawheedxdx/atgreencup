import React from 'react';
import type { IssuePriority } from '../../types';
import { ISSUE_PRIORITY_CONFIG } from '../../types';

interface PriorityChipProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
}

export const PriorityChip: React.FC<PriorityChipProps> = ({ priority, size = 'sm' }) => {
  const cfg = ISSUE_PRIORITY_CONFIG[priority];

  return (
    <span
      className={`
        inline-flex items-center font-bold rounded-full uppercase tracking-widest
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}
      `}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {priority === 'urgent' && (
        <span className="mr-1 text-[8px]">●</span>
      )}
      {cfg.label}
    </span>
  );
};
