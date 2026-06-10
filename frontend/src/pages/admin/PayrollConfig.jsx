import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, Building2, IndianRupee, Save, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function PayrollConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const { data, error, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/hr/${id}` : null,
    fetcher
  );

  const employee = data?.data;
  const emp = employee?.employeeProfile;
  const loading = !data && !error;

  const [tab, setTab] = useState('salary');

  // Salary tab state
  const [baseSalary, setBaseSalary] = useState('');
  const [ctc, setCtc] = useState('');
  const [pfRate, setPfRate] = useState(12);
  const [salesTarget, setSalesTarget] = useState('');

  // Payment Details tab state
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('CASH');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (emp) {
      setBaseSalary(emp.baseSalary || '');
      setCtc(emp.ctc || '');
      setPfRate(emp.pfRate || 12);
      setSalesTarget(emp.salesTarget || '');

      setBankName(emp.bankName || '');
      setBankAccountName(emp.bankAccountName || (employee.firstName + ' ' + employee.lastName));
      setBankAccountNumber(emp.bankAccountNumber || '');
      setBankIFSC(emp.bankIFSC || '');
      setUpiId(emp.upiId || '');
      setPaymentPreference(emp.paymentPreference || 'CASH');
    }
  }, [emp, employee]);

  const saveSalary = async () => {
    if (!baseSalary || parseFloat(baseSalary) <= 0) return toast.error('Enter a valid base salary');
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${emp?.id}/salary-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ baseSalary, ctc, pfRate, salesTarget })
      });
      const json = await res.json();
      if (json.success) { 
        toast.success('Salary configuration saved'); 
        mutate();
      } else {
        toast.error(json.message || 'Failed');
      }
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const savePaymentDetails = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${emp?.id}/bank-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankName, bankAccountName, bankAccountNumber, bankIFSC, upiId, paymentPreference })
      });
      const json = await res.json();
      if (json.success) { 
        toast.success('Payment details saved'); 
        mutate();
      } else {
        toast.error(json.message || 'Failed');
      }
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Employee Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const PREF_OPTIONS = [
    { key: 'CASH', label: 'Cash', icon: '💵' },
    { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
    { key: 'UPI', label: 'UPI', icon: '📱' },
    { key: 'CHEQUE', label: 'Cheque', icon: '📝' },
  ];

  const isSalesRole = ['SALES', 'MARKETING', 'DIGITAL_MARKETING'].includes(employee.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="text-primary" size={24} /> Payroll Configuration
            </h1>
            <p className="text-muted-foreground text-sm">{employee.firstName} {employee.lastName} • {employee.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/30">
          {[
            { key: 'salary', label: 'Salary Config', icon: IndianRupee },
            { key: 'payment', label: 'Payment Details', icon: Building2 },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors border-b-2 ${
                tab === t.key ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'salary' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Base Salary (₹/month) *</label>
                  <Input type="number" min="0" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="e.g. 50000" className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Annual CTC (₹)</label>
                  <Input type="number" min="0" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} value={ctc} onChange={e => setCtc(e.target.value)} placeholder="e.g. 600000" className="h-11" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">PF Contribution Rate (%)</label>
                  <Input type="number" min="0" max="100" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} value={pfRate} onChange={e => setPfRate(e.target.value)} placeholder="12" className="h-11" />
                  <p className="text-[10px] text-muted-foreground mt-1">Default is 12% of Basic</p>
                </div>
                {isSalesRole && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">Monthly Sales Target (₹)</label>
                    <Input type="number" min="0" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} value={salesTarget} onChange={e => setSalesTarget(e.target.value)} placeholder="e.g. 500000" className="h-11 border-primary/30 focus:ring-primary" />
                    <p className="text-[10px] text-muted-foreground mt-1">For incentive calculations</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4 border-t border-border mt-6">
                <Button onClick={saveSalary} disabled={saving} className="gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Salary Config'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">Preferred Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PREF_OPTIONS.map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => setPaymentPreference(opt.key)}
                      className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentPreference === opt.key ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {paymentPreference === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Account Holder Name</label>
                    <Input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="As per bank records" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Bank Name</label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">IFSC Code</label>
                    <Input value={bankIFSC} onChange={e => setBankIFSC(e.target.value)} placeholder="e.g. HDFC0001234" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Account Number</label>
                    <Input type="text" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="Account Number" />
                  </div>
                </div>
              )}

              {paymentPreference === 'UPI' && (
                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">UPI ID</label>
                  <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. name@okbank" />
                </div>
              )}

              {paymentPreference === 'CHEQUE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Payee Name</label>
                    <Input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="Name on the Cheque" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Bank Name</label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Account Number (Optional)</label>
                    <Input type="text" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="For Account Payee only checks" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border mt-6">
                <Button onClick={savePaymentDetails} disabled={saving} className="gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Payment Details'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
