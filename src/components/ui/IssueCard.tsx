import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { IssueReport } from '../../types';
import { ISSUE_TYPE_CONFIG } from '../../types';
import { IssueStatusChip } from './IssueStatusChip';
import { PriorityChip } from './PriorityChip';
import { formatDate } from '../../utils/helpers';

interface IssueCardProps {
  issue: IssueReport;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const typeCfg = ISSUE_TYPE_CONFIG[issue.issueType];

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/issues/${issue.id}`)}
      className="bg-white dark:bg-dark-surface rounded-[1.5rem] overflow-hidden shadow-sm shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-dark-border cursor-pointer transition-all hover:border-emerald-200 dark:hover:border-emerald-900/50 relative"
    >
      {/* Left priority accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.5rem]"
        style={{ backgroundColor: typeCfg.color }}
      />

      <div className="p-5 pl-6">
        {/* Top row: type badge + status chip + thumbnail */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="text-xs px-2.5 py-1 rounded-xl font-black uppercase tracking-widest flex-shrink-0"
              style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}15` }}
            >
              {typeCfg.icon} {typeCfg.label}
            </span>
          </div>
          {issue.photoUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-bg flex-shrink-0 ml-3 border border-gray-100 dark:border-dark-border">
              <img src={issue.photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}
        </div>

        {/* Description preview */}
        <p className="text-sm font-semibold text-gray-800 dark:text-emerald-50 line-clamp-2 mb-3 leading-snug">
          {issue.description}
        </p>

        {/* Bottom row: machine, priority, status, date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {t('issue.machine_label')}: {issue.machineNo}
            </span>
            <PriorityChip priority={issue.priority} />
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <IssueStatusChip status={issue.status} />
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {formatDate(issue.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
