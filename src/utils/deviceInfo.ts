import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'app_device_unique_id';

let cachedDeviceId: string | null = null;

/**
 * Returns or creates a persistent unique device UUID stored in SecureStore.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    if (Platform.OS !== 'web') {
      const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (storedId) {
        cachedDeviceId = storedId;
        return storedId;
      }
    }
  } catch (err) {
    console.warn('[deviceInfo] Error reading device ID from SecureStore:', err);
  }

  // Generate a new UUID-like identifier
  const newId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  cachedDeviceId = newId;

  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    }
  } catch (err) {
    console.warn('[deviceInfo] Error saving device ID to SecureStore:', err);
  }

  return newId;
}

export type DeviceCategory = 'phone' | 'tablet' | 'laptop' | 'desktop';

export interface DeviceSessionPayload {
  device_id: string;
  device_name: string;
  device_type: DeviceCategory;
  os: string;
}

/**
 * Gathers current device metadata using expo-device and Platform.
 */
export async function getCurrentDevicePayload(): Promise<DeviceSessionPayload> {
  const deviceId = await getOrCreateDeviceId();

  let deviceType: DeviceCategory = 'phone';
  if (Platform.OS === 'web') {
    deviceType = 'laptop';
  } else if (Device.deviceType === Device.DeviceType.TABLET) {
    deviceType = 'tablet';
  } else if (Device.deviceType === Device.DeviceType.DESKTOP) {
    deviceType = 'desktop';
  }

  const brand = Device.brand ? Device.brand.trim() : '';
  const model = Device.modelName || Device.deviceName || (Platform.OS === 'ios' ? 'iPhone' : 'Android Device');
  
  let deviceName = model;
  if (brand && !model.toLowerCase().includes(brand.toLowerCase())) {
    deviceName = `${brand} ${model}`;
  }

  if (Platform.OS === 'web') {
    deviceName = 'Browser / Web';
  }

  const osName = Device.osName || (Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web');
  const osVersion = Device.osVersion || Platform.Version || '';
  const os = `${osName} ${osVersion}`.trim();

  return {
    device_id: deviceId,
    device_name: deviceName,
    device_type: deviceType,
    os,
  };
}
