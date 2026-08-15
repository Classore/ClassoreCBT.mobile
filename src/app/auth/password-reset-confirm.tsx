import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { CustomButton } from '@/components/CustomButton';

export default function PasswordResetConfirmScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image source={require('../../../assets/images/back-icon.svg')} style={styles.backIcon} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Password reset</Text>
        <Text style={styles.subtitle}>
          Your password has been successfully reset. click{'\n'}confirm to set a new password
        </Text>

        <CustomButton 
          title="Confirm" 
          onPress={() => router.push({
            pathname: '/auth/reset-password',
            params: { email }
          })} 
          style={styles.confirmButton} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
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
    fontSize: 16,
    color: '#8A8A8E',
    marginBottom: 32,
    lineHeight: 24,
  },
  confirmButton: {
    marginTop: 8,
  }
});
