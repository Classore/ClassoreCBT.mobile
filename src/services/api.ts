import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://192.168.43.237:8081';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    let token = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('auth_token');
    } else {
      token = await SecureStore.getItemAsync('auth_token');
    }
    if (token) {
      // Don't send token for public auth endpoints to avoid 401 on expired tokens
      const publicEndpoints = ['/api/auth/register/', '/api/auth/login/', '/api/auth/verify-otp/', '/api/auth/resend-otp/', '/api/auth/forgot-password/', '/api/auth/reset-password/'];
      const isPublic = config.url && publicEndpoints.some(endpoint => config.url?.includes(endpoint));
      
      if (!isPublic) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
  } catch (error) {
    console.error('Error fetching token for request:', error);
  }
  return config;
});
