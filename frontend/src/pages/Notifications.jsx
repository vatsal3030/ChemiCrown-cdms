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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-slate-500 mt-1">Manage your alerts and system updates.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={generateTestNotification}>Test Notification</Button>
          {notifications.some(n => !n.isRead) && (
            <Button variant="default" onClick={markAllAsRead}>Mark all read</Button>
          )}
          {notifications.length > 0 && (
            <Button variant="destructive" onClick={deleteAllNotifications}>
              <Trash2 size={16} className="mr-2" /> Delete All
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">All caught up!</h3>
            <p className="text-slate-500 mt-1">You don't have any notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-6 flex items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!notif.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <div>
                    <p className={`text-base ${!notif.isRead ? 'font-semibold text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300'}`}>
                      {notif.message}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!notif.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)} className="text-primary hover:text-primary hover:bg-primary/10">
                      <Check size={16} className="mr-2" /> Mark Read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteNotification(notif.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
