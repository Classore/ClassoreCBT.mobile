import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const { login } = useAuth();

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    const newText = text.replace(/[^0-9]/g, '');
    
    if (newText.length > 1) {
      // Handle paste
      const chars = newText.split('').slice(0, 6);
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + chars.length, 5);
      inputs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = newText;
    setCode(newCode);

    if (newText !== '' && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    // Clear error state when user types
    if (hasError) setHasError(false);
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return 'example@gmail.com';
    const [name, domain] = emailStr.split('@');
    if (!name || !domain) return emailStr;
    const maskedName = name.length > 4 ? name.substring(0, 4) + '******' : name + '******';
    return `${maskedName}@${domain}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Image source={require('../../../assets/images/back-icon.svg')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign up</Text>
            <View style={styles.placeholder} />
          </View>

          <Text style={styles.pageTitle}>Verify your email address</Text>
          <Text style={styles.subtitle}>
            A 6 digit code has been sent to{'\n'}
            <Text style={styles.emailBold}>{maskEmail(email)}</Text>
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  digit !== '' && !hasError && styles.otpInputFilled,
                  hasError && styles.otpInputError
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6}
                ref={(ref) => (inputs.current[index] = ref)}
                selectTextOnFocus
              />
            ))}
          </View>
          
          {hasError && (
            <Text style={styles.errorText}>Incorrect code, try again</Text>
          )}

          {/* Verify Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]} 
            disabled={isLoading}
            onPress={async () => {
              const enteredCode = code.join('');
              if (enteredCode.length < 6) return;
              
              try {
                setIsLoading(true);
                console.log("Sending Verify OTP Payload:", { email, otp_code: enteredCode });
                const response = await api.post('/api/auth/verify-otp/', {
                  email: email,
                  otp_code: enteredCode
                });
                
                await login(response.data.token);
                router.push('/(auth)/choose-goal');
              } catch (error: any) {
                setHasError(true);
                const data = error.response?.data;
                console.error("Verify OTP Error:", data);
                let errorMsg = 'Verification failed';
                if (data) {
                   if (typeof data === 'string') errorMsg = data;
                   else if (data.error) errorMsg = data.message || data.error;
                   else if (data.non_field_errors) errorMsg = data.non_field_errors[0];
                   else errorMsg = JSON.stringify(data);
                }
                Alert.alert('Error', errorMsg);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive a mail? </Text>
            <TouchableOpacity onPress={async () => {
              try {
                await api.post('/api/auth/resend-otp/', { email: email });
                Alert.alert('Success', 'A new OTP has been sent to your email.');
              } catch (error: any) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP.');
              }
            }}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flex: 1,
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
    width: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 32,
  },
  emailBold: {
    fontWeight: 'bold',
    color: '#374151',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  otpInputFilled: {
    color: '#6D28D9',
    backgroundColor: '#F5F3FF',
  },
  otpInputError: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: -24,
    marginBottom: 24,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#F97316', // Orange
    fontSize: 14,
    fontWeight: '500',
  },
});
