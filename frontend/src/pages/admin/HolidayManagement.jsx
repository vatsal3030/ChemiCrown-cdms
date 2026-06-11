import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, Trash2, RefreshCw, X, Shield, AlertCircle,
  CalendarCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOLIDAY_TYPE_STYLES = {
  NATIONAL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  FESTIVAL: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
  COMPANY:  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
};
const TYPE_LABELS = { NATIONAL: 'Govt. Holiday', FESTIVAL: 'Festival', COMPANY: 'Company Holiday' };

function HolidayBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${HOLIDAY_TYPE_STYLES[type] || HOLIDAY_TYPE_STYLES.COMPANY}`}>
      {type === 'NATIONAL' && <Shield size={10} className="mr-1" />}
      {TYPE_LABELS[type] || type}
    </span>
  );
}

export default function HolidayManagement() {
  const { token } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed
  const [showAddForm, setShowAddForm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('COMPANY');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/holidays?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setHolidays(json.data);
    } catch { toast.error('Failed to load holidays'); }
    finally { setLoading(false); }
  }, [year, token]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const seedHolidays = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/holidays/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ year })
      });
      const json = await res.json();
      if (json.success) { toast.success(json.message); fetchHolidays(); }
      else toast.error(json.message);
    } catch { toast.error('Network error'); }
    finally { setSeeding(false); }
  };

  const addHoliday = async () => {
    if (!newName.trim() || !newDate) return toast.error('Name and date are required');
    setAdding(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, date: newDate, type: newType, description: newDesc })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Holiday added');
        setNewName(''); setNewDate(''); setNewDesc(''); setNewType('COMPANY');
        setShowAddForm(false);
        fetchHolidays();
      } else toast.error(json.message);
    } catch { toast.error('Network error'); }
    finally { setAdding(false); }
  };

  const deleteHoliday = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) { toast.success('Holiday removed'); setHolidays(prev => prev.filter(h => h.id !== id)); }
      else toast.error(json.message);
    } catch { toast.error('Network error'); }
    finally { setDeletingId(null); }
  };

  // Group holidays by month for calendar view
  const holidaysByMonth = holidays.reduce((acc, h) => {
    const m = new Date(h.date).getMonth();
    if (!acc[m]) acc[m] = [];
    acc[m].push(h);
    return acc;
  }, {});

  // Build mini calendar for selected month
  const buildCalendar = () => {
    const firstDay = new Date(year, viewMonth, 1).getDay();
    const daysInMonth = new Date(year, viewMonth + 1, 0).getDate();
    const monthHolidays = holidaysByMonth[viewMonth] || [];
    const holidayDays = new Set(monthHolidays.map(h => new Date(h.date).getDate()));
    const cells = [];

    // Empty cells before first day (week starts Sunday)
    for (let i = 0; i < firstDay; i++) cells.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, viewMonth, d);
      const isSunday = date.getDay() === 0;
      const isHoliday = holidayDays.has(d);
      const holiday = monthHolidays.find(h => new Date(h.date).getDate() === d);
      cells.push({ day: d, isSunday, isHoliday, holiday });
    }
    return cells;
  };

  const calendarCells = buildCalendar();
  const currentMonthHolidays = holidaysByMonth[viewMonth] || [];

  const nationalCount = holidays.filter(h => h.type === 'NATIONAL').length;
  const festivalCount = holidays.filter(h => h.type === 'FESTIVAL').length;
  const companyCount = holidays.filter(h => h.type === 'COMPANY').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <CalendarDays size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">Holiday Calendar</h1>
          <p className="page-subtitle">Manage govt. holidays, festivals & company leave days. These auto-deduct from payroll.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchHolidays} className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground">
            <RefreshCw size={15} />
          </button>
          <Button onClick={seedHolidays} disabled={seeding} variant="outline" size="sm">
            {seeding ? 'Seeding...' : `🇮🇳 Auto-Seed ${year}`}
          </Button>
          <Button onClick={() => setShowAddForm(v => !v)} size="sm">
            <Plus size={15} className="mr-1.5" /> Add Holiday
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Holidays', value: holidays.length, icon: CalendarDays, color: 'bg-primary/10 text-primary' },
          { label: 'Govt. Holidays', value: nationalCount, icon: Shield, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
          { label: 'Festivals', value: festivalCount, icon: CalendarCheck, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
          { label: 'Company Days', value: companyCount, icon: Plus, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Holiday Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Plus size={16} className="text-primary" /> Add Custom Holiday</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg hover:bg-muted"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Holiday Name *</label>
              <Input placeholder="e.g. Foundation Day" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Date *</label>
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="COMPANY">Company Holiday</option>
                <option value="FESTIVAL">Festival</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Description</label>
              <Input placeholder="Optional description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button onClick={addHoliday} disabled={adding}>{adding ? 'Adding...' : 'Add Holiday'}</Button>
          </div>
        </div>
      )}

      {/* Calendar + List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Mini Calendar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewMonth(m => m === 0 ? (setYear(y => y - 1), 11) : m - 1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value))}
              className="font-bold text-foreground text-sm bg-transparent border-none focus:outline-none cursor-pointer text-center"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>{m} {year}</option>
              ))}
            </select>
            <button
              onClick={() => setViewMonth(m => m === 11 ? (setYear(y => y + 1), 0) : m + 1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className={`text-center text-xs font-bold py-1 ${d === 'Su' ? 'text-red-500' : 'text-muted-foreground'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((cell, i) => (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition-all ${
                  !cell ? '' :
                  cell.isHoliday ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/30' :
                  cell.isSunday ? 'text-red-500 bg-red-50 dark:bg-red-900/10' :
                  'text-foreground hover:bg-muted'
                }`}
                title={cell?.holiday?.name || (cell?.isSunday ? 'Sunday (Weekly Off)' : '')}
              >
                {cell?.day}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-1.5 border-t border-border pt-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded bg-primary" /><span>Holiday (paid off)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/20" /><span>Sunday (weekly off)</span>
            </div>
          </div>
        </div>

        {/* Holiday List for selected month */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold text-foreground">{MONTH_NAMES[viewMonth]} {year} Holidays</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentMonthHolidays.length === 0 ? 'No holidays this month' : `${currentMonthHolidays.length} holiday${currentMonthHolidays.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : currentMonthHolidays.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No holidays in {MONTH_NAMES[viewMonth]}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currentMonthHolidays.map(h => {
                const d = new Date(h.date);
                return (
                  <div key={h.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                    {/* Date badge */}
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <p className="text-xs font-bold text-primary">{MONTH_NAMES[d.getMonth()].substring(0, 3).toUpperCase()}</p>
                      <p className="text-lg font-extrabold text-primary leading-none">{d.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">{h.name}</p>
                        {h.isReadOnly && <Shield size={12} className="text-red-500" title="Cannot be deleted (National Holiday)" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <HolidayBadge type={h.type} />
                        {h.description && <p className="text-xs text-muted-foreground">{h.description}</p>}
                        <p className="text-xs text-muted-foreground">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                      </div>
                    </div>
                    {!h.isReadOnly && (
                      <button
                        onClick={() => deleteHoliday(h.id)}
                        disabled={deletingId === h.id}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove holiday"
                      >
                        {deletingId === h.id ? '...' : <Trash2 size={14} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full year holiday list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">All Holidays — {year}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Complete list of all {holidays.length} holidays. National holidays cannot be deleted.</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading holidays...</div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-amber-400" />
            <p className="text-foreground font-medium">No holidays seeded for {year}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Click "Auto-Seed {year}" to populate Indian national holidays and festivals.</p>
            <Button onClick={seedHolidays} disabled={seeding}>🇮🇳 Seed Indian Holidays for {year}</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Holiday</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Day</th>
                  <th className="data-table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holidays.map(h => {
                  const d = new Date(h.date);
                  return (
                    <tr key={h.id} className="data-table-row">
                      <td className="data-table-cell text-muted-foreground font-mono text-xs">
                        {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="data-table-cell">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground">{h.name}</p>
                          {h.isReadOnly && <Shield size={11} className="text-red-400" title="National Holiday — cannot delete" />}
                        </div>
                        {h.description && <p className="text-xs text-muted-foreground">{h.description}</p>}
                      </td>
                      <td className="data-table-cell"><HolidayBadge type={h.type} /></td>
                      <td className="data-table-cell text-muted-foreground text-xs capitalize">
                        {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                      </td>
                      <td className="data-table-cell text-right">
                        {!h.isReadOnly && (
                          <button
                            onClick={() => deleteHoliday(h.id)}
                            disabled={deletingId === h.id}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            {deletingId === h.id ? '...' : <Trash2 size={13} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
