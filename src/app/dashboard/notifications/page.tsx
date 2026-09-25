'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

export default function NotificationCenterPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=20&filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data.notifications);
        setPages(data.data.pages);
        setTotal(data.data.total);
      } else {
        setError(data.error || 'Failed to load notifications');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
    setItems((prev) =>
      prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await fetch(`/api/notifications/read-all`, { method: 'PATCH' });
    fetchNotifications();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your alerts and updates</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/settings/notifications" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
            Preferences ⚙️
          </Link>
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline font-medium">
            Mark all as read
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f as 'all' | 'unread' | 'read'); setPage(1); }}
              className={`flex-1 py-3 text-sm font-medium capitalize ${filter === f ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-gray-900 font-medium text-lg">You&apos;re all caught up.</p>
              <p className="text-gray-500 mt-1">No {filter !== 'all' ? filter : ''} notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((n) => (
                <div key={n.notificationId} className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    <span className={`w-3 h-3 rounded-full inline-block ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <h3 className={`text-base truncate ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{n.message}</p>
                    
                    <div className="flex items-center gap-3">
                      {n.actionUrl && (
                        <Link href={n.actionUrl} onClick={() => { if (!n.isRead) markAsRead(n.notificationId); }} className="text-xs font-semibold text-blue-600 hover:underline border border-blue-200 bg-white px-3 py-1 rounded shadow-sm">
                          View Details
                        </Link>
                      )}
                      {n.priority !== 'NORMAL' && n.priority !== 'LOW' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(n.priority)}`}>
                          {n.priority}
                        </span>
                      )}
                      {!n.isRead && (
                        <button onClick={() => markAsRead(n.notificationId)} className="text-xs text-gray-500 hover:text-gray-800 underline ml-auto">
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="border-t p-4 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-gray-500">Total: {total}</span>
            <div className="flex gap-2 items-center">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Prev</button>
              <span className="text-gray-700">Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
