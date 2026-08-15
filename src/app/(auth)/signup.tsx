import { CustomInput } from '@/components/CustomInput';
import { api } from '@/services/api';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

GoogleSignin.configure({
  webClientId: 'PLACEHOLDER_WEB_CLIENT_ID', // Replace with actual Web Client ID from Google Cloud
  iosClientId: 'PLACEHOLDER_IOS_CLIENT_ID', // Replace if needed for iOS
});

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralId, setReferralId] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignup = async () => {
    setFormError(null);
    
    if (!agreeTerms) {
      setFormError('Please agree to the terms and conditions to continue.');
      return;
    }

    try {
      setIsLoading(true);
      const username = firstName && lastName ? `${firstName}_${lastName}` : email.split('@')[0];
      
      await api.post('/api/auth/register/', {
        email: email,
        password: password,
        username: username,
        first_name: firstName,
        last_name: lastName,
        referral_id: referralId
      });
      
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: email }
      });
    } catch (error: any) {
      console.error("Signup error: ", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      setFormError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        
        // Send to backend
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.237:8081';
        const res = await fetch(`${API_URL}/api/auth/google/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_token: idToken }),
        });
        
        if (!res.ok) {
          throw new Error('Backend authentication failed');
        }
        
        const data = await res.json();
        // Here you would typically save data.token to SecureStore or Context
        
        router.push('/(auth)/choose-goal');
      } else {
        // Sign in was cancelled by user
        console.log('Google sign in cancelled');
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert('Google Sign-In', 'Sign in is already in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Google Sign-In', 'Play services not available or outdated');
            break;
          default:
            Alert.alert('Google Sign-In Error', error.message || 'An unknown error occurred');
        }
      } else {
        Alert.alert('Error', error.message || 'An error occurred during sign in');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image source={require('../../../assets/images/back-icon.svg')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign up</Text>
            <View style={styles.placeholder} />
          </View>

          <Text style={styles.pageTitle}>Create your account</Text>

          {/* Form */}
          <View style={styles.row}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, styles.inputActive]}
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#A0A0A0"
              />
            </View>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Arowoka"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#D0D0D0"
            />
          </View>

          <CustomInput
            label="Password"
            placeholder="****************"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Referral ID</Text>
            <TextInput
              style={styles.input}
              placeholder="John123ref"
              value={referralId}
              onChangeText={setReferralId}
              placeholderTextColor="#D0D0D0"
            />
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => {
              setAgreeTerms(!agreeTerms);
              if (formError) setFormError(null);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
              {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>I agree to the terms and conditions</Text>
          </TouchableOpacity>

          {formError && (
            <Text style={styles.errorText}>{formError}</Text>
          )}

          {/* Signup Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orText}>Or</Text>

          {/* Google Button */}
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Image source={require('../../../assets/images/google-icon.png')} style={styles.googleIcon} contentFit="contain" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 16,
    height: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40, // To balance the back button
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainerHalf: {
    width: '48%',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputActive: {
    borderColor: '#8B5CF6',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 20,
    marginTop: -10,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#6D28D9', // Purple
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#F97316', // Orange
    fontSize: 14,
    fontWeight: '500',
  },
  orText: {
    textAlign: 'center',
    color: '#111',
    fontSize: 14,
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  }
});
