import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, CheckCircle2, Clock, Plus, Search, Filter,
  DollarSign, CreditCard, X, ShieldCheck,
  Trash2, Users, SlidersHorizontal, RefreshCw, IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { formatINR, formatINRFull } from '@/lib/utils';
import toast from 'react-hot-toast';

function SalaryStatusBadge({ status, confirmed }) {
  if (status === 'PAID' && confirmed) return <span className="badge badge-success"><ShieldCheck size={11} /> Paid &amp; Confirmed</span>;
  if (status === 'PAID') return <span className="badge badge-success"><CheckCircle2 size={11} /> Paid</span>;
  if (status === 'PROCESSING') return <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Clock size={11} /> Processing</span>;
  if (status === 'FAILED') return <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><X size={11} /> Failed</span>;
  return <span className="badge badge-warning"><Clock size={11} /> Pending</span>;
}

export default function Payroll() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // All filter/state from URL
  const month        = searchParams.get('month')  || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
  const statusFilter = searchParams.get('status') || 'ALL';
  const search       = searchParams.get('q')      || '';
  const minNet       = searchParams.get('minNet')  || '';
  const maxNet       = searchParams.get('maxNet')  || '';

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value || value === 'ALL') prev.delete(key);
      else prev.set(key, value);
      return prev;
    }, { replace: true });
  };

  const [salaries, setSalaries]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [temp, setTemp] = useState({ status: statusFilter, minNet, maxNet });

  const setMonth = (m) => setParam('month', m);

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ month });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setSalaries(json.data);
      else toast.error('Failed to fetch payroll data');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  }, [month, statusFilter, token]);

  useEffect(() => { fetchSalaries(); }, [fetchSalaries]);

  const handleGenerate = async () => {
    const hasExisting = salaries.length > 0;
    const hasPending = salaries.some(s => s.status === 'PENDING');
    let force = false;

    if (hasExisting) {
      if (hasPending) {
        const confirmForce = window.confirm(
          `Payroll slips already exist for ${month}.\n\nDo you want to REGENERATE (re-calculate) all PENDING slips?\n\nThis will delete the pending slips and recalculate them based on the latest attendance and approved overtime/incentives. PAID slips will not be modified.`
        );
        if (!confirmForce) return;
        force = true;
      } else {
        toast.error('All payroll slips for this month are already PAID. Cannot regenerate.');
        return;
      }
    } else {
      if (!window.confirm(`Generate payroll for all active employees for ${month}? This cannot be undone.`)) return;
    }

    try {
      setGenerating(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month, force })
      });
      const json = await res.json();
      if (json.success) { 
        toast.success(json.message || 'Payroll processed successfully!'); 
        fetchSalaries(); 
      } else { 
        toast.error(json.message || 'Failed to generate payroll'); 
      }
    } catch { 
      toast.error('Network error'); 
    } finally { 
      setGenerating(false); 
    }
  };



  const handleBulkPay = async () => {
    const pending = salaries.filter(s => s.status === 'PENDING');
    if (pending.length === 0) return toast.error('No pending slips');
    if (!window.confirm(`Mark ALL ${pending.length} pending slips for ${month} as PAID via Bank Transfer?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/bulk-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month, paymentMethod: 'BANK_TRANSFER' })
      });
      const json = await res.json();
      if (json.success) { toast.success(json.message); fetchSalaries(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const handleDeleteSlip = async (id) => {
    if (!window.confirm('Delete this pending salary slip?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) { toast.success('Slip deleted'); fetchSalaries(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const applyFilters = () => {
    setSearchParams(prev => {
      Object.entries(temp).forEach(([k, v]) => {
        if (!v || v === 'ALL') prev.delete(k);
        else prev.set(k, v);
      });
      return prev;
    }, { replace: true });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setTemp({ status: 'ALL', minNet: '', maxNet: '' });
    setSearchParams(prev => {
      ['status','minNet','maxNet','q'].forEach(k => prev.delete(k));
      return prev;
    }, { replace: true });
  };

  // Client-side secondary filtering (for search and amount range applied on top of server filter)
  const filtered = salaries.filter(s => {
    const name = `${s.employee?.user?.firstName || ''} ${s.employee?.user?.lastName || ''}`.toLowerCase();
    const matchSearch = name.includes((search || '').toLowerCase());
    const matchMin = !minNet || s.netPay >= parseFloat(minNet);
    const matchMax = !maxNet || s.netPay <= parseFloat(maxNet);
    return matchSearch && matchMin && matchMax;
  });

  const totalPaid    = salaries.filter(s => s.status === 'PAID').reduce((a, s) => a + s.netPay, 0);
  const totalPending = salaries.filter(s => s.status === 'PENDING').reduce((a, s) => a + s.netPay, 0);
  const totalPF      = salaries.reduce((a, s) => a + s.pfContribution, 0);
  const pendingCount = salaries.filter(s => s.status === 'PENDING').length;
  const hasActiveFilters = statusFilter !== 'ALL' || minNet || maxNet;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary"><Wallet size={22} /></div>
        <div className="flex-1">
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Generate monthly salaries, track deductions, and manage PF contributions.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {pendingCount > 0 && (
            <Button variant="outline" onClick={handleBulkPay} className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <Users size={15} /> Bulk Pay ({pendingCount})
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={generating} className="flex flex-wrap items-center gap-2">
            <Plus size={16} /> {generating ? 'Generating...' : `Generate ${month}`}
          </Button>
        </div>
      </div>

      {/* Summary Cards — skeleton during loading, real data after */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="kpi-card animate-pulse">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="h-3 bg-muted rounded w-28" />
                <div className="w-9 h-9 rounded-xl bg-muted" />
              </div>
              <div className="h-7 bg-muted rounded w-36 mt-3" />
              <div className="h-3 bg-muted rounded w-24 mt-2" />
            </div>
          ))
        ) : (
          <>
            <div className="kpi-card" title={formatINRFull(totalPaid)}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid Out</p>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatINR(totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{salaries.filter(s => s.status === 'PAID').length} employees paid</p>
            </div>
            <div className="kpi-card" title={formatINRFull(totalPending)}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Disbursement</p>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatINR(totalPending)}</p>
              <p className="text-xs text-muted-foreground mt-1">{pendingCount} slips pending</p>
            </div>
            <div className="kpi-card" title={formatINRFull(totalPF)}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total PF Contributions</p>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><IndianRupee size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatINR(totalPF)}</p>
              <p className="text-xs text-muted-foreground mt-1">Employer PF liability</p>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 sm:max-w-5xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={e => setParam('q', e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Advanced filter toggle */}
            <button
              onClick={() => { setShowFilters(v => !v); setTemp({ status: statusFilter, minNet, maxNet }); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                  : 'bg-card border-border text-foreground hover:border-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && (
                <span className="bg-white/20 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] ml-1">
                  {[statusFilter !== 'ALL', !!minNet, !!maxNet].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={fetchSalaries}
              className="p-2 border border-border text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="border-b border-border bg-muted/20 px-6 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-foreground flex flex-wrap items-center gap-2 text-sm"><Filter size={15} /> Advanced Filters</h3>
              <div className="flex flex-wrap gap-3">
                {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-destructive hover:underline"><X size={12} className="inline mr-0.5" />Clear all</button>}
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Status</label>
                <select
                  value={temp.status}
                  onChange={e => setTemp({ ...temp, status: e.target.value })}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-0.5" />Min Net Pay
                </label>
                <Input type="number" min="0" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} placeholder="₹ 0" value={temp.minNet} onChange={e => setTemp(t => ({ ...t, minNet: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-0.5" />Max Net Pay
                </label>
                <Input type="number" min="0" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} placeholder="₹ ∞" value={temp.maxNet} onChange={e => setTemp(t => ({ ...t, maxNet: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">Reset</button>
              <button onClick={applyFilters} className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">Apply</button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="px-4 py-2 border-b border-border flex flex-wrap gap-2">
            {statusFilter !== 'ALL' && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {statusFilter} <button onClick={() => setParam('status', 'ALL')}><X size={10} /></button>
              </span>
            )}
            {minNet && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                Min ₹{minNet} <button onClick={() => setParam('minNet', '')}><X size={10} /></button>
              </span>
            )}
            {maxNet && (
              <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                Max ₹{maxNet} <button onClick={() => setParam('maxNet', '')}><X size={10} /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive ml-auto">Clear all</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="data-table-cell">Employee</th>
                <th className="data-table-cell">Base Salary</th>
                <th className="data-table-cell">Absent Days</th>
                <th className="data-table-cell">Deductions</th>
                <th className="data-table-cell">PF</th>
                <th className="data-table-cell font-bold">Net Pay</th>
                <th className="data-table-cell">Status</th>
                <th className="data-table-cell">Method</th>
                <th className="data-table-cell text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="data-table-row">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="data-table-cell"><div className="h-5 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No payroll data for {month}</p>
                    <p className="text-xs mt-1">Click "Generate" to create payroll slips for all active employees.</p>
                  </td>
                </tr>
              ) : filtered.map(slip => (
                <tr key={slip.id} className="data-table-row">
                  <td className="data-table-cell">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center overflow-hidden uppercase">
                        {slip.employee?.user?.profileImageUrl
                          ? <img src={slip.employee.user.profileImageUrl} className="w-full h-full object-cover" alt="" />
                          : (slip.employee?.user?.firstName?.[0] || '?')}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{slip.employee?.user?.firstName} {slip.employee?.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{slip.employee?.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="data-table-cell font-medium">₹{slip.amount.toLocaleString('en-IN')}</td>
                  <td className="data-table-cell">
                    <span className={`badge ${slip.absentDays > 0 ? 'badge-error' : 'badge-success'}`}>
                      {slip.absentDays} days
                    </span>
                  </td>
                  <td className="data-table-cell text-rose-600 font-medium">-₹{slip.deductions.toFixed(2)}</td>
                  <td className="data-table-cell text-rose-700/80 font-medium">-₹{slip.pfContribution.toFixed(2)}</td>
                  <td className="data-table-cell font-bold text-foreground text-base">₹{slip.netPay.toFixed(2)}</td>
                  <td className="data-table-cell"><SalaryStatusBadge status={slip.status} confirmed={slip.confirmedByEmployee} /></td>
                  <td className="data-table-cell">
                    <div className="text-xs text-muted-foreground">{slip.paymentMethod?.replace('_', ' ') || '—'}</div>
                  </td>
                  <td className="data-table-cell text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {slip.status === 'PENDING' ? (
                        <>
                          <Link to={`/dashboard/payroll/${slip.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              View
                            </Button>
                          </Link>
                          <Link to={`/dashboard/payroll/pay/${slip.id}`}>
                            <Button size="sm" className="text-xs">
                              <CreditCard size={13} className="mr-1" /> Pay
                            </Button>
                          </Link>
                          <button title="Delete slip" onClick={() => handleDeleteSlip(slip.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block mb-1">
                            {slip.paidAt ? new Date(slip.paidAt).toLocaleDateString('en-IN') : ''}
                          </span>
                          {!slip.confirmedByEmployee && (
                            <span className="text-xs text-amber-600 block mb-1">Awaiting confirmation</span>
                          )}
                          <Link to={`/dashboard/payroll/${slip.id}`}>
                            <Button size="sm" variant="outline" className="text-xs mt-1">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        {filtered.length > 0 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} slip{filtered.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-foreground">
              Total Net: ₹{filtered.reduce((a, s) => a + s.netPay, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
