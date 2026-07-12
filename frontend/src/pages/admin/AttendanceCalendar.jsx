import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AttendanceCalendar() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = ['SUPER_ADMIN'].includes(user?.role);

  const [viewDate, setViewDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  
  // Pending changes to be saved
  const [pendingChanges, setPendingChanges] = useState({});

  const targetYear = viewDate.getFullYear();
  const targetMonth = viewDate.getMonth();
  const formattedDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-02`;

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  };

  // Fetch employees with attendances for the current month
  const { data: employees, error, isLoading, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/hr?attendanceDate=${formattedDate}&showTerminated=false` : null,
    fetcher
  );

  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setPendingChanges({});
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setPendingChanges({});
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCellClick = (empId, day) => {
    if (!isSuperAdmin) return;

    const cellDateTime = new Date(targetYear, targetMonth, day).getTime();
    
    // Check if future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (cellDateTime > today.getTime()) {
      toast.error('Cannot mark attendance for future dates');
      return;
    }

    // Check if date is before employee joining date
    const emp = employees?.find(e => e.id === empId);
    if (emp?.employeeProfile?.joiningDate) {
      const joiningDateTime = new Date(new Date(emp.employeeProfile.joiningDate).setHours(0,0,0,0)).getTime();
      if (cellDateTime < joiningDateTime) {
        toast.error(`Cannot edit attendance before joining date (${new Date(emp.employeeProfile.joiningDate).toLocaleDateString()})`);
        return;
      }
    }
    
    const dateStr = new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().split('T')[0];
    const key = `${empId}_${dateStr}`;
    
    // Cycle through states: PRESENT -> ABSENT -> HALF_DAY -> LEAVE -> null
    setPendingChanges(prev => {
      const current = prev[key] !== undefined ? prev[key] : getExistingStatus(empId, dateStr);
      let nextStatus = null;
      if (current === 'PRESENT') nextStatus = 'ABSENT';
      else if (current === 'ABSENT') nextStatus = 'HALF_DAY';
      else if (current === 'HALF_DAY') nextStatus = 'LEAVE';
      else if (current === 'LEAVE') nextStatus = null;
      else nextStatus = 'PRESENT';

      return { ...prev, [key]: nextStatus };
    });
  };

  const getExistingStatus = (empId, dateStr) => {
    const emp = employees?.find(e => e.id === empId);
    if (!emp) return null;
    const att = emp.employeeProfile?.attendances?.find(a => a.date.startsWith(dateStr));
    return att ? att.status : null;
  };

  const getCellStatus = (empId, day) => {
    const dateStr = new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().split('T')[0];
    const key = `${empId}_${dateStr}`;
    if (pendingChanges[key] !== undefined) return pendingChanges[key];
    return getExistingStatus(empId, dateStr);
  };

  const getStatusColor = (status, isPending) => {
    const base = isPending ? 'ring-2 ring-primary dark:ring-primary/80 ring-offset-1 dark:ring-offset-slate-900 opacity-80' : '';
    switch (status) {
      case 'PRESENT': return `bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ${base}`;
      case 'ABSENT': return `bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 ${base}`;
      case 'HALF_DAY': return `bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ${base}`;
      case 'LEAVE': return `bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 ${base}`;
      default: return `hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-300 dark:text-slate-700 ${base}`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PRESENT': return 'P';
      case 'ABSENT': return 'A';
      case 'HALF_DAY': return 'H';
      case 'LEAVE': return 'L';
      default: return '-';
    }
  };

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    let successCount = 0;
    
    // Optimistic UI update
    const optimisticEmployees = employees.map(emp => {
      let atts = [...(emp.employeeProfile?.attendances || [])];
      for (const [key, status] of Object.entries(pendingChanges)) {
        const [empId, dateStr] = key.split('_');
        if (emp.id === empId) {
          const existingIdx = atts.findIndex(a => a.date.startsWith(dateStr));
          if (existingIdx >= 0) {
            atts[existingIdx] = { ...atts[existingIdx], status };
          } else {
            atts.push({ date: new Date(dateStr).toISOString(), status });
          }
        }
      }
      return {
        ...emp,
        employeeProfile: {
          ...emp.employeeProfile,
          attendances: atts
        }
      };
    });
    mutate(optimisticEmployees, false);
    
    // Process changes in parallel
    const promises = Object.entries(pendingChanges).map(async ([key, status]) => {
      const [empId, dateStr] = key.split('_');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${empId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            date: new Date(dateStr).toISOString(),
            status 
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to save');
        return true;
      } catch (e) {
        console.error("Failed to update attendance", e);
        return false;
      }
    });

    const results = await Promise.all(promises);
    successCount = results.filter(Boolean).length;
    
    setSaving(false);
    setPendingChanges({});
    mutate(); // Re-fetch from server to ensure state consistency
    if (successCount > 0) {
      toast.success(`Saved ${successCount} attendance records`);
    }
    if (successCount < results.length) {
      toast.error(`Failed to save ${results.length - successCount} records`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground flex flex-wrap items-center gap-2">
              <CalendarIcon className="text-blue-600 dark:text-blue-400" /> Attendance Register
            </h1>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">Month view for all employees</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft size={18} /></button>
            <input 
              type="month" 
              value={`${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m] = e.target.value.split('-');
                  setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                  setPendingChanges({});
                }
              }}
              className="text-sm font-bold text-center text-slate-800 dark:text-slate-200 bg-transparent border-0 focus:ring-0 cursor-pointer w-36"
            />
            <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight size={18} /></button>
          </div>
          
          {isSuperAdmin && (
            <Button onClick={handleSave} disabled={saving || Object.keys(pendingChanges).length === 0} className="gap-2">
              <Save size={16} /> {saving ? 'Saving...' : `Save Changes (${Object.keys(pendingChanges).length})`}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2 animate-pulse bg-card">
            {/* Skeleton header row */}
            <div className="flex gap-1">
              <div className="h-10 w-[200px] bg-muted rounded-lg shrink-0" />
              {Array.from({ length: Math.min(daysInMonth, 15) }).map((_, i) => (
                <div key={i} className="h-10 w-8 bg-muted/60 rounded shrink-0" />
              ))}
              <div className="h-10 flex-1 bg-muted/60 rounded" />
            </div>
            {/* Skeleton data rows */}
            {Array.from({ length: 6 }).map((_, row) => (
              <div key={row} className="flex gap-1">
                <div className="h-12 w-[200px] bg-muted rounded-lg shrink-0">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mt-3 ml-3" />
                  <div className="h-2 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded mt-1.5 ml-3" />
                </div>
                {Array.from({ length: Math.min(daysInMonth, 15) }).map((_, c) => (
                  <div key={c} className="h-12 w-8 bg-slate-50 dark:bg-slate-800/30 rounded shrink-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-slate-200/50 dark:bg-slate-750 rounded" />
                  </div>
                ))}
                <div className="h-12 flex-1 bg-slate-50 dark:bg-slate-800/30 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 flex flex-col items-center">
            <AlertTriangle className="mb-2" /> Failed to load data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-max">
              <thead className="bg-muted/80 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="px-3 sm:px-4 py-3 text-left font-bold text-foreground border-r border-border sticky left-0 bg-muted z-20 min-w-[120px] max-w-[120px] sm:min-w-[200px] sm:max-w-[200px]">
                    Employee
                  </th>
                  {daysArray.map(day => (
                    <th key={day} className="px-1 py-2 text-center font-semibold text-muted-foreground border-b border-border min-w-[32px]">
                      <div className="text-[10px] uppercase">{new Date(targetYear, targetMonth, day).toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                      <div className="mt-1">{day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.filter(e => e.employeeProfile).map(emp => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/30 group">
                    <td className="px-3 sm:px-4 py-2 border-r border-border sticky left-0 bg-card group-hover:bg-muted/40 z-10 transition-colors min-w-[120px] max-w-[120px] sm:min-w-[200px] sm:max-w-[200px]">
                      <div className="font-semibold text-foreground truncate text-xs sm:text-sm">{emp.firstName || emp.lastName ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : emp.email?.split('@')[0] || 'Unknown User'}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{emp.employeeProfile?.department || 'No Dept'} • {emp.employeeProfile?.jobTitle}</div>
                    </td>
                    {daysArray.map(day => {
                      const empId = emp.id;
                      const status = getCellStatus(empId, day);
                      const dateStr = new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().split('T')[0];
                      const key = `${empId}_${dateStr}`;
                      const isPending = pendingChanges[key] !== undefined;
                      const isWeekend = [0, 6].includes(new Date(targetYear, targetMonth, day).getDay());
                      
                      // Check if before joining date
                      const joiningDateVal = emp.employeeProfile?.joiningDate ? new Date(emp.employeeProfile.joiningDate) : null;
                      const cellDateTime = new Date(targetYear, targetMonth, day).getTime();
                      const joiningDateTime = joiningDateVal ? new Date(new Date(joiningDateVal).setHours(0,0,0,0)).getTime() : null;
                      const isBeforeJoining = joiningDateTime ? cellDateTime < joiningDateTime : false;
                      
                      // Check if future date
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isFutureDate = cellDateTime > today.getTime();

                      const isCellDisabled = isBeforeJoining || isFutureDate;
                      
                      return (
                        <td key={day} className={`p-0.5 border-r border-border text-center ${isWeekend ? 'bg-muted/10' : ''}`}>
                          <button
                            disabled={!isSuperAdmin || isCellDisabled}
                            onClick={() => handleCellClick(empId, day)}
                            className={`w-full h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${
                              isCellDisabled 
                                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-350 dark:text-slate-600 cursor-not-allowed opacity-50' 
                                : getStatusColor(status, isPending)
                            } ${!isSuperAdmin || isCellDisabled ? '' : 'cursor-pointer hover:opacity-80'}`}
                            title={
                              isBeforeJoining
                                ? `${emp.firstName} - Before Joining Date (Joined: ${new Date(emp.employeeProfile.joiningDate).toLocaleDateString('en-IN')})`
                                : isFutureDate
                                  ? `Cannot mark attendance for future dates`
                                  : `${emp.firstName} - ${day}/${targetMonth + 1}/${targetYear}`
                            }
                          >
                            {isCellDisabled ? '-' : getStatusLabel(status)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees?.filter(e => e.employeeProfile).length === 0 && (
                  <tr>
                    <td colSpan={daysInMonth + 1} className="p-8 text-center text-slate-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">P</div> Present</div>
        <div className="flex flex-wrap items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 flex items-center justify-center">A</div> Absent</div>
        <div className="flex flex-wrap items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">H</div> Half Day</div>
        <div className="flex flex-wrap items-center gap-2"><div className="w-4 h-4 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 flex items-center justify-center">L</div> Leave</div>
        <div className="flex flex-wrap items-center gap-2 ml-auto text-slate-400 dark:text-slate-500">Click cells to cycle through statuses (Super Admin only)</div>
      </div>
    </div>
  );
}
