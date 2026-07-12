import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function LeaveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isSuperAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    const found = json.data.find(l => l.id === id);
    if (!found) throw new Error("Leave record not found");
    return found;
  };

  const { data: lr, error, mutate, isLoading } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/leaves` : null,
    fetcher
  );

  const [processing, setProcessing] = useState(false);

  const handleApprove = async (status) => {
    try {
      setProcessing(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaves/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Leave request ${status.toLowerCase()} successfully`);
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

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading leave details...</div>;
  
  if (error || !lr) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Record Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const empUser = lr.employee?.user;
  const startDate = new Date(lr.date);
  const endDate = lr.endDate ? new Date(lr.endDate) : new Date(lr.date);
  
  // Render a clean calendar block for "Affected Dates"
  const renderCalendar = () => {
    // Generate dates from startDate to endDate inclusive
    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    if (dates.length === 0) return null;

    const otDate = dates[0];
    const daysInMonth = new Date(otDate.getFullYear(), otDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(otDate.getFullYear(), otDate.getMonth(), 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const monthDays = Array.from({length: daysInMonth}, (_,i) => i+1);

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4 shadow-sm">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-center">
          {otDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="p-4 grid grid-cols-7 gap-2 text-center text-xs">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="font-bold text-slate-400">{d}</div>)}
          {blanks.map((_,i) => <div key={`b-${i}`} />)}
          {monthDays.map(d => {
            const currentDateStr = new Date(otDate.getFullYear(), otDate.getMonth(), d).toISOString().split('T')[0];
            const isLeaveDay = dates.some(date => date.toISOString().split('T')[0] === currentDateStr);
            return (
              <div key={d} className={`aspect-square flex items-center justify-center rounded-lg font-medium transition-all ${
                isLeaveDay 
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2' 
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
            <CalendarIcon className="text-blue-600" /> Leave Request Details
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Full view of leave request and actions</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl overflow-hidden">
              {empUser?.profileImageUrl ? (
                <img src={empUser.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                `${empUser?.firstName?.[0] || ''}${empUser?.lastName?.[0] || ''}`
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{empUser?.firstName} {empUser?.lastName}</h2>
              <p className="text-sm text-slate-500">{lr.employee?.department || 'Unassigned'} • {lr.employee?.jobTitle}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
              lr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              lr.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              lr.status === 'CANCELLED' ? 'bg-amber-100 text-amber-700' :
              'bg-orange-100 text-orange-700'
            }`}>
            STATUS: {lr.status}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</p>
            <p className="font-semibold text-slate-800">
              {startDate.toLocaleDateString('en-IN')} {startDate.getTime() !== endDate.getTime() && `- ${endDate.toLocaleDateString('en-IN')}`}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
            <p className="font-semibold text-slate-800">{lr.type.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Reason for Leave</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 min-h-[80px]">
            {lr.reason || <span className="italic text-slate-400">No reason provided.</span>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Affected Dates</h3>
          {renderCalendar()}
        </div>

        {/* Action Bar */}
        {isSuperAdmin && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            {lr.status === 'PENDING' && (
              <>
                <Button onClick={() => handleApprove('APPROVED')} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none">
                  <CheckCircle2 size={16} className="mr-2" /> Approve Leave
                </Button>
                <Button onClick={() => handleApprove('REJECTED')} disabled={processing} variant="destructive" className="flex-1 sm:flex-none">
                  <XCircle size={16} className="mr-2" /> Reject
                </Button>
              </>
            )}
            
            {lr.status === 'APPROVED' && (
              <Button onClick={() => handleApprove('PENDING')} disabled={processing} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <XCircle size={16} className="mr-2" /> Revoke Approval
              </Button>
            )}

            {(lr.status === 'REJECTED' || lr.status === 'CANCELLED') && (
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
