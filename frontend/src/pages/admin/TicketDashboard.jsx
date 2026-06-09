import { useState, useEffect } from 'react';
import { Bug, Lightbulb, Database, AlertTriangle, CheckCircle2, Clock, RefreshCw, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const TYPE_ICONS = { BUG: Bug, FEATURE_REQUEST: Lightbulb, DATA_ISSUE: Database, OTHER: AlertTriangle };
const PRIORITY_STYLES = {
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  CRITICAL: 'badge-error',
};
const STATUS_STYLES = {
  OPEN: 'badge-warning',
  IN_PROGRESS: 'badge-info',
  RESOLVED: 'badge-success',
  CLOSED: 'badge-secondary',
};

export default function TicketDashboard() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setTickets(json.data);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleResolve = async (id, status) => {
    setResolving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, resolution })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Ticket ${status.toLowerCase()}`);
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status, resolution } : t));
        setSelected(null);
        setResolution('');
      } else toast.error(json.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setResolving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if ((await res.json()).success) {
        toast.success('Ticket deleted');
        setTickets(prev => prev.filter(t => t.id !== id));
      }
    } catch { toast.error('Network error'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-foreground">Update Ticket</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="font-semibold text-foreground">{selected.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
              </div>
              <div>
                <label className="form-label">Resolution / Response</label>
                <textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  rows={3}
                  placeholder="Describe the resolution or action taken..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleResolve(selected.id, 'IN_PROGRESS')} disabled={resolving}>Mark In Progress</Button>
                <Button onClick={() => handleResolve(selected.id, 'RESOLVED')} disabled={resolving}>
                  <CheckCircle2 size={14} className="mr-1.5" />
                  {resolving ? 'Saving...' : 'Mark Resolved'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header mb-0">
        <div className="page-header-icon bg-red-500/10 text-red-600"><Bug size={22} /></div>
        <div className="flex-1">
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">All submitted issue reports and feature requests from staff.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTickets}><RefreshCw size={14} className="mr-1.5" /> Refresh</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
          <div key={s} className="kpi-card text-center">
            <p className="kpi-label mb-1">{s.replace('_', ' ')}</p>
            <p className="text-2xl font-extrabold text-foreground">{tickets.filter(t => t.status === s).length}</p>
          </div>
        ))}
      </div>

      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary/5">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="data-table-cell text-left">Type</th>
                <th className="data-table-cell text-left">Title</th>
                <th className="data-table-cell text-left">From</th>
                <th className="data-table-cell text-left">Priority</th>
                <th className="data-table-cell text-left">Status</th>
                <th className="data-table-cell text-left">Date</th>
                <th className="data-table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="data-table-cell"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
              )) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No tickets found.</td></tr>
              ) : tickets.map(t => {
                const Icon = TYPE_ICONS[t.type] || AlertTriangle;
                return (
                  <tr key={t.id} className="data-table-row">
                    <td className="data-table-cell"><Icon size={16} className="text-muted-foreground" /></td>
                    <td className="data-table-cell">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{t.title}</p>
                      {t.resolution && <p className="text-xs text-emerald-600 mt-0.5 truncate max-w-[200px]">✓ {t.resolution}</p>}
                    </td>
                    <td className="data-table-cell">
                      <p className="text-xs font-medium text-foreground">{t.submitter?.firstName} {t.submitter?.lastName}</p>
                    </td>
                    <td className="data-table-cell"><span className={`badge ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span></td>
                    <td className="data-table-cell"><span className={`badge ${STATUS_STYLES[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                    <td className="data-table-cell text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="data-table-cell text-right">
                      <div className="flex justify-end gap-2">
                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelected(t); setResolution(t.resolution || ''); }}>
                            Review
                          </Button>
                        )}
                        {['SUPER_ADMIN', 'OWNER'].includes(user?.role) && (
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
