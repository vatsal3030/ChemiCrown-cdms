import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, Calendar as CalendarIcon, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import toast from 'react-hot-toast';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch employee details (by getting all and filtering for now)
        const empRes = await fetch(`${import.meta.env.VITE_API_URL}/api/hr`, { headers: { Authorization: `Bearer ${token}` }});
        const empData = await empRes.json();
        if (empData.success) {
          const found = empData.data.find(e => e.id === id);
          if (found) setEmployee(found);
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
    fetchData();
  }, [id, token]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading employee profile...</div>;
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
    score = 85; // Default if no data
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-slate-500 hover:text-slate-800 flex items-center">
        <ArrowLeft size={16} className="mr-1" /> Go Back
      </button>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center text-white">
        <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
          <Trophy size={400} className="text-indigo-400 rotate-12" />
        </div>
        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-5xl font-black shadow-[0_0_30px_rgba(99,102,241,0.5)] border-4 border-white/10">
          {employee.firstName?.charAt(0) || 'E'}
        </div>
        <div className="relative z-10 flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-indigo-300 font-bold tracking-widest uppercase text-sm mt-2 flex items-center justify-center md:justify-start gap-2">
            <Trophy size={16} className="text-yellow-400" /> {employee.role}
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6 text-sm text-slate-300 font-medium">
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Mail size={14} className="text-indigo-400"/> {employee.email}</div>
            {employee.phone && <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Phone size={14} className="text-indigo-400"/> {employee.phone}</div>}
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Building size={14} className="text-indigo-400"/> {employee.employeeProfile?.department || 'No Dept'}</div>
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Briefcase size={14} className="text-indigo-400"/> {employee.employeeProfile?.jobTitle || 'No Title'}</div>
            <div className="flex flex-wrap items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><CalendarIcon size={14} className="text-indigo-400"/> Joined: {employee.employeeProfile?.joiningDate ? new Date(employee.employeeProfile.joiningDate).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl min-w-[160px]">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Performance Score</p>
          <div className="flex items-baseline gap-1 text-yellow-400">
            <span className="text-5xl font-black">{score}</span>
            <span className="text-lg font-bold">/100</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${score >= 80 ? 'from-green-400 to-emerald-500' : score >= 50 ? 'from-yellow-400 to-amber-500' : 'from-red-400 to-rose-500'}`} style={{ width: `${score}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Stats & Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold">Attendance Overview</h2>
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={isPrevDisabled} onClick={handlePrevMonth} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600"><ChevronLeft size={16} /></button>
                <span className="text-sm font-semibold w-24 text-center">{viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                <button disabled={isNextDisabled} onClick={handleNextMonth} className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
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
                let colorClass = "bg-slate-100 text-slate-400";
                if (record) {
                  if (record.status === 'PRESENT') colorClass = "bg-green-100 text-green-600 border border-green-200";
                  else if (record.status === 'ABSENT') colorClass = "bg-red-100 text-red-600 border border-red-200";
                  else if (record.status === 'LEAVE') colorClass = "bg-orange-100 text-orange-600 border border-orange-200";
                  else if (record.status === 'HALF_DAY') colorClass = "bg-blue-100 text-blue-600 border border-blue-200";
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
              <span className="flex flex-wrap items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md"><div className="w-3 h-3 rounded bg-green-400 border border-green-500 shadow-inner"></div> Present</span>
              <span className="flex flex-wrap items-center gap-1.5 px-2 py-1 bg-red-50 rounded-md"><div className="w-3 h-3 rounded bg-red-400 border border-red-500 shadow-inner"></div> Absent</span>
              <span className="flex flex-wrap items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-md"><div className="w-3 h-3 rounded bg-orange-400 border border-orange-500 shadow-inner"></div> Leave</span>
              <span className="flex flex-wrap items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md"><div className="w-3 h-3 rounded bg-blue-400 border border-blue-500 shadow-inner"></div> Half Day</span>
              <span className="flex flex-wrap items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md"><div className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></div> No Data</span>
            </div>
          </div>
        </div>

        {/* Salary History */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Payroll History</h2>
            {salaries.length === 0 ? (
              <p className="text-slate-500 text-sm">No salary records found for this employee.</p>
            ) : (
              <>
                <div className="h-48 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
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
                    <div key={salary.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
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
        </div>
      </div>
    </div>
  );
}
