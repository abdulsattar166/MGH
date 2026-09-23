import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from "@/lib/notifications";

export function useNotifications(pollMs = 20000) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      if (!mounted.current) return;
      setItems(list);
      setUnread(count);
    } catch {
      // silent — notifications must never break the page
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = window.setInterval(() => void refresh(), pollMs);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [refresh, pollMs]);

  const markRead = useCallback(
    async (id: number) => {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteNotification(id);
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.isRead) setUnread((u) => Math.max(0, u - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  return { items, unread, loading, refresh, markRead, markAllRead, remove };
}