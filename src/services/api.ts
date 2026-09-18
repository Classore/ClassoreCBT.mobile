import axios, { AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000/';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

export const REMEMBER_CREDENTIALS_KEY = '@classore_remember_creds';

// Synchronous In-Memory Token Cache (0ms latency, eliminates KeyStore timeout/null glitches)
let inMemoryAuthToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const setAuthTokens = (token: string | null, refreshToken?: string | null) => {
  inMemoryAuthToken = token;
  if (refreshToken !== undefined) {
    inMemoryRefreshToken = refreshToken;
  }
};

export const getAuthToken = () => inMemoryAuthToken;
export const getRefreshToken = () => inMemoryRefreshToken;

export const clearAuthTokens = () => {
  inMemoryAuthToken = null;
  inMemoryRefreshToken = null;
};

// Smart Authorization header generator (handles both JWT SimpleJWT and DRF TokenAuthentication)
export const formatAuthHeader = (token: string): string => {
  if (!token) return '';
  const trimmed = token.trim();
  // JWT tokens start with 'eyJ' and consist of 3 dot-separated base64 parts
  if (trimmed.startsWith('eyJ') || trimmed.split('.').length === 3) {
    return `Bearer ${trimmed}`;
  }
  return `Token ${trimmed}`;
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type UnauthorizedCallback = () => void;
let unauthorizedListener: UnauthorizedCallback | null = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedListener = (listener: UnauthorizedCallback | null) => {
  unauthorizedListener = listener;
};

// Queue for pending requests while a token refresh is in flight
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Multi-Tier Storage Token Retrieval:
 * 1. Synchronous Memory Cache (fastest, immune to KeyStore drops)
 * 2. SecureStore (encrypted OS KeyStore/Keychain)
 * 3. AsyncStorage (persistent fallback in case of KeyStore corruption)
 */
export const getStoredTokenWithFallback = async (): Promise<string | null> => {
  if (inMemoryAuthToken) return inMemoryAuthToken;

  let token: string | null = null;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('auth_token');
  } else {
    try {
      token = await SecureStore.getItemAsync('auth_token');
    } catch (err) {
      console.warn('SecureStore.getItemAsync error, attempting AsyncStorage fallback:', err);
    }
    if (!token) {
      try {
        token = await AsyncStorage.getItem('auth_token');
      } catch (err) {
        console.warn('AsyncStorage.getItem error for auth_token:', err);
      }
    }
  }

  if (token) {
    inMemoryAuthToken = token;
  }
  return token;
};

export const getStoredRefreshTokenWithFallback = async (): Promise<string | null> => {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;

  let token: string | null = null;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('refresh_token');
  } else {
    try {
      token = await SecureStore.getItemAsync('refresh_token');
    } catch {
      // ignore
    }
    if (!token) {
      try {
        token = await AsyncStorage.getItem('refresh_token');
      } catch {
        // ignore
      }
    }
  }

  if (token) {
    inMemoryRefreshToken = token;
  }
  return token;
};

