import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, CheckCircle2, Clock, Plus, Search, Filter,
  DollarSign, CreditCard, Banknote, Smartphone, X, ShieldCheck,
  Trash2, Users, SlidersHorizontal, RefreshCw, IndianRupee, Calendar,
  Building2, QrCode, FileText, AlertCircle, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { formatINR, formatINRFull } from '@/lib/utils';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const PAYMENT_METHODS = [
  {
    key: 'CASH',
    label: 'Cash',
    icon: Banknote,
    desc: 'Physical cash handover',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800'
  },
  {
    key: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: Building2,
    desc: 'NEFT / IMPS / RTGS',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
  },
  {
    key: 'UPI',
    label: 'UPI Transfer',
    icon: QrCode,
    desc: 'GPay / PhonePe / Paytm',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800'
  },
  {
    key: 'CHEQUE',
    label: 'Cheque',
    icon: FileText,
    desc: 'Physical cheque payment',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800'
  }
];

function SalaryStatusBadge({ status, confirmed }) {
  if (status === 'PAID' && confirmed) return <span className="badge badge-success"><ShieldCheck size={11} /> Paid &amp; Confirmed</span>;
  if (status === 'PAID') return <span className="badge badge-success"><CheckCircle2 size={11} /> Paid</span>;
  return <span className="badge badge-warning"><Clock size={11} /> Pending</span>;
}

