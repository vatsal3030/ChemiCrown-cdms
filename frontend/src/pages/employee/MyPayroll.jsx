import { useState, useEffect, useCallback } from 'react';
import { 
  IndianRupee, FileText, CheckCircle2, Clock, Shield, ThumbsUp, Search, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function MyPayroll() {
  const { user, token } = useAuth();
  const [data, setData] = useState({ salaries: [], pfBalance: 0, lastUpdatedMonth: null });
  const [loading, setLoading] = useState(true);
  const [searchMonth, setSearchMonth] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
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
                          onClick={() => setSelectedSlip(slip)}
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

      {/* Modal / Dialog for Payslip Breakdown and Printing */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:relative print:p-0 print:bg-transparent" onClick={() => setSelectedSlip(null)}>
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:p-0" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border print:hidden">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  Payslip - {selectedSlip.month}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Slip ID: {selectedSlip.id}</p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable Printable Content */}
            <div id="printable-payslip" className="flex-1 overflow-y-auto py-6 space-y-6 print:overflow-visible print:py-0">
              
              {/* Company & Employee Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black tracking-tight text-primary">ChemiCrown Inc.</h3>
                  <p className="text-xs text-muted-foreground">Monthly Salary Slip</p>
                  <div className="text-xs text-muted-foreground pt-2 space-y-1">
                    <p><strong>Month:</strong> {selectedSlip.month}</p>
                    <p><strong>Working Days:</strong> {selectedSlip.workingDays} days (Absent: {selectedSlip.absentDays || 0} days)</p>
                  </div>
                </div>
                
                <div className="space-y-1 md:text-right">
                  <h4 className="font-bold text-foreground">{displayName || 'Employee'}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, ' ').toLowerCase()}</p>
                  <div className="text-xs text-muted-foreground pt-2 space-y-1">
                    <p><strong>Email:</strong> {user?.email}</p>
                    {selectedSlip.paidAt && (
                      <p><strong>Paid On:</strong> {new Date(selectedSlip.paidAt).toLocaleDateString('en-IN')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Earnings */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-1 border-b border-border">Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                      <span className="font-medium text-foreground">₹{(selectedSlip.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(selectedSlip.overtime || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Overtime Pay</span>
                        <span className="font-medium text-emerald-600">+₹{(selectedSlip.overtime || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(selectedSlip.incentive || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Sales Incentive</span>
                        <span className="font-medium text-emerald-600">+₹{(selectedSlip.incentive || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(selectedSlip.bonus || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Bonus</span>
                        <span className="font-medium text-emerald-600">+₹{(selectedSlip.bonus || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(selectedSlip.allowances || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Allowances</span>
                        <span className="font-medium text-emerald-600">+₹{(selectedSlip.allowances || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
                      <span>Gross Earnings</span>
                      <span>
                        ₹{(
                          (selectedSlip.amount || 0) + 
                          (selectedSlip.overtime || 0) + 
                          (selectedSlip.incentive || 0) + 
                          (selectedSlip.bonus || 0) + 
                          (selectedSlip.allowances || 0)
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-1 border-b border-border">Deductions</h4>
                  <div className="space-y-2 text-sm">
                    {(selectedSlip.deductions || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Absent Deduction</span>
                        <span className="font-medium text-rose-600">-₹{(selectedSlip.deductions || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(selectedSlip.pfContribution || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">PF Contribution</span>
                        <span className="font-medium text-rose-600">-₹{(selectedSlip.pfContribution || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(selectedSlip.tds || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">TDS / Taxes</span>
                        <span className="font-medium text-rose-600">-₹{(selectedSlip.tds || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {((selectedSlip.deductions || 0) === 0 && (selectedSlip.pfContribution || 0) === 0 && (selectedSlip.tds || 0) === 0) && (
                      <div className="text-xs text-muted-foreground italic">No deductions this month</div>
                    )}
                    <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
                      <span>Total Deductions</span>
                      <span className="text-rose-600">
                        -₹{(
                          (selectedSlip.deductions || 0) + 
                          (selectedSlip.pfContribution || 0) + 
                          (selectedSlip.tds || 0)
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable */}
              <div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Net Payable Amount</h4>
                  <p className="text-2xl font-black text-foreground">₹{(selectedSlip.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                
                {selectedSlip.status === 'PAID' && (
                  <div className="text-xs space-y-0.5 sm:text-right text-slate-500">
                    <p><strong>Paid via:</strong> {selectedSlip.paymentMethod?.replace(/_/g, ' ')}</p>
                    {selectedSlip.transactionRef && <p><strong>Ref:</strong> {selectedSlip.transactionRef}</p>}
                  </div>
                )}
              </div>

              {/* Employee Acknowledgment */}
              {selectedSlip.status === 'PAID' && !selectedSlip.confirmedByEmployee && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Acknowledge Receipt</h5>
                    <p className="text-xs text-amber-700 dark:text-amber-500/80">Please click the button to confirm receipt of payment.</p>
                  </div>
                  <Button
                    onClick={() => handleConfirmReceipt(selectedSlip.id)}
                    disabled={confirmingReceipt}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <ThumbsUp size={13} />
                    {confirmingReceipt ? 'Confirming...' : 'Confirm'}
                  </Button>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border print:hidden">
              <Button variant="outline" onClick={() => setSelectedSlip(null)}>Close</Button>
              <Button onClick={handlePrintPayslip} className="gap-2">
                Print Payslip
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
