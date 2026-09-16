import { AppText } from '@/components/AppText';
import React, { useState, useRef } from 'react';
import {
  View,
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

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

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
    if (hasError) {
      setHasError(false);
      setErrorMessage('');
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const maskEmail = (emailStr?: string) => {
    if (!emailStr) return 'arow******.gmail.com';
    const [name, domain] = emailStr.split('@');
    if (!name || !domain) return emailStr;
    const maskedName = name.length > 4 ? name.substring(0, 4) + '******' : name + '******';
    return `${maskedName}.${domain}`;
  };

  const handleVerify = async () => {
    const enteredCode = code.join('');
    if (enteredCode.length < 6) {
      setHasError(true);
      setErrorMessage('Please enter all 6 digits of the code');
      return;
    }

    try {
      setIsLoading(true);
      try {
        await api.post('/api/auth/verify-otp/', {
          email: email?.trim(),
          otp_code: enteredCode.trim()
        });
      } catch (err: any) {
        const resData = err.response?.data;
        const msg = resData?.message || resData?.error || '';
        if (resData?.status === 400 || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
          setHasError(true);
          setErrorMessage(msg || 'Incorrect code, please try again');
          setIsLoading(false);
          return;
        }
      }

      router.push({
        pathname: '/auth/password-reset-confirm',
        params: {
          email: email?.trim(),
          otpCode: enteredCode.trim()
        }
      });
    } catch (error: any) {
      setHasError(true);
      setErrorMessage(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      setIsResending(true);
      await api.post('/api/auth/resend-otp/', { email: email.trim() });
      Alert.alert('Success', 'A new 6-digit code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
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
            <TouchableOpacity 
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image 
                source={require('../../../assets/images/back-icon.svg')} 
                style={styles.backIcon} 
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <AppText style={styles.pageTitle}>Check your email</AppText>
          
          {/* Subtitle with masked email */}
          <AppText style={styles.subtitle}>
            We sent a reset link to <AppText style={styles.emailBold}>{maskEmail(email)}</AppText>{'\n'}
            enter 6 digit code that mentioned in the email
          </AppText>

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
                ref={(ref) => { inputs.current[index] = ref; }}
                selectTextOnFocus
              />
            ))}
          </View>
          
          {hasError && (
            <AppText style={styles.errorText}>{errorMessage || 'Incorrect code, try again'}</AppText>
          )}

          {/* Verify Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]} 
            disabled={isLoading}
            onPress={handleVerify}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <AppText style={styles.primaryButtonText}>Verify</AppText>
            )}
          </TouchableOpacity>

          {/* Resend Footer */}
          <View style={styles.resendContainer}>
            <AppText style={styles.resendText}>Didn't receive a mail? </AppText>
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <AppText style={styles.resendLink}>{isResending ? 'Resending...' : 'Resend'}</AppText>
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
    paddingTop: 12,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailBold: {
    fontWeight: '700',
    color: '#4B5563',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  otpInputFilled: {
    color: '#6D28D9',
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  otpInputError: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: -20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '600',
  },
});
