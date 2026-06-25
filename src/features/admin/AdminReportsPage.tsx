import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { subscribeAllEntries } from '../../services/admin.service';
import { MobileHeader } from '../../components/layout/MobileHeader';
import type { ProductionEntry, Earning } from '../../types';

type PresetType = 'today' | 'week' | 'month' | 'custom';

// Helper to format Date to YYYY-MM-DD
const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const AdminReportsPage: React.FC = () => {
  const [preset, setPreset] = useState<PresetType>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  // Set initial dates based on preset
  useEffect(() => {
    const today = new Date();
    if (preset === 'today') {
      const todayStr = formatDateStr(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const past = new Date();
      past.setDate(today.getDate() - 6); // Last 7 days
      setStartDate(formatDateStr(past));
      setEndDate(formatDateStr(today));
    } else if (preset === 'month') {
      const past = new Date();
      past.setDate(today.getDate() - 29); // Last 30 days
      setStartDate(formatDateStr(past));
      setEndDate(formatDateStr(today));
    }
  }, [preset]);

  // Subscribe to all entries & earnings
  useEffect(() => {
    const unsubEntries = subscribeAllEntries((list) => {
      setEntries(list);
    });

    const qEarnings = query(collection(db, 'earnings'));
    const unsubEarnings = onSnapshot(qEarnings, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Earning));
      setEarnings(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching earnings for reports:', err);
      setLoading(false);
    });

    return () => {
      unsubEntries();
      unsubEarnings();
    };
  }, []);

  // Filtered data based on selected range
  const filteredData = useMemo(() => {
    if (!startDate || !endDate) return { entries: [], earnings: [] };
    
    const fEntries = entries.filter(
      e => e.productionDate >= startDate && e.productionDate <= endDate
    );
    const fEarnings = earnings.filter(
      e => e.productionDate >= startDate && e.productionDate <= endDate
    );

    return { entries: fEntries, earnings: fEarnings };
  }, [entries, earnings, startDate, endDate]);

  // Calculations
  const stats = useMemo(() => {
    const approvedEntries = filteredData.entries.filter(e => e.status === 'approved');
    
    const totalPcs = approvedEntries.reduce((sum, e) => sum + (e.pcs || 0), 0);
    const totalAmount = filteredData.earnings.reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);
    
    // Average pieces per approved entry
    const avgPcs = approvedEntries.length > 0 ? Math.round(totalPcs / approvedEntries.length) : 0;
    
    // Operator leaderboards
    const opMap: Record<string, { name: string; pcs: number; amount: number }> = {};
    approvedEntries.forEach(e => {
      if (!opMap[e.operatorUid]) {
        opMap[e.operatorUid] = { name: e.operatorName, pcs: 0, amount: 0 };
      }
      opMap[e.operatorUid].pcs += e.pcs || 0;
    });

    filteredData.earnings.forEach(earn => {
      if (opMap[earn.operatorUid]) {
        opMap[earn.operatorUid].amount += earn.calculatedAmount || 0;
      }
    });

    const operatorsList = Object.values(opMap).sort((a, b) => b.pcs - a.pcs);

    // Product performance
    const prodMap: Record<string, { name: string; pcs: number }> = {};
    approvedEntries.forEach(e => {
      if (!prodMap[e.productId]) {
        prodMap[e.productId] = { name: e.productName, pcs: 0 };
      }
      prodMap[e.productId].pcs += e.pcs || 0;
    });
    const productsList = Object.values(prodMap).sort((a, b) => b.pcs - a.pcs);

    return {
      totalPcs,
      totalAmount,
      avgPcs,
      approvedCount: approvedEntries.length,
      operatorsList,
      productsList
    };
  }, [filteredData]);

  // Generate chart data points (max 10 points)
  const chartPoints = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const approvedEntries = filteredData.entries.filter(e => e.status === 'approved');

    // If difference is small, show every day
    if (diffDays <= 10) {
      const points = [];
      for (let i = 0; i < diffDays; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const dateStr = formatDateStr(current);
        const dayEntries = approvedEntries.filter(e => e.productionDate === dateStr);
        const pcsSum = dayEntries.reduce((sum, e) => sum + (e.pcs || 0), 0);
        
        points.push({
          label: current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: pcsSum,
        });
      }
      return points;
    }

    // Otherwise group into 7 chunks (intervals)
    const pointsCount = 7;
    const chunkSize = Math.floor(diffDays / pointsCount);
    const points = [];

    for (let i = 0; i < pointsCount; i++) {
      const chunkStart = new Date(start);
      chunkStart.setDate(start.getDate() + i * chunkSize);
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkStart.getDate() + chunkSize - 1);
      
      const startStr = formatDateStr(chunkStart);
      const endStr = formatDateStr(chunkEnd);

      const chunkEntries = approvedEntries.filter(
        e => e.productionDate >= startStr && e.productionDate <= endStr
      );
      const pcsSum = chunkEntries.reduce((sum, e) => sum + (e.pcs || 0), 0);

      points.push({
        label: `${chunkStart.getDate()}-${chunkEnd.getDate()} ${chunkStart.toLocaleDateString(undefined, { month: 'short' })}`,
        value: pcsSum,
      });
    }
    return points;
  }, [startDate, endDate, filteredData.entries]);

  // SVG Chart rendering helper
  const svgChart = useMemo(() => {
    if (chartPoints.length === 0) return null;

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = chartPoints.map(p => p.value);
    const maxVal = Math.max(...values, 1000); // minimum scale max at 1000

    // Coordinates mapping helper
    const getX = (index: number) => {
      if (chartPoints.length <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (chartPoints.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
      return paddingTop + chartHeight - (val / maxVal) * chartHeight;
    };

    // Build the SVG path string
    let pathD = '';
    let areaD = `M ${getX(0)} ${getY(0)}`;

    chartPoints.forEach((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.value);
      if (idx === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${paddingTop + chartHeight} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
    });

    if (chartPoints.length > 0) {
      areaD += ` L ${getX(chartPoints.length - 1)} ${paddingTop + chartHeight} Z`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + ratio * chartHeight;
          const val = Math.round((1 - ratio) * maxVal);
          return (
            <g key={i} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="4 4"
                className="dark:stroke-dark-border"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                className="text-[9px] font-black fill-gray-400 dark:fill-gray-500 text-right"
                textAnchor="end"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Chart fill area */}
        {chartPoints.length > 1 && (
          <path d={areaD} fill="url(#chartGradient)" />
        )}

        {/* Chart line path */}
        {chartPoints.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#10B981"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points & labels */}
        {chartPoints.map((pt, idx) => {
          const x = getX(idx);
          const y = getY(pt.value);
          return (
            <g key={idx} className="group">
              <circle
                cx={x}
                cy={y}
                r={4}
                className="fill-emerald-500 dark:fill-emerald-400 stroke-white dark:stroke-dark-surface cursor-pointer"
                strokeWidth={1.5}
              />
              {/* Highlight Ring on hover (simulated in CSS/SVG) */}
              <circle
                cx={x}
                cy={y}
                r={8}
                className="fill-emerald-500 opacity-0 group-hover:opacity-20 cursor-pointer transition-opacity"
              />
              {/* Tooltip text */}
              <text
                x={x}
                y={y - 8}
                className="text-[9px] font-black fill-emerald-700 dark:fill-emerald-400 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                textAnchor="middle"
              >
                {pt.value}
              </text>
              {/* X Axis Label */}
              <text
                x={x}
                y={height - 10}
                className="text-[8px] font-black fill-gray-400 dark:fill-gray-500 uppercase tracking-wider"
                textAnchor="middle"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }, [chartPoints]);

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-dark-bg pb-6">
      <MobileHeader title="Performance Reports" />

      {/* Preset Selector */}
      <div className="px-4 mt-6">
        <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-2xl p-1 shadow-sm flex mb-4">
          {(['today', 'week', 'month', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                preset === p
                  ? 'bg-emerald-500 text-white shadow-premium'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-emerald-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {preset === 'custom' && (
          <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-emerald-50"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm">
              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Total Pieces</span>
              <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.totalPcs.toLocaleString()}
              </h2>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-black">Approved production</p>
            </div>

            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm">
              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Total Earnings</span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-emerald-50 mt-1">
                ₹{stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-black">Approved payments</p>
            </div>

            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm">
              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Approved Logs</span>
              <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50 mt-1">
                {stats.approvedCount}
              </h2>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-black">Entries count</p>
            </div>

            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-3xl p-4 shadow-sm">
              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Avg. Pieces / Log</span>
              <h2 className="text-xl font-black text-gray-900 dark:text-emerald-50 mt-1">
                {stats.avgPcs.toLocaleString()}
              </h2>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-black">Log efficiency</p>
            </div>
          </div>

          {/* SVG Trend Graph */}
          {chartPoints.length > 0 && (
            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2rem] p-4 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Production Trend (PCS)</h3>
              <div className="w-full">
                {svgChart}
              </div>
            </div>
          )}

          {/* Leaderboard Lists */}
          <div className="grid grid-cols-1 gap-6">
            {/* Operator Pcs Leaderboard */}
            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2rem] p-5 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Operator Performance</h3>
              {stats.operatorsList.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No operator records for this period.</p>
              ) : (
                <div className="space-y-3">
                  {stats.operatorsList.map((op, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-dark-border/30 last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-400 dark:text-gray-500 w-4">#{idx + 1}</span>
                        <div>
                          <div className="text-xs font-black text-gray-900 dark:text-emerald-50">{op.name}</div>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Earnings: ₹{op.amount.toFixed(2)}</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-emerald-50">
                        {op.pcs.toLocaleString()} PCS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Performance Leaderboard */}
            <div className="bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-[2rem] p-5 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Product Production Shares</h3>
              {stats.productsList.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No product records for this period.</p>
              ) : (
                <div className="space-y-3">
                  {stats.productsList.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-dark-border/30 last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-400 dark:text-gray-500 w-4">#{idx + 1}</span>
                        <span className="text-xs font-black text-gray-900 dark:text-emerald-50">{prod.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-emerald-50">
                        {prod.pcs.toLocaleString()} PCS
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
