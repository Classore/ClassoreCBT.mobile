import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const REGISTERED_PUSH_TOKEN_KEY = '@classore_registered_push_token';

// Setup foreground notification handler
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Register this device for Expo push notifications and send token to the backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Web push through expo-notifications is not supported
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // 1. Android channel configuration (Required on Android 8.0+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Classore Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C47C6',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 2. Check and request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted.');
      return null;
    }

    // 3. Resolve EAS Project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '3f681f03-eeef-482a-98d4-3c3bcded99da';

    if (!projectId) {
      console.warn('EAS Project ID not found for push notifications.');
      return null;
    }

    // 4. Get Expo Push Token
    const pushTokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = pushTokenResponse?.data;

    if (!token) {
      console.warn('Could not acquire Expo push token.');
      return null;
    }

    console.log('Expo Push Token acquired:', token);

    // 5. Send to backend if new or changed
    const lastSavedToken = await AsyncStorage.getItem(REGISTERED_PUSH_TOKEN_KEY);
    if (lastSavedToken !== token) {
      try {
        await api.post('/api/user/device-tokens/', {
          token,
          platform: Platform.OS,
        });
        await AsyncStorage.setItem(REGISTERED_PUSH_TOKEN_KEY, token);
        console.log('Device token successfully registered with backend.');
      } catch (err) {
        console.error('Failed to register device token with backend:', err);
      }
    }

    return token;
  } catch (error) {
    console.error('Error during push notification registration:', error);
    return null;
  }
}

/**
 * Deactivate or unregister token on backend when user logs out.
 */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(REGISTERED_PUSH_TOKEN_KEY);
    if (token) {
      await api.delete('/api/user/device-tokens/', {
        data: { token },
      });
      await AsyncStorage.removeItem(REGISTERED_PUSH_TOKEN_KEY);
      console.log('Device token unregistered from backend.');
    }
  } catch (err) {
    console.warn('Error unregistering device token:', err);
  }
}
