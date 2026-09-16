import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { CustomButton } from '@/components/CustomButton';

import { examService, isSectionBasedExam } from '@/services/exam';
import {
  SubscriptionRequiredModal,
  isSubscriptionError,
  getSubscriptionErrorMessage,
} from '@/components/SubscriptionRequiredModal';

export default function TestInstructionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    attempt_id?: string;
    exam_type_id?: string;
    exam?: string;
    exam_name?: string;
    mode?: string;
    sections?: string;
    difficulty?: string;
    question_count?: string;
    time_limit?: string;
    is_timed?: string;
  }>();

  const [isStarting, setIsStarting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  const handleBeginTest = async () => {
    if (isStarting) return;

    // If attempt was pre-fetched before showing instructions, navigate directly
    if (params.attempt_id) {
      const examTypeId = params.exam_type_id 
        ? Number(params.exam_type_id) 
        : (params.exam ? Number(params.exam) : 41);
      const mode = (params.mode as 'Standard' | 'Practice') || 'Standard';

      try {
        const allExams = await examService.getExams();
        const currentExam = allExams.find(e => e.id === examTypeId);
        const isSectionExam = isSectionBasedExam(currentExam?.name);
        const resolvedExamName = currentExam?.name || params.exam_name;

        if (isSectionExam) {
          router.push({
            pathname: '/(exam)/ielts-session',
            params: {
              attempt_id: params.attempt_id,
              exam: String(examTypeId),
              exam_type_id: String(examTypeId),
              exam_name: resolvedExamName,
              mode: mode,
              sections: params.sections,
            },
          });
        } else {
          router.push({
            pathname: '/(exam)/session',
            params: {
              attempt_id: params.attempt_id,
              exam_type_id: String(examTypeId),
              exam_name: resolvedExamName,
              mode: mode,
              sections: params.sections,
            },
          });
        }
      } catch {
        router.push({
          pathname: '/(exam)/session',
          params: {
            attempt_id: params.attempt_id,
            exam_type_id: String(examTypeId),
            exam_name: params.exam_name,
            mode: mode,
          },
        });
      }
      return;
    }

    setIsStarting(true);
    try {
      const examTypeId = params.exam_type_id 
        ? Number(params.exam_type_id) 
        : (params.exam ? Number(params.exam) : 41);
      
      const mode = (params.mode as 'Standard' | 'Practice') || 'Standard';
      let selectedSectionIds: number[] | undefined;
      if (params.sections) {
        try {
          selectedSectionIds = typeof params.sections === 'string' 
            ? JSON.parse(params.sections) 
            : params.sections;
        } catch {
          selectedSectionIds = undefined;
        }
      }

      const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;
      const targetQuestionCount = params.question_count ? Number(params.question_count) : undefined;
      const targetDifficulty = params.difficulty ? String(params.difficulty) : undefined;

      let practiceConfig: Record<string, any> | undefined;
      if (mode === 'Practice') {
        practiceConfig = {
          question_count: targetQuestionCount || 40,
          difficulty: targetDifficulty || 'Medium',
        };
        if (selectedSectionIds && selectedSectionIds.length > 0) {
          selectedSectionIds.forEach(id => {
            practiceConfig![String(id)] = {
              question_count: targetQuestionCount || 40,
              difficulty: targetDifficulty || 'Medium',
            };
          });
        }
      }

      const allExams = await examService.getExams();
      const currentExam = allExams.find(e => e.id === examTypeId);

      const newAttempt = await examService.startExam({
        exam_type_id: examTypeId,
        mode: mode,
        selected_section_ids: selectedSectionIds,
        time_limit_override: mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
        question_count: targetQuestionCount,
        difficulty: targetDifficulty,
        practice_config: practiceConfig,
      });

      const isSectionExam = isSectionBasedExam(currentExam?.name, newAttempt.sections);

      if (isSectionExam) {
        router.push({
          pathname: '/(exam)/ielts-session',
          params: {
            attempt_id: String(newAttempt.id),
            exam: String(examTypeId),
            exam_type_id: String(examTypeId),
            exam_name: currentExam?.name || params.exam_name,
            mode: mode,
            sections: params.sections,
          },
        });
      } else {
        router.push({
          pathname: '/(exam)/session',
          params: {
            attempt_id: String(newAttempt.id),
            exam_type_id: String(examTypeId),
            exam_name: currentExam?.name || params.exam_name,
            mode: mode,
            sections: params.sections,
          },
        });
      }

    } catch (error: any) {
      console.error('Failed to start exam:', error);
      const errorMsg = getSubscriptionErrorMessage(
        error,
        'Failed to start exam. Please check your connection and try again.'
      );
      if (isSubscriptionError(error)) {
        setSubscriptionMessage(errorMsg);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Unable to Start Exam', errorMsg);
      }
    } finally {
      setIsStarting(false);
    }
  };

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
            <AppText style={styles.streakText}>{user?.streak || 0}</AppText>
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
          onPress={handleBeginTest} 
          loading={isStarting}
          style={styles.beginButton} 
        />

        <View style={{height: 40}} />
      </ScrollView>

      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
        customMessage={subscriptionMessage}
        onViewBundles={() => {
          setShowSubscriptionModal(false);
          router.push('/(tabs)/bundles' as any);
        }}
      />
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

