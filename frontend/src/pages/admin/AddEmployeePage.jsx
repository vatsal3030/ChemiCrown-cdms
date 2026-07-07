import { useState } from 'react';
import {
  ArrowLeft, Eye, EyeOff, UserPlus, Building2, CreditCard,
  Phone, Mail, Lock, Calendar, IndianRupee, Percent, Briefcase,
  User, BadgeCheck, Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT',
  'Logistics', 'Procurement', 'Quality Control', 'Administration', 'Management', 'Other'
];

const JOB_TITLES = {
  'OWNER':              ['Owner', 'Founder', 'Co-Founder', 'Director'],
  'MANAGER':            ['General Manager', 'Operations Manager', 'Branch Manager', 'Team Lead'],
  'INVENTORY_MANAGER':  ['Inventory Manager', 'Stock Controller', 'Warehouse Supervisor', 'Logistics Head'],
  'SALES':              ['Sales Executive', 'Senior Sales Executive', 'Sales Rep', 'Account Manager', 'Business Dev Executive'],
  'MARKETING':          ['Marketing Executive', 'Marketing Manager', 'Content Writer', 'Brand Manager'],
  'DIGITAL_MARKETING':  ['Digital Marketing Executive', 'SEO Specialist', 'Social Media Manager', 'PPC Analyst'],
};

const PAYMENT_PREFS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)' },
  { value: 'UPI',           label: 'UPI' },
  { value: 'CASH',          label: 'Cash' },
  { value: 'CHEQUE',        label: 'Cheque' },
];

const ROLES = [
  { value: 'OWNER',             label: 'Owner' },
  { value: 'MANAGER',           label: 'Manager' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'SALES',             label: 'Sales Rep' },
  { value: 'MARKETING',        label: 'Marketing' },
  { value: 'DIGITAL_MARKETING', label: 'Digital Marketing' },
];

const empty = {
  firstName: '', lastName: '', email: '', password: '', phone: '',
  role: 'SALES', department: '', jobTitle: '',
  joiningDate: new Date().toISOString().split('T')[0],
  baseSalary: '', ctc: '', pfRate: '12',
  bankAccountNumber: '', bankIFSC: '', bankName: '', bankAccountName: '', upiId: '',
  paymentPreference: 'BANK_TRANSFER',
  salesTarget: '',
};

