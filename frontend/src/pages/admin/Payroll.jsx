import { useState, useEffect } from 'react';
import {
  Wallet, CheckCircle2, Clock, Plus, Search, Filter,
  DollarSign, CreditCard, Banknote, Smartphone, X, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function SalaryStatusBadge({ status, confirmed }) {
  if (status === 'PAID' && confirmed) return <span className="badge badge-success"><ShieldCheck size={11} /> Paid & Confirmed</span>;
  if (status === 'PAID') return <span className="badge badge-success"><CheckCircle2 size={11} /> Paid</span>;
  return <span className="badge badge-warning"><Clock size={11} /> Pending</span>;
}

function PaymentModal({ slip, onClose, onConfirm, loading }) {
  const [method, setMethod] = useState('CASH');
  if (!slip) return null;
  const emp = slip.employee?.user;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <DollarSign size={20} className="text-primary" /> Process Salary Payment
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Paying To</p>
            <p className="font-bold text-foreground">{emp?.firstName} {emp?.lastName}</p>
            <p className="text-sm text-muted-foreground">{emp?.email}</p>
            <p className="text-2xl font-extrabold text-primary mt-2">₹{slip.netPay?.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Net pay for {slip.month}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ key: 'CASH', label: 'Cash', icon: Banknote, desc: 'Physical cash payment' }, { key: 'DIGITAL_TRANSFER', label: 'Digital Transfer', icon: Smartphone, desc: 'Bank/UPI transfer' }].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMethod(opt.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    method === opt.key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <opt.icon size={20} className={method === opt.key ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="font-semibold text-sm text-foreground mt-1">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {method === 'CASH' && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 rounded-xl p-3">
              ⚠️ Cash payment requires manual handover. Employee will be notified to confirm receipt.
            </div>
          )}
          {method === 'DIGITAL_TRANSFER' && (
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 rounded-xl p-3">
              ℹ️ Mark after completing the bank/UPI transfer. Employee will confirm receipt.
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(slip.id, method)} disabled={loading}>
            <CheckCircle2 size={16} className="mr-1.5" />
            {loading ? 'Processing...' : `Confirm ${method === 'CASH' ? 'Cash' : 'Digital'} Payment`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Payroll() {
  const { token } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [payModal, setPayModal] = useState(null); // slip to pay
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchSalaries = async () => {
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
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalaries(); }, [month, statusFilter]);

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for all active employees for ${month}? This cannot be undone.`)) return;
    try {
      setGenerating(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Payroll generated successfully!');
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

  const handlePay = async (salaryId, paymentMethod) => {
    try {
      setPayingId(salaryId);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${salaryId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Salary marked as paid via ${paymentMethod === 'CASH' ? 'Cash' : 'Digital Transfer'}!`);
        setSalaries(prev => prev.map(s => s.id === salaryId ? { ...s, status: 'PAID', paidAt: new Date(), paymentMethod } : s));
        setPayModal(null);
      } else {
        toast.error(json.message || 'Failed to mark as paid');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setPayingId(null);
    }
  };

  const filtered = salaries.filter(s => {
    const name = `${s.employee?.user?.firstName || ''} ${s.employee?.user?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalPaid = salaries.filter(s => s.status === 'PAID').reduce((a, s) => a + s.netPay, 0);
  const totalPending = salaries.filter(s => s.status === 'PENDING').reduce((a, s) => a + s.netPay, 0);
  const totalPF = salaries.reduce((a, s) => a + s.pfContribution, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PaymentModal
        slip={payModal}
        onClose={() => setPayModal(null)}
        onConfirm={handlePay}
        loading={!!payingId}
      />
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <Wallet size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Generate monthly salaries, track deductions, and manage PF contributions.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            {generating ? 'Generating...' : `Generate ${month}`}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid Out</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{salaries.filter(s => s.status === 'PAID').length} employees paid</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Disbursement</p>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{salaries.filter(s => s.status === 'PENDING').length} slips pending</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total PF Contributions</p>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">₹{totalPF.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">Employer PF liability</p>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="data-table-cell">Employee</th>
                <th className="data-table-cell">Base Salary</th>
                <th className="data-table-cell">Absent Days</th>
                <th className="data-table-cell">Deductions</th>
                <th className="data-table-cell">PF (12%)</th>
                <th className="data-table-cell font-bold">Net Pay</th>
                <th className="data-table-cell">Status</th>
                <th className="data-table-cell text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="data-table-row">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="data-table-cell"><div className="h-5 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Wallet size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No payroll data for {month}</p>
                    <p className="text-xs mt-1">Click "Generate" to create payroll slips for all active employees.</p>
                  </td>
                </tr>
              ) : filtered.map(slip => (
                <tr key={slip.id} className="data-table-row">
                  <td className="data-table-cell">
                    <div className="flex items-center gap-3">
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
                  <td className="data-table-cell text-amber-600 font-medium">-₹{slip.pfContribution.toFixed(2)}</td>
                  <td className="data-table-cell font-bold text-foreground text-base">₹{slip.netPay.toFixed(2)}</td>
                  <td className="data-table-cell"><SalaryStatusBadge status={slip.status} confirmed={slip.confirmedByEmployee} /></td>
                  <td className="data-table-cell">
                    <div className="text-xs text-muted-foreground">{slip.paymentMethod?.replace('_', ' ') || '—'}</div>
                  </td>
                  <td className="data-table-cell text-right">
                    {slip.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        onClick={() => setPayModal(slip)}
                        disabled={payingId === slip.id}
                        className="text-xs"
                      >
                        <CreditCard size={13} className="mr-1" />
                        {payingId === slip.id ? 'Processing...' : 'Pay Now'}
                      </Button>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {slip.paidAt ? new Date(slip.paidAt).toLocaleDateString('en-IN') : ''}
                        </span>
                        {!slip.confirmedByEmployee && (
                          <span className="text-xs text-amber-600">Awaiting confirmation</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
