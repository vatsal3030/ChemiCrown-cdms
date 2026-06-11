import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, FileText, CheckCircle2, Clock, Shield, ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function SalarySlipCard({ slip, token, onConfirmed }) {
  const isPaid = slip.status === 'PAID';
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${slip.id}/confirm`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Salary receipt confirmed!');
        onConfirmed();
      } else {
        toast.error(json.message || 'Failed to confirm');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setConfirming(false);
    }
  };

  // Safe number formatting helpers — guard against null/undefined API values
  const safeFmt   = (v, dec = 2) => (Number(v) || 0).toFixed(dec);
  const safeLocale = (v)         => (Number(v) || 0).toLocaleString('en-IN');

  return (
    <div className={`form-card hover:shadow-md transition-all ${isPaid ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-amber-200 dark:border-amber-900/40'}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <p className="font-bold text-foreground text-base">{slip.month}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Salary Slip</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isPaid && slip.confirmedByEmployee && (
            <span className="badge badge-success"><ThumbsUp size={11} /> Confirmed</span>
          )}
          <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
            {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {slip.status}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-border pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Salary</span>
          <span className="font-medium text-foreground">₹{safeLocale(slip.amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Absent Deduction ({slip.absentDays || 0} days)</span>
          <span className="font-medium text-rose-600">-₹{safeFmt(slip.deductions)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">PF Contribution (12%)</span>
          <span className="font-medium text-amber-600">-₹{safeFmt(slip.pfContribution)}</span>
        </div>
        {(slip.bonus || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bonus</span>
            <span className="font-medium text-emerald-600">+₹{safeFmt(slip.bonus)}</span>
          </div>
        )}
        {(slip.overtime || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overtime Pay</span>
            <span className="font-medium text-emerald-600">+₹{safeFmt(slip.overtime)}</span>
          </div>
        )}
        {(slip.incentive || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Incentive</span>
            <span className="font-medium text-emerald-600">+₹{safeFmt(slip.incentive)}</span>
          </div>
        )}
        {(slip.allowances || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Allowances</span>
            <span className="font-medium text-emerald-600">+₹{safeFmt(slip.allowances)}</span>
          </div>
        )}
        {(slip.tds || 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TDS</span>
            <span className="font-medium text-rose-600">-₹{safeFmt(slip.tds)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-border pt-2.5 mt-2.5">
          <span className="text-foreground">Net Pay</span>
          <span className="text-emerald-600 text-lg">₹{safeFmt(slip.netPay)}</span>
        </div>
      </div>

      {isPaid && slip.paidAt && (
        <p className="text-xs text-muted-foreground mt-3">
          Paid on {new Date(slip.paidAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          {slip.paymentMethod && <span className="ml-2 font-semibold">via {slip.paymentMethod.replace(/_/g, ' ')}</span>}
        </p>
      )}

      {/* Confirm Receipt Button */}
      {isPaid && !slip.confirmedByEmployee && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ThumbsUp size={14} className="mr-2" />
            {confirming ? 'Confirming...' : 'Confirm Receipt'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-1.5">Acknowledge you have received this salary payment</p>
        </div>
      )}
    </div>
  );
}

export default function MyPayroll() {
  const { user, token } = useAuth();
  const [data, setData] = useState({ salaries: [], pfBalance: 0, lastUpdatedMonth: null });
  const [loading, setLoading] = useState(true);

  // fetchPayroll defined in component scope (not inside useEffect)
  // so it can be passed as a prop and called from child components
  const fetchPayroll = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        // Defensive: ensure salaries is always an array
        setData({
          salaries: Array.isArray(json.data?.salaries) ? json.data.salaries : [],
          pfBalance: json.data?.pfBalance || 0,
          lastUpdatedMonth: json.data?.lastUpdatedMonth || null,
        });
      } else {
        toast.error('Failed to load payroll data');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const salaries = data.salaries || [];
  const totalEarned = salaries.filter(s => s.status === 'PAID').reduce((a, s) => a + (s.netPay || 0), 0);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="page-title">My Payslips &amp; PF</h1>
          <p className="page-subtitle">Your salary history, deductions, and provident fund balance.</p>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="bg-linear-to-br from-primary/90 to-primary rounded-2xl p-6 text-white flex flex-wrap items-center gap-5 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden uppercase">
          {user?.profileImageUrl
            ? <img src={user.profileImageUrl} className="w-full h-full object-cover" alt="" />
            : ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || ''))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xl">{displayName || 'Employee'}</p>
          <p className="text-white/60 text-sm capitalize">{user?.role?.replace(/_/g, ' ').toLowerCase()}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-white/60 text-xs">PF Balance</p>
          <p className="text-2xl font-bold">₹{(data.pfBalance || 0).toLocaleString('en-IN')}</p>
          {data.lastUpdatedMonth && (
            <p className="text-white/50 text-xs mt-0.5">Last updated: {data.lastUpdatedMonth}</p>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
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
            <div className="kpi-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Net Earned</p>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">₹{totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all paid months</p>
            </div>
            <div className="kpi-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PF Accumulated</p>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Shield size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">₹{(data.pfBalance || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-1">Redeemable on exit</p>
            </div>
            <div className="kpi-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Slips</p>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{salaries.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {salaries.filter(s => s.status === 'PAID').length} paid,&nbsp;
                {salaries.filter(s => s.status === 'PENDING').length} pending
              </p>
            </div>
          </>
        )}
      </div>

      {/* Salary Slips Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Salary Slips</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : salaries.length === 0 ? (
          <div className="form-card text-center py-16">
            <FileText size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No payslips yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your salary slips will appear here once payroll is processed by HR.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {salaries.map(slip => (
              <SalarySlipCard
                key={slip.id}
                slip={slip}
                token={token}
                onConfirmed={fetchPayroll}  // ✅ now in scope
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
