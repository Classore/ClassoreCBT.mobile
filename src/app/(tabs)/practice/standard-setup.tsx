import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function StandardSetupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={20} tintColor="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Standard Mode</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </View>
        </View>

        {/* Hero Card */}
        <LinearGradient colors={['#6D28D9', '#4C1D95']} style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconBg}>
              <SymbolView name="graduationcap" size={24} tintColor="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.heroTitle}>2025 Official Mock</Text>
              <Text style={styles.heroSubtitle}>JAMB UTME</Text>
            </View>
            <View style={styles.heroLogoPlaceholder}>
              {/* Assuming logo goes here */}
              <SymbolView name="seal.fill" size={60} tintColor="#10B981" />
            </View>
          </View>
          <View style={styles.heroTags}>
            <View style={styles.tag}>
              <SymbolView name="checkmark.square" size={14} tintColor="#FFF" />
              <Text style={styles.tagText}>400 Questions</Text>
            </View>
            <View style={styles.tag}>
              <SymbolView name="clock" size={14} tintColor="#FFF" />
              <Text style={styles.tagText}>2 Hours</Text>
            </View>
            <View style={styles.tag}>
              <SymbolView name="star.fill" size={14} tintColor="#F59E0B" />
              <Text style={styles.tagText}>4.8 (12.4k)</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Test Overview */}
        <Text style={styles.sectionTitle}>Test Overview</Text>
        <View style={styles.overviewCard}>
          
          <View style={styles.overviewRow}>
            <Text style={styles.rowLabel}>Questions</Text>
            <Text style={styles.rowValue}>400</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.subjectsSection}>
            <Text style={styles.rowLabel}>Subjects</Text>
            <View style={styles.subjectsGrid}>
              {[
                { name: 'English', icon: 'book', color: '#3B82F6', bg: '#DBEAFE' },
                { name: 'Mathematics', icon: 'function', color: '#8B5CF6', bg: '#EDE9FE' },
                { name: 'Physics', icon: 'atom', color: '#10B981', bg: '#D1FAE5' },
                { name: 'Biology', icon: 'leaf', color: '#10B981', bg: '#D1FAE5' },
              ].map(sub => (
                <View key={sub.name} style={styles.subjectItem}>
                  <View style={[styles.subjectIconBg, { backgroundColor: sub.bg }]}>
                    <SymbolView name={sub.icon as any} size={24} tintColor={sub.color} />
                  </View>
                  <Text style={styles.subjectName}>{sub.name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <Text style={styles.rowLabel}>Duration</Text>
            <Text style={styles.rowValue}>2 Hours</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <Text style={styles.rowLabel}>Difficulty</Text>
            <Text style={styles.rowValue}>Official</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <Text style={styles.rowLabel}>Attempts</Text>
            <Text style={styles.rowValue}>Unlimited</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <Text style={styles.rowLabel}>Rewards</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <SymbolView name="medal" size={16} tintColor="#F59E0B" style={{marginRight: 4}} />
              <Text style={[styles.rowValue, { color: '#D97706' }]}>250 XP</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <Text style={styles.rowLabel}>Leaderboard</Text>
            <Text style={styles.rowValue}>Eligible</Text>
          </View>

        </View>

        {/* Test Rules */}
        <Text style={styles.sectionTitle}>Test Rules</Text>
        <View style={styles.rulesContainer}>
          <View style={styles.ruleItem}>
            <SymbolView name="checkmark.circle" size={20} tintColor="#10B981" />
            <Text style={styles.ruleText}>This is a full-length CBT simulation</Text>
          </View>
          <View style={styles.ruleItem}>
            <SymbolView name="checkmark.circle" size={20} tintColor="#10B981" />
            <Text style={styles.ruleText}>Exiting the app may affect your score</Text>
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity 
          style={styles.beginButton}
          onPress={() => router.push('/(exam)/instructions')}
        >
          <Text style={styles.beginButtonText}>Begin Test</Text>
          <SymbolView name="arrow.right" size={16} tintColor="#FFF" />
        </TouchableOpacity>

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { color: '#6D28D9', fontWeight: 'bold', fontSize: 14 },
  heroCard: { borderRadius: 24, padding: 20, marginBottom: 32 },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  heroIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#E0E7FF' },
  heroLogoPlaceholder: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  tagText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  overviewCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 32 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  subjectsSection: { paddingVertical: 16 },
  subjectsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  subjectItem: { alignItems: 'center' },
  subjectIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 11, fontWeight: '600', color: '#111827' },
  rulesContainer: { marginBottom: 32 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  ruleText: { fontSize: 14, color: '#4B5563' },
  beginButton: { backgroundColor: '#4C1D95', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  beginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
