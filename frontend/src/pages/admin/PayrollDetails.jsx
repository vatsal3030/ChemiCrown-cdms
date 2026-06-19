import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, Wallet, CheckCircle2, Clock, X, 
  ShieldCheck, User, Calendar, CreditCard, Receipt, 
  Building2, Phone, Mail, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

function SalaryStatusBadge({ status, confirmed }) {
  if (status === 'PAID' && confirmed) return <span className="badge badge-success"><ShieldCheck size={12} className="mr-1" /> Paid &amp; Confirmed</span>;
  if (status === 'PAID') return <span className="badge badge-success"><CheckCircle2 size={12} className="mr-1" /> Paid</span>;
  if (status === 'PROCESSING') return <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Clock size={12} className="mr-1" /> Processing</span>;
  if (status === 'FAILED') return <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><X size={12} className="mr-1" /> Failed</span>;
  return <span className="badge badge-warning"><Clock size={12} className="mr-1" /> Pending</span>;
}

export default function PayrollDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setSlip(json.data);
        } else {
          toast.error(json.message || 'Failed to load slip details');
          navigate('/dashboard/payroll');
        }
      } catch (e) {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchSlip();
  }, [id, token, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="h-8 w-1/4 bg-muted rounded animate-pulse" />
        <div className="h-[400px] bg-card border border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!slip) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/payroll')}
            className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-colors print:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex flex-wrap items-center gap-2">
              Payslip Details
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">ID: {slip.id}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <SalaryStatusBadge status={slip.status} confirmed={slip.confirmedByEmployee} />
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Receipt size={16} /> Print Payslip
          </Button>
          {slip.status === 'PENDING' && (
            <Button onClick={() => navigate(`/dashboard/payroll/pay/${slip.id}`)} className="gap-2">
              <CreditCard size={16} /> Pay Salary
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-none">
        
        {/* Header section (Company & Emp) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">ChemiCrown Inc.</h2>
                <p className="text-sm text-muted-foreground">Monthly Salary Slip</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2"><Calendar size={14} /> <strong>Month:</strong> {slip.month}</div>
              <div className="flex flex-wrap items-center gap-2"><Calendar size={14} /> <strong>Generated:</strong> {fmt(slip.createdAt)}</div>
              {slip.paidAt && <div className="flex flex-wrap items-center gap-2"><CheckCircle2 size={14} /> <strong>Paid On:</strong> {fmt(slip.paidAt)}</div>}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                {slip.employee?.user?.profileImageUrl ? (
                  <img src={slip.employee.user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{slip.employee?.user?.firstName} {slip.employee?.user?.lastName}</h2>
                <p className="text-sm text-muted-foreground">{slip.employee?.jobTitle || 'Employee'} • {slip.employee?.department || 'General'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2"><Mail size={14} /> {slip.employee?.user?.email}</div>
              {slip.employee?.user?.phone && <div className="flex flex-wrap items-center gap-2"><Phone size={14} /> {slip.employee?.user?.phone}</div>}
              <div className="flex flex-wrap items-center gap-2"><Calendar size={14} /> <strong>Working Days:</strong> {slip.workingDays} 
                <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-xs">Absent: {slip.absentDays}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="p-6 md:p-8 bg-muted/20 border-t border-border print:bg-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Earnings</h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                  <span className="font-medium text-foreground">{formatINR(slip.amount)}</span>
                </div>
                {slip.overtime > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Overtime Pay</span>
                    <span className="font-medium text-emerald-600">+{formatINR(slip.overtime)}</span>
                  </div>
                )}
                {slip.incentive > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Sales Incentive</span>
                    <span className="font-medium text-emerald-600">+{formatINR(slip.incentive)}</span>
                  </div>
                )}
                {slip.bonus > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Bonus</span>
                    <span className="font-medium text-emerald-600">+{formatINR(slip.bonus)}</span>
                  </div>
                )}
                {slip.allowances > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Allowances</span>
                    <span className="font-medium text-emerald-600">+{formatINR(slip.allowances)}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-semibold pt-3 border-t border-border mt-3">
                  <span>Gross Earnings</span>
                  <span>{formatINR(slip.amount + (slip.overtime||0) + (slip.incentive||0) + (slip.bonus||0) + (slip.allowances||0))}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Deductions</h3>
              <div className="space-y-3">
                {slip.absentDeduction > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Absent Deduction ({slip.absentDays} days)</span>
                    <span className="font-medium text-rose-600">-{formatINR(slip.absentDeduction)}</span>
                  </div>
                )}
                {slip.pfContribution > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">PF Contribution</span>
                    <span className="font-medium text-rose-600">-{formatINR(slip.pfContribution)}</span>
                  </div>
                )}
                {slip.tds > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">TDS / Taxes</span>
                    <span className="font-medium text-rose-600">-{formatINR(slip.tds)}</span>
                  </div>
                )}
                {slip.deductions > slip.absentDeduction && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Other Deductions</span>
                    <span className="font-medium text-rose-600">-{formatINR(slip.deductions - slip.absentDeduction)}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-semibold pt-3 border-t border-border mt-3">
                  <span>Total Deductions</span>
                  <span className="text-rose-600">-{formatINR((slip.absentDeduction||0) + (slip.pfContribution||0) + (slip.tds||0) + ((slip.deductions||0) - (slip.absentDeduction||0)))}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Net Pay Box */}
        <div className="p-6 md:p-8 border-t border-border bg-card">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Net Payable Amount</h3>
              <p className="text-3xl md:text-4xl font-black text-foreground">{formatINR(slip.netPay)}</p>
              <p className="text-sm text-muted-foreground mt-2 italic capitalize">
                {/* A simple number to words could be added here if needed */}
                Rupees {Math.floor(slip.netPay)} Only
              </p>
            </div>
            
            {slip.status === 'PAID' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 md:text-right max-w-sm">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center md:justify-end gap-2 mb-2">
                  <CheckCircle2 size={18} /> Payment Processed
                </h4>
                <div className="text-sm text-emerald-600 dark:text-emerald-500/80 space-y-1">
                  <p><strong>Method:</strong> {slip.paymentMethod?.replace('_', ' ')}</p>
                  {slip.transactionRef && <p><strong>Ref:</strong> {slip.transactionRef}</p>}
                  {slip.bankUsed && <p><strong>Bank:</strong> {slip.bankUsed}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remarks */}
        {slip.remarks && (
          <div className="px-6 md:px-8 pb-8">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-1 flex flex-wrap items-center gap-2">
                <FileText size={14} /> Remarks
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400/80">{slip.remarks}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
