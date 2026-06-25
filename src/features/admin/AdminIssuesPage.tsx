import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeOpenIssues, updateIssueStatus } from '../../services/admin.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { 
  ISSUE_PRIORITY_CONFIG, 
  ISSUE_STATUS_CONFIG, 
  ISSUE_TYPE_CONFIG 
} from '../../types';
import type { IssueReport, IssueStatus } from '../../types';

export const AdminIssuesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);

  // Status edit form state
  const [newStatus, setNewStatus] = useState<IssueStatus>('open');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeOpenIssues((list) => {
      setIssues(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleOpenDetails = (issue: IssueReport) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setAdminNote(issue.adminNote || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !selectedIssue.id || !user) return;

    setSubmitting(true);
    try {
      await updateIssueStatus(selectedIssue.id, newStatus, adminNote, user.uid);
      setSelectedIssue(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update issue status');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to safely format Firestore dates
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openIssuesCount = issues.filter(i => i.status === 'open' || i.status === 'in_review').length;

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Issue Logs" />

      <div className="px-4 mt-6">
        {/* Statistics Banner */}
        <div className="bg-red-500/10 dark:bg-red-950/20 border border-red-500/20 dark:border-red-500/10 p-5 rounded-3xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{openIssuesCount}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70 dark:text-red-400/70 mt-1">Open/In-Review Issues</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001c-.77 1.332.192 2.999 1.732 2.999z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">No reported issues found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => {
              const typeCfg = ISSUE_TYPE_CONFIG[issue.issueType] || { label: issue.issueType, icon: '⚠️' };
              const priorityCfg = ISSUE_PRIORITY_CONFIG[issue.priority] || { label: issue.priority, bg: '#F3F4F6', color: '#6B7280' };
              const statusCfg = ISSUE_STATUS_CONFIG[issue.status] || { label: issue.status, bg: '#F3F4F6', color: '#6B7280' };

              return (
                <div
                  key={issue.id}
                  onClick={() => handleOpenDetails(issue)}
                  className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeCfg.icon}</span>
                      <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50">{typeCfg.label}</h4>
                    </div>
                    <span
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {issue.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-dark-border/40 pt-3 mt-1">
                    <div className="flex items-center gap-2">
                      <span>M-{issue.machineNo}</span>
                      <span>•</span>
                      <span>{issue.operatorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.color }}
                        className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                      >
                        {priorityCfg.label}
                      </span>
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-y-auto max-h-[90vh] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Issue Investigation</h3>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedIssue.photoUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden aspect-video border border-gray-100 dark:border-dark-border">
                  <img
                    src={selectedIssue.photoUrl}
                    alt="Issue Proof"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Description</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1 bg-gray-50 dark:bg-dark-bg p-3 rounded-2xl border border-gray-100 dark:border-dark-border">
                    {selectedIssue.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Operator</span>
                    <span className="text-xs font-black text-gray-800 dark:text-emerald-50 block mt-0.5">{selectedIssue.operatorName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Machine</span>
                    <span className="text-xs font-black text-gray-800 dark:text-emerald-50 block mt-0.5">Machine {selectedIssue.machineNo}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4 border-t border-gray-100 dark:border-dark-border/40 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="needs_more_info">Needs Info</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Admin Resolution Notes</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Enter details on how the issue was resolved or notes for the operator..."
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full !rounded-2xl mt-4"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
