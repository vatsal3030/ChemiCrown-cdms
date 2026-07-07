import { useState, useEffect } from 'react';
import {
  Bell, Check, CheckCheck, Trash2, ShoppingCart, IndianRupee,
  Clock, AlertTriangle, UserCheck, Package, QrCode, CreditCard,
  Award, Timer, CalendarDays, MessageSquare, Inbox,
  ChevronRight, RefreshCw, Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── Shared utility (same logic as dropdown) ────────────────────────────────────
function resolveNotifLink(message = '', userRole = '') {
  const msg = message.toLowerCase();
  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(userRole);
  const isEmployee = ['SALES', 'MARKETING', 'DIGITAL_MARKETING', 'INVENTORY_MANAGER'].includes(userRole);

  if (msg.includes('upi payment submitted') || msg.includes('utr') || msg.includes('verify and approve'))
    return isAdmin ? '/dashboard/orders' : null;
  if (msg.includes('order') && (msg.includes('placed') || msg.includes('created') || msg.includes('requested') || msg.includes('dispatched') || msg.includes('delivered') || msg.includes('processing') || msg.includes('packaged') || msg.includes('cancelled')))
    return '/dashboard/orders';
  if (msg.includes('payment') && (msg.includes('verified') || msg.includes('approved') || msg.includes('rejected')))
    return '/dashboard/orders';
  if (msg.includes('cod') && (msg.includes('verify') || msg.includes('confirm')))
    return isAdmin ? '/dashboard/orders' : null;
  if (msg.includes('salary') || msg.includes('payslip') || msg.includes('payroll'))
    return isEmployee ? '/dashboard/my-payroll' : isAdmin ? '/dashboard/payroll' : '/dashboard/payroll';
  if (msg.includes('overtime'))
    return isAdmin ? '/dashboard/hr#overtime' : '/dashboard/me';
  if (msg.includes('incentive') || msg.includes('commission') || msg.includes('bonus'))
    return isAdmin ? '/dashboard/hr#incentives' : '/dashboard/my-payroll';
  if (msg.includes('leave'))
    return isAdmin ? '/dashboard/hr#leaves' : '/dashboard/me';
  if (msg.includes('warning') || msg.includes('[warning from hr]'))
    return isAdmin ? '/dashboard/hr#warnings' : '/dashboard/me';
  if (msg.includes('task'))
    return '/dashboard/tasks';
  if (msg.includes('ledger') || msg.includes('finance') || msg.includes('transaction'))
    return isAdmin ? '/dashboard/finance' : null;
  if (msg.includes('employee') && (msg.includes('terminated') || msg.includes('suspended') || msg.includes('reinstated')))
    return isAdmin ? '/dashboard/hr' : null;
  if (msg.includes('ticket') || msg.includes('support') || msg.includes('issue'))
    return isAdmin ? '/dashboard/tickets' : '/dashboard/support';
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('low quantity'))
    return '/dashboard/inventory';
  return null;
}

function getNotifMeta(message = '') {
  const msg = message.toLowerCase();
  if (msg.includes('upi') || msg.includes('qr') || msg.includes('utr'))
    return { icon: QrCode, color: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', label: 'UPI Payment' };
  if (msg.includes('order') || msg.includes('dispatched') || msg.includes('delivered'))
    return { icon: ShoppingCart, color: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', label: 'Order' };
  if (msg.includes('salary') || msg.includes('payroll') || msg.includes('paid') || msg.includes('payslip'))
    return { icon: IndianRupee, color: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Payroll' };
  if (msg.includes('overtime'))
    return { icon: Timer, color: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', label: 'Overtime' };
  if (msg.includes('incentive') || msg.includes('commission') || msg.includes('bonus'))
    return { icon: Award, color: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', label: 'Incentive' };
  if (msg.includes('leave'))
    return { icon: CalendarDays, color: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400', label: 'Leave' };
  if (msg.includes('warning') || msg.includes('terminated') || msg.includes('suspended'))
    return { icon: AlertTriangle, color: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', label: 'HR Alert' };
  if (msg.includes('task'))
    return { icon: CheckCheck, color: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', label: 'Task' };
  if (msg.includes('ticket') || msg.includes('support'))
    return { icon: MessageSquare, color: 'bg-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', label: 'Support' };
  if (msg.includes('stock') || msg.includes('inventory'))
    return { icon: Package, color: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', label: 'Inventory' };
  if (msg.includes('verified') || msg.includes('approved') || msg.includes('reinstated'))
    return { icon: UserCheck, color: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', label: 'Approved' };
  if (msg.includes('payment') || msg.includes('cod'))
    return { icon: CreditCard, color: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', label: 'Payment' };
  return { icon: Bell, color: 'bg-slate-400', light: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500', label: 'System' };
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Notifications() {
  const { token, user } = useAuth();
  const { confirm } = useDialog();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [token]);

  const markAllAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
  };

  const markAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Failed'); }
  };

  const deleteNotification = async (id, e) => {
    e?.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
    } catch { toast.error('Failed'); fetchNotifications(); }
  };

  const deleteAllNotifications = async () => {
    const confirmed = await confirm('Delete All Notifications', 'Are you sure you want to delete ALL notifications? This cannot be undone.', { type: 'danger' });
    if (!confirmed) return;
    try {
      setNotifications([]);
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/all`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('All notifications cleared');
    } catch { toast.error('Failed'); fetchNotifications(); }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) await markAsRead(notif.id);
    const link = resolveNotifLink(notif.message, user?.role);
    if (link) navigate(link);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  // Group by date
  const groups = filtered.reduce((acc, n) => {
    const d = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread · ` : ''}{notifications.length} total
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={fetchNotifications} className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors">
            <RefreshCw size={14} />
          </button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead} variant="outline">
              <CheckCheck size={14} className="mr-1.5" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteAllNotifications}>
              <Trash2 size={14} className="mr-1.5" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'read', label: 'Read', count: notifications.length - unreadCount },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-bold ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-4 px-6 py-5 border-b border-border animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Inbox size={28} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'All caught up!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'unread' ? "You're all caught up! 🎉" : "Nothing here yet"}
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-1">
              {/* Date group label */}
              <div className="flex flex-wrap items-center gap-3 px-1 mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{dateLabel}</p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {items.map((notif, idx) => {
                  const { icon: Icon, color, light, text, label } = getNotifMeta(notif.message);
                  const link = resolveNotifLink(notif.message, user?.role);
                  const isClickable = !!link;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`group relative flex items-start gap-4 px-6 py-4 transition-all duration-150 ${
                        idx > 0 ? 'border-t border-border/50' : ''
                      } ${
                        isClickable ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        !notif.isRead
                          ? 'bg-primary/[0.035] dark:bg-primary/[0.07] hover:bg-primary/[0.07]'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Left unread stripe */}
                      {!notif.isRead && (
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon size={17} className="text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {/* Type label */}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${light} ${text}`}>
                              {label}
                            </span>
                            <p className={`text-sm leading-snug ${
                              !notif.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notif.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              <p className="text-xs text-muted-foreground">{relativeTime(notif.createdAt)}</p>
                              <p className="text-xs text-muted-foreground/60">
                                {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {isClickable && (
                                <span className={`text-[10px] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${text}`}>
                                  <ChevronRight size={10} /> Go to page
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.isRead && (
                              <button
                                onClick={(e) => markAsRead(notif.id, e)}
                                title="Mark as read"
                                className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all"
                              >
                                <Check size={13} />
                              </button>
                            )}
                            <button
                              onClick={(e) => deleteNotification(notif.id, e)}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
