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

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  };

  // Fetch employees with attendances for the current month
  const { data: employees, error, isLoading, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/hr?attendanceDate=${viewDate.toISOString()}&showTerminated=false` : null,
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
    const base = isPending ? 'ring-2 ring-primary ring-offset-1 opacity-80' : '';
    switch (status) {
      case 'PRESENT': return `bg-emerald-100 text-emerald-700 ${base}`;
      case 'ABSENT': return `bg-red-100 text-red-700 ${base}`;
      case 'HALF_DAY': return `bg-blue-100 text-blue-700 ${base}`;
      case 'LEAVE': return `bg-orange-100 text-orange-700 ${base}`;
      default: return `hover:bg-slate-100 text-slate-300 ${base}`;
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
    
    // Process changes sequentially for simplicity/reliability
    for (const [key, status] of Object.entries(pendingChanges)) {
      const [empId, dateStr] = key.split('_');
      // For backend, it needs an array of employeeIds and a date
      // We will make individual calls or group by date
      
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${empId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            date: dateStr, 
            status: status || 'REMOVE' 
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to save');
        successCount++;
      } catch (e) {
        console.error("Failed to update attendance", e);
        toast.error(`Failed to update attendance for ${dateStr}`);
      }
    }
    
    setSaving(false);
    setPendingChanges({});
    mutate();
    toast.success(`Saved ${successCount} attendance records`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="text-blue-600" /> Attendance Register
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Month view for all employees</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><ChevronLeft size={18} /></button>
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
              className="text-sm font-bold text-center text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer w-36"
            />
            <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><ChevronRight size={18} /></button>
          </div>
          
          {isSuperAdmin && (
            <Button onClick={handleSave} disabled={saving || Object.keys(pendingChanges).length === 0} className="gap-2">
              <Save size={16} /> {saving ? 'Saving...' : `Save Changes (${Object.keys(pendingChanges).length})`}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading attendance data...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 flex flex-col items-center">
            <AlertTriangle className="mb-2" /> Failed to load data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-max">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-20 min-w-[200px]">
                    Employee
                  </th>
                  {daysArray.map(day => (
                    <th key={day} className="px-1 py-2 text-center font-semibold text-slate-500 border-b border-slate-200 min-w-[32px]">
                      <div className="text-[10px] uppercase">{new Date(targetYear, targetMonth, day).toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                      <div className="mt-1">{day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.filter(e => e.employeeProfile).map(emp => (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 group">
                    <td className="px-4 py-2 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-10 transition-colors">
                      <div className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">{emp.employeeProfile?.department || 'No Dept'} • {emp.employeeProfile?.jobTitle}</div>
                    </td>
                    {daysArray.map(day => {
                      const empId = emp.id;
                      const status = getCellStatus(empId, day);
                      const dateStr = new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().split('T')[0];
                      const key = `${empId}_${dateStr}`;
                      const isPending = pendingChanges[key] !== undefined;
                      const isWeekend = [0, 6].includes(new Date(targetYear, targetMonth, day).getDay());
                      
                      return (
                        <td key={day} className={`p-0.5 border-r border-slate-100 text-center ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                          <button
                            disabled={!isSuperAdmin}
                            onClick={() => handleCellClick(empId, day)}
                            className={`w-full h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${getStatusColor(status, isPending)} ${!isSuperAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                            title={`${emp.firstName} - ${day}/${targetMonth + 1}/${targetYear}`}
                          >
                            {getStatusLabel(status)}
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
      
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">P</div> Present</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 text-red-700 flex items-center justify-center">A</div> Absent</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 text-blue-700 flex items-center justify-center">H</div> Half Day</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-100 text-orange-700 flex items-center justify-center">L</div> Leave</div>
        <div className="flex items-center gap-2 ml-auto text-slate-400">Click cells to cycle through statuses (Super Admin only)</div>
      </div>
    </div>
  );
}
