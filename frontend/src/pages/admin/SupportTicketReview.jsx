import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Bug, Lightbulb, Database, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
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

export default function SupportTicketReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          const t = json.data.find(t => t.id === id);
          if (t) {
            setTicket(t);
            setResolution(t.resolution || '');
          } else {
            toast.error('Ticket not found');
            navigate('/dashboard/tickets');
          }
        }
      } catch {
        toast.error('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, token, navigate]);

  const handleResolve = async (status) => {
    setResolving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, resolution })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
        navigate('/dashboard/tickets');
      } else {
        toast.error(json.message || 'Failed to update ticket');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-1/3 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-card border border-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!ticket) return null;

  const Icon = TYPE_ICONS[ticket.type] || AlertTriangle;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/tickets')}
          className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Ticket Review
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">ID: {ticket.id}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{ticket.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted by <span className="font-semibold text-foreground">{ticket.submitter?.firstName} {ticket.submitter?.lastName}</span> on {new Date(ticket.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${PRIORITY_STYLES[ticket.priority]}`}>{ticket.priority}</span>
              <span className={`badge ${STATUS_STYLES[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
            <p className="text-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resolution / Response</h3>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={5}
              disabled={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'}
              placeholder="Describe the resolution, workaround, or answer..."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
            />
          </div>

          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => handleResolve('IN_PROGRESS')}
                disabled={resolving}
              >
                <Save size={16} className="mr-2" /> Mark In Progress
              </Button>
              <Button
                onClick={() => handleResolve('RESOLVED')}
                disabled={resolving}
              >
                <CheckCircle2 size={16} className="mr-2" /> Resolve Ticket
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
