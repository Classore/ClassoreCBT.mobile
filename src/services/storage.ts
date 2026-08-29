import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: async <T>(key: string, defaultValue: T | null = null): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value) as T;
      }
    } catch (e) {
      console.warn(`[Storage] Failed to read key "${key}":`, e);
    }
    return defaultValue;
  },

  set: async <T>(key: string, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[Storage] Failed to set key "${key}":`, e);
      return false;
    }
  },

  remove: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[Storage] Failed to remove key "${key}":`, e);
      return false;
    }
  },
};
