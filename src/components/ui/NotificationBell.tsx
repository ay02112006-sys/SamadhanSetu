'use client';
// src/components/ui/NotificationBell.tsx
// Small client component mounted in the server Navbar.
// Fetches unread count on mount and on window focus. Shows a dropdown of recent notifications.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

type NotificationItem = {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setCount(data.count);
      }
    } catch {
      // silently ignore network errors for badge
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=5&filter=all');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setItems(data.data.notifications);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh on mount, on focus
  useEffect(() => {
    fetchCount();
    const onFocus = () => fetchCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) fetchRecent();
  };

  const markRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
    fetchCount();
  };

  const handleClick = (item: NotificationItem) => {
    if (!item.isRead) markRead(item.notificationId);
    setOpen(false);
    if (item.actionUrl) router.push(item.actionUrl);
  };

  const timeAgo = (date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const priorityDot = (priority: string): string => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      default: return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggle}
        className="relative text-gray-600 hover:text-gray-900 p-1"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      >
        {/* Bell SVG Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {count > 0 && (
              <button
                onClick={async () => {
                  await fetch('/api/notifications/read-all', { method: 'PATCH' });
                  fetchCount();
                  fetchRecent();
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <p className="mb-1">No notifications yet.</p>
                <p className="text-xs">You&apos;re all caught up!</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.notificationId}
                  onClick={() => handleClick(item)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex gap-2">
                    {priorityDot(item.priority) && (
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${priorityDot(item.priority)}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-sm truncate ${!item.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{item.title}</p>
                        {!item.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t bg-gray-50 text-center">
            <button
              onClick={() => { setOpen(false); router.push('/dashboard/notifications'); }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
