import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, User, Briefcase, MessageSquare, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

export default function Notifications() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications/${user?.uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'connection': return <User size={18} className="text-blue-500" />;
      case 'job': return <Briefcase size={18} className="text-emerald-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      case 'like': return <Heart size={18} className="text-red-500" />;
      default: return <Bell size={18} className="text-neutral-500" />;
    }
  };

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-8 max-w-2xl mx-auto pb-24 transition-colors duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Notifications</h2>
          <p className="text-neutral-500 text-sm font-medium">Stay updated with your professional network</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1"
          >
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className={`h-24 rounded-3xl animate-pulse ${theme === 'dark' ? 'glass' : 'bg-neutral-100'}`} />
          ))
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-[32px] flex gap-4 relative group transition-all border ${
                  theme === 'dark' 
                    ? `glass ${!n.is_read ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'}` 
                    : `bg-white ${!n.is_read ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-neutral-200 shadow-sm'}`
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  theme === 'dark' ? (!n.is_read ? 'bg-emerald-500/20' : 'bg-white/5') : (!n.is_read ? 'bg-emerald-100' : 'bg-neutral-100')
                }`}>
                  {getIcon(n.type)}
                </div>
                
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-black text-sm ${
                      theme === 'dark' ? (!n.is_read ? 'text-white' : 'text-neutral-300') : (!n.is_read ? 'text-neutral-900' : 'text-neutral-700')
                    }`}>{n.title}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                      <Clock size={10} />
                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{n.message}</p>
                </div>

                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="absolute top-4 right-4 p-1 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Check size={18} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className={`text-center py-16 rounded-[40px] border border-dashed ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <Bell size={64} className="mx-auto text-neutral-700 mb-6 opacity-20" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No notifications yet. You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
