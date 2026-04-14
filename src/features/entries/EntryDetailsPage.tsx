import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { getEntryById, deleteEntry } from '../../services/entries.service';
import { getEntryEarning } from '../../services/earnings.service';
import { deleteEntryImage } from '../../services/storage.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { StatusChip } from '../../components/ui/StatusChip';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/feedback/LoadingView';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Toast } from '../../components/feedback/Toast';
import { formatDateTime } from '../../utils/helpers';
import type { ProductionEntry, Earning } from '../../types';

export const EntryDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [entry, setEntry] = useState<ProductionEntry | null>(null);
  const [earning, setEarning] = useState<Earning | null>(null);
  const [loadingEarning, setLoadingEarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchEntry = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getEntryById(id);
      if (!data || data.operatorUid !== profile?.uid) {
        setError(t('history.not_found') || 'Production not found');
        return;
      }
      setEntry(data);
      if (data.status === 'approved' && data.id) {
        setLoadingEarning(true);
        getEntryEarning(data.id)
          .then(setEarning)
          .catch(console.error)
          .finally(() => setLoadingEarning(false));
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntry(); }, [id, profile]);

  const canEdit = entry && (entry.status === 'pending' || entry.status === 'rejected' || entry.status === 'correction_requested');
  const canDelete = entry && entry.status === 'pending';

  const handleDelete = async () => {
    if (!entry?.id) return;
    setDeleting(true);
    try {
      if (entry.imagePath) await deleteEntryImage(entry.imagePath);
      await deleteEntry(entry.id);
      setToast({ message: t('history.delete_success') || 'Deleted successfully', type: 'success' });
      setTimeout(() => navigate('/entries', { replace: true }), 1500);
    } catch {
      setToast({ message: t('common.error'), type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) return <LoadingView message={t('common.loading')} />;
  if (error || !entry) return <ErrorState message={error || t('history.not_found')} onRetry={fetchEntry} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader title={t('history.details_title') || "Production Details"} onBack={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">
        {/* Status & Date Header */}
        <div className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <StatusChip status={entry.status} size="md" />
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{formatDateTime(entry.submittedAt)}</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50 leading-tight">{entry.productName}</h2>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 mt-2.5 uppercase tracking-[0.2em]">
            {t('entry.machine')}: {entry.machineNo}
          </p>
        </div>

        {/* Image */}
        {entry.imageUrl && (
          <div className="bg-white dark:bg-dark-surface rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border">
            <img src={entry.imageUrl} alt="Production" className="w-full h-64 object-cover" />
          </div>
        )}

        {/* Details Grid */}
        <div className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-dark-border space-y-4">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] mb-2">{t('profile.details')}</h3>
          <DetailRow label={t('profile.operator')} value={entry.operatorName} />
          {entry.employeeId && <DetailRow label={t('profile.emp_id')} value={entry.employeeId} />}
          <DetailRow label={t('entry.quantity_box')} value={`${entry.quantity} ${t(`common.${entry.unit.toLowerCase()}`) || entry.unit}`} />
          {entry.quantity2 && entry.unit2 && (
            <DetailRow label={t('entry.quantity_pcs')} value={`${entry.quantity2} ${t(`common.${entry.unit2.toLowerCase()}`) || entry.unit2}`} />
          )}
          <DetailRow label={t('entry.shift')} value={t(`shift.${entry.shift.toLowerCase()}`) || entry.shift} />
          <DetailRow label={t('entry.date')} value={entry.productionDate} />
          {entry.notes && <DetailRow label={t('entry.notes')} value={entry.notes} />}
          {entry.updatedAt && (
            <DetailRow label={t('history.last_updated')} value={formatDateTime(entry.updatedAt)} />
          )}
        </div>

        {/* Earnings Details */}
        {entry.status === 'approved' ? (
          <div className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-dark-border space-y-4">
            <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] mb-2">Earnings Calculation</h3>
            {loadingEarning ? (
               <p className="text-sm text-gray-500">Loading calculation...</p>
            ) : earning ? (
               <>
                 <DetailRow label="Machine" value={earning.machineNo} />
                 <DetailRow label="Quantity" value={`${earning.quantity} ${earning.unit}`} />
                 <DetailRow label="Rate" value={`₹${earning.rateAmount} / ${earning.ratePerQuantity} ${earning.unit}`} />
                 <div className="flex justify-between items-center py-3 border-t border-gray-50 dark:border-gray-800 mt-2">
                   <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Earning</span>
                   <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 text-right">₹{earning.calculatedAmount.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                   <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</span>
                   <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${earning.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                     {earning.paymentStatus.replace('_', ' ')}
                   </span>
                 </div>
               </>
            ) : (
               <p className="text-sm text-gray-500 font-medium pb-2">No earning record found for this entry.</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-dark-surface rounded-[1.5rem] p-5 border border-dashed border-gray-300 dark:border-dark-border text-center">
             <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
               Earning will be calculated after approval
             </p>
          </div>
        )}

        {/* Rejection / Correction Message */}
        {(entry.rejectionReason || entry.correctionMessage) && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-[1.5rem] p-5 border border-red-100 dark:border-red-900/30">
            <h3 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-2">
              {entry.status === 'correction_requested' ? t('history.correction_required') : t('history.rejection_reason')}
            </h3>
            <p className="text-sm font-medium text-red-600 dark:text-red-300">
              {entry.correctionMessage || entry.rejectionReason}
            </p>
          </div>
        )}

        {/* Approval Info */}
        {entry.status === 'approved' && entry.approvedBy && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-[1.5rem] p-5 border border-emerald-100 dark:border-emerald-900/30">
            <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1.5">{t('profile.approved')}</h3>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
              {t('history.approved_by', { name: entry.approvedBy })} {formatDateTime(entry.approvedAt)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {(canEdit || canDelete) && (
          <div className="flex gap-4 pt-4 pb-10">
            {canEdit && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate(`/entries/${entry.id}/edit`)}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                className="!py-4 !rounded-2xl dark:bg-dark-surface dark:text-emerald-50 dark:border-dark-border"
              >
                {t('common.edit')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                fullWidth
                onClick={() => setShowDeleteDialog(true)}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
                className="!py-4 !rounded-2xl"
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title={t('common.confirm_delete') || "Delete Production"}
        message={t('common.confirm_delete_msg') || "Are you sure you want to delete this production?"}
        confirmLabel={t('common.delete')}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">{label}</span>
    <span className="text-sm font-black text-gray-900 dark:text-emerald-50 text-right ml-4">{value}</span>
  </div>
);
