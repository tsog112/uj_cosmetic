'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/auth/clientFetch';
import { createInflightRunner } from '@/lib/client/inflight';
import type { NotificationRow } from '@/components/ui/NotificationSheet';

type NotificationContextValue = {
  notifications: NotificationRow[];
  unreadCount: number;
  hasUnread: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);
const runNotificationFetch = createInflightRunner<string>();

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    await runNotificationFetch(uid, async () => {
      setLoading(true);
      try {
        const response = await authFetch('/api/notifications');
        if (!response.ok) return;
        const data = await response.json();
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setUnreadCount(Number(data?.unreadCount || 0));
      } catch {
        // UI-г унагахгүй.
      } finally {
        setLoading(false);
      }
    });
  }, [uid]);

  const markRead = useCallback(async () => {
    if (!uid) return;
    try {
      await authFetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' })));
    } catch {
      // Алдааг үл тоомсорлоно.
    }
  }, [uid]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();

    let focusTimer: ReturnType<typeof setTimeout> | null = null;
    const onFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => void refresh(), 800);
    };
    window.addEventListener('focus', onFocus);
    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, [authLoading, refresh]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      hasUnread: unreadCount > 0,
      loading,
      refresh,
      markRead,
    }),
    [notifications, unreadCount, loading, refresh, markRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
