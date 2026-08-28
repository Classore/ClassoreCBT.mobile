import { AppText } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { examService, ExamSection, ExamTierConfig } from '@/services/exam';

export default function StandardSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exam?: string }>();

  const [subjects, setSubjects] = useState<ExamSection[]>([]);
  const [tierConfig, setTierConfig] = useState<ExamTierConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examIdStr = Array.isArray(params.exam) ? params.exam[0] : params.exam;
        const examId = examIdStr ? parseInt(examIdStr, 10) : 1;

        const [fetchedSections, fetchedTiers] = await Promise.all([
          examService.getSections(examId),
          examService.getExamTierConfigs()
        ]);
        setSubjects(fetchedSections);
        const config = fetchedTiers.find(t => t.exam_type === examId);
        if (config) setTierConfig(config);
      } catch (error) {
        console.error('Error fetching standard setup data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.exam]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Standard Mode</AppText>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => router.push('/streak')}
            activeOpacity={0.8}
          >
            <AppText style={styles.streakEmoji}>🔥</AppText>
            <AppText style={styles.streakText}>120</AppText>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <LinearGradient colors={['#6D28D9', '#4C1D95']} style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.heroTitleRow}>
              <View style={styles.heroIconBg}>
                <Ionicons name="school-outline" size={24} color="#FFF" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <AppText style={styles.heroTitle}>2025 Official Mock</AppText>
                <AppText style={styles.heroSubtitle}>JAMB UTME</AppText>
              </View>
            </View>
            
            <View style={styles.heroTagsColumn}>
              <View style={styles.heroTagRow}>
                <View style={styles.tag}>
                  <Feather name="check-square" size={14} color="#FFF" />
                  <AppText style={styles.tagText}>400 Questions</AppText>
                </View>
              </View>
              <View style={styles.heroTagRow}>
                <View style={styles.tag}>
                  <Feather name="clock" size={14} color="#FFF" />
                  <AppText style={styles.tagText}>2 Hours</AppText>
                </View>
                <View style={styles.tag}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <AppText style={styles.tagText}>4.8 (12.4k)</AppText>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.heroRightAbsolute}>
            <Image source={require('../../../../assets/images/jamb-logo.png')} style={styles.hugeJambLogo} contentFit="contain" />
          </View>
        </LinearGradient>

        {/* Test Overview */}
        <AppText style={styles.sectionTitle}>Test Overview</AppText>
        <View style={styles.overviewCard}>
          
          <View style={styles.overviewRow}>
            <AppText style={styles.rowLabel}>Questions</AppText>
            <AppText style={styles.rowValue}>400</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.subjectsSection}>
            <AppText style={styles.rowLabel}>Subjects</AppText>
            <View style={styles.subjectsGrid}>
              {loading ? (
                <AppText style={{ color: '#6B7280' }}>Loading subjects...</AppText>
              ) : (
                subjects.slice(0, 4).map(sub => (
                  <View key={sub.id} style={styles.subjectItem}>
                    <View style={[styles.subjectIconBg, { backgroundColor: '#DBEAFE' }]}>
                      <MaterialCommunityIcons name="book-open-outline" size={24} color="#3B82F6" />
                    </View>
                    <AppText style={styles.subjectName}>{sub.name}</AppText>
                  </View>
                ))
              )}
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <AppText style={styles.rowLabel}>Duration</AppText>
            <AppText style={styles.rowValue}>2 Hours</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <AppText style={styles.rowLabel}>Difficulty</AppText>
            <AppText style={styles.rowValue}>Official</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <AppText style={styles.rowLabel}>Attempts</AppText>
            <AppText style={styles.rowValue}>Unlimited</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <AppText style={styles.rowLabel}>Rewards</AppText>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="medal" size={16} color="#F59E0B" style={{marginRight: 4}} />
              <AppText style={[styles.rowValue, { color: '#D97706' }]}>250 XP</AppText>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.overviewRow}>
            <AppText style={styles.rowLabel}>Leaderboard</AppText>
            <AppText style={styles.rowValue}>Eligible</AppText>
          </View>

        </View>

        {/* Test Rules */}
        <AppText style={styles.sectionTitle}>Test Rules</AppText>
        <View style={styles.rulesContainer}>
          <View style={styles.ruleItem}>
            <Feather name="check-circle" size={20} color="#10B981" />
            <AppText style={styles.ruleText}>This is a full-length CBT simulation</AppText>
          </View>
          <View style={styles.ruleItem}>
            <Feather name="check-circle" size={20} color="#10B981" />
            <AppText style={styles.ruleText}>Exiting the app may affect your score</AppText>
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity 
          style={styles.beginButton}
          onPress={() => {
            const examIdStr = Array.isArray(params.exam) ? params.exam[0] : params.exam;
            const examId = examIdStr ? parseInt(examIdStr, 10) : 41;

            router.push({
              pathname: '/(exam)/instructions',
              params: {
                exam_type_id: examId,
                mode: 'Standard',
              }
            });
          }}
        >
          <AppText style={styles.beginButtonText}>Begin Test</AppText>
          <Feather name="arrow-right" size={16} color="#FFF" />
        </TouchableOpacity>

        {/* Extra clearance for tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: 0 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  streakBadge: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { color: '#6D28D9', fontWeight: 'bold', fontSize: 14 },
  heroCard: { borderRadius: 24, padding: 20, marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between' },
  heroLeft: { flex: 1 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  heroSubtitle: { fontSize: 12, color: '#E0E7FF' },
  heroTagsColumn: { gap: 8 },
  heroTagRow: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  tagText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  heroRightAbsolute: { position: 'absolute', right: -10, top: 10, bottom: 0, justifyContent: 'center' },
  hugeJambLogo: { width: 140, height: 140 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  overviewCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 32 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  subjectsSection: { paddingVertical: 16 },
  subjectsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  subjectItem: { alignItems: 'center' },
  subjectIconBg: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  subjectName: { fontSize: 12, fontWeight: '700', color: '#111827' },
  rulesContainer: { marginBottom: 32 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  ruleText: { fontSize: 14, color: '#4B5563' },
  beginButton: { backgroundColor: '#4C1D95', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 56, borderRadius: 16, gap: 8 },
  beginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

