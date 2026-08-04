import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CustomButton } from '@/components/CustomButton';

export default function SuccessScreen() {
  const router = useRouter();

  const handleConfirm = () => {
    // Navigate back to login
    router.dismissAll();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SymbolView name="checkmark" size={40} tintColor="#6C47C6" weight="bold" />
        </View>

        <Text style={styles.title}>Successful</Text>
        
        <Text style={styles.message}>
          Congratulations!{'\n'}
          Your password has{'\n'}
          been changed. Click continue to login
        </Text>
      </View>

      <View style={styles.footer}>
        <CustomButton 
          title="Confirm" 
          onPress={handleConfirm} 
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3EDFA',
    borderWidth: 2,
    borderColor: '#6C47C6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8A8A8E',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  }
});
