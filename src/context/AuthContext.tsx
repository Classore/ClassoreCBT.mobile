import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '@/services/api';

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
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile> | FormData) => Promise<UserProfile>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  useStreakProtection: () => Promise<{ remainingCards: number; streak: number }>;
  setGoal: (examName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user details from /api/auth/me/
  const fetchUserDetails = async (authToken?: string) => {
    try {
      const activeToken = authToken || token;
      if (!activeToken) return;

      const response = await api.get('/api/auth/me/', {
        headers: {
          Authorization: `Token ${activeToken}`,
        },
      });

      if (response.data) {
        setUser(response.data);
      }
    } catch (e: any) {
      console.warn('Failed to fetch user profile /me:', e?.response?.data || e.message);
      if (e?.response?.status === 401) {
        logout(); // Automatically log out if the token is invalid
      }
    }
  };

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        let storedToken = null;
        if (Platform.OS === 'web') {
          storedToken = localStorage.getItem('auth_token');
        } else {
          storedToken = await SecureStore.getItemAsync('auth_token');
        }
        
        if (storedToken) {
          setToken(storedToken);
          await fetchUserDetails(storedToken);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (newToken: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('auth_token', newToken);
      } else {
        await SecureStore.setItemAsync('auth_token', newToken);
      }
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

      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
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
        remainingCards: response.data?.remaining_protection_cards,
        streak: response.data?.streak,
      };
    } catch (e) {
      console.error('Failed to use streak protection:', e);
      throw e;
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
