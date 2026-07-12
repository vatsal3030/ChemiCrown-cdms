import { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, CreditCard,
  Phone, Mail, Calendar, IndianRupee, Percent, Briefcase,
  User, BadgeCheck, Smartphone, Edit
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function EditEmployeePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          const emp = json.data;
          const profile = emp.employeeProfile || {};
          setForm({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            role: emp.role || 'SALES',
            department: profile.department || '',
            jobTitle: profile.jobTitle || '',
            joiningDate: profile.joiningDate ? profile.joiningDate.split('T')[0] : '',
            baseSalary: profile.baseSalary !== null ? String(profile.baseSalary) : '',
            ctc: profile.ctc !== null ? String(profile.ctc) : '',
            pfRate: profile.pfRate !== null ? String(profile.pfRate) : '12',
            bankAccountNumber: profile.bankAccountNumber || '',
            bankIFSC: profile.bankIFSC || '',
            bankName: profile.bankName || '',
            bankAccountName: profile.bankAccountName || '',
            upiId: profile.upiId || '',
            paymentPreference: profile.paymentPreference || 'BANK_TRANSFER',
            salesTarget: profile.salesTarget !== null ? String(profile.salesTarget) : '',
            isActive: profile.isActive !== undefined ? profile.isActive : true
          });
        } else {
          toast.error(json.message || 'Failed to load employee details');
          navigate('/dashboard/hr#directory');
        }
      } catch {
        toast.error('Network error loading employee details');
        navigate('/dashboard/hr#directory');
      } finally {
        setFetching(false);
      }
    };
    fetchEmployee();
  }, [id, token, navigate]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error('First and last name are required');
    }
    if (!form.email.trim()) return toast.error('Email is required');
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
        baseSalary:   form.baseSalary  ? parseFloat(form.baseSalary)  : null,
        ctc:          form.ctc         ? parseFloat(form.ctc)          : null,
        pfRate:       form.pfRate      ? parseFloat(form.pfRate)       : 12,
        salesTarget:  form.salesTarget ? parseFloat(form.salesTarget)  : null,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee profile updated successfully!');
        navigate(`/dashboard/hr/${id}`);
      } else {
        toast.error(json.message || 'Failed to update employee');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!form) return null;

  const jobTitleOptions = JOB_TITLES[form.role] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => navigate(`/dashboard/hr/${id}`)}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="page-header-icon bg-primary/10 text-primary">
          <Edit size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">Edit Employee Profile</h1>
          <p className="page-subtitle">Update employee work information, payroll, and payment configurations.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(`/dashboard/hr/${id}`)}>
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
                    onChange={e => set('email', e.target.value.toLowerCase().trim())}
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

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground select-none cursor-pointer uppercase">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                Active Employee Profile
              </label>
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
                    value={form.joiningDate}
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
            Save the updated profile information. Changing the role or department will take effect immediately.
          </p>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={() => navigate(`/dashboard/hr/${id}`)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
