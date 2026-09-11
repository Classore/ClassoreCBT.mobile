import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Service to pre-download and cache audio clips & heavy images to local disk.
 * Prevents playback stuttering, network buffering delays, and bandwidth waste.
 */
export const mediaCache = {
  /**
   * Returns a local file:// URI for a given remote media URL.
   * If already downloaded, returns the cached file path immediately.
   */
  getCachedAudioUri: async (remoteUrl: string): Promise<string> => {
    if (!remoteUrl || typeof remoteUrl !== 'string') {
      return remoteUrl;
    }

    // On Web or for local assets / file URIs, return as is
    if (Platform.OS === 'web' || remoteUrl.startsWith('file://') || remoteUrl.startsWith('data:')) {
      return remoteUrl;
    }

    try {
      // Create a deterministic filename based on URL hash/name
      const cleanUrl = remoteUrl.split('?')[0];
      const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1) || `audio_${Date.now()}.mp3`;
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!docDir) return remoteUrl;

      const localUri = `${docDir}cached_${filename}`;

      // Check if file already exists on disk
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        return localUri;
      }

      // Download file to disk
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
      if (downloadResult && downloadResult.status === 200) {
        return downloadResult.uri;
      }
      return remoteUrl;
    } catch (error) {
      console.warn('[mediaCache] Failed to download media, falling back to remote URL:', error);
      return remoteUrl;
    }
  },

  /**
   * Pre-downloads an array of remote audio URLs concurrently.
   */
  prefetchAudioList: async (urls: string[]): Promise<string[]> => {
    if (!urls || urls.length === 0) return [];
    try {
      const results = await Promise.allSettled(urls.map(url => mediaCache.getCachedAudioUri(url)));
      return results.map((res, idx) => (res.status === 'fulfilled' ? res.value : urls[idx]));
    } catch (e) {
      console.warn('[mediaCache] Prefetch list error:', e);
      return urls;
    }
  },
};
