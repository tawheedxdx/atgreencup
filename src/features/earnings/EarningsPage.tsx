import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEarningsStore } from '../../store/earningsStore';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { LoadingView } from '../../components/feedback/LoadingView';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PeriodRestrictedWarning } from '../../components/feedback/PeriodRestrictedWarning';
import { PageTransition } from '../../components/layout/PageTransition';
import { subscribeToSalarySlips } from '../../services/salarySlips.service';
import { Toast } from '../../components/feedback/Toast';
import type { SalarySlip } from '../../types';

type FilterType = 'all' | 'paid' | 'unpaid' | 'not_payable';

export const EarningsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const {
    assignedPeriod,
    selectedPeriod,
    isRestricted,
    earnings,
    forecasted,
    paid,
    unpaid,
    loading,
    initPeriod,
    selectPeriod,
  } = useEarningsStore();

  const [filter, setFilter] = useState<FilterType>('all');

  // Wages slips state
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loadingSlips, setLoadingSlips] = useState(true);
  const [slipsSearch, setSlipsSearch] = useState('');
  const [slipsFilter, setSlipsFilter] = useState<'all' | 'paid' | 'pending' | 'rejected'>('all');
  const [toastSlips, setToastSlips] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;

    setLoadingSlips(true);
    const unsubscribe = subscribeToSalarySlips(
      profile.uid,
      (data) => {
        setSlips(data);
        setLoadingSlips(false);
      },
      (err) => {
        console.error('Realtime slips error:', err);
        setLoadingSlips(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  const filteredSlips = slips.filter((slip) => {
    if (slipsFilter !== 'all' && slip.paymentStatus !== slipsFilter) {
      return false;
    }
    if (slipsSearch.trim()) {
      const q = slipsSearch.toLowerCase();
      const matchNo = (slip.slipNumber || '').toLowerCase().includes(q);
      const matchPeriod = (slip.salaryPeriod || '').toLowerCase().includes(q);
      return matchNo || matchPeriod;
    }
    return true;
  });

  // Bootstrap: set assigned period from profile and fetch earnings once
  useEffect(() => {
    if (profile?.uid) {
      initPeriod(profile.earningsPeriodType, profile.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  const handlePeriodToggle = (type: 'weekly' | 'monthly') => {
    selectPeriod(type);
  };

  const filteredEarnings = earnings.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'paid') return e.paymentStatus === 'paid';
    if (filter === 'unpaid') return e.paymentStatus === 'pending_payment';
    if (filter === 'not_payable') return e.paymentStatus === 'not_payable';
    return true;
  });

  // Helper: is this period option the assigned one?
  const isAssigned = (type: 'weekly' | 'monthly') => assignedPeriod === type;

  return (
    <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300">
      <MobileHeader title="Earnings" onBack={() => navigate('/dashboard')} />

      <div className="px-5 max-w-lg mx-auto py-6 space-y-6">

        {/* Header & Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50">
            {selectedPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Summary
          </h2>

          <div className="flex bg-gray-200/50 dark:bg-dark-surface p-1 rounded-xl">
            {(['weekly', 'monthly'] as const).map((type) => {
              const active = selectedPeriod === type;
              const locked = assignedPeriod !== null && !isAssigned(type);

              return (
                <button
                  key={type}
                  onClick={() => handlePeriodToggle(type)}
                  title={locked ? `You are assigned for ${assignedPeriod}` : undefined}
                  className={[
                    'text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-colors flex items-center gap-1',
                    active
                      ? 'bg-white dark:bg-dark-bg text-emerald-600 shadow-sm'
                      : locked
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500',
                  ].join(' ')}
                >
                  {locked && <span className="text-[9px]">🔒</span>}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Restricted Warning — replaces all earnings content */}
        {isRestricted && assignedPeriod && (
          <PeriodRestrictedWarning assignedPeriod={assignedPeriod} />
        )}

        {/* Earnings Content — only shown when NOT restricted */}
        {!isRestricted && (
          <>
            {/* Summary Cards */}
            {loading ? (
              <div className="py-8"><LoadingView message="Loading earnings..." /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-600 dark:bg-emerald-900/40 p-5 rounded-[1.5rem] col-span-2 shadow-lg shadow-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-200 dark:text-emerald-400 uppercase tracking-widest mb-1">Forecasted Earnings</p>
                  <p className="text-3xl font-black text-white dark:text-emerald-50">₹{forecasted.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-dark-surface p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-dark-border">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Paid</p>
                  <p className="text-xl font-black text-gray-900 dark:text-gray-100">₹{paid.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-[1.5rem] border border-orange-100 dark:border-orange-800/20">
                  <p className="text-[10px] font-black text-orange-600/70 dark:text-orange-500/70 uppercase tracking-widest mb-1">Unpaid</p>
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400">₹{unpaid.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="pt-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {(['all', 'paid', 'unpaid', 'not_payable'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${
                      filter === f
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-white text-gray-500 border border-gray-200 dark:bg-dark-surface dark:text-gray-400 dark:border-dark-border'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Earnings List */}
            {!loading && (
              <div className="space-y-3">
                {filteredEarnings.length === 0 ? (
                  <EmptyState title="No Earnings Found" message="No records match your selected filters." />
                ) : (
                  filteredEarnings.map((earning) => (
                    <div
                      key={earning.id}
                      onClick={() => navigate(`/entries/${earning.entryId}`)}
                      className="bg-white dark:bg-dark-surface p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50 leading-tight mb-0.5">{earning.productName}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{earning.productionDate} • {earning.machineNo}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          earning.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                          earning.paymentStatus === 'not_payable' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' :
                          'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                        }`}>
                          {earning.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-end justify-between pt-3 border-t border-gray-50 dark:border-gray-800/50">
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            {earning.quantity} {earning.unit} @ ₹{earning.rateAmount}/{earning.ratePerQuantity}
                          </p>
                        </div>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          ₹{earning.calculatedAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Wages Slips Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50">
              Wages Slips
            </h2>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={slipsSearch}
                onChange={(e) => setSlipsSearch(e.target.value)}
                placeholder="Search by Slip No. or Period..."
                className="w-full bg-white dark:bg-dark-surface pl-10 pr-10 py-3 rounded-2xl border border-gray-200 dark:border-dark-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {slipsSearch && (
                <button
                  onClick={() => setSlipsSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['all', 'paid', 'pending', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSlipsFilter(status)}
                  className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border ${
                    slipsFilter === status
                      ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 dark:bg-dark-surface dark:text-gray-400 dark:border-dark-border'
                  }`}
                >
                  {status === 'all' ? 'All Slips' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Slips List */}
          {loadingSlips ? (
            <div className="py-8"><LoadingView message="Loading wages slips..." /></div>
          ) : filteredSlips.length === 0 ? (
            <EmptyState
              title={slips.length === 0 ? "No Wages Slips" : "No Matching Slips"}
              message={slips.length === 0 ? "No wages slips have been generated yet." : "No records match your search or filter."}
            />
          ) : (
            <div className="space-y-3.5">
              {filteredSlips.map((slip) => (
                <div
                  key={slip.id}
                  className="bg-white dark:bg-dark-surface p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Slip Number</p>
                      <h4 className="text-sm font-black text-gray-900 dark:text-emerald-50 leading-tight">{slip.slipNumber}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                      slip.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                      slip.paymentStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                      'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                    }`}>
                      {slip.paymentStatus === 'paid' ? '🟢 Paid' : slip.paymentStatus === 'rejected' ? '🔴 Rejected' : '🟡 Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs py-1">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Salary Period</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300">{slip.salaryPeriod}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Generated Date</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300">{slip.generatedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-3.5 border-t border-gray-50 dark:border-gray-800/50">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Final Amount</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{(slip.finalAmount || 0).toFixed(2)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/earnings/slips/${slip.id}`)}
                        title="View Slip"
                        className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-dark-bg dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-colors border border-gray-100 dark:border-gray-800"
                      >
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => {
                          if (slip.pdfUrl) {
                            window.open(slip.pdfUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            setToastSlips({ message: 'PDF not available for this slip.', type: 'error' });
                          }
                        }}
                        disabled={!slip.pdfUrl}
                        title="Download PDF"
                        className={`p-2 rounded-xl transition-colors border ${
                          slip.pdfUrl 
                            ? 'bg-gray-50 hover:bg-gray-100 dark:bg-dark-bg dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-800' 
                            : 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-300 border-transparent dark:bg-dark-bg/25 dark:text-gray-600'
                        }`}
                      >
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>

                      <button
                        onClick={() => navigate(`/earnings/slips/${slip.id}?save=true`)}
                        title="Save Image"
                        className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-dark-bg dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-colors border border-gray-100 dark:border-dark-border"
                      >
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>

                      <button
                        onClick={async () => {
                          const shareText = `Wages Slip ${slip.slipNumber} (${slip.salaryPeriod}) - Amount: ₹${slip.finalAmount}`;
                          const shareUrl = `${window.location.origin}/earnings/slips/${slip.id}`;
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: `Wages Slip ${slip.slipNumber}`,
                                text: shareText,
                                url: shareUrl,
                              });
                            } catch (err: any) {
                              if (err.name !== 'AbortError') {
                                setToastSlips({ message: 'Failed to share.', type: 'error' });
                              }
                            }
                          } else {
                            try {
                              await navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
                              setToastSlips({ message: 'Copied share link to clipboard!', type: 'success' });
                            } catch {
                              setToastSlips({ message: 'Failed to copy share link.', type: 'error' });
                            }
                          }
                        }}
                        title="Share"
                        className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-dark-bg dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-colors border border-gray-100 dark:border-gray-800"
                      >
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l4.632-2.316m0 0a3 3 0 10-2.671-4.06l-4.632 2.316m8.948 2.502a3 3 0 11-2.122 4.632l-4.632-2.316m0 0a3 3 0 10-2.67 4.06l4.632-2.316m-4.632 2.316a3 3 0 011.602-2.767" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {toastSlips && (
          <Toast
            message={toastSlips.message}
            type={toastSlips.type}
            onClose={() => setToastSlips(null)}
          />
        )}
      </div>
    </PageTransition>
  );
};
