import { api } from './api';

export interface NotificationItem {
  id: string;
  notification_type: 'test' | 'achievement' | 'streak' | 'contest' | 'token' | 'ai' | 'system';
  title: string;
  message: string;
  is_unread: boolean;
  created_at: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await api.get('/api/user/notifications/');
    return response.data.results ? response.data.results : response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/user/notifications/mark-read/');
    return response.data;
  }
};
