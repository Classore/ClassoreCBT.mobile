import { AppText } from '@/components/AppText';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { CustomButton } from '@/components/CustomButton';

export default function TestInstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Test Instructions</AppText>
          <View style={styles.streakBadge}>
            <AppText style={styles.streakEmoji}>🔥</AppText>
            <AppText style={styles.streakText}>120</AppText>
          </View>
        </View>

        <View style={styles.illustrationPlaceholder}>
          <Image source={require('../../../assets/images/test-instructions-3d.png')} style={{ width: 140, height: 140 }} contentFit="contain" />
        </View>

        <AppText style={styles.title}>Read carefully before you begin</AppText>
        <AppText style={styles.subtitle}>These instructions are important for a smooth testing experience.</AppText>

        <View style={styles.instructionsList}>
          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#EDE9FE' }]}>
              <Feather name="clock" size={20} color="#6D28D9" />
            </View>
            <AppText style={styles.instructionText}>The test is timed and will auto-submit when time is up.</AppText>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="refresh-cw" size={20} color="#EF4444" />
            </View>
            <AppText style={styles.instructionText}>Do not refresh or close the app during the test.</AppText>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#D1FAE5' }]}>
              <Feather name="check-square" size={20} color="#10B981" />
            </View>
            <AppText style={styles.instructionText}>Answers are auto-saved as you go. Your progress is safe.</AppText>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="wifi" size={20} color="#3B82F6" />
            </View>
            <AppText style={styles.instructionText}>Ensure a stable internet connection throughout the test.</AppText>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#FFEDD5' }]}>
              <Feather name="pause-circle" size={20} color="#F97316" />
            </View>
            <AppText style={styles.instructionText}>You cannot pause or restart the test once started.</AppText>
          </View>
        </View>

        <CustomButton 
          title="Begin Test" 
          onPress={() => router.push({
            pathname: '/(exam)/session',
            params: params
          })} 
          style={styles.beginButton} 
          iconRight="arrow-right"
        />

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, justifyContent: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: 0 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  streakBadge: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { color: '#6D28D9', fontWeight: 'bold', fontSize: 14 },
  illustrationPlaceholder: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20, lineHeight: 20 },
  instructionsList: { gap: 16, marginBottom: 32 },
  instructionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  instructionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  beginButton: { backgroundColor: '#4C1D95' }
});

