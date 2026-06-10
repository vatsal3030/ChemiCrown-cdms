import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, Shield, Clock, User, Activity, Database, Key, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/audit-logs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setLog(json.data);
        } else {
          toast.error(json.message || 'Failed to load audit log');
          navigate('/dashboard/audit-log');
        }
      } catch (e) {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [id, token, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this audit log entry? This is generally not recommended for compliance.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/audit-logs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Audit log deleted');
        navigate('/dashboard/audit-log');
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="h-8 w-1/4 bg-muted rounded animate-pulse" />
        <div className="h-[400px] bg-card border border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!log) return null;

  let parsedDetails = null;
  try {
    parsedDetails = log.details ? JSON.parse(log.details) : null;
  } catch {
    parsedDetails = log.details;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/audit-log')}
            className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="text-primary" /> Audit Log Details
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">ID: {log.id}</p>
          </div>
        </div>
        
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER') && (
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm border border-red-200"
          >
            <Trash2 size={16} /> Delete Record
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity size={14} /> Action Summary
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Action Performed</span>
                <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold font-mono">
                  {log.action}
                </span>
              </div>
              
              <div className="flex items-start gap-8">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Entity Affected</span>
                  <span className="font-medium flex items-center gap-1.5"><Database size={14} className="text-muted-foreground" /> {log.entity}</span>
                </div>
                {log.entityId && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Entity ID</span>
                    <span className="font-mono text-sm">{log.entityId}</span>
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Timestamp</span>
                <span className="font-medium flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground" /> {new Date(log.createdAt).toLocaleString('en-IN', { timeZoneName: 'short' })}</span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <User size={14} /> Actor Information
            </h3>
            
            {log.user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {log.user.firstName?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold">{log.user.firstName} {log.user.lastName}</div>
                    <div className="text-sm text-muted-foreground">{log.user.email}</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Role</span>
                      <span className="badge badge-neutral text-xs">{log.user.role}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">User ID</span>
                      <span className="font-mono text-xs">{log.userId}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                System or unknown actor
              </div>
            )}
          </div>
        </div>

        {/* JSON Details */}
        <div className="p-6 md:p-8 border-t border-border bg-muted/10">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Key size={14} /> Detailed Payload / Changes
          </h3>
          
          <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto">
            {parsedDetails ? (
              <pre className="text-xs text-[#d4d4d4] font-mono leading-relaxed">
                {JSON.stringify(parsedDetails, null, 2)}
              </pre>
            ) : log.details ? (
              <div className="text-sm text-[#d4d4d4] whitespace-pre-wrap font-mono">{log.details}</div>
            ) : (
              <div className="text-sm text-slate-500 italic">No additional details recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
