import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { getIssueById } from '../../services/issues.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { IssueStatusChip } from '../../components/ui/IssueStatusChip';
import { PriorityChip } from '../../components/ui/PriorityChip';
import { LoadingView } from '../../components/feedback/LoadingView';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Toast } from '../../components/feedback/Toast';
import { Button } from '../../components/ui/Button';
import { deleteIssueReport } from '../../services/issues.service';
import { deleteIssuePhoto } from '../../services/storage.service';
import { formatDateTime } from '../../utils/helpers';
import { ISSUE_TYPE_CONFIG } from '../../types';
import type { IssueReport } from '../../types';

export const IssueDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [issue, setIssue] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchIssue = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getIssueById(id);
      // Security: operators can only see their own issues
      if (!data || data.operatorUid !== profile?.uid) {
        setError(t('issue.not_found'));
        return;
      }
      setIssue(data);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    setDeleting(true);
    try {
      // 1. Delete document
      await deleteIssueReport(issue.id!);
      
      // 2. Delete photo if exists
      if (issue.photoPath) {
        try {
          await deleteIssuePhoto(issue.photoPath);
        } catch (imgErr) {
          console.warn('Storage cleanup failed:', imgErr);
        }
      }

      setToast({ message: t('issue.delete_success'), type: 'success' });
      setTimeout(() => navigate('/issues', { replace: true }), 1500);
    } catch (err: any) {
      setToast({ message: err.message || t('common.error'), type: 'error' });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id, profile]);

  if (loading) return <LoadingView message={t('common.loading')} />;
  if (error || !issue) return <ErrorState message={error || t('issue.not_found')} onRetry={fetchIssue} />;

  const typeCfg = ISSUE_TYPE_CONFIG[issue.issueType];
  const canEdit = issue.status === 'open';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader title={t('issue.details_title')} onBack={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-lg mx-auto space-y-5 pb-24">

        {/* ── Status + Date header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-dark-border"
        >
          <div className="flex items-center justify-between mb-4">
            <IssueStatusChip status={issue.status} size="md" />
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {formatDateTime(issue.createdAt)}
            </span>
          </div>

          {/* Issue type badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-4"
            style={{ backgroundColor: `${typeCfg.color}12`, color: typeCfg.color }}
          >
            <span className="text-xl">{typeCfg.icon}</span>
            <span className="text-sm font-black uppercase tracking-wide">{typeCfg.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              {t('issue.machine_label')}: <span className="text-gray-700 dark:text-emerald-100">{issue.machineNo}</span>
            </span>
            <PriorityChip priority={issue.priority} size="md" />
          </div>
        </motion.div>

        {/* ── Photo ── */}
        {issue.photoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-surface rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border"
          >
            <img src={issue.photoUrl} alt="Issue photo" className="w-full h-56 object-cover" />
          </motion.div>
        )}

        {/* ── Description ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-dark-border"
        >
          <h3 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mb-3">
            {t('issue.description_label')}
          </h3>
          <p className="text-sm font-medium text-gray-800 dark:text-emerald-50 leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </motion.div>

        {/* ── Operator info ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-dark-border space-y-3"
        >
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] mb-1">
            {t('profile.details')}
          </h3>
          <DetailRow label={t('issue.operator_label')} value={issue.operatorName} />
          {issue.employeeId && <DetailRow label={t('profile.emp_id')} value={issue.employeeId} />}
          {issue.updatedAt && (
            <DetailRow label={t('history.last_updated')} value={formatDateTime(issue.updatedAt)} />
          )}
        </motion.div>

        {/* ── Admin note / Needs more info ── */}
        {issue.adminNote ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-amber-50 dark:bg-amber-950/20 rounded-[1.5rem] p-5 border border-amber-100 dark:border-amber-900/30"
          >
            <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2">
              {t('issue.admin_note')}
            </h3>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 leading-relaxed">
              {issue.adminNote}
            </p>
          </motion.div>
        ) : null}

        {/* ── Resolution info (resolved / closed) ── */}
        {(issue.status === 'resolved' || issue.status === 'closed') && issue.resolvedBy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-emerald-50 dark:bg-emerald-950/20 rounded-[1.5rem] p-5 border border-emerald-100 dark:border-emerald-900/30"
          >
            <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">
              {t('issue.resolved_info')}
            </h3>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
              {t('issue.resolved_by', { name: issue.resolvedBy })}
              {issue.resolvedAt ? ` · ${formatDateTime(issue.resolvedAt)}` : ''}
            </p>
            {issue.resolutionType && (
              <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 font-semibold uppercase tracking-widest">
                {issue.resolutionType}
              </p>
            )}
          </motion.div>
        )}

        {/* ── Actions (only while open) ── */}
        {canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="pt-2 pb-4 flex gap-3"
          >
            <Button
              variant="secondary"
              className="flex-1 !py-4 !rounded-2xl dark:bg-dark-surface dark:text-emerald-50 dark:border-dark-border"
              onClick={() => navigate(`/issues/${issue.id}/edit`)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="danger"
              className="flex-1 !py-4 !rounded-2xl !bg-red-500/10 !text-red-600 !border-red-500/20 shadow-none hover:!bg-red-500/20"
              onClick={() => setShowDeleteConfirm(true)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              {t('common.delete') || 'Delete'}
            </Button>
          </motion.div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('issue.delete_title')}
        message={t('issue.delete_msg')}
        confirmLabel={t('issue.delete_btn')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

// ── Local helper ──────────────────────────────────────────────
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">
      {label}
    </span>
    <span className="text-sm font-black text-gray-900 dark:text-emerald-50 text-right ml-4">{value}</span>
  </div>
);
