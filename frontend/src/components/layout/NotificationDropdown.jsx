import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, Check, CheckCheck, ExternalLink, ShoppingCart, IndianRupee,
  Clock, AlertTriangle, UserCheck, Package, QrCode, CreditCard,
  Banknote, Award, Timer, CalendarDays, Shield, MessageSquare,
  Inbox, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── Smart routing: parse notification message → deduce destination ─────────────
function resolveNotifLink(message = '', userRole = '') {
  const msg = message.toLowerCase();
  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(userRole);
  const isEmployee = ['SALES', 'MARKETING', 'DIGITAL_MARKETING', 'INVENTORY_MANAGER'].includes(userRole);

  // Orders
  if (msg.includes('upi payment submitted') || msg.includes('utr') || msg.includes('verify and approve'))
    return isAdmin ? '/dashboard/orders' : null;
  if (msg.includes('order') && (msg.includes('placed') || msg.includes('created') || msg.includes('requested')))
    return '/dashboard/orders';
  if (msg.includes('order') && (msg.includes('dispatched') || msg.includes('delivered') || msg.includes('processing') || msg.includes('packaged')))
    return '/dashboard/orders';
  if (msg.includes('order') && msg.includes('cancelled'))
    return '/dashboard/orders';
  if (msg.includes('cod') && (msg.includes('verify') || msg.includes('confirm')))
    return isAdmin ? '/dashboard/orders' : null;
  if (msg.includes('payment') && (msg.includes('verified') || msg.includes('approved') || msg.includes('rejected')))
    return '/dashboard/orders';

  // Payroll & Salary
  if (msg.includes('salary') && (msg.includes('paid') || msg.includes('generated') || msg.includes('payslip')))
    return isEmployee ? '/dashboard/my-payroll' : isAdmin ? '/dashboard/payroll' : '/dashboard/payroll';
  if (msg.includes('payroll'))
    return isAdmin ? '/dashboard/payroll' : '/dashboard/my-payroll';

  // Overtime
  if (msg.includes('overtime'))
    return isAdmin ? '/dashboard/hr#overtime' : '/dashboard/me';

  // Incentive
  if (msg.includes('incentive') || msg.includes('commission') || msg.includes('bonus'))
    return isAdmin ? '/dashboard/hr#incentives' : '/dashboard/my-payroll';

  // Leave
  if (msg.includes('leave') && (msg.includes('approved') || msg.includes('rejected') || msg.includes('pending')))
    return isAdmin ? '/dashboard/hr#leaves' : '/dashboard/me';

  // Warning / Disciplinary
  if (msg.includes('warning') || msg.includes('[warning from hr]'))
    return isAdmin ? '/dashboard/hr#warnings' : '/dashboard/me';

  // Tasks
  if (msg.includes('task') && (msg.includes('assigned') || msg.includes('due') || msg.includes('completed')))
    return '/dashboard/tasks';

  // Finance / Ledger
  if (msg.includes('ledger') || msg.includes('finance') || msg.includes('transaction'))
    return isAdmin ? '/dashboard/finance' : null;

  // HR / Employee
  if (msg.includes('employee') && (msg.includes('terminated') || msg.includes('suspended') || msg.includes('reinstated')))
    return isAdmin ? '/dashboard/hr' : null;

  // Support / Tickets
  if (msg.includes('ticket') || msg.includes('support') || msg.includes('issue'))
    return isAdmin ? '/dashboard/tickets' : '/dashboard/support';

  // Inventory / Stock
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('low quantity'))
    return '/dashboard/inventory';

  // Default
  return '/dashboard/notifications';
}

