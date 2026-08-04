import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';
import { api } from '@/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <SymbolView name="chevron.left" size={24} tintColor="#000" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Set a new password</Text>
          <Text style={styles.subtitle}>
            Create a new password. Ensure it differs from previous ones for security
          </Text>

          {/* Form */}
          <View style={styles.formContainer}>
            <CustomInput
              label="OTP Code from Email"
              placeholder="123456"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <CustomInput
              label="Password"
              placeholder="****************"
              value={password}
              onChangeText={setPassword}
              isPassword
            />
            
            <CustomInput
              label="Confirm Password"
              placeholder="****************"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
            />
          </View>

          <CustomButton 
            title="Update Password" 
            loading={isLoading}
            onPress={async () => {
              if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
              }
              if (!otpCode || otpCode.length < 6) {
                Alert.alert('Error', 'Please enter the 6-digit OTP');
                return;
              }
              
              try {
                setIsLoading(true);
                await api.post('/auth/reset-password/', {
                  email,
                  otp_code: otpCode,
                  new_password: password
                });
                router.push('/auth/success');
              } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to reset password';
                Alert.alert('Error', errorMsg);
              } finally {
                setIsLoading(false);
              }
            }} 
            style={styles.submitButton} 
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
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8A8A8E',
    marginBottom: 32,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  }
});
