import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, Calendar as CalendarIcon, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Trophy, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { formatPhone } from '@/lib/utils';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { confirm, prompt } = useDialog();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());


  const handleIssueWarning = async () => {
    const type = await prompt("Issue Official Warning", "Enter Warning Type (VERBAL, WRITTEN, FINAL):", "WRITTEN", { placeholder: "VERBAL, WRITTEN, or FINAL" });
    if (!type) return;
    if (!['VERBAL', 'WRITTEN', 'FINAL'].includes(type.toUpperCase())) {
      return toast.error("Invalid warning type. Must be VERBAL, WRITTEN, or FINAL.");
    }
    const reason = await prompt("Warning Reason", `Enter reason for the ${type.toUpperCase()} warning:`);
    if (!reason?.trim()) return toast.error("Reason is required.");
    
    const ok = await confirm("Confirm Warning", `Confirm issuing ${type.toUpperCase()} warning to ${employee.firstName}?`, { type: 'warning' });
    if (!ok) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/warnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: type.toUpperCase(), reason })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Warning issued successfully");
      } else {
        toast.error(json.message || "Failed to issue warning");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleSuspend = async () => {
    const from = await prompt("Suspension Start Date", "Enter Start Date (YYYY-MM-DD):", new Date().toISOString().substring(0, 10));
    if (!from) return;
    const to = await prompt("Suspension End Date", "Enter End Date (YYYY-MM-DD):");
    if (!to) return;
    const reason = await prompt("Suspension Reason", "Enter reason for suspension:");
    if (!reason?.trim()) return toast.error("Reason is required.");

    const ok = await confirm("Confirm Suspension", `Confirm suspending ${employee.firstName} from ${from} to ${to}?`, { type: 'warning' });
    if (!ok) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ from, to, reason })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Employee suspended successfully");
        setEmployee(prev => ({ ...prev, employeeProfile: { ...prev.employeeProfile, status: 'SUSPENDED' } }));
      } else {
        toast.error(json.message || "Failed to suspend");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleTerminate = async () => {
    const reason = await prompt("Termination Reason", "Enter reason for termination:");
    if (!reason?.trim()) return toast.error("Reason is required.");
    const date = await prompt("Termination Date", "Enter effective date (YYYY-MM-DD):", new Date().toISOString().substring(0, 10));
    if (!date) return;

    const ok = await confirm(
      "⚠️ CRITICAL: Confirm Termination",
      `Are you sure you want to TERMINATE ${employee.firstName} ${employee.lastName} effective ${date}? This cannot be undone.`,
      { type: 'danger', confirmLabel: 'Terminate Employee' }
    );
    if (!ok) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason, effectiveDate: date })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Employee terminated successfully");
        setEmployee(prev => ({ ...prev, employeeProfile: { ...prev.employeeProfile, status: 'TERMINATED' } }));
      } else {
        toast.error(json.message || "Failed to terminate");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const getHeatmapData = () => {
    const days = [];
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - 5); // 6 months total
    startDate.setDate(1);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch employee details directly
      const empRes = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      const empData = await empRes.json();
      if (empData.success) {
        setEmployee(empData.data);
      }

      // Fetch attendance
      const attRes = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}/attendance`, { headers: { Authorization: `Bearer ${token}` }});
      const attData = await attRes.json();
      if (attData.success) setAttendance(attData.data);

      // Fetch salaries
      const salRes = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}/salary`, { headers: { Authorization: `Bearer ${token}` }});
      const salData = await salRes.json();
      if (salData.success) setSalaries(salData.data);
    } catch {
      toast.error("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) {
      fetchData();
    }
  }, [id, token]);

  const openEditModal = () => {
    navigate(`/dashboard/hr/edit-employee/${id}`);
  };

  const handleDeleteWarning = async (warnId) => {
    const ok = await confirm("Delete Warning", "Are you sure you want to remove this warning log?", { type: 'warning' });
    if (!ok) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${employee.employeeProfile?.id}/warnings/${warnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Warning removed successfully");
        fetchData();
      } else {
        toast.error(json.message || "Failed to remove warning");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse max-w-[1600px] px-4 md:px-8 mx-auto pb-10">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
  if (!employee) return <div className="p-8 text-center text-red-500">Employee not found.</div>;

  // Process data for charts
  const attendanceStats = {
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    leave: attendance.filter(a => a.status === 'LEAVE').length,
    half_day: attendance.filter(a => a.status === 'HALF_DAY').length,
  };

  const chartData = [
    { name: 'Present', value: attendanceStats.present },
    { name: 'Absent', value: attendanceStats.absent },
    { name: 'Leave', value: attendanceStats.leave },
  ];

  // Calculate a mock Performance Score
  const totalDays = attendance.length;
  let score = 0;
  if (totalDays > 0) {
    const presentScore = attendanceStats.present * 10;
    const halfDayScore = attendanceStats.half_day * 5;
    const absentScore = attendanceStats.absent * -5;
    const maxPossible = totalDays * 10;
    const rawScore = presentScore + halfDayScore + absentScore;
    score = Math.max(0, Math.min(100, Math.round((rawScore / maxPossible) * 100)));
  } else {
    score = null; // Default if no data
  }

  const salaryData = salaries.map(s => ({
    month: s.month,
    amount: s.amount
  })).reverse();

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

  const joiningDate = employee.employeeProfile?.joiningDate ? new Date(employee.employeeProfile.joiningDate) : null;
  const isPrevDisabled = joiningDate && viewDate.getFullYear() === joiningDate.getFullYear() && viewDate.getMonth() === joiningDate.getMonth();
  const isNextDisabled = viewDate.getFullYear() === new Date().getFullYear() && viewDate.getMonth() === new Date().getMonth();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] px-4 md:px-8 mx-auto pb-10">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-slate-500 hover:text-slate-800 flex items-center">
        <ArrowLeft size={16} className="mr-1" /> Go Back
      </button>

      <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center text-white">
        <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
          <Trophy size={400} className="text-indigo-400 rotate-12" />
        </div>
        <div className="relative z-10 w-28 h-28 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-5xl font-black shadow-[0_0_30px_rgba(99,102,241,0.5)] border-4 border-white/10 overflow-hidden">
          {employee.profileImageUrl ? (
            <img src={employee.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            employee.firstName?.charAt(0) || 'E'
          )}
        </div>
        <div className="relative z-10 flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-slate-300">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-indigo-300 font-bold tracking-widest uppercase text-sm mt-2 flex items-center justify-center md:justify-start gap-2">
            <Trophy size={16} className="text-yellow-400" /> {employee.role}
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6 text-sm text-slate-300 font-medium">
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Mail size={14} className="text-indigo-400"/> {employee.email}</div>
            {employee.phone && <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Phone size={14} className="text-indigo-400"/> {formatPhone(employee.phone)}</div>}
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Building size={14} className="text-indigo-400"/> {employee.employeeProfile?.department || 'No Dept'}</div>
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Briefcase size={14} className="text-indigo-400"/> {employee.employeeProfile?.jobTitle || 'No Title'}</div>
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><CalendarIcon size={14} className="text-indigo-400"/> Joined: {employee.employeeProfile?.joiningDate ? new Date(employee.employeeProfile.joiningDate).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl min-w-[160px]">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Performance Score</p>
          <div className="flex items-baseline gap-1 text-yellow-400">
            <span className="text-5xl font-black">{score !== null ? score : 'N/A'}</span>
            {score !== null && <span className="text-lg font-bold">/100</span>}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div className={`h-full rounded-full bg-linear-to-r ${score >= 80 ? 'from-green-400 to-emerald-500' : score >= 50 ? 'from-yellow-400 to-amber-500' : score !== null ? 'from-red-400 to-rose-500' : 'bg-slate-500'}`} style={{ width: `${score !== null ? score : 0}%` }}></div>
          </div>
        </div>

        {['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role) && (
          <div className="relative z-10 flex flex-col gap-2 w-full md:w-44 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-center mb-1">Actions</p>
            <button onClick={openEditModal} className="w-full text-xs font-semibold px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl transition-all cursor-pointer">
              Edit Profile
            </button>
            {employee.id !== user.id && user?.role === 'SUPER_ADMIN' && (
              <>
                <button onClick={handleIssueWarning} className="w-full text-xs font-semibold px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 border border-yellow-500/30 rounded-xl transition-all cursor-pointer mt-1">
                  Issue Warning
                </button>
                {employee.employeeProfile?.status === 'ACTIVE' && (
                  <button onClick={handleSuspend} className="w-full text-xs font-semibold px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/30 rounded-xl transition-all cursor-pointer">
                    Suspend
                  </button>
                )}
                {employee.employeeProfile?.status !== 'TERMINATED' && (
                  <button onClick={handleTerminate} className="w-full text-xs font-semibold px-4 py-2 bg-red-600/25 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl transition-all cursor-pointer">
                    Terminate
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Stats & Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold">Attendance Overview</h2>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={isPrevDisabled} onClick={handlePrevMonth} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600"><ChevronLeft size={16} /></button>
                <span className="text-sm font-semibold w-24 text-center">{viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                <button disabled={isNextDisabled} onClick={handleNextMonth} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="grid grid-rows-7 text-[10px] text-muted-foreground pr-1 pt-1 h-[98px] justify-between">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div className="grid grid-flow-col grid-rows-7 gap-1 h-[98px] w-max">
                    {getHeatmapData().map((day, idx) => {
                      const record = attendance.find(a => new Date(a.date).toDateString() === day.toDateString());
                      let colorClass = "bg-muted/60";
                      if (record) {
                        if (record.status === 'PRESENT') colorClass = "bg-emerald-500 dark:bg-emerald-600";
                        else if (record.status === 'ABSENT') colorClass = "bg-red-500 dark:bg-red-600";
                        else if (record.status === 'LEAVE') colorClass = "bg-amber-500 dark:bg-amber-600";
                        else if (record.status === 'HALF_DAY') colorClass = "bg-blue-500 dark:bg-blue-600";
                      }
                      return (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-xs transition-all hover:scale-125 ${colorClass}`}
                          title={`${day.toLocaleDateString('en-IN')}${record ? `: ${record.status}` : ': No Data'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Daily Log</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-slate-400">{d}</div>
              ))}
              {Array.from({length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()}).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map((date, i) => {
                const record = attendance.find(a => new Date(a.date).toDateString() === date.toDateString());
                let colorClass = "bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-600 dark:border-slate-800";
                if (record) {
                  if (record.status === 'PRESENT') colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
                  else if (record.status === 'ABSENT') colorClass = "bg-rose-50 text-rose-700 border border-rose-200/30 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20";
                  else if (record.status === 'LEAVE') colorClass = "bg-amber-50 text-amber-700 border border-amber-200/30 dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20";
                  else if (record.status === 'HALF_DAY') colorClass = "bg-blue-50 text-blue-700 border border-blue-200/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
                }
                
                return (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (record) {
                        toast.success(`${date.toLocaleDateString('en-IN')}: Marked as ${record.status}`, { icon: '📅', duration: 3000 });
                      } else {
                        toast(`${date.toLocaleDateString('en-IN')}: No attendance recorded`, { icon: 'ℹ️', duration: 2000 });
                      }
                    }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer hover:shadow-md border-2 ${colorClass}`} 
                    title={date.toDateString() + (record ? `: ${record.status}` : ': No Data')}
                  >
                    <span className="font-bold text-sm">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-6 text-xs text-slate-500 justify-center font-medium">
              <span className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400"></div> Present
              </span>
              <span className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/30 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 dark:bg-rose-400"></div> Absent
              </span>
              <span className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/30 dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 dark:bg-amber-400"></div> Leave
              </span>
              <span className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 dark:bg-blue-400"></div> Half Day
              </span>
              <span className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div> No Data
              </span>
            </div>
          </div>
        </div>

        {/* Salary History */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Payroll History</h2>
            {salaries.length === 0 ? (
              <p className="text-slate-500 text-sm">No salary records found for this employee.</p>
            ) : (
              <>
                <div className="h-48 mb-6">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={salaryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Transactions</h3>
                  {salaries.slice(0, 5).map(salary => (
                    <div key={salary.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-lg bg-muted border border-border">
                      <div>
                        <p className="font-medium">{salary.month}</p>
                        <p className="text-xs text-slate-500">{new Date(salary.paidAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{salary.amount.toLocaleString()}</p>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-800">{salary.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Warning Logs Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Warnings Issued
              </h2>
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-450 text-xs px-2 py-0.5 rounded-full font-bold">
                {employee.employeeProfile?.warnings?.length || 0}
              </span>
            </div>
            
            {(!employee.employeeProfile?.warnings || employee.employeeProfile.warnings.length === 0) ? (
              <p className="text-slate-500 text-xs">No active warnings issued to this employee.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {employee.employeeProfile.warnings.map(warning => (
                  <div key={warning.id} className="p-3 rounded-lg bg-amber-50/50 border border-amber-250/20 dark:bg-amber-950/20 dark:border-amber-900/40 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          warning.type === 'FINAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {warning.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(warning.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{warning.reason}</p>
                    </div>
                    {user?.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDeleteWarning(warning.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                        title="Remove Warning"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
