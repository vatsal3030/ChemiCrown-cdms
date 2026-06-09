import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, Wallet,
  RefreshCw, Plus, Trash2, Edit3, X, Filter,
  ShoppingCart, Users, Package, AlertTriangle, ChevronDown,
  Receipt, ArrowUpRight, ArrowDownRight, BookOpen
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (n) => {
  const v = Math.abs(n || 0);
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

const PIE_COLORS = ['#1F2E54','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'];

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, trend, color, size = 'normal' }) {
  const sizeClass = size === 'large' ? 'p-6' : 'p-5';
  return (
    <div className={`kpi-card group ${sizeClass}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`font-extrabold text-foreground ${size === 'large' ? 'text-4xl' : 'text-2xl'}`}>{value}</p>
      {sub && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend === 'up' && <ArrowUpRight size={13} className="text-emerald-500" />}
          {trend === 'down' && <ArrowDownRight size={13} className="text-rose-500" />}
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
      )}
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────
const EXPENSE_CATS = ['UTILITIES','MAINTENANCE','RENT','MARKETING','TRAVEL','SALARIES','SHIPPING','EQUIPMENT','TAX','INSURANCE','OTHER'];

function ExpenseModal({ expense, token, onClose, onSuccess }) {
  const isEdit = !!expense?.id;
  const [form, setForm] = useState({
    category: expense?.category || 'UTILITIES',
    amount: expense?.amount || '',
    description: expense?.description || '',
    date: expense?.date ? expense.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
    receiptUrl: expense?.receiptUrl || ''
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.category || !form.amount || !form.description || !form.date) {
      return toast.error('Please fill all required fields');
    }
    if (parseFloat(form.amount) <= 0) return toast.error('Amount must be positive');
    setLoading(true);
    try {
      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/api/finance/expenses/${expense.id}`
        : `${import.meta.env.VITE_API_URL}/api/finance/expenses`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) { toast.success(isEdit ? 'Expense updated' : 'Expense recorded'); onSuccess(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    setLoading(false);
  };

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Receipt size={20} className="text-primary" />
            {isEdit ? 'Edit Expense' : 'Log Expense'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Category *</label>
              <select value={form.category} onChange={e => upd('category', e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Amount (₹) *</label>
              <Input type="number" value={form.amount} onChange={e => upd('amount', e.target.value)} placeholder="0.00" min="0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={2}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief description of this expense..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Date *</label>
              <Input type="date" value={form.date} onChange={e => upd('date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Receipt URL</label>
              <Input value={form.receiptUrl} onChange={e => upd('receiptUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Record Expense'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
const TABS = ['overview', 'ledger', 'expenses'];

export default function Finance() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // All filterable state lives in URL
  const activeTab      = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const dateFrom       = searchParams.get('from')     || '';
  const dateTo         = searchParams.get('to')       || '';
  const ledgerType     = searchParams.get('ltype')    || '';
  const ledgerCat      = searchParams.get('lcat')     || '';
  const ledgerPage     = parseInt(searchParams.get('lpage') || '1', 10);
  const expenseCatFilter = searchParams.get('ecat')   || 'all';
  const expensePage    = parseInt(searchParams.get('epage') || '1', 10);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value || value === 'all') prev.delete(key);
      else prev.set(key, value);
      return prev;
    }, { replace: true });
  };

  const setTab = (t) => setParam('tab', t);

  // Date range (temporary state until applied)
  const [tempFrom, setTempFrom] = useState(dateFrom);
  const [tempTo, setTempTo]     = useState(dateTo);

  // Data states
  const [overview, setOverview] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerPagination, setLedgerPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [expenses, setExpenses] = useState([]);
  const [expensePagination, setExpensePagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseModal, setExpenseModal] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };
  const dateQ = () => `${dateFrom ? `&from=${dateFrom}` : ''}${dateTo ? `&to=${dateTo}` : ''}`;

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/overview?${dateQ()}`, { headers });
      const json = await res.json();
      if (json.success) setOverview(json.data);
      else toast.error('Failed to load finance data');
    } catch { toast.error('Network error'); }
    setLoading(false);
  }, [dateFrom, dateTo, token]);

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const q = `page=${ledgerPage}&limit=30${dateQ()}${ledgerType ? `&type=${ledgerType}` : ''}${ledgerCat ? `&category=${ledgerCat}` : ''}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/ledger?${q}`, { headers });
      const json = await res.json();
      if (json.success) { setLedger(json.data); setLedgerPagination(json.pagination); }
    } catch { toast.error('Failed to load ledger'); }
    setLedgerLoading(false);
  }, [ledgerPage, ledgerType, ledgerCat, dateFrom, dateTo, token]);

  const fetchExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const q = `page=${expensePage}&limit=20${dateQ()}${expenseCatFilter !== 'all' ? `&category=${expenseCatFilter}` : ''}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/expenses?${q}`, { headers });
      const json = await res.json();
      if (json.success) { setExpenses(json.data); setExpensePagination(json.pagination); }
    } catch { toast.error('Failed to load expenses'); }
    setExpensesLoading(false);
  }, [expensePage, expenseCatFilter, dateFrom, dateTo, token]);

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/expenses/${id}`, {
        method: 'DELETE', headers
      });
      const json = await res.json();
      if (json.success) { toast.success('Expense deleted'); fetchExpenses(); fetchOverview(); }
      else toast.error(json.message);
    } catch { toast.error('Network error'); }
  };

  const syncLedger = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/sync-ledger`, {
        method: 'POST', headers
      });
      const json = await res.json();
      if (json.success) { toast.success(json.message); fetchLedger(); fetchOverview(); }
    } catch { toast.error('Sync failed'); }
  };

  useEffect(() => { fetchOverview(); }, [fetchOverview]);
  useEffect(() => { if (activeTab === 'ledger') fetchLedger(); }, [fetchLedger, activeTab]);
  useEffect(() => { if (activeTab === 'expenses') fetchExpenses(); }, [fetchExpenses, activeTab]);

  const d = overview;

  // Pie chart data for cost breakdown
  const pieData = d ? [
    { name: 'COGS', value: d.cogs },
    { name: 'Payroll', value: d.payrollCost },
    { name: 'Expenses', value: d.totalExpenses },
  ].filter(x => x.value > 0) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance & Accounting</h1>
          <p className="text-slate-500 mt-1">All-time P&L, expense log, and financial ledger.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Date filter */}
          <div className="relative">
            <button onClick={() => setShowDateFilter(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${(dateFrom || dateTo) ? 'bg-primary text-white border-primary' : 'bg-background border-input hover:border-primary text-foreground'}`}>
              <Filter size={15} />
              {dateFrom || dateTo ? `${dateFrom || 'Start'} → ${dateTo || 'Now'}` : 'All Time'}
              <ChevronDown size={14} />
            </button>
          {showDateFilter && (
              <div className="absolute right-0 top-full mt-2 z-20 bg-card border border-border rounded-xl shadow-xl p-4 min-w-[280px]">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Date Range</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">From</label>
                    <Input type="date" value={tempFrom} onChange={e => setTempFrom(e.target.value)} className="text-xs" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">To</label>
                    <Input type="date" value={tempTo} onChange={e => setTempTo(e.target.value)} className="text-xs" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => {
                    setSearchParams(prev => {
                      if (tempFrom) prev.set('from', tempFrom); else prev.delete('from');
                      if (tempTo)   prev.set('to',   tempTo);   else prev.delete('to');
                      return prev;
                    }, { replace: true });
                    setShowDateFilter(false);
                  }}>Apply</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setTempFrom(''); setTempTo('');
                    setSearchParams(prev => { prev.delete('from'); prev.delete('to'); return prev; }, { replace: true });
                    setShowDateFilter(false);
                  }}>Clear</Button>
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchOverview} className="gap-1.5">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={syncLedger} className="gap-1.5">
            <BookOpen size={14} /> Sync Ledger
          </Button>
          <Button size="sm" onClick={() => setExpenseModal({})} className="gap-1.5">
            <Plus size={14} /> Log Expense
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 px-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : d ? (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI label="Total Revenue" value={fmtShort(d.revenue)} sub={`${d.orderCount} delivered orders`} icon={TrendingUp} trend="up" color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
              <KPI label="Gross Profit" value={fmtShort(d.grossProfit)} sub={`${d.grossMargin?.toFixed(1)}% margin`} icon={DollarSign} trend={d.grossProfit >= 0 ? 'up' : 'down'} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
              <KPI label="Net Profit" value={fmtShort(d.netProfit)} sub={`${d.netMargin?.toFixed(1)}% net margin`} icon={Wallet} trend={d.netProfit >= 0 ? 'up' : 'down'} color={d.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} />
              <KPI label="Pending Revenue" value={fmtShort(d.pendingRevenue)} sub={`${d.pendingOrderCount} pending orders`} icon={ShoppingCart} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
            </div>

            {/* Costs row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPI label="COGS (Cost of Goods)" value={fmtShort(d.cogs)} sub="Estimated from delivered orders" icon={Package} color="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" />
              <KPI label="Payroll Costs" value={fmtShort(d.payrollCost)} sub="From paid salary slips" icon={Users} color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" />
              <KPI label="Other Expenses" value={fmtShort(d.totalExpenses)} sub="Manually logged expenses" icon={Receipt} color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" />
            </div>

            {/* P&L Summary card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-foreground mb-1">Revenue vs Payroll — Monthly Trend</h3>
                <p className="text-xs text-muted-foreground mb-4">All-time data from first recorded order</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={d.monthlyRevenue || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtShort(v)} />
                    <Tooltip formatter={(v, n) => [fmt(v), n]} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                    <Area type="monotone" dataKey="payroll" name="Payroll" stroke="#EF4444" strokeWidth={2} fill="url(#payGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Cost breakdown pie */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-foreground mb-1">Cost Breakdown</h3>
                <p className="text-xs text-muted-foreground mb-4">COGS + Payroll + Expenses</p>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-semibold text-foreground">{fmtShort(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center h-40 text-muted-foreground text-sm">No cost data</div>
                )}
              </div>
            </div>

            {/* Expense breakdown by category */}
            {Object.keys(d.expenseByCategory || {}).length > 0 && (
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-foreground mb-4">Expense Breakdown by Category</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(d.expenseByCategory).map(([k,v]) => ({ category: k, amount: v }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtShort(v)} />
                    <Tooltip formatter={(v) => [fmt(v), 'Amount']} />
                    <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent expenses */}
            {(d.recentExpenses || []).length > 0 && (
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Recent Expenses</h3>
                  <button onClick={() => setTab('expenses')} className="text-xs text-primary hover:underline">View All</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {['Date','Category','Description','Amount'].map(h => (
                        <th key={h} className={`px-4 py-2.5 ${h==='Amount'?'text-right':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {d.recentExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium">{exp.category}</span></td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{exp.description}</td>
                        <td className="px-4 py-3 text-right font-semibold text-rose-600">-{fmt(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Failed to load finance data</p>
            <Button size="sm" onClick={fetchOverview} className="mt-3">Retry</Button>
          </div>
        )
      )}

      {/* ── LEDGER TAB ── */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <select value={ledgerType} onChange={e => setParam('ltype', e.target.value)}
                className="text-sm bg-background border border-input rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                <option value="">All Types</option>
                <option value="CREDIT">Credit (Income)</option>
                <option value="DEBIT">Debit (Expense)</option>
              </select>
              <Input placeholder="Filter by category..." value={ledgerCat} onChange={e => setParam('lcat', e.target.value)} className="w-40 h-9 text-sm" />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">{ledgerPagination.total} entries</span>
              <button onClick={fetchLedger} className="p-2 rounded-lg border border-input hover:bg-muted">
                <RefreshCw size={13} className={ledgerLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {['Date','Type','Category','Description','Amount','Source'].map(h => (
                    <th key={h} className={`px-5 py-3 ${h==='Amount'?'text-right':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>{[1,2,3,4,5,6].map(j => <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-24" /></td>)}</tr>
                  ))
                ) : ledger.length === 0 ? (
                  <tr><td colSpan="6" className="p-10 text-center text-muted-foreground">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No ledger entries found. Click "Sync Ledger" to import historical data.</p>
                  </td></tr>
                ) : ledger.map(entry => (
                  <tr key={entry.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 ${entry.type === 'DEBIT' ? 'border-l-2 border-l-red-300 dark:border-l-red-800' : 'border-l-2 border-l-emerald-300 dark:border-l-emerald-800'}`}>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs">{entry.category}</span></td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">{entry.description}</td>
                    <td className={`px-5 py-3 text-right font-bold ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {entry.type === 'DEBIT' ? '-' : '+'}{fmt(entry.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${entry.isAutomatic ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'}`}>
                        {entry.isAutomatic ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {ledgerPagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {ledgerPagination.page} of {ledgerPagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setParam('lpage', String(Math.max(1, ledgerPage - 1)))} disabled={ledgerPagination.page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setParam('lpage', String(Math.min(ledgerPagination.totalPages, ledgerPage + 1)))} disabled={ledgerPagination.page >= ledgerPagination.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <select value={expenseCatFilter} onChange={e => setParam('ecat', e.target.value)}
                className="text-sm bg-background border border-input rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                <option value="all">All Categories</option>
                {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">{expensePagination.total} records</span>
              <Button size="sm" onClick={() => setExpenseModal({})}>
                <Plus size={14} className="mr-1.5" /> Log Expense
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {['Date','Category','Description','Amount','Actions'].map(h => (
                    <th key={h} className={`px-5 py-3 ${h==='Amount'||h==='Actions'?'text-right':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expensesLoading ? (
                  [1,2,3,4].map(i => <tr key={i}>{[1,2,3,4,5].map(j => <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-20" /></td>)}</tr>)
                ) : expenses.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-muted-foreground">
                    <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No expenses recorded yet.</p>
                    <Button size="sm" className="mt-3" onClick={() => setExpenseModal({})}>Log First Expense</Button>
                  </td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-semibold">{exp.category}</span></td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[220px] truncate">{exp.description}</td>
                    <td className="px-5 py-3 text-right font-bold text-rose-600">-{fmt(exp.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setExpenseModal(exp)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit3 size={13} /></button>
                        <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expensePagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {expensePagination.page} of {expensePagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setParam('epage', String(Math.max(1, expensePage - 1)))} disabled={expensePagination.page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setParam('epage', String(Math.min(expensePagination.totalPages, expensePage + 1)))} disabled={expensePagination.page >= expensePagination.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expense Modal */}
      {expenseModal !== null && (
        <ExpenseModal
          expense={Object.keys(expenseModal).length > 0 ? expenseModal : null}
          token={token}
          onClose={() => setExpenseModal(null)}
          onSuccess={() => { setExpenseModal(null); fetchExpenses(); fetchOverview(); }}
        />
      )}
    </div>
  );
}
