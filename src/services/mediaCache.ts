import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL } from './api';

/**
 * Resolves a media URL (relative path, local asset, or full remote URL) into a complete, playable URI string.
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const cleanBase = (BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  if (trimmed.startsWith('/')) {
    return `${cleanBase}${trimmed}`;
  }
  return `${cleanBase}/${trimmed}`;
};

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
    const resolvedUrl = resolveMediaUrl(remoteUrl);
    if (!resolvedUrl) {
      return '';
    }

    // On Web or for local assets / file URIs / data URIs, return resolved URL
    if (
      Platform.OS === 'web' ||
      resolvedUrl.startsWith('file://') ||
      resolvedUrl.startsWith('data:') ||
      resolvedUrl.startsWith('blob:')
    ) {
      return resolvedUrl;
    }

    try {
      // Create a deterministic filename based on URL hash/name
      const cleanUrl = resolvedUrl.split('?')[0];
      const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1) || `audio_${Date.now()}.mp3`;
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!docDir) return resolvedUrl;

      const localUri = `${docDir}cached_${filename}`;

      // Check if file already exists on disk
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        return localUri;
      }

      // Download file to disk
      const downloadResult = await FileSystem.downloadAsync(resolvedUrl, localUri);
      if (downloadResult && downloadResult.status === 200) {
        return downloadResult.uri;
      }
      return resolvedUrl;
    } catch (error) {
      console.warn('[mediaCache] Failed to download media, falling back to remote URL:', error);
      return resolvedUrl;
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