function PaymentModal({ slip, onClose, onConfirm, loading }) {
  const [method, setMethod] = useState(() => {
    // Pre-select based on employee's payment preference
    const pref = slip?.employee?.paymentPreference;
    if (pref && ['CASH','BANK_TRANSFER','UPI','CHEQUE'].includes(pref)) return pref;
    return 'CASH';
  });
  const [transactionRef, setTransactionRef] = useState('');
  const [bankUsed, setBankUsed] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [remarks, setRemarks] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const emp = slip?.employee;
  const empUser = emp?.user;

  // Generate QR for UPI payment
  useEffect(() => {
    if (method === 'UPI' && emp?.upiId && slip?.netPay) {
      const upiString = `upi://pay?pa=${emp.upiId}&pn=${encodeURIComponent(empUser?.firstName + ' ' + empUser?.lastName)}&am=${slip.netPay.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Salary ' + slip.month)}`;
      QRCode.toDataURL(upiString, { width: 200, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [method, emp?.upiId, slip?.netPay, slip?.month, empUser?.firstName, empUser?.lastName]);

  if (!slip) return null;

  const handleConfirm = () => {
    onConfirm(slip.id, { paymentMethod: method, transactionRef, bankUsed, chequeDate, chequeBank, remarks });
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.key === method);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg my-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <IndianRupee size={20} className="text-primary" /> Process Salary Payment
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Employee & Amount */}
          <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Paying Salary To</p>
            <p className="font-bold text-foreground text-base">{empUser?.firstName} {empUser?.lastName}</p>
            <p className="text-sm text-muted-foreground">{empUser?.email}</p>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-3xl font-extrabold text-primary">₹{slip.netPay?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Net pay for {slip.month}</p>
              </div>
              {slip.overtime > 0 && <div className="text-right text-xs text-muted-foreground">
                <p>Base: ₹{slip.amount?.toFixed(0)}</p>
                <p className="text-emerald-600">+OT: ₹{slip.overtime?.toFixed(0)}</p>
                {slip.incentive > 0 && <p className="text-violet-600">+Incentive: ₹{slip.incentive?.toFixed(0)}</p>}
              </div>}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMethod(opt.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    method === opt.key
                      ? `border-primary bg-primary/10`
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <opt.icon size={20} className={method === opt.key ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="font-semibold text-sm text-foreground mt-1">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Method-specific fields */}
          {method === 'CASH' && (
            <div className={`rounded-xl p-4 space-y-2 ${selectedMethod.bg} border ${selectedMethod.border}`}>
              <p className="text-sm font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertCircle size={15} /> Cash Payment Instructions
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
                <li>Hand over cash directly to {empUser?.firstName}</li>
                <li>Ask them to count and confirm the amount</li>
                <li>Employee will be notified to confirm receipt in the app</li>
                <li>This payment will be logged in the audit trail</li>
              </ul>
              <Input
                placeholder="Optional: Remarks or notes"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="mt-2 text-sm"
              />
            </div>
          )}

          {method === 'BANK_TRANSFER' && (
            <div className="space-y-3">
              {/* Employee's saved bank details */}
              {emp?.bankAccountNumber ? (
                <div className={`rounded-xl p-4 ${selectedMethod.bg} border ${selectedMethod.border}`}>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wider">Employee Bank Details</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground">
                    <p className="text-muted-foreground">Bank</p><p className="font-medium">{emp.bankName || '—'}</p>
                    <p className="text-muted-foreground">Account</p>
                    <p className="font-mono font-medium flex items-center gap-1">
                      {emp.bankAccountNumber}
                      <button onClick={() => { navigator.clipboard.writeText(emp.bankAccountNumber); toast.success('Copied!'); }}>
                        <Copy size={11} className="text-muted-foreground hover:text-primary" />
                      </button>
                    </p>
                    <p className="text-muted-foreground">IFSC</p>
                    <p className="font-mono font-medium flex items-center gap-1">
                      {emp.bankIFSC}
                      <button onClick={() => { navigator.clipboard.writeText(emp.bankIFSC); toast.success('Copied!'); }}>
                        <Copy size={11} className="text-muted-foreground hover:text-primary" />
                      </button>
                    </p>
                    <p className="text-muted-foreground">Name</p><p className="font-medium">{emp.bankAccountName || empUser?.firstName + ' ' + empUser?.lastName}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ No bank details saved for this employee. Please add them in HR → Configure → Payment Details first.
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transaction Reference Number <span className="text-destructive">*</span></p>
                <Input
                  placeholder="NEFT/IMPS/RTGS reference number"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Input
                placeholder="Bank used for transfer (e.g. SBI NetBanking)"
                value={bankUsed}
                onChange={e => setBankUsed(e.target.value)}
              />
              <Input
                placeholder="Remarks (optional)"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          )}

          {method === 'UPI' && (
            <div className="space-y-3">
              {emp?.upiId ? (
                <>
                  {/* UPI ID display */}
                  <div className={`rounded-xl p-4 ${selectedMethod.bg} border ${selectedMethod.border}`}>
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2 uppercase tracking-wider">Employee UPI Details</p>
                    <p className="font-mono text-sm font-bold text-foreground flex items-center gap-2">
                      {emp.upiId}
                      <button onClick={() => { navigator.clipboard.writeText(emp.upiId); toast.success('UPI ID copied!'); }}>
                        <Copy size={14} className="text-muted-foreground hover:text-primary" />
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Name: {empUser?.firstName} {empUser?.lastName}</p>
                    <p className="text-xs text-muted-foreground">Amount: <strong className="text-foreground">₹{slip.netPay?.toFixed(2)}</strong></p>
                  </div>
                  {/* QR Code */}
                  {qrDataUrl ? (
                    <div className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl bg-white">
                      <p className="text-xs font-semibold text-muted-foreground">Scan QR with GPay / PhonePe / Paytm</p>
                      <img src={qrDataUrl} alt="UPI QR Code" className="w-40 h-40" />
                      <p className="text-xs text-center text-muted-foreground">QR auto-fills ₹{slip.netPay?.toFixed(2)} to {empUser?.firstName}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-center text-muted-foreground p-4 border border-dashed border-border rounded-xl">
                      Generating QR code...
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ No UPI ID saved for this employee. Please add it in HR → Configure → Payment Details.
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">UTR Number (from payment app) <span className="text-destructive">*</span></p>
                <Input
                  placeholder="e.g. 512345678901 (12-digit UTR from GPay/PhonePe)"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Input
                placeholder="Remarks (optional)"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          )}

          {method === 'CHEQUE' && (
            <div className="space-y-3">
              <div className={`rounded-xl p-3 ${selectedMethod.bg} border ${selectedMethod.border} text-xs text-emerald-700 dark:text-emerald-400`}>
                📝 Record the cheque details below. The employee will be notified to collect the cheque.
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cheque Number <span className="text-destructive">*</span></p>
                <Input
                  placeholder="e.g. 001234"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cheque Date <span className="text-destructive">*</span></p>
                <Input
                  type="date"
                  value={chequeDate}
                  onChange={e => setChequeDate(e.target.value)}
                />
              </div>
              <Input
                placeholder="Issuing bank (e.g. HDFC Bank, Andheri Branch)"
                value={chequeBank}
                onChange={e => setChequeBank(e.target.value)}
              />
              <Input
                placeholder="Remarks (optional)"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="min-w-[160px]"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-1.5" />
                Confirm {selectedMethod?.label} Payment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [payingId, setPayingId]     = useState(null);
  const [payModal, setPayModal]     = useState(null);
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
    if (!window.confirm(`Generate payroll for all active employees for ${month}? This cannot be undone.`)) return;
    try {
      setGenerating(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month })
      });
      const json = await res.json();
      if (json.success) { toast.success(json.message || 'Payroll generated!'); fetchSalaries(); }
      else toast.error(json.message || 'Failed to generate payroll');
    } catch { toast.error('Network error'); }
    finally { setGenerating(false); }
  };

  const handlePay = async (salaryId, paymentDetails) => {
    try {
      setPayingId(salaryId);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${salaryId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(paymentDetails)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Salary paid via ${paymentDetails.paymentMethod}!`);
        setSalaries(prev => prev.map(s => s.id === salaryId ? { ...s, status: 'PAID', paidAt: new Date(), ...paymentDetails } : s));
        setPayModal(null);
      } else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setPayingId(null); }
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
      <PaymentModal slip={payModal} onClose={() => setPayModal(null)} onConfirm={handlePay} loading={!!payingId} />

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
          <Button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2">
            <Plus size={16} /> {generating ? 'Generating...' : `Generate ${month}`}
          </Button>
        </div>
      </div>

      {/* Summary Cards — skeleton during loading, real data after */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="kpi-card animate-pulse">
              <div className="flex items-center justify-between">
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
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid Out</p>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatINR(totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{salaries.filter(s => s.status === 'PAID').length} employees paid</p>
            </div>
            <div className="kpi-card" title={formatINRFull(totalPending)}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Disbursement</p>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock size={18} /></div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{formatINR(totalPending)}</p>
              <p className="text-xs text-muted-foreground mt-1">{pendingCount} slips pending</p>
            </div>
            <div className="kpi-card" title={formatINRFull(totalPF)}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total PF Contributions</p>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><DollarSign size={18} /></div>
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
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={e => setParam('q', e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {/* Quick status filter */}
            <select
              value={statusFilter}
              onChange={e => setParam('status', e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
            {/* Advanced filters toggle */}
            <button
              onClick={() => { setShowFilters(v => !v); setTemp({ status: statusFilter, minNet, maxNet }); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm border transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card border-border hover:border-primary text-foreground'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {hasActiveFilters && <span className="bg-white/30 text-white text-xs rounded-full px-1 leading-none py-0.5">{[statusFilter !== 'ALL', !!minNet, !!maxNet].filter(Boolean).length}</span>}
            </button>
            <button onClick={fetchSalaries} className="p-2 rounded-xl border border-border hover:bg-muted"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="border-b border-border bg-muted/20 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm"><Filter size={15} /> Advanced Filters</h3>
              <div className="flex gap-3">
                {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-destructive hover:underline"><X size={12} className="inline mr-0.5" />Clear all</button>}
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Payment Status</label>
                <select value={temp.status} onChange={e => setTemp(t => ({ ...t, status: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="ALL">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-0.5" />Min Net Pay
                </label>
                <Input type="number" placeholder="₹ 0" value={temp.minNet} onChange={e => setTemp(t => ({ ...t, minNet: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  <IndianRupee size={11} className="inline mr-0.5" />Max Net Pay
                </label>
                <Input type="number" placeholder="₹ ∞" value={temp.maxNet} onChange={e => setTemp(t => ({ ...t, maxNet: e.target.value }))} />
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {statusFilter} <button onClick={() => setParam('status', 'ALL')}><X size={10} /></button>
              </span>
            )}
            {minNet && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                Min ₹{minNet} <button onClick={() => setParam('minNet', '')}><X size={10} /></button>
              </span>
            )}
            {maxNet && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
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
                    <div className="flex items-center justify-end gap-1.5">
                      {slip.status === 'PENDING' ? (
                        <>
                          <Button size="sm" onClick={() => setPayModal(slip)} disabled={payingId === slip.id} className="text-xs">
                            <CreditCard size={13} className="mr-1" />
                            {payingId === slip.id ? 'Processing...' : 'Pay'}
                          </Button>
                          <button title="Delete slip" onClick={() => handleDeleteSlip(slip.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
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
