import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
  id: string;
  notification_type: 'test' | 'achievement' | 'streak' | 'contest' | 'token' | 'ai' | 'system';
  title: string;
  message: string;
  is_unread: boolean;
  created_at: string;
  attempt_id?: string | number;
  data?: Record<string, any>;
  reference_id?: string | number;
  target_id?: string | number;
  action_url?: string;
}

const READ_NOTIFICATIONS_KEY = '@classore_read_notification_ids';
const CACHED_NOTIFICATIONS_KEY = '@classore_cached_notifications';

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    let rawItems: NotificationItem[] = [];
    try {
      const response = await api.get('/api/user/notifications/');
      const data = response.data?.results ? response.data.results : response.data;
      if (Array.isArray(data)) {
        rawItems = data;
        await AsyncStorage.setItem(CACHED_NOTIFICATIONS_KEY, JSON.stringify(data));
      }
    } catch {
      // Fallback to cache if offline
      try {
        const cached = await AsyncStorage.getItem(CACHED_NOTIFICATIONS_KEY);
        if (cached) rawItems = JSON.parse(cached);
      } catch {
        rawItems = [];
      }
    }

    // Apply local read IDs if any
    try {
      const readIdsStr = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
      const readIds: string[] = readIdsStr ? JSON.parse(readIdsStr) : [];
      if (readIds.length > 0) {
        const readSet = new Set(readIds);
        rawItems = rawItems.map((item) => ({
          ...item,
          is_unread: readSet.has(String(item.id)) ? false : item.is_unread,
        }));
      }
    } catch {
      // ignore
    }

    return rawItems;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    try {
      await api.post('/api/user/notifications/mark-read/');
    } catch {
      // ignore if offline / mock
    }

    try {
      const notifications = await notificationService.getNotifications();
      const allIds = notifications.map((n) => String(n.id));
      await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(allIds));
    } catch {
      // ignore
    }

    return { message: 'All marked as read' };
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await api.post(`/api/user/notifications/${id}/mark-read/`);
    } catch {
      // ignore
    }

    try {
      const readIdsStr = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
      const readIds: string[] = readIdsStr ? JSON.parse(readIdsStr) : [];
      if (!readIds.includes(String(id))) {
        readIds.push(String(id));
        await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readIds));
      }
    } catch {
      // ignore
    }
  },

  getUnreadCount: async (): Promise<number> => {
    const list = await notificationService.getNotifications();
    return list.filter((n) => n.is_unread).length;
  },
};
