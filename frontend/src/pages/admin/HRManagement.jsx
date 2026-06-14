import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, ArrowUpDown, DollarSign, MessageSquare,
  AlertCircle, Eye, Users, CalendarCheck, TrendingUp, CheckCircle2,
  XCircle, Clock, ShieldAlert, UserX, UserCheck, AlertTriangle,
  ChevronDown, Filter, X, RefreshCw, Settings, SlidersHorizontal,
  Building2, CreditCard, Smartphone, Target, Award, Timer, IndianRupee, PiggyBank, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonTableBody } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import EmployeeModal from '../../components/admin/EmployeeModal';
import HRDetailsModal from '../../components/admin/HRDetailsModal';

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
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex flex-wrap items-center gap-2 text-amber-600">
            <ShieldAlert size={20} /> Issue Warning
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-3 flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm overflow-hidden">
              {employee.profileImageUrl ? (
                <img src={employee.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                employee.firstName?.[0] || '?'
              )}
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
              rows={5}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[120px]"
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
      <div className="bg-card border border-destructive/30 rounded-2xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex flex-wrap items-center gap-2 text-destructive">
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
            <Input type="date" min={new Date().toISOString().split('T')[0]} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Reason for Termination *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-destructive resize-y min-h-[120px]"
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
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex flex-wrap items-center gap-2 text-amber-600">
            <Clock size={20} /> Suspend Employee
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">From Date</label>
              <Input type="date" min={today} value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">To Date</label>
              <Input type="date" min={from || today} value={to} onChange={e => setTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[120px]"
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

// ── Main Component ────────────────────────────────────────────────────────────
const TABS = ['dashboard', 'directory', 'payroll', 'leaves', 'warnings', 'overtime', 'incentives'];

export default function HRManagement() {
  const { user, token } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';  // gate for sensitive write actions
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive active tab from URL hash (e.g. #attendance)
  const hash = location.hash.replace('#', '') || 'dashboard';
  const activeTab = TABS.includes(hash) ? hash : 'dashboard';
  const setActiveTab = (tab) => navigate({ pathname: location.pathname, search: location.search, hash: tab }, { replace: true });

  // All directory filters live in URL searchParams
  const statusFilter = searchParams.get('status') || 'all';
  const roleFilter   = searchParams.get('role')   || 'all';
  const deptFilter   = searchParams.get('dept')   || 'all';
  const searchTerm   = searchParams.get('q')      || '';
  const sortField    = searchParams.get('sort')   || 'firstName';
  const sortOrder    = searchParams.get('order')  || 'asc';

  const setParam = (key, value) => {
    // IMPORTANT: Must preserve the hash when updating search params.
    // Using setSearchParams alone strips the URL hash (#tab).
    // Instead, build the new URL manually with both hash and params intact.
    const newParams = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') newParams.delete(key);
    else newParams.set(key, value);
    const newSearch = newParams.toString();
    navigate(
      `${location.pathname}${newSearch ? '?' + newSearch : ''}#${activeTab}`,
      { replace: true }
    );
  };

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [temp, setTemp] = useState({ status: statusFilter, role: roleFilter, dept: deptFilter });
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('PENDING');
  const [leaveSortOrder, setLeaveSortOrder] = useState('desc');

  // Action modals
  const [warnTarget, setWarnTarget] = useState(null);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [detailsModal, setDetailsModal] = useState({ type: null, data: null });

  // Overtime & Incentive state
  const [overtimes, setOvertimes] = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [otLoading, setOtLoading] = useState(false);
  const [incLoading, setIncLoading] = useState(false);
  
  const [otForm, setOtForm] = useState({ employeeId: '', date: '', hours: '', reason: '' });
  const [incForm, setIncForm] = useState({ employeeId: '', month: '', incentiveAmount: '', notes: '' });
  const [otFormOpen, setOtFormOpen] = useState(false);
  const [incFormOpen, setIncFormOpen] = useState(false);

  const fetchOvertimes = useCallback(async () => {
    setOtLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/overtime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOvertimes(json.data);
    } catch {} finally { setOtLoading(false); }
  }, [token]);

  const fetchIncentives = useCallback(async () => {
    setIncLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/incentives`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setIncentives(json.data);
    } catch {} finally { setIncLoading(false); }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'overtime') fetchOvertimes();
    if (activeTab === 'incentives') fetchIncentives();
  }, [activeTab, fetchOvertimes, fetchIncentives]);

  const handleOtApprove = async (id, action) => {
    // Optimistic UI
    const previousOvertimes = [...overtimes];
    setOvertimes(prev => prev.filter(ot => ot.id !== id));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/overtime/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Overtime ${action.toLowerCase()}`);
      } else {
        toast.error(json.message);
        setOvertimes(previousOvertimes);
      }
    } catch { 
      toast.error('Network error'); 
      setOvertimes(previousOvertimes);
    }
  };

  const handleIncApprove = async (id, action) => {
    // Optimistic UI
    const previousIncentives = [...incentives];
    setIncentives(prev => prev.filter(inc => inc.id !== id));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/incentives/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) { 
        toast.success(`Incentive ${action.toLowerCase()}`); 
      }
      else {
        toast.error(json.message);
        setIncentives(previousIncentives);
      }
    } catch { 
      toast.error('Network error'); 
      setIncentives(previousIncentives);
    }
  };

  const logOvertime = async () => {
    if (!otForm.employeeId || !otForm.date || !otForm.hours) return toast.error('Employee, date and hours are required');
    if (parseFloat(otForm.hours) <= 0) return toast.error('Hours must be greater than 0');
    if (new Date(otForm.date) > new Date()) return toast.error('Cannot log overtime for future dates');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/overtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(otForm)
      });
      const json = await res.json();
      if (json.success) { toast.success(json.message); setOtFormOpen(false); setOtForm({ employeeId: '', date: '', hours: '', reason: '' }); fetchOvertimes(); }
      else toast.error(json.message);
    } catch { toast.error('Network error'); }
  };

  const logIncentive = async () => {
    if (!incForm.employeeId || !incForm.month || !incForm.incentiveAmount) return toast.error('All fields are required');
    if (parseFloat(incForm.incentiveAmount) <= 0) return toast.error('Incentive amount must be greater than 0');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/incentives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(incForm)
      });
      const json = await res.json();
      if (json.success) { toast.success('Incentive logged'); setIncFormOpen(false); setIncForm({ employeeId: '', month: '', incentiveAmount: '', notes: '' }); fetchIncentives(); }
      else toast.error(json.message);
    } catch { toast.error('Network error'); }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchTerm, sortField, sortOrder });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (deptFilter   !== 'all') params.set('department', deptFilter);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hr?${params}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store' 
        }
      );
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
      }
    } catch { toast.error('Failed to fetch employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [searchTerm, sortField, sortOrder, statusFilter, deptFilter]);

  const fetchLeaves = useCallback(async () => {
    setLeavesLoading(true);
    try {
      const params = new URLSearchParams();
      if (leaveStatusFilter !== 'all') params.set('status', leaveStatusFilter);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setLeaveRequests(json.data);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLeavesLoading(false); }
  }, [leaveStatusFilter, token]);

  useEffect(() => { if (activeTab === 'leaves') fetchLeaves(); }, [activeTab, leaveStatusFilter, fetchLeaves]);

  const handleLeaveReview = async (id, status) => {
    // Optimistic UI
    const previousLeaves = [...leaveRequests];
    if (leaveStatusFilter === 'PENDING') {
      setLeaveRequests(prev => prev.filter(l => l.id !== id));
    } else {
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Leave ${status.toLowerCase()}`);
      } else {
        toast.error(json.message || 'Failed');
        setLeaveRequests(previousLeaves); // Revert
      }
    } catch { 
      toast.error('Network error'); 
      setLeaveRequests(previousLeaves); // Revert
    }
  };

  const handleReinstate = async (emp) => {
    if (!window.confirm(`Reinstate ${emp.firstName} ${emp.lastName}?`)) return;
    
    // Optimistic UI
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, employeeProfile: { ...e.employeeProfile, status: 'ACTIVE' } } : e));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${emp.employeeProfile?.id}/reinstate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) { 
        toast.success('Employee reinstated'); 
      }
      else {
        toast.error(json.message);
        fetchEmployees(); // Revert
      }
    } catch { 
      toast.error('Network error'); 
      fetchEmployees(); // Revert
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) setParam('order', sortOrder === 'asc' ? 'desc' : 'asc');
    else { setParam('sort', field); setParam('order', 'asc'); }
  };

  const applyFilters = () => {
    setSearchParams(prev => {
      Object.entries(temp).forEach(([k, v]) => {
        if (!v || v === 'all') prev.delete(k);
        else prev.set(k, v);
      });
      return prev;
    }, { replace: true });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setTemp({ status: 'all', role: 'all', dept: 'all' });
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('status');
    newParams.delete('role');
    newParams.delete('dept');
    const newSearch = newParams.toString();
    navigate(`${location.pathname}${newSearch ? '?' + newSearch : ''}#${activeTab}`, { replace: true });
    setShowFilters(false);
  };

  // Client-side role filter (applied on top of server-side status/dept)
  const filteredEmployees = employees.filter(emp => {
    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
    return true;
  });

  const uniqueRoles = [...new Set(employees.map(e => e.role))];
  const uniqueDepts = [...new Set(employees.map(e => e.employeeProfile?.department).filter(Boolean))];
  const activeCount = employees.filter(e => (e.employeeProfile?.status || 'ACTIVE') === 'ACTIVE').length;
  
  const todayStr = new Date().toISOString().substring(0, 10);
  const presentTodayCount = employees.filter(e => {
    if (!e.employeeProfile?.attendances) return false;
    const todayAtt = e.employeeProfile.attendances.find(a => new Date(a.date).toISOString().substring(0, 10) === todayStr);
    return todayAtt && ['PRESENT', 'HALF_DAY'].includes(todayAtt.status);
  }).length;

  const suspendedCount = employees.filter(e => e.employeeProfile?.status === 'SUSPENDED').length;
  const terminatedCount = employees.filter(e => e.employeeProfile?.status === 'TERMINATED').length;
  const hasActiveFilters = statusFilter !== 'all' || roleFilter !== 'all' || deptFilter !== 'all';
  const activeFilterCount = [statusFilter !== 'all', roleFilter !== 'all', deptFilter !== 'all'].filter(Boolean).length;

  // Compute stats for charts
  const deptData = uniqueDepts.map(dept => ({
    name: dept || 'Unassigned',
    value: employees.filter(e => e.employeeProfile?.department === dept).length
  })).filter(d => d.value > 0);

  const roleData = uniqueRoles.map(role => ({
    name: role.replace(/_/g, ' '),
    value: employees.filter(e => e.role === role).length
  })).filter(d => d.value > 0);

  const COLORS = ['#1F2E54', '#E6513A', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
          <p className="text-slate-500 mt-1">Manage employee records, disciplinary actions, and payroll.</p>
        </div>
        <Button className="flex flex-wrap items-center gap-2" onClick={() => navigate('/dashboard/hr/add-employee')}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      {detailsModal.type && (
        <HRDetailsModal 
          type={detailsModal.type} 
          data={detailsModal.data} 
          onClose={() => setDetailsModal({ type: null, data: null })} 
        />
      )}

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
              : tab === 'overtime'
              ? `Overtime${overtimes.filter(o => o.status === 'PENDING').length ? ` (${overtimes.filter(o => o.status === 'PENDING').length})` : ''}`
              : tab === 'incentives'
              ? `Incentives${incentives.filter(i => i.status === 'PENDING').length ? ` (${incentives.filter(i => i.status === 'PENDING').length})` : ''}`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Dashboard Tab ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              [1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-wrap items-center gap-4 shadow-sm animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                    <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-10" />
                  </div>
                </div>
              ))
            ) : (
              [
                { label: 'Total Employees', value: employees.length, icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', tab: 'directory' },
                { label: 'Present Today', value: presentTodayCount, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', tab: 'directory' },
                { label: 'Pending Leaves', value: leaveRequests.filter(l => l.status === 'PENDING').length, icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', tab: 'leaves' },
                { label: 'Pending Overtimes', value: overtimes.filter(o => o.status === 'PENDING').length, icon: AlertCircle, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', tab: 'overtime' },
                { label: 'Terminated', value: terminatedCount, icon: UserX, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', tab: 'directory' },
                { label: 'Pending Incentives', value: incentives.filter(i => i.status === 'PENDING').length, icon: PiggyBank, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', tab: 'incentives' },
              ].map(kpi => (
                <button 
                  key={kpi.label} 
                  onClick={() => setActiveTab(kpi.tab)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-wrap items-center gap-4 shadow-sm hover:border-primary/50 transition-colors text-left"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${kpi.color}`}>
                    <kpi.icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Headcount by Department</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Employees by Role</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={roleData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Bar dataKey="value" fill="#1F2E54" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm lg:col-span-2">
              <h3 className="font-semibold text-foreground mb-4">Pending HR Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <h4 className="font-medium text-amber-800 dark:text-amber-500 mb-2">Leave Approvals</h4>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">{leaveRequests.filter(l => l.status === 'PENDING').length}</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('leaves')} className="w-full text-amber-700 border-amber-300 hover:bg-amber-100">Review Leaves</Button>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50">
                  <h4 className="font-medium text-purple-800 dark:text-purple-500 mb-2">Overtime Verifications</h4>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{overtimes.filter(o => o.status === 'PENDING').length}</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('overtime')} className="w-full text-purple-700 border-purple-300 hover:bg-purple-100">Verify Overtimes</Button>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
                  <h4 className="font-medium text-indigo-800 dark:text-indigo-500 mb-2">Incentive Approvals</h4>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{incentives.filter(i => i.status === 'PENDING').length}</p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('incentives')} className="w-full text-indigo-700 border-indigo-300 hover:bg-indigo-100">Review Incentives</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Directory / Payroll / Warnings Tabs (shared table) ── */}
      {['directory','payroll','warnings'].includes(activeTab) && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          


          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 sm:max-w-5xl">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by name or email..." value={searchTerm}
                onChange={e => setParam('q', e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Advanced filter toggle */}
              <button
                onClick={() => { setShowFilters(v => !v); setTemp({ status: statusFilter, role: roleFilter, dept: deptFilter }); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all ${
                  hasActiveFilters
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-slate-900 border-border text-foreground hover:border-primary'
                }`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-white/20 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] ml-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={fetchEmployees}
                className="p-2 border border-border text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="border-b border-border bg-muted/20 px-6 py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h3 className="font-bold text-foreground flex flex-wrap items-center gap-2 text-sm"><Filter size={15} /> Advanced Filters</h3>
                <div className="flex flex-wrap gap-3">
                  {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-destructive hover:underline"><X size={12} className="inline mr-0.5" />Clear all</button>}
                  <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Employee Status</label>
                  <select value={temp.status} onChange={e => setTemp(t => ({ ...t, status: e.target.value }))}
                    className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="all">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Role</label>
                  <select value={temp.role} onChange={e => setTemp(t => ({ ...t, role: e.target.value }))}
                    className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="all">All Roles</option>
                    {uniqueRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Department</label>
                  <select value={temp.dept} onChange={e => setTemp(t => ({ ...t, dept: e.target.value }))}
                    className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="all">All Departments</option>
                    {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors">Reset Filters</button>
                <button type="button" onClick={applyFilters} className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors">Apply</button>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="px-4 py-2 border-b border-border flex flex-wrap gap-2 items-center">
              {statusFilter !== 'all' && (
                <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {statusFilter} <button onClick={() => setParam('status', 'all')}><X size={10} /></button>
                </span>
              )}
              {roleFilter !== 'all' && (
                <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                  {roleFilter.replace(/_/g, ' ')} <button onClick={() => setParam('role', 'all')}><X size={10} /></button>
                </span>
              )}
              {deptFilter !== 'all' && (
                <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs font-semibold">
                  Dept: {deptFilter} <button onClick={() => setParam('dept', 'all')}><X size={10} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive ml-auto">Clear all</button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors text-left" onClick={() => toggleSort('firstName')}>
                    <div className="flex flex-wrap items-center gap-1">Employee <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-6 py-3 text-left">Role / Status</th>
                  {activeTab === 'directory'   && <th className="px-6 py-3">Department / Joined</th>}
                  {activeTab === 'directory'   && <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('score')}>
                    <div className="flex flex-wrap items-center gap-1"><Trophy size={14} className="text-yellow-500" /> Performance <ArrowUpDown size={12} /></div>
                  </th>}
                  {activeTab === 'payroll'     && <><th className="px-6 py-3">Base Salary</th><th className="px-6 py-3">PF Rate</th><th className="px-6 py-3">Configure</th></>}
                  {activeTab === 'warnings'    && <th className="px-6 py-3">Actions</th>}
                  {activeTab === 'directory'   && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <SkeletonTableBody rows={5} columns={6} />
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
                    <tr key={emp.id} className="data-table-row">
                      <td className="data-table-cell">
                        <div className="flex flex-wrap items-center gap-3 cursor-pointer group" onClick={() => navigate(`/dashboard/hr/${emp.id}`)}>
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-sm overflow-hidden">
                            {emp.profileImageUrl ? (
                              <img src={emp.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              emp.firstName?.[0] || '?'
                            )}
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
                      <td className="data-table-cell">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{emp.role}</span>
                          <StatusBadge status={empStatus} />
                        </div>
                      </td>

                      {/* Directory columns */}
                      {activeTab === 'directory' && (
                        <>
                          <td className="px-6 py-4 text-slate-500">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{emp.employeeProfile?.department || 'Unassigned'}</div>
                            <div className="text-xs">
                              Joined: {emp.employeeProfile?.joiningDate ? new Date(emp.employeeProfile.joiningDate).toLocaleDateString('en-IN') : 'Unknown'}
                            </div>
                          </td>
                          <td className="data-table-cell">
                            {(() => {
                              const atts = emp.employeeProfile?.attendances || [];
                              const totalDays = atts.length;
                              if (totalDays === 0) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="px-2 py-1 rounded-lg border font-bold text-sm text-slate-400 bg-slate-50 border-slate-200">
                                      N/A
                                    </div>
                                    <span className="text-xs text-muted-foreground">New / No data</span>
                                  </div>
                                );
                              }
                              const present = atts.filter(a => a.status === 'PRESENT').length * 10;
                              const half = atts.filter(a => a.status === 'HALF_DAY').length * 5;
                              const absent = atts.filter(a => a.status === 'ABSENT').length * -5;
                              const max = totalDays * 10;
                              const score = Math.max(0, Math.min(100, Math.round(((present + half + absent) / max) * 100)));
                              const scoreColor = score >= 80 ? 'text-emerald-600 bg-emerald-100 border-emerald-200' : score >= 50 ? 'text-amber-600 bg-amber-100 border-amber-200' : 'text-rose-600 bg-rose-100 border-rose-200';
                              return (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className={`px-2 py-1 rounded-lg border font-bold text-sm ${scoreColor}`}>
                                    {score}/100
                                  </div>
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${score}%` }}></div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </>
                      )}

                      {/* Payroll tab */}
                      {activeTab === 'payroll' && (
                        <>
                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                            {emp.employeeProfile?.baseSalary ? `₹${emp.employeeProfile.baseSalary.toLocaleString('en-IN')}` : <span className="text-amber-500 text-xs">Not set</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{emp.employeeProfile?.pfRate || 12}%</td>
                          <td className="data-table-cell">
                            {isSuperAdmin && (
                              <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/hr/payroll-config/${emp.id}`)}>
                                <Settings size={13} className="mr-1.5" /> Configure
                              </Button>
                            )}
                          </td>
                        </>
                      )}

                      {/* Warnings tab */}
                      {activeTab === 'warnings' && (
                        <td className="data-table-cell">
                          <div className="flex gap-2 flex-wrap">
                            {isSuperAdmin && (
                              <>
                                <Button size="sm" variant="outline" className={`text-amber-600 border-amber-200 hover:bg-amber-50 ${emp.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={emp.id === user.id} onClick={() => setWarnTarget(emp)}>
                                  <ShieldAlert size={13} className="mr-1.5" /> Issue Warning
                                </Button>
                                {empStatus === 'ACTIVE' && (
                                  <Button size="sm" variant="outline" className={`text-orange-600 border-orange-200 hover:bg-orange-50 ${emp.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={emp.id === user.id} onClick={() => setSuspendTarget(emp)}>
                                    <Clock size={13} className="mr-1.5" /> Suspend
                                  </Button>
                                )}
                                {empStatus === 'SUSPENDED' && (
                                  <Button size="sm" variant="outline" className={`text-emerald-600 border-emerald-200 hover:bg-emerald-50 ${emp.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={emp.id === user.id} onClick={() => handleReinstate(emp)}>
                                    <UserCheck size={13} className="mr-1.5" /> Reinstate
                                  </Button>
                                )}
                                {empStatus !== 'TERMINATED' && (
                                  <Button size="sm" variant="outline" className={`text-red-600 border-red-200 hover:bg-red-50 ${emp.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={emp.id === user.id} onClick={() => setTerminateTarget(emp)}>
                                    <UserX size={13} className="mr-1.5" /> Terminate
                                  </Button>
                                )}
                              </>
                            )}
                            {!isSuperAdmin && <span className="text-xs text-muted-foreground italic">Actions restricted to Super Admin</span>}
                            {emp.id === user.id && <span className="text-xs text-red-500 italic ml-2">Self action restricted</span>}
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
                            {isSuperAdmin && (
                              <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => setWarnTarget(emp)}>
                                <ShieldAlert size={13} />
                              </Button>
                            )}
                            {isSuperAdmin && empStatus !== 'TERMINATED' && (
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
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-semibold text-foreground">Leave Requests</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm border transition-all ${
                  leaveStatusFilter !== 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-slate-900 border-border hover:border-primary text-foreground'
                }`}
              >
                <Filter size={14} /> Filters
                {leaveStatusFilter !== 'all' && <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5">1</span>}
              </button>
              <button onClick={fetchLeaves} className="p-2 rounded-lg border border-input hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="border-b border-border bg-muted/20 px-6 py-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Leave Status</label>
                <select
                  value={leaveStatusFilter}
                  onChange={e => setLeaveStatusFilter(e.target.value)}
                  className="w-full sm:w-48 text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Sort Order</label>
                <select
                  value={leaveSortOrder}
                  onChange={e => setLeaveSortOrder(e.target.value)}
                  className="w-full sm:w-48 text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          )}
          {leavesLoading ? (
            <div className="w-full">
              <div className="animate-pulse space-y-4 px-4 py-2">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 p-4 border rounded-xl">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                    {['Employee','Date','Type','Reason','Submitted','Status',''].map(h => (
                      <th key={h} className={`px-6 py-3 ${h === 'Status' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...leaveRequests].sort((a, b) => {
                    const diff = new Date(b.createdAt) - new Date(a.createdAt);
                    return leaveSortOrder === 'desc' ? diff : -diff;
                  }).map(lr => (
                    <tr key={lr.id} className="data-table-row">
                      <td className="data-table-cell">
                        <div className="flex flex-wrap items-center gap-2">
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
                      <td className="data-table-cell"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-400">{lr.type?.replace('_',' ')}</span></td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[180px] truncate">{lr.reason}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(lr.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                              lr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              lr.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {lr.status}
                          </span>
                          {isSuperAdmin && (
                            <div className="flex flex-wrap gap-1 ml-2">
                              {lr.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleLeaveReview(lr.id, 'APPROVED')} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg" title="Approve"><CheckCircle2 size={14} /></button>
                                  <button onClick={() => handleLeaveReview(lr.id, 'REJECTED')} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg" title="Reject"><XCircle size={14} /></button>
                                </>
                              )}
                              {lr.status === 'APPROVED' && (
                                <button onClick={() => handleLeaveReview(lr.id, 'PENDING')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg" title="Revoke to Pending"><RefreshCw size={14} /></button>
                              )}
                              {lr.status === 'REJECTED' && (
                                <button onClick={() => handleLeaveReview(lr.id, 'PENDING')} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg" title="Reset to Pending"><RefreshCw size={14} /></button>
                              )}
                            </div>
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/hr/leaves/${lr.id}`); }} className="ml-2 h-8 w-8 p-0 shrink-0">
                            <Eye size={15} className="text-muted-foreground" />
                          </Button>
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

      {/* ── Overtime Tab ── */}
      {activeTab === 'overtime' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                <Timer size={20} className="text-primary" /> Overtime Management
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track and approve overtime. 1.5× weekdays, 2× Sundays/holidays</p>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => setOtFormOpen(v => !v)} size="sm">
                <Plus size={15} className="mr-1.5" /> Log Overtime
              </Button>
            )}
          </div>

          {/* Log Overtime Form */}
          {otFormOpen && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Log New Overtime</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Employee *</label>
                  <select
                    value={otForm.employeeId}
                    onChange={e => setOtForm(f => ({ ...f, employeeId: e.target.value }))}
                    className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select employee...</option>
                    {employees.filter(e => e.employeeProfile).map(e => (
                      <option key={e.employeeProfile.id} value={e.employeeProfile.id}>
                        {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Date *</label>
                  <Input type="date" max={new Date().toISOString().split('T')[0]} value={otForm.date} onChange={e => setOtForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Hours *</label>
                  <Input 
                    type="number" 
                    min="0.5" 
                    max="12" 
                    step="0.5" 
                    placeholder="e.g. 2.5" 
                    value={otForm.hours} 
                    onChange={e => setOtForm(f => ({ ...f, hours: e.target.value }))} 
                    onWheel={e => e.target.blur()}
                    onKeyDown={(e) => {
                      if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Reason</label>
                  <Input placeholder="Optional reason" value={otForm.reason} onChange={e => setOtForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOtFormOpen(false)}>Cancel</Button>
                <Button onClick={logOvertime}><CheckCircle2 size={15} className="mr-1.5" /> Submit Overtime</Button>
              </div>
            </div>
          )}

          {/* Overtime Records Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Hours</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              {otLoading ? (
                <tbody>
                  <SkeletonTableBody rows={3} columns={7} />
                </tbody>
              ) : overtimes.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Timer size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No overtime records found.</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Log Overtime" to add the first entry.</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-border">
                  {overtimes.map(ot => (
                    <tr key={ot.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{ot.employee?.user?.firstName} {ot.employee?.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{ot.reason || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(ot.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-medium">{ot.hours}h</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{ot.multiplier}×</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">₹{ot.amount?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          ot.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          ot.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          ot.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {ot.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {isSuperAdmin && (
                            <>
                              {ot.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleOtApprove(ot.id, 'APPROVE')} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg" title="Approve"><CheckCircle2 size={14} /></button>
                                  <button onClick={() => handleOtApprove(ot.id, 'REJECT')} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg" title="Reject"><XCircle size={14} /></button>
                                </>
                              )}
                              {ot.status === 'APPROVED' && (
                                <button onClick={() => handleOtApprove(ot.id, 'CANCEL')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg" title="Revoke/Cancel"><XCircle size={14} /></button>
                              )}
                              {(ot.status === 'REJECTED' || ot.status === 'CANCELLED') && (
                                <button onClick={() => handleOtApprove(ot.id, 'PENDING')} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg" title="Reset to Pending"><RefreshCw size={14} /></button>
                              )}
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/hr/overtime/${ot.id}`); }} className="h-8 w-8 p-0 shrink-0">
                            <Eye size={15} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Incentives Tab ── */}
      {activeTab === 'incentives' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                <Award size={20} className="text-primary" /> Sales & Performance Incentives
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage commissions, bonuses, and performance incentives</p>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => setIncFormOpen(v => !v)} size="sm">
                <Plus size={15} className="mr-1.5" /> Add Incentive
              </Button>
            )}
          </div>

          {incFormOpen && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Log New Incentive</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Employee *</label>
                  <select
                    value={incForm.employeeId}
                    onChange={e => setIncForm(f => ({ ...f, employeeId: e.target.value }))}
                    className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select employee...</option>
                    {employees.filter(e => e.employeeProfile).map(e => (
                      <option key={e.employeeProfile.id} value={e.employeeProfile.id}>
                        {e.firstName} {e.lastName} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Month *</label>
                  <Input
                    type="month"
                    max={new Date().toISOString().slice(0, 7)}
                    value={incForm.month}
                    onChange={e => setIncForm(f => ({ ...f, month: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Amount (₹) *</label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 5000" 
                    value={incForm.incentiveAmount} 
                    onChange={e => setIncForm(f => ({ ...f, incentiveAmount: e.target.value }))}
                    onWheel={e => e.target.blur()}
                    onKeyDown={(e) => {
                      if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault();
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
                  <Input placeholder="Reason for incentive" value={incForm.notes} onChange={e => setIncForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIncFormOpen(false)}>Cancel</Button>
                <Button onClick={logIncentive}><CheckCircle2 size={15} className="mr-1.5" /> Add Incentive</Button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Month</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Achieved</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Incentive</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              {incLoading ? (
                <tbody>
                  <SkeletonTableBody rows={3} columns={6} />
                </tbody>
              ) : incentives.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Award size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No incentives recorded yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Add Incentive" to log the first one.</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-border">
                  {incentives.map(inc => (
                    <tr key={inc.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{inc.employee?.user?.firstName} {inc.employee?.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{inc.notes || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.month}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {inc.achievedAmount ? `₹${inc.achievedAmount?.toFixed(0)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-violet-600">₹{inc.incentiveAmount?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          inc.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          inc.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {isSuperAdmin && (
                            <>
                              {inc.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleIncApprove(inc.id, 'APPROVE')} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg" title="Approve"><CheckCircle2 size={14} /></button>
                                  <button onClick={() => handleIncApprove(inc.id, 'REJECT')} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg" title="Reject"><XCircle size={14} /></button>
                                </>
                              )}
                              {inc.status === 'APPROVED' && (
                                <button onClick={() => handleIncApprove(inc.id, 'CANCEL')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg" title="Revoke/Cancel"><XCircle size={14} /></button>
                              )}
                              {(inc.status === 'REJECTED' || inc.status === 'CANCELLED') && (
                                <button onClick={() => handleIncApprove(inc.id, 'PENDING')} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg" title="Reset to Pending"><RefreshCw size={14} /></button>
                              )}
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/hr/incentive/${inc.id}`); }} className="h-8 w-8 p-0 shrink-0 ml-2">
                            <Eye size={15} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
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
    </div>
  );
}
