import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight,
  Wallet, ShoppingCart, AlertTriangle, BarChart3, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function KPI({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground mt-3">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'positive' ? <TrendingUp size={13} className="text-emerald-500" /> : <TrendingDown size={13} className="text-rose-500" />}
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
      )}
      {!trend && sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

export default function Finance() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error('Failed to load finance data');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-72 bg-muted rounded-2xl" />
      </div>
    );
  }

  // Combine monthly charts
  const combinedData = (data?.monthlyRevenue || []).map((r, i) => ({
    month: r.month,
    revenue: r.revenue,
    payroll: data?.monthlyPayroll?.[i]?.expense || 0,
    profit: r.revenue - (data?.monthlyPayroll?.[i]?.expense || 0)
  }));

  const profitMargin = data?.totalRevenue > 0
    ? ((data.grossProfit / data.totalRevenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <div className="page-header-icon bg-emerald-500/10 text-emerald-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="page-title">Finance Overview</h1>
            <p className="page-subtitle">Revenue, payroll expenses, and gross profit analysis.</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPI
          label="Total Revenue (YTD)"
          value={`₹${(data?.totalRevenue || 0).toLocaleString('en-IN')}`}
          sub="All confirmed orders"
          icon={DollarSign}
          color="bg-primary/10 text-primary"
          trend="positive"
        />
        <KPI
          label="This Month Revenue"
          value={`₹${(data?.monthRevenue || 0).toLocaleString('en-IN')}`}
          sub="Current month only"
          icon={ShoppingCart}
          color="bg-blue-500/10 text-blue-600"
        />
        <KPI
          label="Payroll Expenses (YTD)"
          value={`₹${(data?.totalPayrollExpense || 0).toLocaleString('en-IN')}`}
          sub={`${data?.pendingSalaries || 0} slips pending`}
          icon={Wallet}
          color="bg-amber-500/10 text-amber-600"
          trend="negative"
        />
        <KPI
          label="Gross Profit"
          value={`₹${(data?.grossProfit || 0).toLocaleString('en-IN')}`}
          sub={`${profitMargin}% margin`}
          icon={TrendingUp}
          color={`${(data?.grossProfit || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
          trend={(data?.grossProfit || 0) >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue vs Payroll */}
        <div className="xl:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground">Revenue vs Payroll Expenses</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 6 months comparison</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={combinedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={55} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' }}
                formatter={(v, name) => [`₹${v.toLocaleString('en-IN')}`, name]}
                labelStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#1F2E54" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="payroll" name="Payroll" fill="#E6513A" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-foreground">Gross Profit Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly net after payroll</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={50} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)' }}
                formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Profit']}
              />
              <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fill="url(#profitGrad)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dashboard/payroll" className="form-card flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet size={18} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Payroll Management</p>
            <p className="text-xs text-muted-foreground">Generate & disburse salaries</p>
          </div>
          <ArrowUpRight size={16} className="ml-auto text-muted-foreground" />
        </Link>
        <Link to="/dashboard/orders" className="form-card flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingCart size={18} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Order Revenue</p>
            <p className="text-xs text-muted-foreground">{data?.totalOrders || 0} total orders</p>
          </div>
          <ArrowUpRight size={16} className="ml-auto text-muted-foreground" />
        </Link>
        <Link to="/dashboard/hr" className="form-card flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="font-semibold text-foreground">HR Overview</p>
            <p className="text-xs text-muted-foreground">{data?.pendingSalaries || 0} pending slips</p>
          </div>
          <ArrowUpRight size={16} className="ml-auto text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
