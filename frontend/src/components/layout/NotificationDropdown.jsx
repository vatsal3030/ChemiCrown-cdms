import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationDropdown() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications.slice(0, 5)); // Just top 5 for dropdown
        setUnreadCount(data.notifications.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={24} className="text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              Notifications 
              {unreadCount > 0 && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:underline font-medium">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                You have no notifications.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-3 ${!notif.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-medium text-slate-900 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="text-slate-400 hover:text-primary transition-colors shrink-0">
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Link 
              to="/dashboard/notifications" 
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              View all notifications <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
