
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Package,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Product, Sale } from '../types';
import { getHourlySales } from '../src/api/salesApi';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalTransactions = sales.length;

  // Fetch today's hourly sales from the backend (re-fetch when sales change)
  const [salesData, setSalesData] = useState(
    Array.from({ length: 24 }, (_, h) => ({ name: `${h}:00`, total: 0 }))
  );

  useEffect(() => {
    getHourlySales()
      .then((data) => {
        setSalesData(data.map((d) => ({ name: `${d.hour}:00`, total: d.total })));
      })
      .catch((err) => console.error("Failed to fetch hourly sales:", err));
  }, [sales]);

  const pieData = [
    { name: 'Healthy Stock', value: products.length - lowStockCount, color: '#10B981' },
    { name: 'Low Stock', value: lowStockCount, color: '#EF4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Total Sales"
          value={totalTransactions.toString()}
          icon={Users}
          color="sky"
        />
        <StatCard
          title="Available Products"
          value={totalProducts.toString()}
          icon={Package}
          color="violet"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount.toString()}
          icon={AlertTriangle}
          color={lowStockCount > 0 ? "rose" : "amber"}
          isAlert={lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
              <p className="text-sm text-gray-500">Today's revenue by hour (Rs.)</p>
            </div>
          </div>
          <div className="h-[350px] w-full" style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{color: '#0F766E', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="total" stroke="#0F766E" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Inventory Status</h3>
          <p className="text-sm text-gray-500 mb-8">Stock health distribution</p>
          <div className="h-[300px] w-full" style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Low Stock Items</h4>
            {products.filter(p => p.quantity <= p.minQuantity).slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-[10px] text-red-500 font-medium">Qty: {p.quantity} {p.type}</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-red-600 hover:underline">REORDER</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'sky' | 'violet' | 'rose' | 'amber';
  isAlert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, isAlert }) => {
  const gradientMap = {
    blue:   'from-primary-400 via-primary-600 to-primary-800',
    sky:    'from-teal-300 via-primary-500 to-primary-700',
    violet: 'from-emerald-400 via-primary-500 to-primary-800',
    amber:  'from-emerald-400 via-teal-500 to-primary-700',
    rose:   'from-amber-400 via-orange-500 to-red-600',
  };

  const ringClass = isAlert
    ? color === 'rose'
      ? 'ring-2 ring-red-400/70 animate-pulse'
      : 'ring-2 ring-warning/60'
    : '';

  return (
    <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl bg-primary-800/80 border border-white/30 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group hover:-translate-y-1 ${ringClass}`}>
      {/* Gradient overlay */}
      <div className={`absolute inset-0 opacity-80 bg-gradient-to-br ${gradientMap[color]} pointer-events-none`} />
      {/* Content */}
      <div className="relative z-10 p-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-primary-100">{title}</h4>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
