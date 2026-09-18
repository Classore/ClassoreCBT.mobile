import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { 
  api, 
  setUnauthorizedListener, 
  persistAuthTokens, 
  purgeStoredAuthTokens, 
  setAuthTokens, 
  getStoredTokenWithFallback 
} from '@/services/api';
import { router } from 'expo-router';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  scholar_tier?: string;
  accuracy?: number;
  study_time_hours?: number;
  study_time_minutes?: number;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  state?: string;
  school?: string;
  class_level?: string;
  avatar?: string;
  avatar_url?: string;
  xp?: number;
  streak?: number;
  best_streak?: number;
  days_active?: number;
  protection_cards_count?: number;
  token_balance?: number;
  daily_freemium_attempts?: number;
  last_freemium_reset_date?: string | null;
  target_exam_name?: string | null;
  tests_taken?: number;
  average_score?: number;
}

type AuthContextType = {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isRefreshingUser: boolean;
  login: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile> | FormData) => Promise<UserProfile>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  useStreakProtection: () => Promise<{ success: boolean; message: string; remainingCards?: number; streak?: number }>;
  setGoal: (examName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  const saveCachedUser = async (profile: UserProfile | null) => {
    try {
      if (!profile) {
        if (Platform.OS === 'web') {
          localStorage.removeItem('cached_user_profile');
        } else {
          await AsyncStorage.removeItem('cached_user_profile');
        }
        return;
      }
      const serialized = JSON.stringify(profile);
      if (Platform.OS === 'web') {
        localStorage.setItem('cached_user_profile', serialized);
      } else {
        await AsyncStorage.setItem('cached_user_profile', serialized);
      }
    } catch (err) {
      console.warn('Failed to cache user profile', err);
    }
  };

  const getCachedUser = async (): Promise<UserProfile | null> => {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem('cached_user_profile');
      } else {
        raw = await AsyncStorage.getItem('cached_user_profile');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to read cached user profile', err);
    }
    return null;
  };

  // Fetch current user details from /api/auth/me/
  const fetchUserDetails = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) return;

    setIsRefreshingUser(true);
    try {
      const response = await api.get('/api/auth/me/');

      if (response.data) {
        setUser(response.data);
        await saveCachedUser(response.data);
      }
    } catch (e: any) {
      console.warn('Failed to fetch user profile /me:', e?.response?.data || e.message);
      if (e?.response?.status === 401) {
        logout(); // Automatically log out if the token is invalid
      }
    } finally {
      setIsRefreshingUser(false);
    }
  };

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // 1. Immediately hydrate cached user profile if available (0ms delay, no flashing 0)
        const cachedUser = await getCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
        }

        const storedToken = await getStoredTokenWithFallback();
        if (storedToken) {
          setToken(storedToken);
          setAuthTokens(storedToken);
          // 2. Fetch fresh user details in background (stale-while-revalidate)
          await fetchUserDetails(storedToken);
        }
      } catch (e) {
        console.error('Failed to load token or cached user', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  useEffect(() => {
    setUnauthorizedListener(() => {
      setToken(null);
      setUser(null);
      saveCachedUser(null);
      Alert.alert(
        'Session Expired',
        'Your session has expired or is invalid. Please sign in again to continue.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              router.replace('/(auth)/login' as any);
            },
          },
        ],
        { cancelable: false }
      );
    });

    return () => {
      setUnauthorizedListener(null);
    };
  }, []);

  const login = async (newToken: string, newRefreshToken?: string) => {
    try {
      await persistAuthTokens(newToken, newRefreshToken);
      setToken(newToken);
      // Fetch details asynchronously without blocking the login resolution
      fetchUserDetails(newToken).catch(err => console.error('Failed to fetch user after login', err));
    } catch (e) {
      console.error('Failed to save token', e);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        try {
          await api.post('/api/auth/logout/');
        } catch (err) {
          console.warn('Backend logout call failed or already invalidated', err);
        }
      }

      await purgeStoredAuthTokens();
      await saveCachedUser(null);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to delete token', e);
    }
  };

  const refreshUser = async () => {
    await fetchUserDetails();
  };

  const updateUserProfile = async (data: Partial<UserProfile> | FormData): Promise<UserProfile> => {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
      
      const response = await api.patch('/api/auth/me/', data, { headers });
      if (response.data) {
        setUser(response.data);
        await saveCachedUser(response.data);
        return response.data;
      }
      throw new Error('No profile data returned');
    } catch (e) {
      console.error('Failed to update profile:', e);
      throw e;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await api.post('/api/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (e) {
      console.error('Failed to change password:', e);
      throw e;
    }
  };

  const useStreakProtection = async () => {
    try {
      const response = await api.post('/api/auth/use-streak-protection/');
      await refreshUser();
      return {
        success: true,
        message: response.data?.message || 'Streak protection card activated!',
        remainingCards: response.data?.remaining_protection_cards ?? response.data?.protection_cards_count,
        streak: response.data?.streak,
      };
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        'Unable to use streak protection card. Check if you have available cards.';
      console.warn('Failed to use streak protection:', errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  };

  const setGoal = async (examName: string) => {
    try {
      await api.patch('/api/auth/set-goal/', { exam_name: examName });
      await refreshUser();
    } catch (e) {
      console.error('Failed to set goal:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user, 
        isLoading, 
        isRefreshingUser,
        login, 
        logout, 
        refreshUser, 
        updateUserProfile,
        changePassword,
        useStreakProtection,
        setGoal 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
