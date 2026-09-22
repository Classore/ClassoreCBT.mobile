import React, { useState, useEffect } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';

export default function ContestRegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user, token } = useAuth();
  const isGuest = !token;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [school, setSchool] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Prepopulate if logged in
  useEffect(() => {
    if (user) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '';
      if (name) setFullName(name);
      if (user.email) setEmail(user.email);
      if (user.phone_number) setPhoneNumber(user.phone_number);
      if (user.school) setSchool(user.school);
    }
  }, [user]);

  const handleContinue = () => {
    if (isGuest) {
      Alert.alert(
        'Sign Up Required',
        'Contest entry and prize pool rewards require a registered account. Sign up for free to join!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up Now', onPress: () => router.push('/(auth)/signup') },
        ]
      );
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }

    router.push({
      pathname: '/(tabs)/contest/payment',
      params: {
        id: params.id || '1',
        fullName,
        email,
        phoneNumber,
        school,
        referralCode,
      },
    });
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Registration details</AppText>
          <View style={styles.streakBadge}>
            <AppText style={{ fontSize: 13, marginRight: 4 }}>🔥</AppText>
            <AppText style={styles.streakText}>{user?.streak ?? 0}</AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Fields */}
          <View style={styles.formGroup}>
            <AppText style={styles.label}>Full Name</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <AppText style={styles.label}>Email Address</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <AppText style={styles.label}>Phone Number</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <AppText style={styles.label}>School (Optional)</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter your school name"
              placeholderTextColor="#9CA3AF"
              value={school}
              onChangeText={setSchool}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <AppText style={styles.label}>Referral Code (Optional)</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code"
              placeholderTextColor="#9CA3AF"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <AppText style={styles.primaryButtonText}>Continue to payment</AppText>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
