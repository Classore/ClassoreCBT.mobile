import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import type * as NotificationsType from 'expo-notifications';

export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Dynamically require expo-notifications on native platforms only
    let Notifications: typeof NotificationsType;
    try {
      Notifications = require('expo-notifications');
    } catch {
      return;
    }

    function handleRedirect(notification: NotificationsType.Notification) {
      const url = notification?.request?.content?.data?.url;
      if (typeof url === 'string' && url.length > 0) {
        try {
          router.push(url as any);
        } catch (e) {
          console.warn('Failed to navigate from notification:', e);
        }
      }
    }

    // Check if app was opened via a notification response
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        handleRedirect(response.notification);
      }
    });

    // Listen for incoming taps on notifications while app is in background or foreground
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response?.notification) {
        handleRedirect(response.notification);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);
}
