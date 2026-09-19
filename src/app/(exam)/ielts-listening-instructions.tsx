import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService, resolveNumericExamId } from '@/services/exam';
import {
  SubscriptionRequiredModal,
  isSubscriptionError,
  getSubscriptionErrorMessage,
} from '@/components/SubscriptionRequiredModal';

export default function IELTSListeningInstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    attempt_id?: string;
    exam?: string;
    exam_type_id?: string;
    exam_name?: string;
    section_index?: string;
    section_name?: string;
    section_order?: string;
    sections?: string;
    mode?: string;
    time_limit?: string;
    question_count?: string;
    difficulty?: string;
  }>();

  const [isStarting, setIsStarting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  const handleContinue = async () => {
    if (isStarting) return;

    // If part of an ongoing attempt (resuming or next section)
    const activeAttemptId = examService.parseAttemptId(params.attempt_id) || (await examService.getActiveAttemptId());
    if (activeAttemptId) {
      router.push({
        pathname: '/(exam)/ielts-listening-session',
        params: {
          ...params,
          attempt_id: String(activeAttemptId),
          section_index: params.section_index || '0',
        },
      });
      return;
    }

    // Otherwise, start a brand new attempt
    setIsStarting(true);
    try {
      const examId = resolveNumericExamId(params.exam || params.exam_type_id, 42);
      const order = params.section_order
        ? params.section_order.split(',').map(Number)
        : params.sections
        ? (typeof params.sections === 'string' ? JSON.parse(params.sections) : params.sections)
        : undefined;
      const mode = (params.mode as any) || 'Standard';
      const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;
      const targetQuestionCount = params.question_count ? Number(params.question_count) : undefined;
      const targetDifficulty = params.difficulty ? String(params.difficulty) : undefined;

      const newAttempt = await examService.startExam({
        exam_type_id: examId,
        mode: mode,
        selected_section_ids: order,
        time_limit_override: mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
        question_count: targetQuestionCount,
        difficulty: targetDifficulty,
      });

      router.push({
        pathname: '/(exam)/ielts-listening-session',
        params: {
          ...params,
          attempt_id: String(newAttempt.id),
          section_index: params.section_index || '0',
        },
      });
    } catch (error: any) {
      console.warn('Failed to start listening exam:', error);
      if (isSubscriptionError(error)) {
        const errorMsg = getSubscriptionErrorMessage(
          error,
          'You do not have an active subscription or bundle to access IELTS Listening.'
        );
        setSubscriptionMessage(errorMsg);
        setShowSubscriptionModal(true);
        return;
      }
      // Fallback: navigate directly to listening session with params
      router.push({
        pathname: '/(exam)/ielts-listening-session',
        params: params,
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <Text style={styles.headerTitle}>Listening Instructions</Text>

          {/* Spacer to keep title centered */}
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Headphones Hero Illustration */}
          <View style={styles.heroContainer}>
            <Image
              source={require('@/../assets/images/listening-headphones-3d.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.mainTitle}>Listening Test Instructions</Text>
          <Text style={styles.subTitle}>
            These instructions are important for{'\n'}
            Please read the instructions carefully. You cannot{'\n'}
            view them at any time during the test
          </Text>

          {/* 3 Feature Info Cards */}
          <View style={styles.cardsContainer}>
            {/* Card 1: Time */}
            <View style={styles.infoCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
                <Feather name="clock" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.infoCardText}>
                1 hr for all questions in this section.
              </Text>
            </View>

            {/* Card 2: Question Count */}
            <View style={styles.infoCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="check-square" size={20} color="#10B981" />
              </View>
              <Text style={styles.infoCardText}>
                The test have 4 section 40 questions.
              </Text>
            </View>

            {/* Card 3: Audio Rule */}
            <View style={styles.infoCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="document-text-outline" size={20} color="#F97316" />
              </View>
              <Text style={styles.infoCardText}>
                You can hear each recording only once.
              </Text>
            </View>
          </View>

          {/* How it works section */}
          <View style={styles.howItWorksSection}>
            <Text style={styles.howItWorksTitle}>How it works</Text>

            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4C1D95" />
              <Text style={styles.ruleText}>Manage your time carefully.</Text>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4C1D95" />
              <Text style={styles.ruleText}>Your word count will be shown</Text>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4C1D95" />
              <Text style={styles.ruleText}>You cannot edit your answers at the end.</Text>
            </View>
          </View>

          {/* Continue Action Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.88}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        subjectName={params.section_name || 'Listening'}
        examName={params.exam_name || 'IELTS Academic'}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 42 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  headerSpacer: {
    width: 44,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },

  // Hero 3D Illustration
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  heroImage: {
    width: 175,
    height: 175,
  },

  // Titles
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Feature Cards
  cardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },

  // How it works
  howItWorksSection: {
    marginTop: 6,
    marginBottom: 10,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Continue Button
  continueButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
