import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getAttendanceHistory } from '../../services/attendance.service';
import type { AttendanceRecord } from '../../types/attendance';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { LoadingView } from '../../components/feedback/LoadingView';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'present') {
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
        Present
      </span>
    );
  }
  if (status === 'absent') {
    return (
      <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
        Absent
      </span>
    );
  }
  return (
    <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
      {status}
    </span>
  );
};

export const AttendanceHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const fetchHistory = async () => {
      try {
        const data = await getAttendanceHistory(profile.uid);
        setRecords(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load attendance history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [profile]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <MobileHeader title="My Attendance" onBack={() => navigate(-1)} />

      <div className="px-5 py-6 max-w-lg mx-auto">
        {loading ? (
          <div className="py-20">
            <LoadingView message="Loading attendance history..." />
          </div>
        ) : error ? (
          <div className="py-10">
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          </div>
        ) : records.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title="No Attendance Records"
              message="You have no attendance history yet."
              icon={
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-dark-surface/40 rounded-3xl p-5 mb-2 border border-emerald-100 dark:border-dark-border">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] mb-1">
                Total Records
              </p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-emerald-50">{records.length}</h2>
              <div className="flex gap-4 mt-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  <span className="text-emerald-600 dark:text-emerald-400">{records.filter(r => r.status === 'present').length}</span> Present
                </p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  <span className="text-red-500">{records.filter(r => r.status === 'absent').length}</span> Absent
                </p>
              </div>
            </div>

            {records.map((record) => (
              <div key={record.id} className="bg-white dark:bg-dark-surface rounded-[1.5rem] p-5 shadow-sm border border-gray-100 dark:border-dark-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white mb-0.5">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  {record.checkInTime && record.status === 'present' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={record.status} />
                  {record.status === 'present' && record.locationVerified && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[10px] font-bold">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
