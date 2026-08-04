import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';
import { api } from '@/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
          <Text style={styles.title}>Forget Password</Text>

          {/* Form */}
          <View style={styles.formContainer}>
            <CustomInput
              label="Your Email"
              placeholder="name@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <CustomButton 
            title="Send Reset Link" 
            loading={isLoading}
            onPress={async () => {
              if (!email) {
                Alert.alert('Error', 'Please enter your email');
                return;
              }
              try {
                setIsLoading(true);
                await api.post('/auth/forgot-password/', { email });
                // Pass email to the confirm screen so it can be passed to reset-password
                router.push({
                  pathname: '/auth/password-reset-confirm',
                  params: { email }
                });
              } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to send reset link';
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
    marginLeft: -8, // slight offset to align arrow visually
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  }
});
