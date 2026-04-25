
import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronRight,
  Package,
  Download,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { Product, Sale } from '../types';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  onOpenCalendar: () => void;
}

const SHOP_NAME = 'GrocyPro Store';

const Reports: React.FC<ReportsProps> = ({ products, sales, onOpenCalendar }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Inventory estimated asset value
  const inventoryValue = products.reduce((acc, p) => acc + p.quantity * p.pricePerUnit, 0);

  // Filtered table data
  const todaySales = sales.filter(s => s.date.startsWith(today));
  const monthSales = sales.filter(s => s.date.startsWith(currentMonth));
  const displayedSales = showAllTransactions ? monthSales : todaySales;

  // CSV export helper
  const generateCSV = (data: Sale[], filename: string) => {
    const headers = ['Invoice ID', 'Date', 'Time', 'Items', 'Total Amount'];
    
    const rows = data.map(s => {
      const dateObj = new Date(s.date);
      return [
        s.id.toUpperCase(),
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        s.items.length.toString(),
        s.totalAmount.toFixed(2),
      ];
    });

    const totalAmount = data.reduce((a, s) => a + s.totalAmount, 0);
    rows.push(['', '', '', 'Total Transactions:', data.length.toString()]);
    rows.push(['', '', '', 'Total Amount:', totalAmount.toFixed(2)]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToday = () => {
    generateCSV(todaySales, `sales-today-${today}`);
    setExportMenuOpen(false);
  };

  const exportMonth = () => {
    generateCSV(
      monthSales,
      `sales-${currentMonth}`
    );
    setExportMenuOpen(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Business Reports</h2>
          <p className="text-sm text-gray-500">Detailed overview of store performance and trends</p>
        </div>
        <button
          onClick={onOpenCalendar}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-200"
        >
          <Calendar className="w-4 h-4" /> Calendar
        </button>
      </div>

      {/* Estimated Asset Value */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-200">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">Estimated Asset Value</p>
          <p className="text-4xl font-extrabold text-gray-700">Rs. {inventoryValue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total value of current inventory stock</p>
        </div>
      </div>

      {/* Recent Sales Activity Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-gray-800">Recent Sales Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {showAllTransactions
                ? `All transactions — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
                : "Today's transactions"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllTransactions(v => !v)}
              className="text-sm font-bold text-primary hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              {showAllTransactions ? 'Show Today' : 'View All Transactions'}
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setExportMenuOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow shadow-primary-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <button
                    onClick={exportToday}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold">Export Today's Transactions</p>
                      <p className="text-xs text-gray-400">Generate CSV for today</p>
                    </div>
                  </button>
                  <div className="h-px bg-gray-100" />
                  <button
                    onClick={exportMonth}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold">Export All Transactions</p>
                      <p className="text-xs text-gray-400">Generate CSV for this month</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-800 uppercase">{sale.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">
                      {new Date(sale.date).toLocaleDateString()} at{' '}
                      {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500">{sale.items.length} products</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-700">Rs. {sale.totalAmount.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
              {displayedSales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No transactions recorded {showAllTransactions ? 'this month' : 'today'}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
