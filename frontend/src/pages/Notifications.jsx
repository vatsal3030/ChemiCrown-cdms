import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const markAllAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
      fetchNotifications();
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) return;
    try {
      setNotifications([]);
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('All notifications deleted');
    } catch {
      toast.error('Failed to delete all notifications');
      fetchNotifications();
    }
  };

  const generateTestNotification = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
      toast.success('Test notification created! Check the bell icon.');
      
      // Dispatch a custom event to force the dropdown to reload
      // This is a quick workaround since they don't share state context currently
      window.dispatchEvent(new Event('new_notification'));
    } catch {
      toast.error('Failed to generate test notification');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="page-header mb-0">
          <div className="page-header-icon bg-primary/10 text-primary">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Manage your alerts and system updates.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateTestNotification}>Test</Button>
          {notifications.some(n => !n.isRead) && (
            <Button size="sm" onClick={markAllAsRead}>
              <Check size={14} className="mr-1.5" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteAllNotifications}>
              <Trash2 size={14} className="mr-1.5" /> Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="data-table-wrapper">
        {loading ? (
          <div className="p-10 text-center">
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded-lg w-3/4" />
                    <div className="h-3 bg-muted rounded-lg w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 text-muted-foreground/40">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground text-sm mt-1">No notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div key={notif.id} className={`px-6 py-4 flex items-start sm:items-center justify-between gap-4 transition-colors hover:bg-muted/30 ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notif.isRead && (
                    <button onClick={() => markAsRead(notif.id)} className="text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      Mark read
                    </button>
                  )}
                  <button onClick={() => deleteNotification(notif.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
