import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEarningsStore } from '../../store/earningsStore';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { LoadingView } from '../../components/feedback/LoadingView';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PeriodRestrictedWarning } from '../../components/feedback/PeriodRestrictedWarning';
import { PageTransition } from '../../components/layout/PageTransition';

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

      </div>
    </PageTransition>
  );
};
