import React, { useState, useEffect, useCallback } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';
import { useBackgroundAwareTimer } from '@/hooks/useBackgroundAwareTimer';

export default function IELTSBreakScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    attempt_id?: string;
    exam_id?: string;
    exam_name?: string;
    next_section_index?: string;
    next_section_name?: string;
    section_order?: string;
    section_names?: string;
    mode?: string;
  }>();

  const nextSectionName = params.next_section_name || 'Writing';
  const nextSectionIndex = params.next_section_index || '0';

  // Break Timer State (10 minutes = 600 seconds)
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProceed = useCallback(() => {
    const isSpeaking = nextSectionName.toLowerCase().includes('speaking');
    const isListening = nextSectionName.toLowerCase().includes('listening');
    const activeAttemptId = examService.parseAttemptId(params.attempt_id) || examService.getActiveAttemptIdSync();
    const attemptIdStr = activeAttemptId ? String(activeAttemptId) : '';

    if (isSpeaking) {
      router.replace({
        pathname: '/(exam)/ielts-speaking-instructions',
        params: {
          attempt_id: attemptIdStr,
          exam: params.exam_id || '42',
          exam_id: params.exam_id || '42',
          exam_name: params.exam_name || 'IELTS Academic',
          section_index: nextSectionIndex,
          section_name: nextSectionName,
          section_order: params.section_order,
          section_names: params.section_names,
          mode: params.mode,
        },
      });
    } else if (isListening) {
      router.replace({
        pathname: '/(exam)/ielts-listening-instructions',
        params: {
          attempt_id: attemptIdStr,
          exam: params.exam_id || '42',
          exam_id: params.exam_id || '42',
          exam_name: params.exam_name || 'IELTS Academic',
          section_index: nextSectionIndex,
          section_name: nextSectionName,
          section_order: params.section_order,
          section_names: params.section_names,
          mode: params.mode,
        },
      });
    } else {
      router.replace({
        pathname: '/(exam)/ielts-section-instructions',
        params: {
          attempt_id: attemptIdStr,
          exam: params.exam_id || '42',
          exam_id: params.exam_id || '42',
          section_index: nextSectionIndex,
          section_name: nextSectionName,
          exam_name: params.exam_name || 'IELTS Academic',
          section_order: params.section_order,
          section_names: params.section_names,
          mode: params.mode,
        },
      });
    }
  }, [nextSectionName, params, nextSectionIndex, router]);

  // Background-aware break countdown — corrects the timer when the app resumes.
  // syncBreakTimer is called when the user taps "Start Break" to anchor the end time.
  const { syncTimer: syncBreakTimer } = useBackgroundAwareTimer(
    setSecondsRemaining,
    handleProceed,
    isBreakActive,
  );

  const handleStartBreak = () => {
    if (isBreakActive) {
      // User tapped "End Break & Continue"
      handleProceed();
    } else {
      setIsBreakActive(true);
      // Anchor the wall-clock end time now that the break has started
      syncBreakTimer(secondsRemaining);
    }
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>10 mins Break</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Purple Alarm Clock Graphic */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../../assets/images/ielts-break-clock.png')}
              style={styles.illustrationImage}
              contentFit="contain"
            />
          </View>

          {/* Headline & Subtitle */}
          <View style={styles.headlineSection}>
            <Text style={styles.mainTitle}>
              {isBreakActive ? 'Break in Progress' : 'Take a 10-minute break (Optional)'}
            </Text>
            <Text style={styles.mainSubtitle}>
              {isBreakActive
                ? `Take a deep breath and rest. Your break will conclude automatically in ${formatTimer(secondsRemaining)}, or tap below to proceed now.`
                : `You have the option to take a 10-minute break before your ${nextSectionName} test.`}
            </Text>

            {isBreakActive && (
              <View style={styles.activeTimerBadge}>
                <Feather name="clock" size={20} color="#6D28D9" style={{ marginRight: 8 }} />
                <Text style={styles.activeTimerText}>{formatTimer(secondsRemaining)}</Text>
              </View>
            )}
          </View>

          {/* Information Cards */}
          <View style={styles.infoCardsSection}>
            {/* Card 1 */}
            <View style={styles.infoCard}>
              <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
                <Feather name="clock" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.infoCardText}>This break is optional</Text>
            </View>

            {/* Card 2 */}
            <View style={styles.infoCard}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="check-circle" size={20} color="#10B981" />
              </View>
              <Text style={styles.infoCardText}>
                You can prepare for your {nextSectionName} test during this time
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartBreak}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isBreakActive ? 'End Break & Continue' : 'Take 10-mins Break'}
              </Text>
            </TouchableOpacity>

            {!isBreakActive && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleProceed}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Skip Break</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
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
    fontWeight: '800',
    color: '#111827',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  illustrationImage: {
    width: 220,
    height: 180,
  },
  headlineSection: {
    alignItems: 'center',
    marginBottom: 26,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '400',
  },
  activeTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  activeTimerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6D28D9',
  },
  infoCardsSection: {
    gap: 14,
    marginBottom: 36,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    gap: 14,
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4C1D95',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4C1D95',
  },
});
