import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';
import { api } from '@/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otpCode } = useLocalSearchParams<{ email: string; otpCode?: string }>();
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
              <Image source={require('../../../assets/images/back-icon.svg')} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <AppText style={styles.title}>Set a new password</AppText>
          <AppText style={styles.subtitle}>
            Create a new password. Ensure it differs from previous ones for security
          </AppText>

          {/* Form */}
          <View style={styles.formContainer}>
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
              if (!password) {
                Alert.alert('Error', 'Please enter a password');
                return;
              }
              if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
              }
              
              try {
                setIsLoading(true);
                await api.post('/api/auth/reset-password/', {
                  email: email?.trim(),
                  otp_code: otpCode?.trim() || '',
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
  backIcon: {
    width: 24,
    height: 24,
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

