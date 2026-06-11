import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function IncentiveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isSuperAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    const found = json.data.find(i => i.id === id);
    if (!found) throw new Error("Incentive record not found");
    return found;
  };

  const { data: inc, error, mutate, isLoading } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/incentives` : null,
    fetcher
  );

  const [processing, setProcessing] = useState(false);

  const handleApprove = async (action) => {
    try {
      setProcessing(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/incentives/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Incentive ${action.toLowerCase()}d successfully`);
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

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading incentive details...</div>;
  
  if (error || !inc) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Record Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const empUser = inc.employee?.user;
  
  // Format the month (e.g., '2026-11' -> 'November 2026')
  const [yearStr, monthStr] = inc.month.split('-');
  const displayMonth = new Date(parseInt(yearStr), parseInt(monthStr) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
            <Trophy className="text-primary" /> Incentive Details
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Full view of incentive record and actions</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xl">
              {empUser?.firstName?.[0]}{empUser?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{empUser?.firstName} {empUser?.lastName}</h2>
              <p className="text-sm text-slate-500">{inc.employee?.department || 'Unassigned'} • {inc.employee?.jobTitle}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
              inc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              inc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              inc.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
            STATUS: {inc.status}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Incentive Month</p>
            <p className="text-2xl font-black text-slate-800 flex flex-wrap items-center gap-2">
              📅 {displayMonth}
            </p>
          </div>
          <div className="bg-violet-50/50 rounded-xl p-6 border border-violet-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Incentive Amount</p>
            <p className="font-black text-violet-700 text-3xl">₹{inc.incentiveAmount?.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Performance Notes / Reason</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 min-h-[80px] leading-relaxed">
            {inc.notes || <span className="italic text-slate-400">No specific notes provided.</span>}
          </div>
        </div>

        {/* Action Bar */}
        {isSuperAdmin && inc.status !== 'PAID' && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            {inc.status === 'PENDING' && (
              <>
                <Button onClick={() => handleApprove('APPROVE')} disabled={processing} className="bg-violet-600 hover:bg-violet-700 text-white flex-1 sm:flex-none">
                  <CheckCircle2 size={16} className="mr-2" /> Approve Incentive
                </Button>
                <Button onClick={() => handleApprove('REJECT')} disabled={processing} variant="destructive" className="flex-1 sm:flex-none">
                  <XCircle size={16} className="mr-2" /> Reject
                </Button>
              </>
            )}

            {inc.status === 'REJECTED' && (
              <Button onClick={() => handleApprove('PENDING')} disabled={processing} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                <RefreshCw size={16} className="mr-2" /> Reset to Pending
              </Button>
            )}
            
            {inc.status === 'APPROVED' && (
              <Button onClick={() => handleApprove('PENDING')} disabled={processing} variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <RefreshCw size={16} className="mr-2" /> Revoke Approval
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
