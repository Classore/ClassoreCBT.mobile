import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { CustomButton } from '@/components/CustomButton';

export default function TestInstructionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={20} tintColor="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Instructions</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </View>
        </View>

        <View style={styles.illustrationPlaceholder}>
          <SymbolView name="list.bullet.clipboard" size={80} tintColor="#8B5CF6" />
        </View>

        <Text style={styles.title}>Read carefully before you begin</Text>
        <Text style={styles.subtitle}>These instructions are important for a smooth testing experience.</Text>

        <View style={styles.instructionsList}>
          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#EDE9FE' }]}>
              <SymbolView name="clock" size={20} tintColor="#6D28D9" />
            </View>
            <Text style={styles.instructionText}>The test is timed and will auto-submit when time is up.</Text>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#FEE2E2' }]}>
              <SymbolView name="arrow.clockwise" size={20} tintColor="#EF4444" />
            </View>
            <Text style={styles.instructionText}>Do not refresh or close the app during the test.</Text>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#D1FAE5' }]}>
              <SymbolView name="checkmark.square" size={20} tintColor="#10B981" />
            </View>
            <Text style={styles.instructionText}>Answers are auto-saved as you go. Your progress is safe.</Text>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#DBEAFE' }]}>
              <SymbolView name="wifi" size={20} tintColor="#3B82F6" />
            </View>
            <Text style={styles.instructionText}>Ensure a stable internet connection throughout the test.</Text>
          </View>

          <View style={styles.instructionCard}>
            <View style={[styles.iconBg, { backgroundColor: '#FFEDD5' }]}>
              <SymbolView name="pause.circle" size={20} tintColor="#F97316" />
            </View>
            <Text style={styles.instructionText}>You cannot pause or restart the test once started.</Text>
          </View>
        </View>

        <CustomButton 
          title="Begin Test" 
          onPress={() => router.push('/(exam)/session')} 
          style={styles.beginButton} 
          iconRight="arrow.right"
        />

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
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
