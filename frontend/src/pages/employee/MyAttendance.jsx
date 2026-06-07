import { useState } from 'react';
import { ClipboardCheck, Calendar, DollarSign, PiggyBank, ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyAttendance() {
  const { token, user } = useAuth();
  
  const fetcher = async (url) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  };

  const { data: profile, error, isLoading } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/hr/me` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Failed to load profile data.</p>
      </div>
    );
  }

  const attendance = profile.attendance || [];
  const salaries = profile.salaries || [];

  const currentMonth = new Date().toISOString().substring(0, 7);
  const thisMonthAttendance = attendance.filter(a => a.date.startsWith(currentMonth));
  
  const presentDays = thisMonthAttendance.filter(a => a.status === 'PRESENT').length;
  const halfDays = thisMonthAttendance.filter(a => a.status === 'HALF_DAY').length;
  const absentDays = thisMonthAttendance.filter(a => a.status === 'ABSENT').length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === 'LEAVE').length;

  const totalPresent = presentDays + (halfDays * 0.5);
  const totalAbsent = absentDays + (halfDays * 0.5);

  const accumulatedPF = salaries.reduce((sum, s) => sum + (s.pfContribution || 0), 0);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" /> My Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Welcome back, {user?.firstName}. Here is your personal overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-slate-500 font-medium mb-2">Total Present</h3>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">{totalPresent}</p>
          <p className="text-xs text-slate-500 mt-1">Days this month</p>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-slate-500 font-medium mb-2">Total Absent</h3>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400">{totalAbsent}</p>
          <p className="text-xs text-slate-500 mt-1">Days this month</p>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-slate-500 font-medium mb-2">Current Base Salary</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₹{(profile.baseSalary || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Per Month</p>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm text-center relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <PiggyBank size={100} />
          </div>
          <h3 className="text-slate-500 font-medium mb-2 relative z-10 flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-orange-500" /> Accumulated PF
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 relative z-10">₹{accumulatedPF.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 relative z-10">Total Fund</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance History */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Attendance Logs</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No attendance records found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 text-xs uppercase font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {attendance.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          rec.status === 'PRESENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          rec.status === 'ABSENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          rec.status === 'HALF_DAY' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {rec.status.replace('_', ' ')}
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
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Salary History</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {salaries.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No salary records found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 text-xs uppercase font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3">Month</th>
                    <th className="px-6 py-3">Deductions</th>
                    <th className="px-6 py-3">PF</th>
                    <th className="px-6 py-3">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {salaries.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">{s.month}</td>
                      <td className="px-6 py-3 text-red-600">-₹{(s.deductions || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-orange-600">-₹{(s.pfContribution || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 font-bold text-green-600 dark:text-green-400">₹{(s.netPay || s.amount).toLocaleString()}</td>
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
