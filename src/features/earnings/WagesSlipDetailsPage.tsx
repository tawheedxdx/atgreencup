import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getSalarySlipById } from '../../services/salarySlips.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { LoadingView } from '../../components/feedback/LoadingView';
import { Toast } from '../../components/feedback/Toast';
import { PageTransition } from '../../components/layout/PageTransition';
import type { SalarySlip } from '../../types';
import html2canvas from 'html2canvas';

export const WagesSlipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [slip, setSlip] = useState<SalarySlip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSlip = async () => {
      if (!id || !profile?.uid) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getSalarySlipById(id);
        if (!data) {
          setError('Wages Slip not found.');
          return;
        }
        // Security check: Operator can only view their own wages slips
        if (data.operatorUid !== profile.uid) {
          setError('Access denied. You do not have permission to view this wages slip.');
          return;
        }
        setSlip(data);
      } catch (err: any) {
        console.error('Error fetching slip:', err);
        setError(err.message || 'Failed to load wages slip.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlip();
  }, [id, profile?.uid]);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      setToast({ message: 'Generating image...', type: 'info' });
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Wages_Slip_${slip?.slipNumber || 'details'}.png`;
      link.href = image;
      link.click();
      setToast({ message: 'Wages slip saved to your phone!', type: 'success' });
    } catch (err) {
      console.error('Error saving image:', err);
      setToast({ message: 'Failed to save wages slip image.', type: 'error' });
    }
  };

  // Handle auto-save if save query param is present
  useEffect(() => {
    if (!loading && slip && searchParams.get('save') === 'true') {
      // Small timeout to ensure document is fully rendered
      const timer = setTimeout(() => {
        handleSaveImage();
        // Remove the query param after saving to avoid repeating
        navigate(`/earnings/slips/${slip.id}`, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, slip, searchParams, navigate]);

  const handleShare = async () => {
    if (!slip) return;
    const shareText = `Wages Slip ${slip.slipNumber} for ${slip.salaryPeriod || (slip.fromDate && slip.toDate ? `${slip.fromDate} to ${slip.toDate}` : 'N/A')}\nGross: ₹${(slip.grossEarnings || slip.grossAmount || 0).toFixed(2)}\nFinal Amount: ₹${slip.finalAmount}\nStatus: ${(slip.paymentStatus || slip.status || 'pending').toUpperCase()}`;
    const shareUrl = window.location.href.split('?')[0]; // strip query params

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Wages Slip ${slip.slipNumber}`,
          text: shareText,
          url: shareUrl,
        });
        setToast({ message: 'Shared successfully!', type: 'success' });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setToast({ message: 'Failed to share.', type: 'error' });
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
        setToast({ message: 'Copied to clipboard!', type: 'success' });
      } catch (err) {
        setToast({ message: 'Failed to copy share link.', type: 'error' });
      }
    }
  };

  const handleDownloadPDF = () => {
    if (!slip?.pdfUrl) return;
    window.open(slip.pdfUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        <MobileHeader title="Wages Slip Details" onBack={() => navigate('/earnings')} />
        <div className="flex items-center justify-center py-20">
          <LoadingView message="Loading wages slip..." />
        </div>
      </PageTransition>
    );
  }

  if (error || !slip) {
    return (
      <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        <MobileHeader title="Error" onBack={() => navigate('/earnings')} />
        <div className="max-w-md mx-auto px-5 py-12 text-center">
          <div className="bg-white dark:bg-dark-surface rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-dark-border">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-emerald-50 mb-2">Failed to load</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">{error || 'Something went wrong.'}</p>
            <button
              onClick={() => navigate('/earnings')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-6 rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Back to Earnings
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'paid': return '🟢';
      case 'rejected': return '🔴';
      default: return '🟡';
    }
  };

  const displayMachines = slip.machines && slip.machines.length > 0 
    ? slip.machines 
    : (slip.items || []).map(item => ({
        machineNo: item.machineNo,
        productName: item.productName,
        boxQuantity: item.box,
        totalPackets: item.totalPackets,
        pcs: item.pcs,
        rateAmount: typeof item.rate === 'string' ? parseFloat(item.rate.replace(/[^0-9.]/g, '')) || 0 : item.rate || 0,
        calculatedAmount: item.amount,
        rateString: typeof item.rate === 'string' ? item.rate : undefined
      }));

  return (
    <PageTransition className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300">
      {/* Dynamic styling for print layout */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            background: white !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .print-border {
            border-color: #e5e7eb !important;
          }
        }
      `}</style>

      {/* Header hidden in print */}
      <div className="no-print">
        <MobileHeader title="Wages Slip Details" onBack={() => navigate('/earnings')} />
      </div>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-6">
        {/* Actions bar hidden in print */}
        <div className="no-print flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleSaveImage}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/10"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Save
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 text-xs font-black uppercase tracking-wider rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l4.632-2.316m0 0a3 3 0 10-2.671-4.06l-4.632 2.316m8.948 2.502a3 3 0 11-2.122 4.632l-4.632-2.316m0 0a3 3 0 10-2.67 4.06l4.632-2.316m-4.632 2.316a3 3 0 011.602-2.767" />
            </svg>
            Share
          </button>

          {slip.pdfUrl && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-200 text-xs font-black uppercase tracking-wider rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          )}
        </div>

        {/* Professional Wages Slip document */}
        <div ref={cardRef} className="print-card bg-white dark:bg-dark-surface rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-dark-border">
          {/* Header Banner */}
          <div className="text-center pb-6 border-b border-gray-100 dark:border-gray-800/80 mb-6 print-border">
            <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em] mb-1">AT GREENCUP</h2>
            <h1 className="text-2xl font-black text-gray-900 dark:text-emerald-50 tracking-wide">WAGES SLIP</h1>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Slip No: {slip.slipNumber}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100 dark:border-gray-800/80 mb-6 print-border text-sm">
            <div className="space-y-1.5">
              <p className="text-gray-500 dark:text-gray-400 font-bold">
                Operator Name: <span className="text-gray-900 dark:text-emerald-50 font-black">{slip.operatorName}</span>
              </p>
              <p className="text-gray-500 dark:text-gray-400 font-bold">
                Employee ID: <span className="text-gray-900 dark:text-emerald-50 font-black">{slip.employeeId || 'N/A'}</span>
              </p>
            </div>
            <div className="space-y-1.5 sm:text-right">
              <p className="text-gray-500 dark:text-gray-400 font-bold">
                Salary Period: <span className="text-gray-900 dark:text-emerald-50 font-black">{slip.salaryPeriod || (slip.fromDate && slip.toDate ? `${slip.fromDate} to ${slip.toDate}` : 'N/A')}</span>
              </p>
              <p className="text-gray-500 dark:text-gray-400 font-bold">
                Generated Date: <span className="text-gray-900 dark:text-emerald-50 font-black">{slip.generatedDate || (slip.generatedAt ? new Date(slip.generatedAt).toLocaleDateString() : 'N/A')}</span>
              </p>
            </div>
          </div>

          {/* Machine-wise Summary Table */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Machine-wise Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60 print-border text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider">
                    <th className="py-2.5">Machine No</th>
                    <th className="py-2.5">Product</th>
                    <th className="py-2.5 text-right">Boxes</th>
                    <th className="py-2.5 text-right">Packets</th>
                    <th className="py-2.5 text-right">PCS</th>
                    <th className="py-2.5 text-right">Rate</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40 print-border font-medium text-gray-700 dark:text-gray-300">
                  {displayMachines && displayMachines.length > 0 ? (
                    displayMachines.map((mach: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-gray-900 dark:text-emerald-50">{mach.machineNo}</td>
                        <td className="py-3">{mach.productName}</td>
                        <td className="py-3 text-right">{mach.boxQuantity}</td>
                        <td className="py-3 text-right">{mach.totalPackets}</td>
                        <td className="py-3 text-right">{mach.pcs}</td>
                        <td className="py-3 text-right">
                          {mach.rateString || `₹${(mach.rateAmount || 0).toFixed(2)}`}
                        </td>
                        <td className="py-3 text-right font-black text-gray-900 dark:text-emerald-50">₹{(mach.calculatedAmount || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-gray-400">No machine details found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary / Total Section */}
          <div className="bg-gray-50 dark:bg-dark-bg/60 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-800/80 mb-6 print-border space-y-3.5">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-gray-200/50 dark:border-gray-800/40 pb-2 print-border">Summary</h3>
            <div className="grid grid-cols-2 gap-y-2 text-xs font-bold text-gray-500 dark:text-gray-400">
              <div>Total Boxes:</div>
              <div className="text-right text-gray-900 dark:text-emerald-50 font-black">{slip.totalBoxes}</div>
              
              <div>Total Packets:</div>
              <div className="text-right text-gray-900 dark:text-emerald-50 font-black">{slip.totalPackets}</div>

              <div>Total PCS:</div>
              <div className="text-right text-gray-900 dark:text-emerald-50 font-black">{slip.totalPcs || slip.totalPCS || 0}</div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 print-border">Gross Earnings:</div>
              <div className="text-right text-gray-900 dark:text-emerald-50 font-black border-t border-dashed border-gray-200 dark:border-gray-800 pt-2 print-border">₹{(slip.grossEarnings || slip.grossAmount || 0).toFixed(2)}</div>

              <div>Round Off:</div>
              <div className="text-right text-gray-900 dark:text-emerald-50 font-black">₹{(slip.roundOff || 0) >= 0 ? '+' : ''}{(slip.roundOff || 0).toFixed(2)}</div>

              <div className="text-sm text-emerald-600 dark:text-emerald-400 pt-2 border-t border-gray-200 dark:border-gray-800 print-border">Final Amount:</div>
              <div className="text-right text-base text-emerald-600 dark:text-emerald-400 font-black pt-2 border-t border-gray-200 dark:border-gray-800 print-border">₹{(slip.finalAmount || 0).toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Status Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/80 print-border">
            <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Payment Status</span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusBadgeClass(slip.paymentStatus || slip.status || 'pending')}`}>
              <span className="text-[10px]">{getStatusDot(slip.paymentStatus || slip.status || 'pending')}</span>
              <span>{slip.paymentStatus || slip.status || 'pending'}</span>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageTransition>
  );
};
