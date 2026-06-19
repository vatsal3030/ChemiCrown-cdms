import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Package, ShoppingCart, Users, IndianRupee, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Activity, Clock, CheckCircle2,
  XCircle, BarChart3, RefreshCw, ExternalLink, Zap, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatINR, formatINRFull, formatCompact } from '@/lib/utils';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

// ── Skeleton building blocks ──────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`bg-muted animate-pulse rounded-xl ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
      </div>
      <Skeleton className="h-4 w-28 mt-3" />
    </div>
  );
}

// ── Live stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, trend, trendValue, title }) {
  return (
    <div className="kpi-card group" title={title}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {trend === 'up' && <span className="badge badge-success"><ArrowUpRight size={12} />{trendValue}</span>}
        {trend === 'down' && <span className="badge badge-error"><ArrowDownRight size={12} />{trendValue}</span>}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, to, color }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 group`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
      <span className="text-xs font-semibold text-foreground text-center leading-tight">{label}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null); // null = not yet loaded (distinguish from loaded-but-empty)

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Customer redirect — MUST come after all hooks
  if (user?.role === 'CUSTOMER') return <Navigate to="/dashboard/catalog" replace />;

  const OrderStatusBadge = ({ status }) => {
    const map = {
      REQUESTED: 'badge-info',
      PENDING: 'badge-warning',
      PROCESSING: 'badge-secondary',
      PACKAGED: 'badge-info',
      DISPATCHED: 'badge-info',
      DELIVERED: 'badge-success',
      CANCELLED: 'badge-destructive',
    };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
  };

  // ── Full skeleton loading state (no zeros shown) ───────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        {/* Quick Actions */}
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  // Data loaded (may be null if fetch failed — show empty state)
  const stats         = data?.stats         || { revenue: 0, orders: 0, pendingOrders: 0, customers: 0, newCustomers: 0, inventoryAlerts: 0, lowStockProducts: [], revenueTrend: null };
  const revenueData   = data?.revenueData   || [];
  const inventoryData = data?.inventoryData || [];
  const attendanceData = data?.attendanceData || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex flex-wrap items-center gap-2">
            <Zap size={22} className="text-primary" />
            Welcome back, {user.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Revenue"
          value={formatINR(stats.revenue)}
          title={`Full value: ${formatINRFull(stats.revenue)}`}
          trend={stats.revenueTrend !== null ? (parseFloat(stats.revenueTrend) >= 0 ? 'up' : 'down') : undefined}
          trendValue={stats.revenueTrend !== null ? `${parseFloat(stats.revenueTrend) >= 0 ? '+' : ''}${stats.revenueTrend}% vs last month` : undefined}
          icon={IndianRupee}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Active Orders"
          value={stats.orders}
          sub={`${stats.pendingOrders || 0} pending approval`}
          icon={ShoppingCart}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          label="Verified Customers"
          value={stats.customers}
          sub={`${stats.newCustomers || 0} new this week`}
          icon={Users}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <Link to="/dashboard/inventory?stock=low" className="block h-full transition-transform hover:-translate-y-0.5">
          <StatCard
            label="Low Stock Alerts"
            value={stats.inventoryAlerts}
            sub={stats.inventoryAlerts > 0 ? "Needs restock" : "All levels healthy"}
            icon={AlertTriangle}
            color={stats.inventoryAlerts > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}
          />
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
          <QuickAction label="New Order" icon={ShoppingCart} to="/dashboard/orders" color="bg-primary/10 text-primary" />
          <QuickAction label="Add Product" icon={Package} to="/dashboard/inventory/product/new" color="bg-secondary/10 text-secondary" />
          <QuickAction label="HR & Payroll" icon={Users} to="/dashboard/hr" color="bg-primary/10 text-primary" />
          <QuickAction label="Stock History" icon={BarChart3} to="/dashboard/stock-history" color="bg-secondary/10 text-secondary" />
          <QuickAction label="Tasks" icon={CheckCircle2} to="/dashboard/tasks" color="bg-primary/10 text-primary" />
          <QuickAction label="Finance" icon={IndianRupee} to="/dashboard/finance" color="bg-secondary/10 text-secondary" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-foreground">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue year-to-date</p>
            </div>
            <span className="badge badge-success"><TrendingUp size={11} /> YTD</span>
          </div>
          {revenueData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" minHeight={260} height={260} minWidth={0}>
              <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickFormatter={v => formatINR(v)}
                  width={55}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                  formatter={v => [formatINRFull(v), 'Revenue']}
                  cursor={{ fill: 'var(--muted)', radius: 4 }}
                  labelStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
                />
                <Bar dataKey="value" fill="#1F2E54" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Pie */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-foreground">Today's Attendance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Staff present vs absent</p>
          </div>
          {attendanceData?.some(d => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {attendanceData.map((item, i) => (
                  <div key={item.name} className="flex flex-wrap items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground truncate">{item.name}: <strong className="text-foreground">{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No attendance data today</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock Items List */}
        {stats.lowStockProducts?.length > 0 && (
          <div className="bg-card rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-foreground flex flex-wrap items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-500" /> Action Required: Low Stock
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Click an item to view in inventory</p>
              </div>
              <Link to="/dashboard/inventory?filter=low_stock" className="text-xs text-primary font-semibold hover:underline">
                View All →
              </Link>
            </div>
            <div className="space-y-2">
              {stats.lowStockProducts.slice(0, 5).map(p => (
                <Link
                  key={p.id}
                  to={`/dashboard/inventory?search=${encodeURIComponent(p.name)}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                    {p.casNumber && <p className="text-xs font-mono text-muted-foreground mt-0.5">CAS: {p.casNumber}</p>}
                  </div>
                  <div className={`shrink-0 ml-4 font-bold text-sm px-2.5 py-1 rounded-lg ${p.quantity === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {p.quantity === 0 ? 'OUT OF STOCK' : `${p.quantity} left`}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* Inventory Bar Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-foreground">Top Products – Stock Level</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Current inventory quantities</p>
            </div>
          </div>
          {inventoryData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No inventory data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
              <BarChart data={inventoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} width={35} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)' }}
                  cursor={{ fill: 'var(--muted)', radius: 4 }}
                />
                <Bar dataKey="stock" fill="#E6513A" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-foreground">Recent Orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest customer transactions</p>
            </div>
            <Link to="/dashboard/orders" className="text-xs text-primary font-semibold flex flex-wrap items-center gap-1 hover:underline">
              View all <ExternalLink size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {!data?.recentOrders?.length && (
              <div className="text-center py-8 text-sm text-muted-foreground">No recent orders.</div>
            )}
            {data?.recentOrders?.map((order) => {
              const companyName = order.customer?.companyName || 'Unknown';
              const companyInitials = companyName
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <div key={order.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary uppercase">
                    {companyInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {companyName}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <p className="text-xs font-bold text-foreground mt-1" title={formatINRFull(order.total)}>
                      {formatINR(order.total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
