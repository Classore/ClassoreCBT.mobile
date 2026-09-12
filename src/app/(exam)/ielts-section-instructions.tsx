import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';
import { 
  SubscriptionRequiredModal, 
  isSubscriptionError, 
  getSubscriptionErrorMessage 
} from '@/components/SubscriptionRequiredModal';

export default function IELTSSectionInstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    attempt_id?: string;
    exam?: string; 
    exam_type_id?: string; 
    exam_name?: string;
    section_name?: string;
    section_index?: string;
    sections?: string;
    section_order?: string;
    mode?: string;
    time_limit?: string;
    question_count?: string;
    difficulty?: string;
  }>();

  const currentSection = params.section_name || 'Writing';

  const getSectionDetails = (section: string) => {
    const s = section.toLowerCase();
    if (s.includes('writing')) {
      return {
        title: 'Writing',
        timeText: '1 hr for all questions in this section.',
        tasksText: 'The test have 2 Tasks.',
        requirementsText: 'You must write at least 150 words for Task 1,\nYou must write at least 250 words for Task 2.',
        rules: [
          'Manage your time carefully.',
          'Your word count will be shown',
          'You cannot edit your answers before the time ends.',
        ],
      };
    }
    if (s.includes('reading')) {
      return {
        title: 'Reading',
        timeText: '60 mins for all questions in this section.',
        tasksText: 'The test has 40 questions across 3 passages.',
        requirementsText: 'Read each passage carefully and answer all questions based on the text.',
        rules: [
          'Manage your time carefully.',
          'Review your answers before moving forward.',
          'You cannot return to this section once completed.',
        ],
      };
    }
    if (s.includes('listening')) {
      return {
        title: 'Listening',
        timeText: '~30 mins for all questions in this section.',
        tasksText: 'The test has 40 questions across 4 recordings.',
        requirementsText: 'Audio tracks play once. Check your headphones before continuing.',
        rules: [
          'Listen carefully as audio plays only once.',
          'Answers are auto-saved as you listen.',
          'Ensure steady volume and internet connection.',
        ],
      };
    }
    return {
      title: section,
      timeText: 'Follow the allotted time for this section.',
      tasksText: 'Complete all questions in this section.',
      requirementsText: 'Answer all questions carefully before finishing.',
      rules: [
        'Manage your time carefully.',
        'Review your answers before submitting.',
        'Answers are auto-saved in real-time.',
      ],
    };
  };

  const details = getSectionDetails(currentSection);
  const illustrationSource = details.title.toLowerCase().includes('reading')
    ? require('../../../assets/images/ielts-book-illustration.png')
    : details.title.toLowerCase().includes('writing')
    ? require('../../../assets/images/test-instructions-3d.png')
    : require('../../../assets/images/ielts-instructions-mic.png');

  const [isStarting, setIsStarting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  useEffect(() => {
    const isListening = (currentSection || '').toLowerCase().includes('listening') || (params.section_name || '').toLowerCase().includes('listening');
    const isSpeaking = (currentSection || '').toLowerCase().includes('speaking') || (params.section_name || '').toLowerCase().includes('speaking');

    if (isListening) {
      router.replace({
        pathname: '/(exam)/ielts-listening-instructions',
        params: params,
      });
    } else if (isSpeaking) {
      router.replace({
        pathname: '/(exam)/ielts-speaking-instructions',
        params: params,
      });
    }
  }, [currentSection, params.section_name]);

  const handleContinue = async () => {
    if (isStarting) return;

    const isListening = (currentSection || '').toLowerCase().includes('listening') || (params.section_name || '').toLowerCase().includes('listening');
    const isSpeaking = (currentSection || '').toLowerCase().includes('speaking') || (params.section_name || '').toLowerCase().includes('speaking');

    // If this section is part of an ongoing attempt (resuming / after break)
    if (params.attempt_id) {
      router.replace({
        pathname: isListening 
          ? '/(exam)/ielts-listening-session' 
          : isSpeaking 
          ? '/(exam)/ielts-speaking-session' 
          : '/(exam)/ielts-session',
        params: {
          ...params,
          attempt_id: params.attempt_id,
          section_index: params.section_index || '0',
        },
      });
      return;
    }

    // Otherwise, start a brand new attempt
    setIsStarting(true);
    try {
      const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
      const order = params.section_order ? params.section_order.split(',').map(Number) : (params.sections ? (typeof params.sections === 'string' ? JSON.parse(params.sections) : params.sections) : undefined);
      const mode = (params.mode as any) || 'Standard';
      const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;
      const targetQuestionCount = params.question_count ? Number(params.question_count) : undefined;
      const targetDifficulty = params.difficulty ? String(params.difficulty) : undefined;

      let practiceConfig: Record<string, any> | undefined;
      if (mode === 'Practice') {
        practiceConfig = {
          question_count: targetQuestionCount || 40,
          difficulty: targetDifficulty || 'Medium',
        };
        if (order && order.length > 0) {
          order.forEach((id: number) => {
            practiceConfig![String(id)] = {
              question_count: targetQuestionCount || 40,
              difficulty: targetDifficulty || 'Medium',
            };
          });
        }
      }

      const newAttempt = await examService.startExam({
        exam_type_id: examId,
        mode: mode,
        selected_section_ids: order,
        time_limit_override: mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
        question_count: targetQuestionCount,
        difficulty: targetDifficulty,
        practice_config: practiceConfig,
      });

      router.replace({
        pathname: isListening 
          ? '/(exam)/ielts-listening-session' 
          : isSpeaking 
          ? '/(exam)/ielts-speaking-session' 
          : '/(exam)/ielts-session',
        params: {
          ...params,
          attempt_id: String(newAttempt.id),
          section_index: '0',
        },
      });
    } catch (error: any) {
      console.error('Failed to start section exam:', error);
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
          <Text style={styles.headerTitle}>{details.title} Instructions</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Section Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationCircle}>
              <Image
                source={illustrationSource}
                style={styles.illustrationImage}
                contentFit="contain"
                transition={150}
                cachePolicy="memory-disk"
                priority="high"
              />
            </View>
          </View>

          {/* Section Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.mainTitle}>{details.title} Test Instructions</Text>
            <Text style={styles.mainSubtitle}>
              These instructions are important for{'\n'}Please read the instructions carefully. You cannot view them at any time during the test
            </Text>
          </View>

          {/* 3 Summary Cards */}
          <View style={styles.summaryCardsList}>
            {/* Time Card */}
            <View style={styles.summaryCard}>
              <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
                <Feather name="clock" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.summaryCardText}>{details.timeText}</Text>
            </View>

            {/* Tasks Card */}
            <View style={styles.summaryCard}>
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkbox-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.summaryCardText}>{details.tasksText}</Text>
            </View>

            {/* Requirements / Word count Card */}
            <View style={styles.summaryCard}>
              <View style={[styles.iconBg, { backgroundColor: '#FFF7ED' }]}>
                <Feather name="file-text" size={20} color="#EA580C" />
              </View>
              <Text style={styles.summaryCardText}>{details.requirementsText}</Text>
            </View>
          </View>

          {/* How it works Section */}
          <View style={styles.howItWorksSection}>
            <Text style={styles.howItWorksTitle}>How it works</Text>
            
            <View style={styles.rulesList}>
              {details.rules.map((rule, idx) => (
                <View key={idx} style={styles.ruleRow}>
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueButton, isStarting && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={isStarting}
            activeOpacity={0.85}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        subjectName={details.title || (params.section_name as string)}
        examName={params.exam_name as string}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
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
    paddingTop: 10,
    flexGrow: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  illustrationCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 110,
    height: 110,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '400',
  },
  summaryCardsList: {
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
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
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  howItWorksSection: {
    marginBottom: 28,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
    marginLeft: 2,
  },
  rulesList: {
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5824B7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ruleText: {
    flex: 1,
    fontSize: 13.5,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 19,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
