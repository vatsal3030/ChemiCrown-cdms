import { X, Calendar as CalendarIcon, FileText, CheckCircle2, Clock, XCircle, Award, Timer, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HRDetailsModal({ type, data, onClose }) {
  if (!data) return null;

  const isLeave = type === 'leave';
  const isOvertime = type === 'overtime';
  const isIncentive = type === 'incentive';

  const employee = isLeave ? data.employee : (isOvertime ? data.employee : data.employeeProfile);
  const user = employee?.user || employee; // Fallback for nested structures
  const empName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'Unknown Employee';

  // Calendar logic
  const targetDate = isLeave ? new Date(data.date) : (isOvertime ? new Date(data.date) : new Date(data.month + '-01'));
  const monthDays = Array.from({ length: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate() }, (_, i) => {
    return new Date(targetDate.getFullYear(), targetDate.getMonth(), i + 1);
  });
  
  const isDateHighlighted = (date) => {
    if (isLeave) {
      if (data.isMultiDay && data.endDate) {
        const start = new Date(data.date).setHours(0,0,0,0);
        const end = new Date(data.endDate).setHours(0,0,0,0);
        const current = date.setHours(0,0,0,0);
        return current >= start && current <= end;
      }
      return date.setHours(0,0,0,0) === new Date(data.date).setHours(0,0,0,0);
    }
    if (isOvertime) return date.setHours(0,0,0,0) === new Date(data.date).setHours(0,0,0,0);
    return true; // Incentive = whole month
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`p-6 text-white flex items-start justify-between ${
          isLeave ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
          isOvertime ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600' :
          'bg-gradient-to-r from-emerald-600 to-teal-600'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80 text-xs font-bold uppercase tracking-wider">
              {isLeave ? <CalendarIcon size={14} /> : isOvertime ? <Timer size={14} /> : <Award size={14} />}
              {isLeave ? 'Leave Request' : isOvertime ? 'Overtime Log' : 'Incentive Record'}
            </div>
            <h2 className="text-2xl font-bold">{empName}</h2>
            <p className="opacity-90 text-sm mt-1">{employee?.department || 'Unassigned'} • {user?.email}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Status & Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/40 p-3 rounded-2xl border border-border">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</p>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                data.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                data.status === 'REJECTED' || data.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {data.status === 'APPROVED' ? <CheckCircle2 size={12} /> : data.status === 'PENDING' ? <Clock size={12} /> : <XCircle size={12} />}
                {data.status}
              </div>
            </div>
            
            {isLeave && (
              <>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-semibold text-foreground">{data.type?.replace('_', ' ')}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border sm:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(data.date).toLocaleDateString('en-IN')} {data.endDate ? `to ${new Date(data.endDate).toLocaleDateString('en-IN')}` : ''}
                  </p>
                </div>
              </>
            )}

            {isOvertime && (
              <>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Hours</p>
                  <p className="text-sm font-bold text-purple-600">{data.hours}h</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rate</p>
                  <p className="text-sm font-semibold text-foreground">{data.multiplier}×</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-bold text-emerald-600">₹{data.amount?.toFixed(2) || '0.00'}</p>
                </div>
              </>
            )}

            {isIncentive && (
              <>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border sm:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Month</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(data.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 mb-1">Incentive Amount</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{data.incentiveAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </>
            )}
          </div>

          {/* Reason / Notes */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
              <FileText size={16} className="text-primary" /> 
              {isLeave ? 'Reason for Leave' : isOvertime ? 'Overtime Context' : 'Performance Notes'}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[80px]">
              {data.reason || data.notes || <span className="text-muted-foreground italic">No context provided.</span>}
            </div>
          </div>

          {/* Mini Calendar View */}
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <CalendarIcon size={16} className="text-primary" /> 
              Affected Dates
            </h3>
            <div className="bg-card border border-border p-4 rounded-3xl">
              <div className="text-center font-bold text-sm mb-4">
                {targetDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-muted-foreground">{d}</div>
                ))}
                {Array.from({length: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).getDay()}).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDays.map((date, i) => {
                  const highlighted = isDateHighlighted(date);
                  let highlightClass = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
                  
                  if (highlighted) {
                    if (isLeave) highlightClass = "bg-blue-500 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30 scale-110 z-10";
                    else if (isOvertime) highlightClass = "bg-purple-500 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-500/30 scale-110 z-10";
                    else highlightClass = "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30 scale-110 z-10";
                  }

                  return (
                    <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${highlightClass}`}>
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Close Details</Button>
        </div>
      </div>
    </div>
  );
}
