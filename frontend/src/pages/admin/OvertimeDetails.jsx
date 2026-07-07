import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function OvertimeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isSuperAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    // The backend /api/overtime returns ALL overtimes. 
    // We filter down to the one we want.
    const found = json.data.find(o => o.id === id);
    if (!found) throw new Error("Overtime record not found");
    return found;
  };

  const { data: ot, error, mutate, isLoading } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/overtime` : null,
    fetcher
  );

  const [processing, setProcessing] = useState(false);

  const handleApprove = async (action) => {
    try {
      setProcessing(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/overtime/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Overtime ${action.toLowerCase()}d successfully`);
        mutate();
      } else {
        toast.error(json.message);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading overtime details...</div>;
  
  if (error || !ot) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Record Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const empUser = ot.employee?.user;
  const otDate = new Date(ot.date);
  
  // Render a clean specific month/day block for "Affected Dates"
  const renderCalendar = () => {
    const daysInMonth = new Date(otDate.getFullYear(), otDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(otDate.getFullYear(), otDate.getMonth(), 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_,i) => i+1);

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4 shadow-sm">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-center">
          {otDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="p-4 grid grid-cols-7 gap-2 text-center text-xs">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="font-bold text-slate-400">{d}</div>)}
          {blanks.map((_,i) => <div key={`b-${i}`} />)}
          {days.map(d => {
            const isOtDay = d === otDate.getDate();
            return (
              <div key={d} className={`aspect-square flex items-center justify-center rounded-lg font-medium transition-all ${
                isOtDay 
                  ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
            <Timer className="text-primary" /> Overtime Details
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Full view of overtime record and actions</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
              {empUser?.profileImageUrl ? (
                <img src={empUser.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                `${empUser?.firstName?.[0] || ''}${empUser?.lastName?.[0] || ''}`
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{empUser?.firstName} {empUser?.lastName}</h2>
              <p className="text-sm text-slate-500">{ot.employee?.department || 'Unassigned'} • {ot.employee?.jobTitle}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
              ot.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              ot.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              ot.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
              ot.status === 'CANCELLED' ? 'bg-amber-100 text-amber-700' :
              'bg-orange-100 text-orange-700'
            }`}>
            STATUS: {ot.status}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p className="font-semibold text-slate-800">{otDate.toLocaleDateString('en-IN')}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hours</p>
            <p className="font-semibold text-slate-800">{ot.hours}h <span className="text-xs text-slate-400 font-normal ml-1">({ot.multiplier}x rate)</span></p>
          </div>
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Amount</p>
            <p className="font-bold text-emerald-700 text-lg">₹{ot.amount?.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Reason / Notes</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 min-h-[80px]">
            {ot.reason || <span className="italic text-slate-400">No reason provided.</span>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Affected Date</h3>
          {renderCalendar()}
        </div>

        {/* Action Bar */}
        {isSuperAdmin && ot.status !== 'PAID' && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            {ot.status === 'PENDING' && (
              <>
                <Button onClick={() => handleApprove('APPROVE')} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none">
                  <CheckCircle2 size={16} className="mr-2" /> Approve Overtime
                </Button>
                <Button onClick={() => handleApprove('REJECT')} disabled={processing} variant="destructive" className="flex-1 sm:flex-none">
                  <XCircle size={16} className="mr-2" /> Reject
                </Button>
              </>
            )}
            
            {ot.status === 'APPROVED' && (
              <Button onClick={() => handleApprove('CANCEL')} disabled={processing} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <XCircle size={16} className="mr-2" /> Revoke Approval
              </Button>
            )}

            {(ot.status === 'REJECTED' || ot.status === 'CANCELLED') && (
              <Button onClick={() => handleApprove('PENDING')} disabled={processing} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                <RefreshCw size={16} className="mr-2" /> Reset to Pending
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
