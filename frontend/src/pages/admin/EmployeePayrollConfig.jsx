import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, IndianRupee, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function EmployeePayrollConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    baseSalary: '',
    pfRate: '12',
    bankAccountNumber: '',
    bankIFSC: '',
    bankName: '',
    bankAccountName: '',
    upiId: '',
    paymentPreference: 'BANK_TRANSFER'
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        // We'll just fetch all employees and find this one, or ideally have a GET /api/hr/:id
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          const emp = json.data.find(e => e.id === id);
          if (emp) {
            setEmployee(emp);
            setConfig({
              baseSalary: emp.employeeProfile?.baseSalary || '',
              pfRate: emp.employeeProfile?.pfRate || '12',
              bankAccountNumber: emp.employeeProfile?.bankAccountNumber || '',
              bankIFSC: emp.employeeProfile?.bankIFSC || '',
              bankName: emp.employeeProfile?.bankName || '',
              bankAccountName: emp.employeeProfile?.bankAccountName || '',
              upiId: emp.employeeProfile?.upiId || '',
              paymentPreference: emp.employeeProfile?.paymentPreference || 'BANK_TRANSFER'
            });
          } else {
            toast.error('Employee not found');
            navigate('/dashboard/hr#payroll');
          }
        }
      } catch (err) {
        toast.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, token, navigate]);

  const handleSave = async () => {
    if (!user || user.role !== 'SUPER_ADMIN') {
      return toast.error('Only Super Admin can update payroll configuration');
    }

    setSaving(true);
    try {
      // 1. Update Salary Config
      const res1 = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile.id}/salary-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          baseSalary: config.baseSalary,
          pfRate: config.pfRate
        })
      });
      
      // 2. Update Bank Details
      const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile.id}/bank-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bankAccountNumber: config.bankAccountNumber,
          bankIFSC: config.bankIFSC,
          bankName: config.bankName,
          bankAccountName: config.bankAccountName,
          upiId: config.upiId,
          paymentPreference: config.paymentPreference
        })
      });

      if (res1.ok && res2.ok) {
        toast.success('Payroll configuration updated successfully');
        navigate('/dashboard/hr#payroll');
      } else {
        toast.error('Failed to update some configurations');
      }
    } catch (err) {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading Employee Data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/hr#payroll')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configure Payroll</h1>
          <p className="text-muted-foreground">
            {employee?.firstName} {employee?.lastName} ({employee?.email})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Salary Configuration */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <IndianRupee className="text-emerald-600" />
            <h2 className="text-lg font-semibold">Salary Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Base Salary (Monthly)</label>
              <Input 
                type="number" 
                value={config.baseSalary} 
                onChange={e => setConfig({...config, baseSalary: e.target.value})} 
                placeholder="e.g. 50000"
                className="text-lg font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">PF Contribution Rate (%)</label>
              <Input 
                type="number" 
                value={config.pfRate} 
                onChange={e => setConfig({...config, pfRate: e.target.value})} 
                placeholder="12"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <CreditCard className="text-blue-600" />
            <h2 className="text-lg font-semibold">Bank & Payment Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Preferred Payment Method</label>
              <select 
                className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={config.paymentPreference}
                onChange={e => setConfig({...config, paymentPreference: e.target.value})}
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            {config.paymentPreference === 'BANK_TRANSFER' && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Bank Name</label>
                  <Input value={config.bankName} onChange={e => setConfig({...config, bankName: e.target.value})} placeholder="HDFC Bank" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Account Number</label>
                  <Input value={config.bankAccountNumber} onChange={e => setConfig({...config, bankAccountNumber: e.target.value})} placeholder="50100..." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">IFSC Code</label>
                  <Input value={config.bankIFSC} onChange={e => setConfig({...config, bankIFSC: e.target.value})} placeholder="HDFC0001234" className="uppercase" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Account Holder Name</label>
                  <Input value={config.bankAccountName} onChange={e => setConfig({...config, bankAccountName: e.target.value})} placeholder="Full Name as per bank" />
                </div>
              </>
            )}

            {config.paymentPreference === 'UPI' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">UPI ID</label>
                <Input value={config.upiId} onChange={e => setConfig({...config, upiId: e.target.value})} placeholder="username@upi" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-8">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
