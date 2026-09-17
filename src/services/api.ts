import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000/';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

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
    
    if (isPublic && !config.headers.Authorization) {
      // For public endpoints without an existing authorization header, send as-is
    }

    let token = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('auth_token');
    } else {
      token = await SecureStore.getItemAsync('auth_token');
    }
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token for request:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';

    // Ignore 401s on login/registration/auth credentials endpoints
    const isAuthAttemptEndpoint =
      url.includes('/api/auth/login/') ||
      url.includes('/api/auth/register/') ||
      url.includes('/api/auth/verify-otp/') ||
      url.includes('/api/auth/forgot-password/') ||
      url.includes('/api/auth/reset-password/');

    if (status === 401 && !isAuthAttemptEndpoint) {
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        console.warn('Received 401 Unauthorized from API. Cleaning up session...');

        try {
          if (Platform.OS === 'web') {
            localStorage.removeItem('auth_token');
          } else {
            await SecureStore.deleteItemAsync('auth_token');
          }
        } catch (e) {
          console.warn('Failed to remove expired auth token:', e);
        }

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
);
