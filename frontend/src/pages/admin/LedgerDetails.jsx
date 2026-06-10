import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, BookOpen, Clock, Activity, FileText, IndianRupee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function LedgerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  };

  const { data: entry, error } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/finance/ledger/${id}` : null,
    fetcher
  );

  const loading = !entry && !error;

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Ledger Entry Not Found</h2>
        <Button onClick={() => navigate('/dashboard/finance?tab=ledger')}>Back to Ledger</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/dashboard/finance?tab=ledger')}
          className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Ledger Log Details</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-full h-2 ${entry.type === 'CREDIT' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        
        <div className="p-8 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                <IndianRupee size={32} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-1">Transaction Amount</p>
                <h2 className={`text-4xl font-black tracking-tight ${entry.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {entry.type === 'DEBIT' ? '-' : '+'}₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {entry.type}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {entry.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${entry.isAutomatic ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {entry.isAutomatic ? 'Automated' : 'Manual Entry'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-2"><FileText size={16} /> Description</p>
                <p className="text-foreground font-medium text-lg leading-snug">{entry.description}</p>
              </div>
              
              {entry.referenceId && (
                <div>
                  <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-2"><BookOpen size={16} /> Reference ID</p>
                  <code className="bg-muted px-3 py-1.5 rounded-lg text-sm font-mono text-foreground break-all">
                    {entry.referenceId}
                  </code>
                </div>
              )}
            </div>
            
            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Transaction Date</p>
                <p className="text-foreground font-medium flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  {new Date(entry.date).toLocaleString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Logged Into System</p>
                <p className="text-foreground font-medium flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  {new Date(entry.createdAt).toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Internal Ledger ID</p>
                <p className="text-muted-foreground font-mono text-xs">{entry.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
