import { useState } from 'react';
import { ClipboardCheck, Calendar, DollarSign, PiggyBank, ShieldCheck, Send, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const ATTENDANCE_STYLES = {
  PRESENT:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ABSENT:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HALF_DAY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  LEAVE:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DEFAULT:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const getAttendanceStyle = (status) =>
  ATTENDANCE_STYLES[status?.toUpperCase?.()] ?? ATTENDANCE_STYLES.DEFAULT;


export default function MyAttendance() {
  const { token, user } = useAuth();
  const [leaveForm, setLeaveForm] = useState({ date: '', endDate: '', reason: '', type: 'FULL_DAY', isMultiDay: false });
  const [submitting, setSubmitting] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  
  const fetcher = async ([url, t]) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  };

  const { data: profile, error, isLoading } = useSWR(
    token ? [`${import.meta.env.VITE_API_URL}/api/hr/me`, token] : null,
    fetcher
  );

  const { data: leaveRequests, mutate: mutateLeaves } = useSWR(
    token ? [`${import.meta.env.VITE_API_URL}/api/leaves/my`, token] : null,
    fetcher
  );

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    if (!leaveForm.date || !leaveForm.reason) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(leaveForm)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Leave request submitted successfully!');
        setLeaveForm({ date: '', endDate: '', reason: '', type: 'FULL_DAY', isMultiDay: false });
        setShowLeaveForm(false);
        mutateLeaves();
      } else {
        toast.error(json.message || 'Failed to submit leave request');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Failed to load profile data. Please try again later.</p>
      </div>
    );
  }

  const attendance = profile.attendances || [];
  const salaries = profile.salaries || [];

  const currentMonth = new Date().toISOString().substring(0, 7);
  const thisMonthAttendance = attendance.filter(a => a.date?.startsWith(currentMonth));
  
  const presentDays = thisMonthAttendance.filter(a => a.status === 'PRESENT').length;
  const halfDays = thisMonthAttendance.filter(a => a.status === 'HALF_DAY').length;
  const absentDays = thisMonthAttendance.filter(a => a.status === 'ABSENT').length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === 'LEAVE').length;

  const totalPresent = presentDays + (halfDays * 0.5);
  const totalAbsent = absentDays + (halfDays * 0.5);
  const accumulatedPF = salaries.reduce((sum, s) => sum + (s.pfContribution || 0), 0);

  const leaveStatusStyle = (status) => {
    if (status === 'APPROVED') return 'badge badge-success';
    if (status === 'REJECTED') return 'badge badge-error';
    return 'badge badge-warning';
  };

  // Generate calendar grid (month view)
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const monthDays = Array.from({length: daysInMonth}, (_, i) => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
  });

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const joiningDate = profile.employeeProfile?.joiningDate ? new Date(profile.employeeProfile.joiningDate) : null;
  const isPrevDisabled = joiningDate && viewDate.getFullYear() === joiningDate.getFullYear() && viewDate.getMonth() === joiningDate.getMonth();
  const isNextDisabled = viewDate.getFullYear() === new Date().getFullYear() && viewDate.getMonth() === new Date().getMonth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header mb-0">
        <div className="page-header-icon bg-primary/10 text-primary">
          <ClipboardCheck size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.firstName}. Your attendance is managed by HR.</p>
        </div>
        <Button onClick={() => setShowLeaveForm(!showLeaveForm)} variant="outline" className="flex flex-wrap items-center gap-2">
          <Send size={16} /> Request Leave
        </Button>
      </div>

      {/* Leave Request Form */}
      {showLeaveForm && (
        <div className="form-card border-l-4 border-primary">
          <h2 className="font-bold text-foreground mb-4 flex flex-wrap items-center gap-2">
            <Send size={16} className="text-primary" /> Submit Leave Request
          </h2>
          <form onSubmit={handleLeaveRequest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between mb-1 min-h-[20px]">
                  <label className="text-sm font-semibold">Start Date</label>
                  <label className="flex flex-wrap items-center gap-1.5 cursor-pointer text-xs font-normal text-muted-foreground">
                    <input 
                      type="checkbox" 
                      checked={leaveForm.isMultiDay} 
                      onChange={e => setLeaveForm(f => ({ ...f, isMultiDay: e.target.checked, endDate: '', type: 'FULL_DAY' }))}
                      className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    Multi-day
                  </label>
                </div>
                <input
                  type="date"
                  value={leaveForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setLeaveForm(f => ({ ...f, date: e.target.value, endDate: f.isMultiDay && f.endDate < e.target.value ? '' : f.endDate }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            {leaveForm.isMultiDay ? (
              <div className="flex flex-col justify-end">
                <label className="form-label block mb-1 text-sm font-semibold min-h-[20px]">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  min={leaveForm.date || new Date().toISOString().split('T')[0]}
                  onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            ) : (
              <div className="flex flex-col justify-end">
                <label className="form-label block mb-1 text-sm font-semibold min-h-[20px]">Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="FULL_DAY">Full Day</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>
            )}
            <div className="flex flex-col justify-end">
              <label className="form-label block mb-1 text-sm font-semibold min-h-[20px]">Reason</label>
              <input
                type="text"
                placeholder="Brief reason for leave..."
                value={leaveForm.reason}
                onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Requests */}
      {leaveRequests && leaveRequests.length > 0 && (
        <div className="form-card">
          <h2 className="font-bold text-foreground mb-4">My Leave Requests</h2>
          <div className="space-y-2">
            {leaveRequests.map(lr => (
              <div key={lr.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {new Date(lr.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {lr.endDate && ` - ${new Date(lr.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lr.reason}</p>
                </div>
                <span className={leaveStatusStyle(lr.status)}>{lr.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card text-center">
          <h3 className="kpi-label mb-2">Present Days</h3>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalPresent}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
        <div className="kpi-card text-center">
          <h3 className="kpi-label mb-2">Absent Days</h3>
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{totalAbsent}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
        <div className="kpi-card text-center">
          <h3 className="kpi-label mb-2">On Leave</h3>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{leaveDays}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
        <div className="kpi-card text-center relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:scale-110 transition-transform">
            <PiggyBank size={80} />
          </div>
          <h3 className="kpi-label mb-2 relative z-10 flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-orange-500" /> Total PF
          </h3>
          <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 relative z-10">₹{accumulatedPF.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1 relative z-10">Accumulated</p>
        </div>
      </div>

      {/* Base Salary Card */}
      <div className="kpi-card flex items-center justify-between">
        <div>
          <p className="kpi-label">Current Base Salary</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">₹{(profile.baseSalary || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">Per month — managed by HR</p>
        </div>
        <DollarSign size={36} className="text-primary/20" />
      </div>

      {/* Attendance & Salary History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance History — Read Only */}
        <div className="data-table-wrapper">
          <div className="data-table-header bg-muted/30">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Attendance Calendar</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button disabled={isPrevDisabled} onClick={handlePrevMonth} className="p-1 rounded bg-background border border-border hover:bg-muted disabled:opacity-50"><ChevronLeft size={14} /></button>
              <span className="text-xs font-semibold w-24 text-center">{viewDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })}</span>
              <button disabled={isNextDisabled} onClick={handleNextMonth} className="p-1 rounded bg-background border border-border hover:bg-muted disabled:opacity-50"><ChevronRight size={14} /></button>
            </div>
          </div>
          
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{d}</div>
              ))}
              {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map((date, i) => {
                const record = attendance.find(a => new Date(a.date).toDateString() === date.toDateString());
                let colorClass = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
                if (record) {
                  if (record.status === 'PRESENT') colorClass = "bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-400";
                  else if (record.status === 'ABSENT') colorClass = "bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/40 dark:border-red-800 dark:text-red-400";
                  else if (record.status === 'LEAVE') colorClass = "bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400";
                  else if (record.status === 'HALF_DAY') colorClass = "bg-orange-100 text-orange-600 border border-orange-200 dark:bg-orange-900/40 dark:border-orange-800 dark:text-orange-400";
                }
                
                return (
                  <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs shadow-sm ${colorClass}`} title={date.toDateString() + (record ? `: ${record.status}` : ': No Data')}>
                    <span className="font-bold">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
              <span className="flex flex-wrap items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800"></div> Present</span>
              <span className="flex flex-wrap items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-red-100 border border-red-200 dark:bg-red-900/40 dark:border-red-800"></div> Absent</span>
              <span className="flex flex-wrap items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-orange-100 border border-orange-200 dark:bg-orange-900/40 dark:border-orange-800"></div> Half Day</span>
              <span className="flex flex-wrap items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-blue-100 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-800"></div> Leave</span>
              <span className="flex flex-wrap items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-muted"></div> No Data</span>
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No attendance records yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border sticky top-0 bg-card">
                  <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="data-table-cell text-left">Date</th>
                    <th className="data-table-cell text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendance.map((rec, i) => (
                    <tr key={i} className="data-table-row">
                      <td className="data-table-cell text-muted-foreground">
                        {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="data-table-cell">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getAttendanceStyle(rec.status)}`}>
                          {(rec.status || '—').replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Salary History */}
        <div className="data-table-wrapper">
          <div className="data-table-header bg-muted/30">
            <div className="flex flex-wrap items-center gap-2">
              <DollarSign size={16} className="text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Salary History</h3>
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {salaries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No salary records yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border sticky top-0 bg-card">
                  <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="data-table-cell text-left">Month</th>
                    <th className="data-table-cell text-left">Deductions</th>
                    <th className="data-table-cell text-left">PF</th>
                    <th className="data-table-cell text-left">Net Pay</th>
                    <th className="data-table-cell text-left">Confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {salaries.map((s, i) => (
                    <tr key={i} className="data-table-row">
                      <td className="data-table-cell font-bold text-foreground">{s.month}</td>
                      <td className="data-table-cell text-rose-600 font-medium">-₹{(s.deductions || 0).toLocaleString()}</td>
                      <td className="data-table-cell text-amber-600 font-medium">-₹{(s.pfContribution || 0).toLocaleString()}</td>
                      <td className="data-table-cell font-bold text-emerald-600 dark:text-emerald-400">₹{(s.netPay || s.amount || 0).toLocaleString()}</td>
                      <td className="data-table-cell">
                        {s.status === 'PAID' && !s.confirmedByEmployee && (
                          <ConfirmReceiptButton salaryId={s.id} token={token} />
                        )}
                        {s.confirmedByEmployee && (
                          <span className="badge badge-success"><CheckCircle2 size={11} /> Confirmed</span>
                        )}
                        {s.status !== 'PAID' && (
                          <span className="badge badge-warning"><Clock size={11} /> Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmReceiptButton({ salaryId, token }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { confirm } = useDialog();

  const handleConfirm = async () => {
    const ok = await confirm('Confirm Salary Receipt', 'Confirm that you have received this salary payment. This will verify disbursement on your profile.', { type: 'success', confirmLabel: 'Confirm' });
    if (!ok) return;
    setConfirming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payroll/${salaryId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Receipt confirmed!');
        setConfirmed(true);
      } else {
        toast.error(json.message || 'Failed to confirm');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setConfirming(false);
    }
  };

  if (confirmed) return <span className="badge badge-success"><CheckCircle2 size={11} /> Confirmed</span>;

  return (
    <button
      onClick={handleConfirm}
      disabled={confirming}
      className="text-xs font-semibold text-primary hover:underline flex flex-wrap items-center gap-1 disabled:opacity-50"
    >
      <CheckCircle2 size={12} /> {confirming ? 'Confirming...' : 'Confirm Receipt'}
    </button>
  );
}