export const persistAuthTokens = async (accessToken: string, refreshToken?: string | null) => {
  setAuthTokens(accessToken, refreshToken);
  if (Platform.OS === 'web') {
    localStorage.setItem('auth_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
  } else {
    try {
      await SecureStore.setItemAsync('auth_token', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refresh_token', refreshToken);
    } catch (err) {
      console.warn('SecureStore save failed, persisting to AsyncStorage:', err);
    }
    await AsyncStorage.setItem('auth_token', accessToken);
    if (refreshToken) await AsyncStorage.setItem('refresh_token', refreshToken);
  }
};

export const purgeStoredAuthTokens = async () => {
  clearAuthTokens();
  if (Platform.OS === 'web') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  } else {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
  }
};

// Request Interceptor: Attach credentials reliably
api.interceptors.request.use(async (config) => {
  try {
    const publicEndpoints = [
      '/api/auth/register/',
      '/api/auth/login/',
      '/api/auth/verify-otp/',
      '/api/auth/resend-otp/',
      '/api/auth/forgot-password/',
      '/api/auth/reset-password/',
      '/api/admin/exams/',
      '/api/user/sections/',
      '/api/user/search/query/',
      '/api/user/contests/',
      '/api/wallet/preview/',
      '/api/user/demo-tests/'
    ];
    const isPublic = config.url && publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    // If Authorization header isn't explicitly set and we're not hitting a public endpoint
    if (!config.headers.Authorization) {
      const token = await getStoredTokenWithFallback();
      if (token) {
        config.headers.Authorization = formatAuthHeader(token);
      }
    }
  } catch (error) {
    console.error('Error fetching token for request in api.interceptors.request:', error);
  }
  return config;
});

// Response Interceptor: 401 handling, silent refresh, and exam submit protection
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as (AxiosRequestConfig & { _retry?: boolean });
    const status = error?.response?.status;
    const url = originalRequest?.url || '';

    // Ignore 401s on initial auth credential attempts
    const isAuthAttemptEndpoint =
      url.includes('/api/auth/login/') ||
      url.includes('/api/auth/register/') ||
      url.includes('/api/auth/verify-otp/') ||
      url.includes('/api/auth/forgot-password/') ||
      url.includes('/api/auth/reset-password/');

    const isExamSubmission = url.includes('/submit');

    if (status === 401 && !isAuthAttemptEndpoint && originalRequest) {
      // 1. If already retried once, do not loop
      if (originalRequest._retry) {
        if (!isExamSubmission && !isHandlingUnauthorized) {
          isHandlingUnauthorized = true;
          await purgeStoredAuthTokens();
          if (unauthorizedListener) unauthorizedListener();
          setTimeout(() => { isHandlingUnauthorized = false; }, 3000);
        }
        return Promise.reject(error);
      }

      // 2. If another refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = formatAuthHeader(newToken);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh via refresh_token if available
        const refreshToken = await getStoredRefreshTokenWithFallback();
        let newAccessToken: string | null = null;

        if (refreshToken) {
          try {
            const refreshRes = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
              refresh: refreshToken,
            });
            newAccessToken = refreshRes.data?.access || refreshRes.data?.token || null;
            if (newAccessToken) {
              await persistAuthTokens(newAccessToken, refreshRes.data?.refresh || refreshToken);
            }
          } catch (refreshErr) {
            console.warn('Token refresh endpoint failed:', refreshErr);
          }
        }

        // Fallback: If no refresh token or refresh failed, check if remembered credentials exist
        if (!newAccessToken) {
          let rememberedRaw: string | null = null;
          try {
            rememberedRaw = await SecureStore.getItemAsync(REMEMBER_CREDENTIALS_KEY);
            if (!rememberedRaw) {
              rememberedRaw = await AsyncStorage.getItem(REMEMBER_CREDENTIALS_KEY);
            }
          } catch {
            // ignore
          }

          if (rememberedRaw) {
            try {
              const { email, password } = JSON.parse(rememberedRaw);
              if (email && password) {
                const loginRes = await axios.post(`${BASE_URL}/api/auth/login/`, {
                  username: email,
                  password: password,
                });
                newAccessToken = loginRes.data?.token || loginRes.data?.access || loginRes.data?.key || null;
                if (newAccessToken) {
                  await persistAuthTokens(newAccessToken, loginRes.data?.refresh || null);
                }
              }
            } catch (reLoginErr) {
              console.warn('Silent re-login with remembered credentials failed:', reLoginErr);
            }
          }
        }

        // If we acquired a new valid token, replay queued and current requests
        if (newAccessToken) {
          processQueue(null, newAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = formatAuthHeader(newAccessToken);
          return api(originalRequest);
        } else {
          // Refresh failed
          processQueue(error, null);

          // For exam submissions, DO NOT immediately clear tokens or force logout.
          // Let the exam screen catch the error so it can offer in-place re-authentication without wiping responses!
          if (!isExamSubmission) {
            if (!isHandlingUnauthorized) {
              isHandlingUnauthorized = true;
              console.warn('Received 401 Unauthorized and recovery failed. Cleaning up session...');
              await purgeStoredAuthTokens();
              if (unauthorizedListener) {
                unauthorizedListener();
              }
              setTimeout(() => {
                isHandlingUnauthorized = false;
              }, 3000);
            }
          }

          return Promise.reject(error);
        }
      } catch (recoveryErr) {
        processQueue(recoveryErr, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
