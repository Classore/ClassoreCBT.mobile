import { AppText } from '@/components/AppText';
import { CustomButton } from '@/components/CustomButton';
import { CustomCheckbox } from '@/components/CustomCheckbox';
import { CustomInput } from '@/components/CustomInput';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';

import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';


const REMEMBER_CREDENTIALS_KEY = 'classore_remembered_credentials';

const getRememberedCredentials = async () => {
  try {
    let json = null;
    if (Platform.OS === 'web') {
      json = localStorage.getItem(REMEMBER_CREDENTIALS_KEY);
    } else {
      try {
        json = await SecureStore.getItemAsync(REMEMBER_CREDENTIALS_KEY);
      } catch {
        json = null;
      }
      if (!json) {
        json = await AsyncStorage.getItem(REMEMBER_CREDENTIALS_KEY);
      }
    }
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('Failed to load remembered credentials:', e);
  }
  return null;
};

const saveRememberedCredentials = async (email: string, pass: string) => {
  try {
    const payload = JSON.stringify({ email, password: pass });
    if (Platform.OS === 'web') {
      localStorage.setItem(REMEMBER_CREDENTIALS_KEY, payload);
    } else {
      try {
        await SecureStore.setItemAsync(REMEMBER_CREDENTIALS_KEY, payload);
      } catch (err) {
        console.warn('SecureStore setItem failed, falling back to AsyncStorage:', err);
      }
      await AsyncStorage.setItem(REMEMBER_CREDENTIALS_KEY, payload);
    }
  } catch (e) {
    console.warn('Failed to save remembered credentials:', e);
  }
};

const clearRememberedCredentials = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
    } else {
      try {
        await SecureStore.deleteItemAsync(REMEMBER_CREDENTIALS_KEY);
      } catch {
        // Ignore
      }
      await AsyncStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
    }
  } catch (e) {
    console.warn('Failed to clear remembered credentials:', e);
  }
};


export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleToggleRemember = async (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      await clearRememberedCredentials();
    }
  };


  useEffect(() => {
    const loadRemembered = async () => {
      const creds = await getRememberedCredentials();
      if (creds && creds.email && creds.password) {
        setEmail(creds.email);
        setPassword(creds.password);
        setRememberMe(true);
      }
    };
    loadRemembered();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
              <Image source={require('../../../assets/images/back-icon.svg')} style={styles.backIcon} />
            </TouchableOpacity>
            <AppText style={styles.headerTitle}>Login</AppText>
            <View style={styles.headerRight} />
          </View>

          {/* Title */}
          <AppText style={styles.welcomeText}>Welcome Back, Doe</AppText>

          {/* Form */}
          <View style={styles.formContainer}>
            <CustomInput
              label="Email Address"
              placeholder="name@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Password"
              placeholder="****************"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <View style={styles.optionsRow}>
              <CustomCheckbox 
                label="Remember my password" 
                checked={rememberMe} 
                onChange={handleToggleRemember} 
              />
              <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                <AppText style={styles.forgotPassword}>Forgot Password ?</AppText>
              </TouchableOpacity>
            </View>


            {formError && (
              <AppText style={styles.errorText}>{formError}</AppText>
            )}

            <CustomButton 
              title="Log in" 
              loading={loading}
              onPress={async () => {
                try {
                  setFormError(null);
                  setLoading(true);
                  const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000');
                  const res = await fetch(`${API_URL}/api/auth/login/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      username: email,
                      password: password
                    })
                  });
                  
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    
                    // Comprehensive check for unverified account
                    const errorStr = JSON.stringify(errorData || '').toLowerCase();
                    const isUnverified = 
                      errorData?.error === 'account_unverified' ||
                      errorStr.includes('account_unverified') ||
                      (res.status === 403 && errorStr.includes('verif')) ||
                      (typeof errorData?.message === 'string' && errorData.message.toLowerCase().includes('not verified'));

                    if (isUnverified) {
                      const targetEmail = errorData?.email || email.trim();
                      router.push({
                        pathname: '/(auth)/verify-email',
                        params: { email: targetEmail }
                      });
                      return;
                    }

                    // Best practice: Extract clean, friendly error messages without raw dumps
                    let cleanMsg = 'Invalid email or password. Please try again.';
                    if (errorData) {
                      if (errorData.error === 'invalid_credentials') {
                        cleanMsg = 'Invalid email or password. Please check your credentials and try again.';
                      } else if (typeof errorData.message === 'string' && errorData.message.trim()) {
                        cleanMsg = errorData.message;
                      } else if (Array.isArray(errorData.non_field_errors) && typeof errorData.non_field_errors[0] === 'string') {
                        cleanMsg = errorData.non_field_errors[0];
                      } else if (typeof errorData.detail === 'string') {
                        cleanMsg = errorData.detail;
                      } else if (typeof errorData.error === 'string') {
                        cleanMsg = errorData.error;
                      }
                    }

                    setFormError(cleanMsg);
                    return;
                  }
                  
                  const responseData = await res.json();
                  const token = responseData.token || responseData.key || responseData.access;
                  if (!token) {
                    throw new Error('No authentication token received from the server.');
                  }
                  
                  if (rememberMe) {
                    await saveRememberedCredentials(email, password);
                  } else {
                    await clearRememberedCredentials();
                  }

                  login(token).catch(err => console.error("Login storage failed:", err));
                  router.replace('/(tabs)');
                } catch (error: any) {
                  console.log("Login error:", error);
                  // Provide clean fallback message if network or unexpected error occurs
                  if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
                    setFormError('Unable to connect to server. Please check your internet connection.');
                  } else {
                    setFormError(error.message || 'An unexpected error occurred. Please try again.');
                  }
                } finally {
                  setLoading(false);
                }
              }} 
              style={styles.loginButton} 
            />

            <View style={styles.signupContainer}>
              <AppText style={styles.signupText}>Don't have an account? </AppText>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <AppText style={styles.signupLink}>Sign up</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <AppText style={styles.dividerText}>Or</AppText>
            <View style={styles.divider} />
          </View>

          {/* Google Login */}
          <GoogleSignInButton
            style={styles.googleButton}
            onSuccess={async (token) => {
              await login(token);
              router.replace('/(tabs)');
            }}
            onError={(err) => setFormError(err.message || 'Google Sign-In failed')}
          />


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 40, // To balance the back button
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  forgotPassword: {
    color: '#F47B4A',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 20,
    marginTop: -10,
    fontWeight: '500',
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#666666',
    fontSize: 15,
  },
  signupLink: {
    color: '#F47B4A',
    fontSize: 15,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#000',
    fontSize: 14,
  },
  googleButton: {
    marginTop: 8,
  }
});

