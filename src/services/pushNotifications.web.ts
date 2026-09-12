/**
 * Web stub for pushNotifications service.
 * Push notifications through expo-notifications are not supported on web in this setup.
 */

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null;
}

export async function unregisterPushNotificationsAsync(): Promise<void> {
  // No-op on web
}
