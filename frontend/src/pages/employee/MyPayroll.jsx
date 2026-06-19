import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, FileText, CheckCircle2, Clock, Shield, ThumbsUp, Search, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function MyPayroll() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ salaries: [], pfBalance: 0, lastUpdatedMonth: null });
  const [loading, setLoading] = useState(true);
  const [searchMonth, setSearchMonth] = useState('');
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchPayroll = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData({
          salaries: Array.isArray(json.data?.salaries) ? json.data.salaries : [],
          pfBalance: json.data?.pfBalance || 0,
          lastUpdatedMonth: json.data?.lastUpdatedMonth || null,
        });
        hasLoadedRef.current = true;
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

  const handleConfirmReceipt = async (slipId) => {
    setConfirmingReceipt(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${slipId}/confirm`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Salary receipt confirmed!');
        setData(prev => ({
          ...prev,
          salaries: prev.salaries.map(s => s.id === slipId ? { ...s, confirmedByEmployee: true } : s)
        }));
        setSelectedSlip(prev => prev && prev.id === slipId ? { ...prev, confirmedByEmployee: true } : prev);
      } else {
        toast.error(json.message || 'Failed to confirm');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const salaries = data.salaries || [];
  const filteredSalaries = salaries.filter(s => 
    (s.month || '').toLowerCase().includes(searchMonth.toLowerCase())
  );
  
  const totalEarned = salaries.reduce((a, s) => a + (s.netPay || 0), 0);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header print:hidden">
        <div className="page-header-icon bg-primary/10 text-primary">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="page-title">My Payslips &amp; PF</h1>
          <p className="page-subtitle">Your salary history, deductions, and provident fund balance.</p>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="bg-linear-to-br from-primary/90 to-primary rounded-2xl p-6 text-white flex flex-wrap items-center gap-5 shadow-lg print:hidden">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:hidden">
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
                  <IndianRupee size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">₹{totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all salary slips</p>
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

      {/* Salary Slips Table Container */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Salary Slips History</h2>
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search month (e.g. 2026-06)..."
              value={searchMonth}
              onChange={e => setSearchMonth(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
          </div>
        </div>

        {loading ? (
          <div className="border border-border rounded-2xl bg-card p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-[200px] bg-muted rounded" />
          </div>
        ) : filteredSalaries.length === 0 ? (
          <div className="form-card text-center py-16">
            <FileText size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No payslips found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchMonth ? 'No results match your search.' : 'Your salary slips will appear here once payroll is processed by HR.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-right">Base Salary</th>
                  <th className="px-4 py-3 text-right">Earnings / Allowances</th>
                  <th className="px-4 py-3 text-right">Deductions &amp; PF</th>
                  <th className="px-4 py-3 text-right font-bold">Net Pay</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSalaries.map(slip => {
                  const isPaid = slip.status === 'PAID';
                  const totalAllowances = (slip.overtime || 0) + (slip.incentive || 0) + (slip.bonus || 0) + (slip.allowances || 0);
                  const totalDeductions = (slip.deductions || 0) + (slip.pfContribution || 0) + (slip.tds || 0);
                  
                  return (
                    <tr key={slip.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{slip.month}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">₹{(slip.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">+₹{totalAllowances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right text-rose-600/80 font-medium">-₹{totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground text-base">₹{(slip.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {slip.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/my-payroll/${slip.id}`)}
                          className="h-8 text-xs font-semibold"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
