import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, IndianRupee, AlertCircle, Copy, FileText, QrCode, Building2, Banknote, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash', icon: Banknote, desc: 'Physical cash handover', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2, desc: 'NEFT / IMPS / RTGS', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { key: 'UPI', label: 'UPI Transfer', icon: QrCode, desc: 'GPay / PhonePe / Paytm', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800' },
  { key: 'CHEQUE', label: 'Cheque', icon: FileText, desc: 'Physical cheque payment', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' }
];

export default function PayrollPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [method, setMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [bankUsed, setBankUsed] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [remarks, setRemarks] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [successData, setSuccessData] = useState(null);

  // Reset fields when payment method changes
  useEffect(() => {
    setTransactionRef('');
    setBankUsed('');
    setChequeDate('');
    setChequeBank('');
    setRemarks('');
  }, [method]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/payroll?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(s => s.id === id);
          if (found) {
            setSlip(found);
            const pref = found.employee?.paymentPreference;
            if (pref && ['CASH','BANK_TRANSFER','UPI','CHEQUE'].includes(pref)) {
              setMethod(pref);
            }
          } else {
            toast.error('Pending salary slip not found');
            navigate('/dashboard/payroll');
          }
        }
      })
      .catch(() => toast.error('Network error'))
      .finally(() => setLoading(false));
  }, [id, token, navigate]);

  useEffect(() => {
    if (method === 'UPI' && slip?.employee?.upiId && slip?.netPay) {
      const empUser = slip.employee.user;
      const upiString = `upi://pay?pa=${slip.employee.upiId}&pn=${encodeURIComponent(empUser?.firstName + ' ' + empUser?.lastName)}&am=${slip.netPay.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Salary ' + slip.month)}`;
      QRCode.toDataURL(upiString, { width: 200, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [method, slip]);

  const handleConfirm = async () => {
    try {
      setProcessing(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: method, transactionRef, bankUsed, chequeDate, chequeBank, remarks })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Salary paid successfully!`);
        setSuccessData(json.data);
      } else {
        toast.error(json.message || 'Payment failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading salary details...</div>;
  if (!slip) return null;

  const emp = slip.employee;
  const empUser = emp?.user;
  const selectedMethod = PAYMENT_METHODS.find(m => m.key === method);

  if (successData) {
    const selectedSuccessMethod = PAYMENT_METHODS.find(m => m.key === successData.paymentMethod);
    
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex items-center gap-3 no-print">
          <button onClick={() => setSuccessData(null)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Payment Receipt</h1>
            <p className="text-xs text-muted-foreground">Transaction completed successfully</p>
          </div>
        </div>

        {/* Printable Receipt Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 printable-document" id="printable-receipt">
          <div className="text-center pb-6 border-b border-border">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3 no-print" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">SALARY DISBURSEMENT RECEIPT</h2>
            <p className="text-xs text-muted-foreground mt-1 font-semibold uppercase tracking-wider">ChemiCrown Distributors</p>
          </div>

          <div className="py-6 space-y-4 border-b border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Employee Name</span>
              <span className="font-semibold text-foreground">{empUser?.firstName} {empUser?.lastName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium text-foreground capitalize">{emp?.designation?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Salary Period</span>
              <span className="font-semibold text-foreground">{slip.month}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disbursed Date</span>
              <span className="font-medium text-foreground">{new Date(successData.paidAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                {selectedSuccessMethod?.label || successData.paymentMethod}
              </span>
            </div>
            {successData.transactionRef && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction Reference</span>
                <span className="font-mono font-bold text-primary">{successData.transactionRef}</span>
              </div>
            )}
            {successData.bankUsed && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank Used</span>
                <span className="font-medium text-foreground">{successData.bankUsed}</span>
              </div>
            )}
          </div>

          <div className="pt-6">
            <div className="flex justify-between items-end bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/10">
              <span className="text-sm font-semibold text-muted-foreground">Total Paid Amount</span>
              <span className="text-2xl font-black text-primary">₹{successData.netPay?.toFixed(2) || slip.netPay.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-wider font-semibold border-t border-dashed border-border pt-4">
            🔒 System Generated Document · Authentic Audit Log
          </div>
        </div>

        <div className="flex gap-3 justify-end no-print">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer size={15} /> Print Receipt
          </Button>
          <Button onClick={() => navigate(`/dashboard/payroll?month=${slip.month}`)} className="gap-2">
            Return to Payroll Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex flex-wrap items-center gap-3">Process Salary Payment</h1>
          <p className="text-muted-foreground mt-1">Record payment details for the selected salary slip</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Select Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMethod(opt.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    method === opt.key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <opt.icon size={24} className={method === opt.key ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="font-semibold text-foreground mt-2">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Payment Details</h2>
            {method === 'CASH' && (
              <div className={`rounded-xl p-4 space-y-2 ${selectedMethod.bg} border ${selectedMethod.border}`}>
                <p className="text-sm font-semibold flex flex-wrap items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertCircle size={15} /> Cash Payment Instructions
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
                  <li>Hand over cash directly to {empUser?.firstName}</li>
                  <li>Ask them to count and confirm the amount</li>
                  <li>This payment will be logged in the audit trail</li>
                </ul>
                <Input placeholder="Optional: Remarks or notes" value={remarks} onChange={e => setRemarks(e.target.value)} className="mt-4 text-sm" />
              </div>
            )}

            {method === 'BANK_TRANSFER' && (
              <div className="space-y-4">
                {emp?.bankAccountNumber ? (
                  <div className={`rounded-xl p-4 ${selectedMethod.bg} border ${selectedMethod.border}`}>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wider">Employee Bank Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-foreground">
                      <p className="text-muted-foreground text-xs">Bank</p><p className="font-medium">{emp.bankName || '—'}</p>
                      <p className="text-muted-foreground text-xs">Account</p>
                      <p className="font-mono font-medium flex flex-wrap items-center gap-2">
                        {emp.bankAccountNumber}
                        <button onClick={() => { navigator.clipboard.writeText(emp.bankAccountNumber); toast.success('Copied!'); }}><Copy size={13} className="text-muted-foreground hover:text-primary" /></button>
                      </p>
                      <p className="text-muted-foreground text-xs">IFSC</p>
                      <p className="font-mono font-medium flex flex-wrap items-center gap-2">
                        {emp.bankIFSC}
                        <button onClick={() => { navigator.clipboard.writeText(emp.bankIFSC); toast.success('Copied!'); }}><Copy size={13} className="text-muted-foreground hover:text-primary" /></button>
                      </p>
                      <p className="text-muted-foreground text-xs">Name</p><p className="font-medium">{emp.bankAccountName || empUser?.firstName + ' ' + empUser?.lastName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ No bank details saved for this employee.
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Transaction Reference Number *</label>
                  <Input placeholder="NEFT/IMPS/RTGS reference number" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Bank Used</label>
                  <Input placeholder="e.g. SBI NetBanking" value={bankUsed} onChange={e => setBankUsed(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Remarks</label>
                  <Input placeholder="Optional remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
              </div>
            )}

            {method === 'UPI' && (
              <div className="space-y-4">
                {emp?.upiId ? (
                  <>
                    <div className={`rounded-xl p-4 ${selectedMethod.bg} border ${selectedMethod.border}`}>
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2 uppercase tracking-wider">Employee UPI Details</p>
                      <p className="font-mono text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                        {emp.upiId}
                        <button onClick={() => { navigator.clipboard.writeText(emp.upiId); toast.success('UPI ID copied!'); }}><Copy size={16} className="text-muted-foreground hover:text-primary" /></button>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Name: {empUser?.firstName} {empUser?.lastName}</p>
                    </div>
                    {qrDataUrl && (
                      <div className="flex flex-col items-center justify-center p-6 border border-border rounded-xl bg-white shadow-sm">
                        <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48 mb-2" />
                        <p className="text-sm text-muted-foreground text-center">Scan with any UPI app. Amount automatically set to ₹{slip.netPay.toFixed(2)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ No UPI ID saved for this employee.
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">UTR Number *</label>
                  <Input placeholder="12-digit UTR from payment app" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Remarks</label>
                  <Input placeholder="Optional remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
              </div>
            )}

            {method === 'CHEQUE' && (
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${selectedMethod.bg} border ${selectedMethod.border} text-sm text-emerald-700 dark:text-emerald-400`}>
                  📝 Record cheque details. Ensure the cheque is prepared before confirming.
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cheque Number *</label>
                  <Input placeholder="e.g. 001234" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cheque Date *</label>
                  <Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Issuing Bank</label>
                  <Input placeholder="e.g. HDFC Bank, Andheri Branch" value={chequeBank} onChange={e => setChequeBank(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Remarks</label>
                  <Input placeholder="Optional remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sticky top-24">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Payment Summary</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden">
                  {empUser?.profileImageUrl ? <img src={empUser.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : empUser?.firstName?.[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground">{empUser?.firstName} {empUser?.lastName}</p>
                  <p className="text-sm text-muted-foreground">Salary for {slip.month}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-primary/20">
                <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                  <span>Base Salary</span>
                  <span>₹{slip.amount.toFixed(2)}</span>
                </div>
                {slip.overtime > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-emerald-600">
                    <span>Overtime</span>
                    <span>+₹{slip.overtime.toFixed(2)}</span>
                  </div>
                )}
                {slip.incentive > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-violet-600">
                    <span>Incentive</span>
                    <span>+₹{slip.incentive.toFixed(2)}</span>
                  </div>
                )}
                {slip.deductions > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-rose-600">
                    <span>Deductions</span>
                    <span>-₹{slip.deductions.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-primary/20">
                  <span className="font-bold text-foreground">Net Pay</span>
                  <span className="text-3xl font-black text-primary">₹{slip.netPay.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handleConfirm} 
                disabled={
                  processing || 
                  (method === 'BANK_TRANSFER' && !transactionRef) || 
                  (method === 'UPI' && !transactionRef) || 
                  (method === 'CHEQUE' && (!transactionRef || !chequeDate))
                } 
                className="w-full h-12 text-base mt-6"
              >
                {processing ? 'Processing...' : <><CheckCircle2 size={18} className="mr-2" /> Confirm Payment</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
