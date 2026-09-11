import { AppText } from '@/components/AppText';
import { CustomButton } from '@/components/CustomButton';
import { CustomCheckbox } from '@/components/CustomCheckbox';
import { CustomInput } from '@/components/CustomInput';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REMEMBER_CREDENTIALS_KEY = 'classore_remembered_credentials';

const getRememberedCredentials = async () => {
  try {
    let json = null;
    if (Platform.OS === 'web') {
      json = localStorage.getItem(REMEMBER_CREDENTIALS_KEY);
    } else {
      json = await SecureStore.getItemAsync(REMEMBER_CREDENTIALS_KEY);
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
      await SecureStore.setItemAsync(REMEMBER_CREDENTIALS_KEY, payload);
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
      await SecureStore.deleteItemAsync(REMEMBER_CREDENTIALS_KEY);
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
                onChange={setRememberMe} 
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
                    const errorText = await res.text();
                    throw new Error(`Login failed (${res.status}): ${errorText}`);
                  }
                  
                  const response = { data: await res.json() };
                  
                  const token = response.data.token || response.data.key || response.data.access;
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
                  const data = error.response?.data;
                  console.log("Login error response:", data);
                  
                  // Comprehensive check for unverified account
                  const errorStr = JSON.stringify(data || '').toLowerCase();
                  const isUnverified = errorStr.includes('account_unverified') || 
                    (error.response?.status === 403 && errorStr.includes('verif')) ||
                    (typeof data?.message === 'string' && data.message.toLowerCase().includes('not verified')) ||
                    (typeof data?.error === 'string' && data.error.toLowerCase().includes('account_unverified'));

                  if (isUnverified) {
                    const targetEmail = data?.email || (typeof data?.email === 'string' ? data.email : email.trim());
                    
                    // Direct navigation to the OTP verification screen
                    router.push({
                      pathname: '/(auth)/verify-email',
                      params: { email: targetEmail }
                    });
                    return;
                  }

                  let errorMsg = error.message || 'Login failed';
                  if (data) {
                    if (typeof data === 'string') {
                      errorMsg = data;
                    } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
                      const err = data.non_field_errors[0];
                      errorMsg = typeof err === 'string' ? err : (err.message || err.error || JSON.stringify(err));
                    } else if (data.message) {
                      errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
                    } else if (data.error) {
                      errorMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                    } else {
                      errorMsg = JSON.stringify(data);
                    }
                  }
                  setFormError(errorMsg);
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
          <CustomButton 
            title="Continue with Google" 
            variant="secondary"
            onPress={() => {}} 
            icon={<Image source={require('../../../assets/images/google-icon.png')} style={{ width: 20, height: 20, marginRight: 10 }} contentFit="contain" />} 
            style={styles.googleButton}
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

