import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationItem } from '@/services/notification';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  hasUnread: boolean;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => n.is_unread).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_unread: false })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, is_unread: false } : n));
        setUnreadCount(next.filter((n) => n.is_unread).length);
        return next;
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [token, refreshNotifications]);

  const hasUnread = unreadCount > 0;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        loading,
        refreshNotifications,
        markAllAsRead,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      hasUnread: false,
      loading: false,
      refreshNotifications: async () => {},
      markAllAsRead: async () => {},
      markAsRead: async () => {},
    };
  }
  return context;
}
