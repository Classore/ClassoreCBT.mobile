import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000/';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const publicEndpoints = ['/api/auth/register/', '/api/auth/login/', '/api/auth/verify-otp/', '/api/auth/resend-otp/', '/api/auth/forgot-password/', '/api/auth/reset-password/'];
    const isPublic = config.url && publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (isPublic) {
      return config;
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
