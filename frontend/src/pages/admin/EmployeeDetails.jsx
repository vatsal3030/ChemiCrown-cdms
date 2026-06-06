import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, Calendar as CalendarIcon, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

  const salaryData = salaries.map(s => ({
    month: s.month,
    amount: s.amount
  })).reverse();

  // Generate calendar grid (simple 30 days visualization)
  const today = new Date();
  const past30Days = Array.from({length: 30}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0,0,0,0);
    return d;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <button onClick={() => navigate('/dashboard/hr')} className="flex items-center text-sm text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to HR Management
      </button>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold shrink-0">
          {employee.firstName?.charAt(0) || 'E'}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-primary font-medium mt-1">{employee.role}</p>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
            <div className="flex items-center gap-1"><Mail size={16} /> {employee.email}</div>
            {employee.phone && <div className="flex items-center gap-1"><Phone size={16} /> {employee.phone}</div>}
            <div className="flex items-center gap-1"><Building size={16} /> {employee.employeeProfile?.department || 'No Dept'}</div>
            <div className="flex items-center gap-1"><Briefcase size={16} /> {employee.employeeProfile?.jobTitle || 'No Title'}</div>
            <div className="flex items-center gap-1"><CalendarIcon size={16} /> Joined: {employee.employeeProfile?.joiningDate ? new Date(employee.employeeProfile.joiningDate).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Stats & Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Attendance Overview (Last 30 Days)</h2>
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
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
              {past30Days.map((date, i) => {
                const record = attendance.find(a => new Date(a.date).toDateString() === date.toDateString());
                let colorClass = "bg-slate-100 text-slate-400";
                if (record) {
                  if (record.status === 'PRESENT') colorClass = "bg-green-100 text-green-600 border border-green-200";
                  else if (record.status === 'ABSENT') colorClass = "bg-red-100 text-red-600 border border-red-200";
                  else if (record.status === 'LEAVE') colorClass = "bg-orange-100 text-orange-600 border border-orange-200";
                  else if (record.status === 'HALF_DAY') colorClass = "bg-blue-100 text-blue-600 border border-blue-200";
                }
                
                return (
                  <div key={i} className={`aspect-square rounded flex flex-col items-center justify-center text-xs ${colorClass}`} title={date.toDateString() + (record ? `: ${record.status}` : ': No Data')}>
                    <span className="font-medium">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-slate-500 justify-center">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div> Present</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Absent</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div> Leave</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-100"></div> No Data</span>
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
                    <div key={salary.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
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
