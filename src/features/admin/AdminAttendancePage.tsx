import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAttendanceLogs, checkInOperator, checkOutOperator, subscribeEmployees } from '../../services/admin.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { Button } from '../../components/ui/Button';
import type { UserProfile } from '../../types';
import { Timestamp } from 'firebase/firestore';

interface AttendanceRecord {
  id: string;
  operatorUid: string;
  operatorName: string;
  employeeId: string;
  checkInTime: Timestamp | null;
  checkOutTime: Timestamp | null;
  date: string;
  status: string;
  shift: string;
}

export const AdminAttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedOperatorUid, setSelectedOperatorUid] = useState('');
  const [selectedShift, setSelectedShift] = useState('Day');
  const [customTime, setCustomTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to employees for manual check-in dropdown
  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      setEmployees(list.filter(e => e.active));
    });
    return unsub;
  }, []);

  // Fetch/Subscribe to attendance logs
  useEffect(() => {
    let active = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const logs = await getAttendanceLogs(selectedDate);
        if (active) {
          setAttendanceList(logs as AttendanceRecord[]);
        }
      } catch (err) {
        console.error('Error fetching attendance logs:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLogs();
    
    // Refresh interval every 30s for today's logs
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedDate]);

  const handleCheckOut = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to check out this operator?')) return;
    try {
      await checkOutOperator(recordId);
      // Refresh current list
      const logs = await getAttendanceLogs(selectedDate);
      setAttendanceList(logs as AttendanceRecord[]);
    } catch (err: any) {
      alert(err.message || 'Check out failed');
    }
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperatorUid) {
      setFormError('Please select an employee.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const checkInDate = customTime ? new Date(`${selectedDate}T${customTime}`) : undefined;
      await checkInOperator(selectedOperatorUid, selectedShift, checkInDate);
      setIsModalOpen(false);
      setSelectedOperatorUid('');
      setCustomTime('');
      // Refresh logs
      const logs = await getAttendanceLogs(selectedDate);
      setAttendanceList(logs as AttendanceRecord[]);
    } catch (err: any) {
      setFormError(err.message || 'Check in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return '--:--';
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: Timestamp | null, end: Timestamp | null) => {
    if (!start || !end) return '';
    const diffMs = end.toDate().getTime() - start.toDate().getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Attendance Logs" />

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="flex bg-white dark:bg-dark-surface p-1 rounded-2xl border border-gray-100 dark:border-dark-border mb-6">
          <button
            onClick={() => {
              setActiveTab('today');
              const today = new Date().toISOString().split('T')[0];
              setSelectedDate(today);
            }}
            className={`flex-1 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all ${
              activeTab === 'today'
                ? 'bg-emerald-500 text-white shadow-premium'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white shadow-premium'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
            }`}
          >
            History Logs
          </button>
        </div>

        {/* Date picker for History mode */}
        {activeTab === 'history' && (
          <div className="mb-6 bg-white dark:bg-dark-surface p-4 rounded-3xl border border-gray-100 dark:border-dark-border flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Select Log Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
            />
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Total Present</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">{attendanceList.length}</span>
          </div>
          <div className="p-4 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl flex flex-col justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Active Right Now</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 block mt-1">
              {attendanceList.filter(r => !r.checkOutTime).length} Shifted
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">
            {selectedDate === new Date().toISOString().split('T')[0] ? "Today's logs" : `Logs for ${selectedDate}`}
          </h2>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="!rounded-2xl"
          >
            + Log Check-In
          </Button>
        </div>

        {/* Logs Table / List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm font-medium">No check-in logs found for this date.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attendanceList.map((record) => (
              <div
                key={record.id}
                className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-gray-900 dark:text-emerald-50 truncate">{record.operatorName}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-2 py-0.5 rounded-full">
                      {record.shift}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-2">Emp ID: {record.employeeId || 'N/A'}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Check In</span>
                      <span>{formatTime(record.checkInTime)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Check Out</span>
                      <span>{formatTime(record.checkOutTime)}</span>
                    </div>
                    {record.checkOutTime && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Duration</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{formatDuration(record.checkInTime, record.checkOutTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!record.checkOutTime && (
                  <button
                    onClick={() => handleCheckOut(record.id)}
                    className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-widest px-3 py-2 rounded-2xl transition-colors shrink-0"
                  >
                    Check Out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Check-in Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-emerald-50 uppercase tracking-widest">Manual Check-In</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleManualCheckIn} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Select Operator</label>
                  <select
                    value={selectedOperatorUid}
                    onChange={(e) => setSelectedOperatorUid(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="">-- Choose Operator --</option>
                    {employees.map((emp) => (
                      <option key={emp.uid} value={emp.uid}>
                        {emp.name} ({emp.employeeId || 'No ID'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Shift</label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Custom Time (Optional)</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="Defaults to current time"
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
                  />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">Leave blank to use current local time.</span>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full !rounded-2xl mt-4"
                >
                  {submitting ? 'Checking In...' : 'Confirm Check-In'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
