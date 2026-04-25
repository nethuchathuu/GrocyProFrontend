import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowLeft,
  Download,
  TrendingUp,
  ShoppingCart,
  Package,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
  ReportData,
} from '../src/api/salesApi';

type CalendarView = 'calendar' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface CalendarProps {
  onBack: () => void;
}

// ─── helpers ───────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getWeekNumber(d: Date): number {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.ceil((d.getDate() + first.getDay()) / 7);
}

function sundayOfWeek(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  const diff = d.getDay();
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── glass styles ──────────────────────────────────────────────────────────
const glass =
  'bg-white/60 backdrop-blur-xl border border-white/30 shadow-xl';
const glassCard =
  'bg-white/70 backdrop-blur-lg border border-white/40 shadow-lg rounded-3xl';

// ─── Component ─────────────────────────────────────────────────────────────
const CalendarComponent: React.FC<CalendarProps> = ({ onBack }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<CalendarView>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch reports when view changes
  useEffect(() => {
    if (view === 'calendar') return;
    setLoading(true);
    let p: Promise<ReportData>;

    if (view === 'daily') {
      p = getDailyReport(selectedDate);
    } else if (view === 'weekly') {
      p = getWeeklyReport(selectedDate);
    } else if (view === 'monthly') {
      p = getMonthlyReport(year, month + 1);
    } else {
      p = getYearlyReport(year);
    }

    p.then(setReportData)
      .catch(() => setReportData(null))
      .finally(() => setLoading(false));
  }, [view, selectedDate, year, month]);

  // ── navigation ──
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── clicks ──
  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    setSelectedDate(formatDate(d));
    setSelectedLabel(`${MONTH_NAMES[month]} ${day}, ${year}`);
    setView('daily');
  };
  const handleWeekClick = (day: number) => {
    const start = sundayOfWeek(year, month, day);
    setSelectedDate(start);
    const wn = getWeekNumber(new Date(year, month, day));
    setSelectedLabel(`Week ${wn} — ${MONTH_NAMES[month]} ${year}`);
    setView('weekly');
  };
  const handleMonthClick = () => {
    setSelectedDate('');
    setSelectedLabel(`${MONTH_NAMES[month]} ${year}`);
    setView('monthly');
  };
  const handleYearClick = () => {
    setSelectedDate('');
    setSelectedLabel(`Year ${year}`);
    setView('yearly');
  };

  // ── CSV export ──
  const exportCSV = () => {
    if (!reportData) return;
    const data = reportData;
    
    let csvRows: string[] = [];
    const safeString = (str: any) => `"${String(str).replace(/"/g, '""')}"`;

    // Title mapping
    const titleMap: Record<string, string> = {
      daily: 'Daily Sales Summary',
      weekly: 'Weekly Sales Summary',
      monthly: 'Monthly Sales Summary',
      yearly: 'Yearly Sales Summary',
    };

    // General Summary
    csvRows.push(['Report:', titleMap[view] || 'Sales Report'].map(safeString).join(','));
    csvRows.push(['Period:', selectedLabel].map(safeString).join(','));
    csvRows.push(['Exported:', new Date().toLocaleString()].map(safeString).join(','));
    csvRows.push('');
    csvRows.push(['TOTAL SALES', `Rs. ${data.totalSales.toFixed(2)}`].map(safeString).join(','));
    csvRows.push(['TRANSACTIONS', data.totalTransactions].map(safeString).join(','));
    csvRows.push('');

    // Chart data as table
    if (view === 'daily' && data.hourly) {
      csvRows.push(['Hour', 'Sales (Rs.)'].map(safeString).join(','));
      data.hourly.forEach(h => {
        csvRows.push([`${String(h.hour).padStart(2, '0')}:00`, h.total.toFixed(2)].map(safeString).join(','));
      });
    } else if (view === 'weekly' && data.daily) {
      csvRows.push(['Day', 'Sales (Rs.)'].map(safeString).join(','));
      data.daily.forEach(d => {
        csvRows.push([d.day, d.total.toFixed(2)].map(safeString).join(','));
      });
    } else if (view === 'monthly' && data.weekly) {
      csvRows.push(['Week', 'Sales (Rs.)'].map(safeString).join(','));
      data.weekly.forEach(w => {
        csvRows.push([w.week, w.total.toFixed(2)].map(safeString).join(','));
      });
    } else if (view === 'yearly' && data.monthly) {
      csvRows.push(['Month', 'Sales (Rs.)'].map(safeString).join(','));
      data.monthly.forEach(m => {
        csvRows.push([m.month, m.total.toFixed(2)].map(safeString).join(','));
      });
    }

    csvRows.push('');

    // Top products table
    if (data.topProducts.length > 0) {
      csvRows.push(['#', 'Product', 'Qty Sold', 'Revenue'].map(safeString).join(','));
      data.topProducts.forEach((p, i) => {
        csvRows.push([String(i + 1), p.name, p.qty, p.revenue.toFixed(2)].map(safeString).join(','));
      });
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GrocyPro_${view}_report_${selectedDate || year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── back to calendar ──
  const backToCalendar = () => { setView('calendar'); setReportData(null); };

  // ═══════════════════════════════════════════════════════════════════════════
  //  CALENDAR GRID
  // ═══════════════════════════════════════════════════════════════════════════
  const renderCalendar = () => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const cells: React.ReactNode[] = [];

    // Empty leading cells
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`e-${i}`} />);
    }
    // Day cells
    for (let d = 1; d <= totalDays; d++) {
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      const wn = getWeekNumber(new Date(year, month, d));
      const isNewWeek = d === 1 || new Date(year, month, d).getDay() === 0;

      cells.push(
        <div key={d} className="relative group">
          <button
            onClick={() => handleDayClick(d)}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-semibold transition-all duration-200
              ${isToday ? 'bg-primary text-white shadow-lg shadow-primary-300' : 'text-gray-700 hover:bg-primary-100/70 hover:text-primary-700'}
            `}
          >
            {d}
          </button>
          {isNewWeek && (
            <button
              onClick={() => handleWeekClick(d)}
              className="absolute -left-1 -top-1 px-1.5 py-0.5 text-[9px] font-bold bg-primary-500/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-primary"
              title={`View Week ${wn} Report`}
            >
              W{wn}
            </button>
          )}
        </div>,
      );
    }

    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className={`${glass} rounded-3xl p-8 w-full max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-500`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-primary-100/60 text-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <button onClick={handleMonthClick} className="text-xl font-extrabold text-gray-700 hover:text-primary transition-colors">
                {MONTH_NAMES[month]}
              </button>
              <span className="mx-2 text-gray-300">|</span>
              <button onClick={handleYearClick} className="text-xl font-extrabold text-gray-700 hover:text-primary transition-colors">
                {year}
              </button>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-primary-100/60 text-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">{cells}</div>

          {/* Tip */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Click a <span className="font-bold text-primary-500">day</span> for daily report &bull; hover for <span className="font-bold text-primary-500">week</span> badge &bull; click <span className="font-bold text-primary-500">month</span> or <span className="font-bold text-primary-500">year</span> in header
          </p>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  REPORT VIEW (shared for all report types)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderReport = () => {
    const reportTitles: Record<string, string> = {
      daily: 'Daily Sales Summary',
      weekly: 'Weekly Sales Summary',
      monthly: 'Monthly Sales Summary',
      yearly: 'Yearly Sales Summary',
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-primary-400 border-t-transparent rounded-full" />
        </div>
      );
    }

    const data = reportData;
    if (!data) {
      return (
        <div className="text-center py-20 text-gray-400">
          No data available for this period.
        </div>
      );
    }

    // Determine chart data & key
    let chartData: any[] = [];
    let xKey = '';
    if (view === 'daily' && data.hourly) {
      const groupedDaily: { timeLabel: string; total: number }[] = [];
      for (let i = 0; i < 24; i += 2) {
        const sum = data.hourly
          .filter(h => h.hour === i || h.hour === i + 1)
          .reduce((acc, curr) => acc + curr.total, 0);
        groupedDaily.push({
          timeLabel: `${String(i).padStart(2, '0')}:00`,
          total: sum
        });
      }
      chartData = groupedDaily;
      xKey = 'timeLabel';
    } else if (view === 'weekly' && data.daily) { chartData = data.daily; xKey = 'day'; }
    else if (view === 'monthly' && data.weekly) { chartData = data.weekly; xKey = 'week'; }
    else if (view === 'yearly' && data.monthly) { chartData = data.monthly; xKey = 'month'; }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 p-2 md:p-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={backToCalendar} className="flex items-center gap-2 text-primary font-bold hover:text-primary-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Calendar
          </button>
          <button
            onClick={exportCSV}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-200 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        <div className="space-y-8">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-extrabold text-gray-700">{reportTitles[view]}</h2>
            <p className="text-sm text-gray-500 mt-1">{selectedLabel}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Sales</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-700">Rs. {data.totalSales.toLocaleString()}</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transactions</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-700">{data.totalTransactions}</p>
            </div>
          </div>

          {/* Sales Overview Chart */}
          <div className={`${glassCard} p-6`}>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '12px',
                  }}
                  formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Sales']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0F766E"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0F766E' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 Products */}
          <div className={`${glassCard} p-6`}>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Top 10 Best-Selling Products</h3>
            {data.topProducts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No product data for this period.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                  <BarChart data={data.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '12px',
                      }}
                      formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#0F766E" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/50">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Qty Sold</th>
                        <th className="px-4 py-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                      {data.topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-primary-50/40 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary-400" /> {p.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.qty}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-700">Rs. {p.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-full bg-linear-to-br from-primary-50 via-white to-emerald-50">
      {view === 'calendar' ? renderCalendar() : renderReport()}
    </div>
  );
};

export default CalendarComponent;
