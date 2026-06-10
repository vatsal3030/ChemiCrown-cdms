import { useState, useEffect, useMemo } from 'react';
import { Bug, Lightbulb, Database, AlertTriangle, CheckCircle2, Clock, RefreshCw, X, ChevronDown, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const navigate = useNavigate();

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

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = searchTerm === '' || 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.submitter?.firstName && t.submitter.firstName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchSearch && matchType && matchStatus && matchPriority;
    });
  }, [tickets, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const hasFilters = searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL';
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">


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

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            className="w-full pl-9 h-9 text-sm" 
            placeholder="Search tickets by title or user..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={typeFilter} 
          onChange={e => setTypeFilter(e.target.value)}
          className="w-full md:w-36 h-9 text-sm bg-background border border-input rounded-md px-3"
        >
          <option value="ALL">All Types</option>
          {Object.keys(TYPE_ICONS).map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
        </select>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full md:w-36 h-9 text-sm bg-background border border-input rounded-md px-3"
        >
          <option value="ALL">All Statuses</option>
          {Object.keys(STATUS_STYLES).map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
        </select>
        <select 
          value={priorityFilter} 
          onChange={e => setPriorityFilter(e.target.value)}
          className="w-full md:w-36 h-9 text-sm bg-background border border-input rounded-md px-3"
        >
          <option value="ALL">All Priorities</option>
          {Object.keys(PRIORITY_STYLES).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="w-full md:w-auto h-9 text-muted-foreground">
            <X size={14} className="mr-1" /> Clear
          </Button>
        )}
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
              )) : filteredTickets.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No tickets found matching filters.</td></tr>
              ) : filteredTickets.map(t => {
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
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/dashboard/tickets/${t.id}`)}>
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
