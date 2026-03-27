import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getEntryById, deleteEntry } from '../../services/entries.service';
import { deleteEntryImage } from '../../services/storage.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { StatusChip } from '../../components/ui/StatusChip';
import { Button } from '../../components/ui/Button';
import { LoadingView } from '../../components/feedback/LoadingView';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Toast } from '../../components/feedback/Toast';
import { formatDateTime } from '../../utils/helpers';
import type { ProductionEntry } from '../../types';

export const EntryDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [entry, setEntry] = useState<ProductionEntry | null>(null);
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
        setError('Production not found');
        return;
      }
      setEntry(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load entry');
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
      setToast({ message: 'Production deleted successfully', type: 'success' });
      setTimeout(() => navigate('/entries', { replace: true }), 1500);
    } catch {
      setToast({ message: 'Failed to delete entry', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) return <LoadingView message="Loading entry..." />;
  if (error || !entry) return <ErrorState message={error || 'Production not found'} onRetry={fetchEntry} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Production Details" onBack={() => navigate(-1)} />

      <div className="px-5 py-4 max-w-lg mx-auto space-y-4">
        {/* Status & Date Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <StatusChip status={entry.status} size="md" />
            <span className="text-xs text-gray-400">{formatDateTime(entry.submittedAt)}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">{entry.productName}</h2>
          <p className="text-sm text-gray-500 mt-1">Machine {entry.machineNo}</p>
        </div>

        {/* Image */}
        {entry.imageUrl && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <img src={entry.imageUrl} alt="Production" className="w-full h-56 object-cover" />
          </div>
        )}

        {/* Details Grid */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
          <DetailRow label="Operator" value={entry.operatorName} />
          {entry.employeeId && <DetailRow label="Employee ID" value={entry.employeeId} />}
          <DetailRow label="Quantity" value={`${entry.quantity} ${entry.unit}`} />
          {entry.quantity2 && entry.unit2 && (
            <DetailRow label="Secondary Quantity" value={`${entry.quantity2} ${entry.unit2}`} />
          )}
          <DetailRow label="Shift" value={entry.shift} />
          <DetailRow label="Production Date" value={entry.productionDate} />
          {entry.notes && <DetailRow label="Notes" value={entry.notes} />}
          {entry.updatedAt && (
            <DetailRow label="Last Updated" value={formatDateTime(entry.updatedAt)} />
          )}
        </div>

        {/* Rejection / Correction Message */}
        {(entry.rejectionReason || entry.correctionMessage) && (
          <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
            <h3 className="text-sm font-semibold text-red-700 mb-2">
              {entry.status === 'correction_requested' ? 'Correction Requested' : 'Rejection Reason'}
            </h3>
            <p className="text-sm text-red-600">
              {entry.correctionMessage || entry.rejectionReason}
            </p>
          </div>
        )}

        {/* Approval Info */}
        {entry.status === 'approved' && entry.approvedBy && (
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="text-sm font-semibold text-emerald-700 mb-1">Approved</h3>
            <p className="text-sm text-emerald-600">
              By {entry.approvedBy} on {formatDateTime(entry.approvedAt)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {(canEdit || canDelete) && (
          <div className="flex gap-3 pt-2 pb-6">
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
              >
                Edit
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
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Production"
        message="Are you sure you want to delete this production? This action cannot be undone."
        confirmLabel="Delete"
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
  <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right ml-4">{value}</span>
  </div>
);
