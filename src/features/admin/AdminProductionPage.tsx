import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeAllEntries, approveEntry, rejectEntry, requestCorrection } from '../../services/admin.service';
import { useAuthStore } from '../../store/authStore';
import { MobileHeader } from '../../components/layout/MobileHeader';
import type { ProductionEntry, EntryStatus } from '../../types';

export const AdminProductionPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const searchParams = new URLSearchParams(location.search);
  const initialFilter = (searchParams.get('status') as EntryStatus) || 'pending';
  const [statusFilter, setStatusFilter] = useState<EntryStatus>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Overlays
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionEntryId, setActionEntryId] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<'reject' | 'correct' | null>(null);
  const [dialogText, setDialogText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    const unsub = subscribeAllEntries((allEntries) => {
      setEntries(allEntries);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      setSubmittingAction(true);
      await approveEntry(id, user.uid);
    } catch (err) {
      console.error(err);
      alert('Approval failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openActionDialog = (id: string, type: 'reject' | 'correct') => {
    setActionEntryId(id);
    setDialogType(type);
    setDialogText('');
  };

  const handleDialogSubmit = async () => {
    if (!user || !actionEntryId || !dialogType || !dialogText.trim()) return;
    try {
      setSubmittingAction(true);
      if (dialogType === 'reject') {
        await rejectEntry(actionEntryId, dialogText, user.uid);
      } else {
        await requestCorrection(actionEntryId, dialogText, user.uid);
      }
      setActionEntryId(null);
      setDialogType(null);
    } catch (err) {
      console.error(err);
      alert('Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesStatus = entry.status === statusFilter;
    const matchesSearch =
      entry.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.machineNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.employeeId && entry.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status: EntryStatus) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400';
      case 'correction_requested': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
    }
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Production Logs" />

      {/* Status Chips */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-hide py-1">
        {(['pending', 'approved', 'rejected', 'correction_requested'] as EntryStatus[]).map((status) => {
          const count = entries.filter(e => e.status === status).length;
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all active:scale-95 ${
                isActive
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-premium'
                  : 'bg-white dark:bg-dark-surface text-gray-500 border-gray-100 dark:border-dark-border'
              }`}
            >
              {status.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="px-4 mt-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search operator, machine or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 pl-10 text-sm text-gray-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400 dark:placeholder-gray-500 shadow-premium transition-all"
          />
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Production List */}
      <div className="px-4 mt-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400 uppercase font-black tracking-widest text-xs">Loading entries...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-6 text-gray-400">
            No entries found matching criteria.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-5 shadow-premium space-y-4 relative overflow-hidden"
            >
              {/* Header info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-emerald-50 text-sm">{entry.operatorName}</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    Employee ID: {entry.employeeId || 'N/A'} • {entry.productionDate}
                  </p>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusBadgeClass(entry.status)}`}>
                  {entry.status.replace('_', ' ')}
                </span>
              </div>

              {/* Data block */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-bg/40 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold block">Machine & Product</span>
                  <span className="font-bold text-gray-900 dark:text-emerald-50 mt-1 block">{entry.machineNo}</span>
                  <span className="text-gray-500 dark:text-emerald-100/60 block mt-0.5 truncate">{entry.productName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold block">Production Quantities</span>
                  <span className="font-bold text-gray-900 dark:text-emerald-50 mt-1 block">
                    {entry.boxQuantity ?? entry.quantity} BOX ({entry.packetsPerBox} pcs/box)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    {entry.pcs ?? entry.quantity2} PCS ({entry.totalPackets} Pkts × {entry.counting})
                  </span>
                </div>
              </div>

              {/* Notes & Rejections if any */}
              {entry.notes && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-black uppercase text-[10px] text-gray-400 block mb-0.5">Operator Note:</span>
                  {entry.notes}
                </div>
              )}

              {entry.rejectionReason && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/10 p-3 rounded-2xl">
                  <span className="font-black uppercase text-[10px] block mb-0.5">Rejection Reason:</span>
                  {entry.rejectionReason}
                </div>
              )}

              {entry.correctionMessage && (
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/10 p-3 rounded-2xl">
                  <span className="font-black uppercase text-[10px] block mb-0.5">Correction Request:</span>
                  {entry.correctionMessage}
                </div>
              )}

              {/* Action Buttons & Image Preview Link */}
              <div className="flex items-center gap-3 pt-2">
                {entry.imageUrl && (
                  <button
                    onClick={() => setSelectedImage(entry.imageUrl)}
                    className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider active:opacity-75"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    View Proof
                  </button>
                )}

                <div className="flex-1 flex justify-end gap-2">
                  {entry.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openActionDialog(entry.id!, 'correct')}
                        disabled={submittingAction}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl active:scale-95"
                      >
                        Correct
                      </button>
                      <button
                        onClick={() => openActionDialog(entry.id!, 'reject')}
                        disabled={submittingAction}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl active:scale-95"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(entry.id!)}
                        disabled={submittingAction}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-emerald-500 rounded-xl shadow-sm active:scale-95 hover:bg-emerald-600 transition-colors"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white bg-white/10 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={selectedImage} alt="Production proof" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      {/* Dialog Overlay for Reject/Correct */}
      {dialogType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-up space-y-4">
            <h3 className="font-black text-gray-900 dark:text-emerald-50 text-base uppercase tracking-wider">
              {dialogType === 'reject' ? 'Reject Entry' : 'Request Correction'}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Provide instructions or reasons below. The operator will see this information.
            </p>
            <textarea
              rows={3}
              placeholder={dialogType === 'reject' ? 'Reason for rejection...' : 'Correction instructions...'}
              value={dialogText}
              onChange={(e) => setDialogText(e.target.value)}
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl p-4 text-sm text-gray-900 dark:text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDialogType(null)}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-500 active:opacity-75"
              >
                Cancel
              </button>
              <button
                onClick={handleDialogSubmit}
                disabled={!dialogText.trim() || submittingAction}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-emerald-500 rounded-xl active:scale-95 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
