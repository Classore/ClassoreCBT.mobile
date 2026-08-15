import { CustomButton } from '@/components/CustomButton';
import { CustomCheckbox } from '@/components/CustomCheckbox';
import { CustomInput } from '@/components/CustomInput';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Image source={require('../../../assets/images/back-icon.svg')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Login</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Title */}
          <Text style={styles.welcomeText}>Welcome Back, Doe</Text>

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
                <Text style={styles.forgotPassword}>Forgot Password ?</Text>
              </TouchableOpacity>
            </View>

            {formError && (
              <Text style={styles.errorText}>{formError}</Text>
            )}

            <CustomButton 
              title="Log in" 
              loading={loading}
              onPress={async () => {
                try {
                  setFormError(null);
                  setLoading(true);
                  const response = await api.post('/api/auth/login/', {
                    username: email,
                    password: password
                  });
                  await login(response.data.token);
                  router.replace('/(tabs)');
                } catch (error: any) {
                  const data = error.response?.data;
                  let errorMsg = error.message || 'Login failed';
                  if (data) {
                    if (typeof data === 'string') {
                        errorMsg = data;
                    } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
                      const err = data.non_field_errors[0];
                      errorMsg = typeof err === 'string' ? err : (err.message || err.error || JSON.stringify(err));
                    } else if (data.message) {
                      errorMsg = data.message;
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
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or</Text>
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
