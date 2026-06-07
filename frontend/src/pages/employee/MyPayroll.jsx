import { useState, useEffect } from 'react';
import {
  FileText, DollarSign, Clock, CheckCircle2, AlertCircle,
  TrendingUp, Shield, Calendar, User, Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function SalarySlipCard({ slip }) {
  const isPaid = slip.status === 'PAID';
  return (
    <div className={`form-card hover:shadow-md transition-all ${isPaid ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-amber-200 dark:border-amber-900/40'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-foreground text-base">{slip.month}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Salary Slip</p>
        </div>
        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {slip.status}
        </span>
      </div>

      <div className="space-y-2.5 border-t border-border pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Salary</span>
          <span className="font-medium text-foreground">₹{slip.amount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Absent Deduction ({slip.absentDays} days)</span>
          <span className="font-medium text-rose-600">-₹{slip.deductions.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">PF Contribution (12%)</span>
          <span className="font-medium text-amber-600">-₹{slip.pfContribution.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t border-border pt-2.5 mt-2.5">
          <span className="text-foreground">Net Pay</span>
          <span className="text-emerald-600 text-lg">₹{slip.netPay.toFixed(2)}</span>
        </div>
      </div>

      {isPaid && slip.paidAt && (
        <p className="text-xs text-muted-foreground mt-3">
          Paid on {new Date(slip.paidAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}
    </div>
  );
}

export default function MyPayroll() {
  const { user, token } = useAuth();
  const [data, setData] = useState({ salaries: [], pfBalance: 0, lastUpdatedMonth: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setData(json.data);
        else toast.error('Failed to load payroll data');
      } catch {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, []);

  const totalEarned = data.salaries.filter(s => s.status === 'PAID').reduce((a, s) => a + s.netPay, 0);
  const totalDeducted = data.salaries.reduce((a, s) => a + s.deductions, 0);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="page-title">My Payslips & PF</h1>
          <p className="page-subtitle">Your salary history, deductions, and provident fund balance.</p>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-6 text-white flex items-center gap-5 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden uppercase">
          {user?.profileImageUrl
            ? <img src={user.profileImageUrl} className="w-full h-full object-cover" alt="" />
            : ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || ''))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xl">{displayName}</p>
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Net Earned</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">₹{totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all paid months</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PF Accumulated</p>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">₹{(data.pfBalance || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground mt-1">Redeemable on exit</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Slips</p>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{data.salaries.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.salaries.filter(s => s.status === 'PAID').length} paid, {data.salaries.filter(s => s.status === 'PENDING').length} pending</p>
        </div>
      </div>

      {/* Salary Slips Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Salary Slips</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : data.salaries.length === 0 ? (
          <div className="form-card text-center py-16">
            <FileText size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No payslips yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your salary slips will appear here once payroll is processed by HR.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.salaries.map(slip => <SalarySlipCard key={slip.id} slip={slip} />)}
          </div>
        )}
      </div>
    </div>
  );
}
