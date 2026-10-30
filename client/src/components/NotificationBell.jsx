import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../utils/formatters';
import EmptyState from './ui/EmptyState';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen((v) => !v);
    if (!isOpen) fetchNotifications();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800 focus-ring"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-80 max-h-[26rem] overflow-y-auto rounded-3xl border border-ink-200 bg-white shadow-2xl z-40"
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up." />
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-sm ${n.isRead ? 'bg-white' : 'bg-brand-50/50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900 truncate">{n.title}</p>
                        <p className="text-ink-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-ink-400 text-[11px] mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-emerald-600"
                            aria-label="Mark read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-rose-600"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