export default function AddEmployeePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error('First and last name are required');
    }
    if (!form.email.trim()) return toast.error('Email is required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!form.department) return toast.error('Department is required');
    if (!form.jobTitle)   return toast.error('Job title is required');

    // Number validations
    if (form.baseSalary && parseFloat(form.baseSalary) < 0) return toast.error('Base Salary cannot be negative');
    if (form.ctc && parseFloat(form.ctc) < 0) return toast.error('CTC cannot be negative');
    if (form.baseSalary && form.ctc && parseFloat(form.ctc) > 0 && parseFloat(form.baseSalary) > 0) {
      if (parseFloat(form.ctc) < parseFloat(form.baseSalary) * 12) {
        return toast.error('Annual CTC must be at least 12 times the monthly Base Salary');
      }
    }
    if (form.pfRate && (parseFloat(form.pfRate) < 0 || parseFloat(form.pfRate) > 30)) {
      return toast.error('PF Rate must be between 0% and 30%');
    }
    if (form.salesTarget && parseFloat(form.salesTarget) < 0) return toast.error('Sales target cannot be negative');

    setLoading(true);
    try {
      const payload = {
        ...form,
        baseSalary:   form.baseSalary  ? parseFloat(form.baseSalary)  : undefined,
        ctc:          form.ctc         ? parseFloat(form.ctc)          : undefined,
        pfRate:       form.pfRate      ? parseFloat(form.pfRate)       : 12,
        salesTarget:  form.salesTarget ? parseFloat(form.salesTarget)  : undefined,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee created successfully!');
        navigate('/dashboard/hr#directory');
      } else {
        toast.error(json.message || 'Failed to create employee');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const jobTitleOptions = JOB_TITLES[form.role] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => navigate('/dashboard/hr#directory')}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="page-header-icon bg-primary/10 text-primary">
          <UserPlus size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">Add New Employee</h1>
          <p className="page-subtitle">Fill in the employee details below. All fields marked * are required.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate('/dashboard/hr#directory')}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Row 1: Personal + Account ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Personal Information */}
          <div className="form-card space-y-4">
            <h2 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2 pb-1 border-b border-border">
              <User size={14} className="text-primary" /> Personal Information
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">First Name <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required type="text" value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    placeholder="e.g. Ravi"
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Last Name <span className="text-destructive">*</span></label>
                <input
                  required type="text" value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="e.g. Sharma"
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Email Address <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required type="email" value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="ravi@company.com"
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel" value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="form-input pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Initial Password <span className="text-destructive">*</span></label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  className="form-input pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Employee will be prompted to change on first login</p>
            </div>
          </div>

          {/* Work Information */}
          <div className="form-card space-y-4">
            <h2 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2 pb-1 border-b border-border">
              <Briefcase size={14} className="text-primary" /> Work Information
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">System Role <span className="text-destructive">*</span></label>
                <select
                  value={form.role}
                  onChange={e => { set('role', e.target.value); set('jobTitle', ''); }}
                  className="form-input"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Department <span className="text-destructive">*</span></label>
                <select
                  required value={form.department}
                  onChange={e => set('department', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Job Title <span className="text-destructive">*</span></label>
                {jobTitleOptions.length > 0 ? (
                  <select
                    required value={form.jobTitle}
                    onChange={e => set('jobTitle', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select title</option>
                    {jobTitleOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input
                    required type="text" value={form.jobTitle}
                    onChange={e => set('jobTitle', e.target.value)}
                    placeholder="e.g. Operations Head"
                    className="form-input"
                  />
                )}
              </div>
              <div>
                <label className="form-label">Joining Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]} value={form.joiningDate}
                    onChange={e => set('joiningDate', e.target.value)}
                    className="form-input pl-9"
                  />
                </div>
              </div>
            </div>

            {form.role === 'SALES' && (
              <div>
                <label className="form-label">Monthly Sales Target (₹)</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number" min={0} step={1000} value={form.salesTarget}
                    onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                    onChange={e => set('salesTarget', e.target.value)}
                    placeholder="e.g. 500000"
                    className="form-input pl-9"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Payroll + Bank Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Payroll Details */}
          <div className="form-card space-y-4">
            <h2 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2 pb-1 border-b border-border">
              <IndianRupee size={14} className="text-primary" /> Payroll & Compensation
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">Base Salary (₹/mo)</label>
                <div className="relative">
                  <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number" min={0} step={500} value={form.baseSalary}
                    onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                    onChange={e => set('baseSalary', e.target.value)}
                    placeholder="e.g. 35000"
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">CTC (₹/yr)</label>
                <div className="relative">
                  <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number" min={0} step={10000} value={form.ctc}
                    onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                    onChange={e => set('ctc', e.target.value)}
                    placeholder="e.g. 500000"
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">PF Rate (%)</label>
                <div className="relative">
                  <Percent size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number" min={0} max={24} step={0.5} value={form.pfRate}
                    onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                    onChange={e => set('pfRate', e.target.value)}
                    className="form-input pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Salary Payment Method</label>
              <select
                value={form.paymentPreference}
                onChange={e => set('paymentPreference', e.target.value)}
                className="form-input"
              >
                {PAYMENT_PREFS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              💡 Salary can be processed monthly from the Payroll section. These values set the default configuration.
            </p>
          </div>

          {/* Bank Details */}
          <div className="form-card space-y-4">
            <h2 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2 pb-1 border-b border-border">
              <CreditCard size={14} className="text-primary" /> Bank & Payment Details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Account Holder Name</label>
                <div className="relative">
                  <BadgeCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text" value={form.bankAccountName}
                    onChange={e => set('bankAccountName', e.target.value)}
                    placeholder="As per bank records"
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Bank Name</label>
                <div className="relative">
                  <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text" value={form.bankName}
                    onChange={e => set('bankName', e.target.value)}
                    placeholder="e.g. SBI, HDFC"
                    className="form-input pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Account Number</label>
                <input
                  type="text" value={form.bankAccountNumber}
                  onChange={e => set('bankAccountNumber', e.target.value)}
                  placeholder="e.g. 1234567890123"
                  className="form-input font-mono"
                />
              </div>
              <div>
                <label className="form-label">IFSC Code</label>
                <input
                  type="text" value={form.bankIFSC}
                  onChange={e => set('bankIFSC', e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  className="form-input font-mono"
                />
              </div>
            </div>

            <div>
              <label className="form-label">UPI ID</label>
              <div className="relative">
                <Smartphone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text" value={form.upiId}
                  onChange={e => set('upiId', e.target.value)}
                  placeholder="e.g. 9876543210@paytm"
                  className="form-input pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 form-card">
          <p className="text-xs text-muted-foreground">
            An account will be created with the provided email and password. The employee can change their password after first login.
          </p>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/hr#directory')} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              <UserPlus size={15} className="mr-2" />
              {loading ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
