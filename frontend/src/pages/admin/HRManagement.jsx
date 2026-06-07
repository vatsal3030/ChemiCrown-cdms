import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, ArrowUpDown, DollarSign, MessageSquare,
  AlertCircle, Eye, Users, CalendarCheck, TrendingUp, CheckCircle2,
  XCircle, Clock, ShieldAlert, UserX, UserCheck, AlertTriangle,
  ChevronDown, Filter, X, RefreshCw, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import EmployeeModal from '@/components/admin/EmployeeModal';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ACTIVE:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    SUSPENDED:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    TERMINATED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.ACTIVE}`}>
      {status}
    </span>
  );
}

// ── Warning Badge ─────────────────────────────────────────────────────────────
function WarningBadge({ count }) {
  if (!count) return null;
  const color = count >= 3 ? 'bg-red-500' : count >= 2 ? 'bg-amber-500' : 'bg-yellow-400';
  return (
    <span className={`ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold ${color}`}>
      {count}
    </span>
  );
}

// ── Issue Warning Modal ───────────────────────────────────────────────────────
function IssueWarningModal({ employee, token, onClose, onSuccess }) {
  const [type, setType] = useState('VERBAL');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return toast.error('Reason is required');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/warnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, reason })
      });
      const json = await res.json();
      if (json.success) { toast.success(`${type} warning issued`); onSuccess(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    setLoading(false);
  };

  const typeStyles = {
    VERBAL:  'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    WRITTEN: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
    FINAL:   'border-red-500 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600">
            <ShieldAlert size={20} /> Issue Warning
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              {employee.firstName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{employee.firstName} {employee.lastName}</p>
              <p className="text-xs text-muted-foreground">{employee.email}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Warning Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['VERBAL', 'WRITTEN', 'FINAL'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`p-2 rounded-xl border-2 text-sm font-semibold transition-all ${type === t ? typeStyles[t] + ' border-2' : 'border-border hover:border-primary/40'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {type === 'VERBAL' && '⚠️ First-level informal warning. Sent as a notification.'}
              {type === 'WRITTEN' && '📋 Formal written warning. Stored in HR records.'}
              {type === 'FINAL' && '🚨 Final warning before termination. Requires immediate attention.'}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Describe the reason for this warning..."
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
            <ShieldAlert size={15} className="mr-1.5" />
            {loading ? 'Issuing...' : `Issue ${type} Warning`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Terminate Modal ───────────────────────────────────────────────────────────
function TerminateModal({ employee, token, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return toast.error('Reason is required');
    if (!confirmed) return toast.error('Please confirm the termination');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason, effectiveDate })
      });
      const json = await res.json();
      if (json.success) { toast.success('Employee terminated'); onSuccess(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-destructive/30 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <UserX size={20} /> Terminate Employee
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">⚠️ This action is irreversible</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              Terminating <strong>{employee.firstName} {employee.lastName}</strong> will immediately revoke their login access and send them a termination notice.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Effective Date</label>
            <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Reason for Termination *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
              placeholder="Enter detailed reason..."
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 accent-destructive" />
            <span className="text-sm text-foreground">I confirm that I have the authority to terminate this employee and all legal/HR requirements have been met.</span>
          </label>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !confirmed} variant="destructive">
            <UserX size={15} className="mr-1.5" />
            {loading ? 'Processing...' : 'Confirm Termination'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Suspend Modal ─────────────────────────────────────────────────────────────
function SuspendModal({ employee, token, onClose, onSuccess }) {
  const today = new Date().toISOString().substring(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!from || !to) return toast.error('Both dates are required');
    if (new Date(to) <= new Date(from)) return toast.error('End date must be after start date');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ from, to, reason })
      });
      const json = await res.json();
      if (json.success) { toast.success('Employee suspended'); onSuccess(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600">
            <Clock size={20} /> Suspend Employee
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">From Date</label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">To Date</label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Reason for suspension..."
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
            {loading ? 'Suspending...' : 'Confirm Suspension'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Salary Config Modal ───────────────────────────────────────────────────────
function SalaryConfigModal({ employee, token, onClose, onSuccess }) {
  const emp = employee.employeeProfile;
  const [baseSalary, setBaseSalary] = useState(emp?.baseSalary || '');
  const [ctc, setCtc] = useState(emp?.ctc || '');
  const [pfRate, setPfRate] = useState(emp?.pfRate || 12);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!baseSalary || parseFloat(baseSalary) <= 0) return toast.error('Enter a valid base salary');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${emp?.id}/salary-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ baseSalary, ctc, pfRate })
      });
      const json = await res.json();
      if (json.success) { toast.success('Salary configuration updated'); onSuccess(); }
      else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Settings size={20} /> Salary Configuration
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">
            Configuring salary for <strong className="text-foreground">{employee.firstName} {employee.lastName}</strong>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Monthly Base Salary (₹) *</label>
            <Input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="e.g. 45000" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Annual CTC (₹)</label>
            <Input type="number" value={ctc} onChange={e => setCtc(e.target.value)} placeholder="e.g. 540000" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">PF Rate (%)</label>
            <Input type="number" value={pfRate} onChange={e => setPfRate(e.target.value)} min="0" max="100" placeholder="12" />
            <p className="text-xs text-muted-foreground mt-1">Standard PF rate is 12% of basic salary</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const TABS = ['dashboard', 'directory', 'attendance', 'payroll', 'leaves', 'warnings'];

