import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { CustomButton } from '@/components/CustomButton';

export default function ExamSetupScreen() {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState('jamb');
  const [selectedMode, setSelectedMode] = useState('practice');

  const exams = [
    { id: 'jamb', name: 'JAMB UTME', fullName: 'Joint Admissions and Matriculation Board', users: '12.5K', icon: 'graduationcap', popular: true },
    { id: 'waec', name: 'WAEC', fullName: 'West African Examinations Council', users: '8.7K', icon: 'doc.plaintext', popular: false },
    { id: 'neco', name: 'NECO', fullName: 'National Examinations Council', users: '5.3K', icon: 'doc.text', popular: false }
  ];

  const handleContinue = () => {
    if (selectedMode === 'practice') {
      router.push('/(tabs)/practice/practice-setup');
    } else {
      router.push('/(tabs)/practice/standard-setup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={20} tintColor="#111827" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>120</Text>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <SymbolView name="bell" size={20} tintColor="#111827" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Area */}
        <View style={styles.titleArea}>
          <View style={styles.titleTextContainer}>
            <Text style={styles.pageTitle}>Let's get you{'\n'}exam-<Text style={styles.highlightText}>ready</Text> 🚀</Text>
            <Text style={styles.pageSubtitle}>Choose the exam and the{'\n'}mode that fits your goal{'\n'}today.</Text>
          </View>
          {/* Placeholder for 3D Checklist Illustration */}
          <View style={styles.illustrationPlaceholder}>
            <SymbolView name="checklist" size={60} tintColor="#8B5CF6" />
          </View>
        </View>

        {/* Step 1: Select Exam */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepTitle}>Select Exam</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Exams</Text>
              <SymbolView name="square.grid.2x2.fill" size={14} tintColor="#6D28D9" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examScroll}>
            {exams.map((exam) => (
              <TouchableOpacity 
                key={exam.id} 
                style={[styles.examCard, selectedExam === exam.id && styles.examCardSelected]}
                onPress={() => setSelectedExam(exam.id)}
                activeOpacity={0.8}
              >
                {selectedExam === exam.id && <View style={styles.examCardSelectedDot} />}
                <View style={[styles.examIconContainer, selectedExam === exam.id ? styles.examIconSelected : styles.examIconUnselected]}>
                  <SymbolView name={exam.icon as any} size={20} tintColor={selectedExam === exam.id ? '#6D28D9' : '#10B981'} />
                </View>
                <Text style={styles.examName}>{exam.name}</Text>
                <Text style={styles.examFullName} numberOfLines={3}>{exam.fullName}</Text>
                
                <View style={styles.examFooter}>
                  <View style={styles.usersPill}>
                    <SymbolView name="person" size={12} tintColor="#6B7280" />
                    <Text style={styles.usersText}>{exam.users}</Text>
                  </View>
                  {exam.popular && (
                    <View style={styles.popularPill}>
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Step 2: Choose Test Mode */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepTitle}>Choose Test Mode</Text>
          </View>
          <Text style={styles.stepSubtitle}>Pick the mode that matches your goal.</Text>

          {/* Practice Mode Card */}
          <TouchableOpacity 
            style={[styles.modeCard, selectedMode === 'practice' && styles.modeCardSelected]}
            onPress={() => setSelectedMode('practice')}
            activeOpacity={0.9}
          >
            <View style={styles.modeHeaderRow}>
              <View style={styles.modeIconTitle}>
                <View style={[styles.modeIconBg, { backgroundColor: '#F3E8FF' }]}>
                  <SymbolView name="target" size={20} tintColor="#6D28D9" />
                </View>
                <Text style={styles.modeTitle}>Practice Mode</Text>
              </View>
              <View style={styles.modeRightGroup}>
                <View style={styles.badgePurple}><Text style={styles.badgeTextPurple}>Best for learning</Text></View>
                <View style={[styles.radioOuter, selectedMode === 'practice' && styles.radioOuterSelected]}>
                  {selectedMode === 'practice' && <View style={styles.radioInner} />}
                </View>
              </View>
            </View>
            <Text style={styles.modeTags}>Learn  •  Improve  •  Master</Text>
            <Text style={styles.modeDesc}>Customize your test. Choose subjects, topics, difficulty and get instant explanations.</Text>
            
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#6D28D9" />
                <Text style={styles.featureText}>Instant answers & explanations</Text>
              </View>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#6D28D9" />
                <Text style={styles.featureText}>Timed or untimed</Text>
              </View>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#6D28D9" />
                <Text style={styles.featureText}>Track your progress</Text>
              </View>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#6D28D9" />
                <Text style={styles.featureText}>AI-powered explanations</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Standard Mode Card */}
          <TouchableOpacity 
            style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardSelected]}
            onPress={() => setSelectedMode('standard')}
            activeOpacity={0.9}
          >
            <View style={styles.modeHeaderRow}>
              <View style={styles.modeIconTitle}>
                <View style={[styles.modeIconBg, { backgroundColor: '#DBEAFE' }]}>
                  <SymbolView name="shield.lefthalf.filled" size={20} tintColor="#3B82F6" />
                </View>
                <Text style={styles.modeTitle}>Standard Mode</Text>
              </View>
              <View style={styles.modeRightGroup}>
                <View style={styles.badgeBlue}><Text style={styles.badgeTextBlue}>Best for exam readiness</Text></View>
                <View style={[styles.radioOuter, selectedMode === 'standard' && styles.radioOuterSelected]}>
                  {selectedMode === 'standard' && <View style={styles.radioInner} />}
                </View>
              </View>
            </View>
            <Text style={styles.modeTagsBlue}>Simulate  •  Experience  •  Excel</Text>
            <Text style={styles.modeDesc}>Take a real exam simulation with official rules and timing.</Text>
            
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#3B82F6" />
                <Text style={styles.featureText}>Official exam structure</Text>
              </View>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#3B82F6" />
                <Text style={styles.featureText}>Real exam timing</Text>
              </View>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#3B82F6" />
                <Text style={styles.featureText}>No instant answers</Text>
              </View>
              <View style={styles.featureItem}>
                <SymbolView name="checkmark.circle" size={16} tintColor="#3B82F6" />
                <Text style={styles.featureText}>Final score at the end</Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Before you continue</Text>
          <View style={styles.tipsGrid}>
            <View style={styles.tipItem}>
              <SymbolView name="wifi" size={16} tintColor="#3B82F6" />
              <Text style={styles.tipText}>Ensure stable internet connection</Text>
            </View>
            <View style={styles.tipItem}>
              <SymbolView name="battery.100" size={16} tintColor="#10B981" />
              <Text style={styles.tipText}>Make sure your device is charged</Text>
            </View>
            <View style={styles.tipItem}>
              <SymbolView name="bell.slash" size={16} tintColor="#F59E0B" />
              <Text style={styles.tipText}>Find a quiet place with no distractions</Text>
            </View>
            <View style={styles.tipItem}>
              <SymbolView name="arrow.up.left.and.arrow.down.right" size={16} tintColor="#8B5CF6" />
              <Text style={styles.tipText}>You may be required to go fullscreen in Standard Mode</Text>
            </View>
          </View>
        </View>

        <CustomButton 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.continueButton} 
          iconRight="arrow.right"
        />

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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { color: '#6D28D9', fontWeight: 'bold', fontSize: 14 },
  bellButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFF' },
  titleArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  titleTextContainer: { flex: 1 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#111827', lineHeight: 38 },
  highlightText: { color: '#6D28D9' },
  pageSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 20 },
  illustrationPlaceholder: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 20 },
  stepSection: { marginBottom: 32 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6D28D9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { color: '#6D28D9', fontSize: 12, fontWeight: '600' },
  examScroll: { paddingBottom: 10 },
  examCard: { width: 140, height: 180, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginRight: 16, backgroundColor: '#FFF' },
  examCardSelected: { borderColor: '#6D28D9', borderWidth: 2, backgroundColor: '#F9F5FF' },
  examCardSelectedDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: '#6D28D9', borderBottomRightRadius: 0 },
  examIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  examIconUnselected: { backgroundColor: '#D1FAE5' },
  examIconSelected: { backgroundColor: '#EDE9FE' },
  examName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  examFullName: { fontSize: 10, color: '#6B7280', lineHeight: 14, flex: 1 },
  examFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  usersPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  usersText: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
  popularPill: { backgroundColor: '#E0E7FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  popularText: { color: '#4F46E5', fontSize: 8, fontWeight: 'bold' },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { width: 16, backgroundColor: '#6D28D9' },
  stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, marginLeft: 36 },
  modeCard: { borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 16, backgroundColor: '#FFF' },
  modeCardSelected: { borderColor: '#6D28D9', backgroundColor: '#FFF' },
  modeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modeIconTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modeTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modeRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgePurple: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextPurple: { color: '#6D28D9', fontSize: 10, fontWeight: '600' },
  badgeBlue: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextBlue: { color: '#3B82F6', fontSize: 10, fontWeight: '600' },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: '#6D28D9' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6D28D9' },
  modeTags: { fontSize: 12, fontWeight: '600', color: '#6D28D9', marginBottom: 8 },
  modeTagsBlue: { fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 8 },
  modeDesc: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  featureText: { fontSize: 11, color: '#4B5563' },
  tipsSection: { backgroundColor: '#FFFBEB', borderRadius: 24, padding: 20, marginBottom: 32 },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  tipItem: { flexDirection: 'row', width: '50%', paddingRight: 10 },
  tipText: { fontSize: 11, color: '#4B5563', marginLeft: 8, flex: 1, lineHeight: 16 },
  continueButton: { backgroundColor: '#4C1D95' }
});
