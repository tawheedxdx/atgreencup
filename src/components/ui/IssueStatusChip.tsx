import React from 'react';
import type { IssueStatus } from '../../types';
import { ISSUE_STATUS_CONFIG } from '../../types';

interface IssueStatusChipProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

export const IssueStatusChip: React.FC<IssueStatusChipProps> = ({ status, size = 'sm' }) => {
  const cfg = ISSUE_STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex items-center font-bold rounded-full uppercase tracking-widest
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}
      `}
      style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
    >
      <span
        className={`rounded-full mr-1.5 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
};