export default function HRManagement() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from URL hash (e.g. #attendance)
  const hash = location.hash.replace('#', '') || 'dashboard';
  const activeTab = TABS.includes(hash) ? hash : 'dashboard';
  const setActiveTab = (tab) => navigate(`${location.pathname}#${tab}`, { replace: true });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Action modals
  const [warnTarget, setWarnTarget] = useState(null);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [salaryTarget, setSalaryTarget] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hr?search=${searchTerm}&sortField=${sortField}&sortOrder=${sortOrder}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch { toast.error('Failed to fetch employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [searchTerm, sortField, sortOrder]);

  const fetchLeaves = async () => {
    setLeavesLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setLeaveRequests(json.data);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLeavesLoading(false); }
  };

  useEffect(() => { if (activeTab === 'leaves') fetchLeaves(); }, [activeTab]);

  const handleLeaveReview = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Leave ${status.toLowerCase()}`);
        setLeaveRequests(prev => prev.filter(l => l.id !== id));
      } else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
  };

  const handleReinstate = async (emp) => {
    if (!window.confirm(`Reinstate ${emp.firstName} ${emp.lastName}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${emp.employeeProfile?.id}/reinstate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) { toast.success('Employee reinstated'); fetchEmployees(); }
      else toast.error(json.message);
    } catch { toast.error('Network error'); }
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const status = emp.employeeProfile?.status || 'ACTIVE';
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
    return true;
  });

  const uniqueRoles = [...new Set(employees.map(e => e.role))];
  const activeCount = employees.filter(e => (e.employeeProfile?.status || 'ACTIVE') === 'ACTIVE').length;
  const suspendedCount = employees.filter(e => e.employeeProfile?.status === 'SUSPENDED').length;
  const terminatedCount = employees.filter(e => e.employeeProfile?.status === 'TERMINATED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
          <p className="text-slate-500 mt-1">Manage employee records, disciplinary actions, and payroll.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      {/* Tabs — URL hash based for persistence on refresh */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'leaves'
              ? `Leave Requests${leaveRequests.length ? ` (${leaveRequests.length})` : ''}`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Dashboard Tab ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Employees', value: employees.length, icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
              { label: 'Active', value: activeCount, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
              { label: 'Suspended', value: suspendedCount, icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
              { label: 'Terminated', value: terminatedCount, icon: UserX, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <kpi.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <Users size={40} className="mx-auto mb-3 text-primary/40" />
            <h3 className="text-lg font-semibold mb-2">Employee Analytics</h3>
            <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">View individual employee pages for attendance calendars, payroll history, leave balances and performance.</p>
            <Button onClick={() => setActiveTab('directory')}>Open Directory</Button>
          </div>
        </div>
      )}

      {/* ── Directory / Attendance / Payroll / Warnings Tabs (shared table) ── */}
      {['directory', 'attendance', 'payroll', 'warnings'].includes(activeTab) && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by name or email..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Status filter */}
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-sm bg-background border border-input rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
              {/* Role filter */}
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="text-sm bg-background border border-input rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                <option value="all">All Roles</option>
                {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={fetchEmployees}
                className="p-2 rounded-lg border border-input hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('firstName')}>
                    <div className="flex items-center gap-1">Employee <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-6 py-3">Role / Status</th>
                  {activeTab === 'directory'   && <th className="px-6 py-3">Department / Joined</th>}
                  {activeTab === 'attendance'  && <th className="px-6 py-3">Mark Attendance</th>}
                  {activeTab === 'payroll'     && <><th className="px-6 py-3">Base Salary</th><th className="px-6 py-3">PF Rate</th><th className="px-6 py-3">Configure</th></>}
                  {activeTab === 'warnings'    && <th className="px-6 py-3">Actions</th>}
                  {activeTab === 'directory'   && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  [1,2,3,4].map(i => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded-full" /><div><Skeleton className="h-4 w-28 mb-1"/><Skeleton className="h-3 w-40"/></div></div></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full"/></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-24 rounded-lg"/></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-lg"/></td>
                    </tr>
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">
                    <Users size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No employees match your filter</p>
                  </td></tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const empStatus = emp.employeeProfile?.status || 'ACTIVE';
                    const warningCount = emp.employeeProfile?.warnings?.length || 0;
                    return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      {/* Employee info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/dashboard/hr/${emp.id}`)}>
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-sm">
                            {emp.firstName?.[0] || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">
                              {emp.firstName} {emp.lastName}
                              <WarningBadge count={warningCount} />
                            </div>
                            <div className="text-xs text-slate-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Role + Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{emp.role}</span>
                          <StatusBadge status={empStatus} />
                        </div>
                      </td>

                      {/* Directory columns */}
                      {activeTab === 'directory' && (
                        <td className="px-6 py-4 text-slate-500">
                          <div className="font-medium text-slate-700 dark:text-slate-300">{emp.employeeProfile?.department || 'Unassigned'}</div>
                          <div className="text-xs">
                            Joined: {emp.employeeProfile?.joiningDate ? new Date(emp.employeeProfile.joiningDate).toLocaleDateString('en-IN') : 'Unknown'}
                          </div>
                        </td>
                      )}

                      {/* Attendance tab */}
                      {activeTab === 'attendance' && (
                        <td className="px-6 py-4">
                          {empStatus === 'ACTIVE' ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {['PRESENT','ABSENT','HALF_DAY','LEAVE'].map(s => {
                                const cls = { PRESENT:'text-emerald-600 border-emerald-200 hover:bg-emerald-50', ABSENT:'text-red-600 border-red-200 hover:bg-red-50', HALF_DAY:'text-amber-600 border-amber-200 hover:bg-amber-50', LEAVE:'text-blue-600 border-blue-200 hover:bg-blue-50' };
                                return (
                                  <Button key={s} size="sm" variant="outline" className={`text-xs h-7 ${cls[s]}`}
                                    onClick={async () => {
                                      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${emp.id}/attendance`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ status: s, date: new Date().toISOString() })
                                      });
                                      if (r.ok) toast.success(`Marked ${s.replace('_',' ')}`);
                                      else toast.error('Failed');
                                    }}>
                                    {s.replace('_',' ')}
                                  </Button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">{empStatus} — no attendance</span>
                          )}
                        </td>
                      )}

                      {/* Payroll tab */}
                      {activeTab === 'payroll' && (
                        <>
                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                            {emp.employeeProfile?.baseSalary ? `₹${emp.employeeProfile.baseSalary.toLocaleString('en-IN')}` : <span className="text-amber-500 text-xs">Not set</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{emp.employeeProfile?.pfRate || 12}%</td>
                          <td className="px-6 py-4">
                            <Button size="sm" variant="outline" onClick={() => setSalaryTarget(emp)}>
                              <Settings size={13} className="mr-1.5" /> Configure
                            </Button>
                          </td>
                        </>
                      )}

                      {/* Warnings tab */}
                      {activeTab === 'warnings' && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => setWarnTarget(emp)}>
                              <ShieldAlert size={13} className="mr-1.5" /> Issue Warning
                            </Button>
                            {empStatus === 'ACTIVE' && (
                              <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                onClick={() => setSuspendTarget(emp)}>
                                <Clock size={13} className="mr-1.5" /> Suspend
                              </Button>
                            )}
                            {empStatus === 'SUSPENDED' && (
                              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => handleReinstate(emp)}>
                                <UserCheck size={13} className="mr-1.5" /> Reinstate
                              </Button>
                            )}
                            {empStatus !== 'TERMINATED' && (
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setTerminateTarget(emp)}>
                                <UserX size={13} className="mr-1.5" /> Terminate
                              </Button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Directory actions */}
                      {activeTab === 'directory' && ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/hr/${emp.id}`)}>
                              <Eye size={13} className="mr-1.5" /> View
                            </Button>
                            <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => setWarnTarget(emp)}>
                              <ShieldAlert size={13} />
                            </Button>
                            {empStatus !== 'TERMINATED' && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setTerminateTarget(emp)} title="Terminate">
                                <UserX size={15} />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Leave Requests Tab ── */}
      {activeTab === 'leaves' && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Pending Leave Requests</h3>
            <button onClick={fetchLeaves} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          {leavesLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : leaveRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400 opacity-50" />
              <p className="font-medium">All clear! No pending leave requests.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {['Employee','Date','Type','Reason','Submitted','Actions'].map(h => (
                      <th key={h} className={`px-6 py-3 ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaveRequests.map(lr => (
                    <tr key={lr.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {lr.employee?.user?.firstName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{lr.employee?.user?.firstName} {lr.employee?.user?.lastName}</p>
                            <p className="text-xs text-muted-foreground">{lr.employee?.department || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-sm">{new Date(lr.date).toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-400">{lr.type?.replace('_',' ')}</span></td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[180px] truncate">{lr.reason}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(lr.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleLeaveReview(lr.id, 'APPROVED')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold transition-colors dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button onClick={() => handleLeaveReview(lr.id, 'REJECTED')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition-colors dark:bg-red-900/30 dark:text-red-400">
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {warnTarget && (
        <IssueWarningModal employee={warnTarget} token={token}
          onClose={() => setWarnTarget(null)}
          onSuccess={() => { setWarnTarget(null); fetchEmployees(); }} />
      )}
      {terminateTarget && (
        <TerminateModal employee={terminateTarget} token={token}
          onClose={() => setTerminateTarget(null)}
          onSuccess={() => { setTerminateTarget(null); fetchEmployees(); }} />
      )}
      {suspendTarget && (
        <SuspendModal employee={suspendTarget} token={token}
          onClose={() => setSuspendTarget(null)}
          onSuccess={() => { setSuspendTarget(null); fetchEmployees(); }} />
      )}
      {salaryTarget && (
        <SalaryConfigModal employee={salaryTarget} token={token}
          onClose={() => setSalaryTarget(null)}
          onSuccess={() => { setSalaryTarget(null); fetchEmployees(); }} />
      )}

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        onSuccess={() => { setIsModalOpen(false); fetchEmployees(); }}
      />
    </div>
  );
}