// ── Pick an icon & color for each notification type ───────────────────────────
function getNotifMeta(message = '') {
  const msg = message.toLowerCase();

  if (msg.includes('upi') || msg.includes('qr') || msg.includes('utr'))
    return { icon: QrCode, color: 'bg-violet-500', ring: 'ring-violet-200 dark:ring-violet-800' };
  if (msg.includes('order') || msg.includes('dispatched') || msg.includes('delivered'))
    return { icon: ShoppingCart, color: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800' };
  if (msg.includes('salary') || msg.includes('payroll') || msg.includes('paid') || msg.includes('payslip'))
    return { icon: IndianRupee, color: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800' };
  if (msg.includes('overtime'))
    return { icon: Timer, color: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800' };
  if (msg.includes('incentive') || msg.includes('commission') || msg.includes('bonus'))
    return { icon: Award, color: 'bg-pink-500', ring: 'ring-pink-200 dark:ring-pink-800' };
  if (msg.includes('leave'))
    return { icon: CalendarDays, color: 'bg-teal-500', ring: 'ring-teal-200 dark:ring-teal-800' };
  if (msg.includes('warning') || msg.includes('terminated') || msg.includes('suspended'))
    return { icon: AlertTriangle, color: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800' };
  if (msg.includes('task'))
    return { icon: CheckCheck, color: 'bg-indigo-500', ring: 'ring-indigo-200 dark:ring-indigo-800' };
  if (msg.includes('ticket') || msg.includes('support'))
    return { icon: MessageSquare, color: 'bg-cyan-500', ring: 'ring-cyan-200 dark:ring-cyan-800' };
  if (msg.includes('stock') || msg.includes('inventory'))
    return { icon: Package, color: 'bg-orange-500', ring: 'ring-orange-200 dark:ring-orange-800' };
  if (msg.includes('verified') || msg.includes('approved') || msg.includes('reinstated'))
    return { icon: UserCheck, color: 'bg-green-500', ring: 'ring-green-200 dark:ring-green-800' };
  if (msg.includes('payment') || msg.includes('cod'))
    return { icon: CreditCard, color: 'bg-purple-500', ring: 'ring-purple-200 dark:ring-purple-800' };

  return { icon: Bell, color: 'bg-slate-400', ring: 'ring-slate-200 dark:ring-slate-700' };
}

// ── Relative time helper ───────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function NotificationDropdown() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications.slice(0, 8));
        setUnreadCount(data.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Auto-refresh every 30s when dropdown is open
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(fetchNotifications, 30000);
    return () => clearInterval(t);
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { fetchNotifications(); toast.success('All marked as read'); }
    } catch { toast.error('Failed'); }
  };

  const markAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Failed'); }
  };

  const handleNotifClick = async (notif) => {
    // Mark as read first
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    // Navigate to relevant page
    const link = resolveNotifLink(notif.message, user?.role);
    if (link) {
      setIsOpen(false);
      navigate(link);
    }
  };

  const displayed = tab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className={`transition-all duration-300 ${isOpen ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute -right-2 sm:right-0 mt-3 w-[340px] sm:w-[420px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/40 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-border bg-linear-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bell size={15} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">Notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-3">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tab === t.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      tab === t.key ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="py-14 px-6 text-center">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Inbox size={22} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tab === 'unread' ? "You're all caught up! 🎉" : "Activity will appear here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {displayed.map((notif) => {
                  const { icon: Icon, color, ring } = getNotifMeta(notif.message);
                  const link = resolveNotifLink(notif.message, user?.role);
                  const isClickable = !!link;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`group relative flex items-start gap-3.5 px-5 py-4 transition-all duration-200 ${
                        isClickable ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        !notif.isRead
                          ? 'bg-primary/4 dark:bg-primary/8 hover:bg-primary/8 dark:hover:bg-primary/12'
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      {/* Unread stripe */}
                      {!notif.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl ${color} ring-2 ${ring} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon size={15} className="text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${
                          !notif.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {relativeTime(notif.createdAt)}
                          </p>
                          {isClickable && (
                            <span className="text-[10px] text-primary/70 font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              <ChevronRight size={10} /> View
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mark read button */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {!notif.isRead ? (
                          <button
                            onClick={(e) => markAsRead(notif.id, e)}
                            className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Mark as read"
                          >
                            <Check size={11} />
                          </button>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-transparent" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {notifications.length > 0
                ? `Showing ${displayed.length} of latest`
                : 'No activity yet'}
            </p>
            <button
              onClick={() => { setIsOpen(false); navigate('/dashboard/notifications'); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              View all
              <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
