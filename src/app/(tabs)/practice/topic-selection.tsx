import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { examService, isSectionBasedExam } from '@/services/exam';
import { 
  SubscriptionRequiredModal, 
  isSubscriptionError, 
  getSubscriptionErrorMessage 
} from '@/components/SubscriptionRequiredModal';

interface TopicItem {
  id: string;
  name: string;
  isLocked: boolean;
}

const DEFAULT_FALLBACK_TOPICS: Record<string, string[]> = {
  mathematics: ['Number Systems', 'Algebra', 'Geometry', 'Trigonometry', 'Mensuration', 'Statistics', 'Calculus', 'Matrices'],
  maths: ['Number Systems', 'Algebra', 'Geometry', 'Trigonometry', 'Mensuration', 'Statistics', 'Calculus', 'Matrices'],
  english: ['Comprehension', 'Lexis and Structure', 'Oral Forms', 'Sentence Completion', 'Idioms & Figures of Speech', 'Antonyms & Synonyms'],
  'use of english': ['Comprehension', 'Lexis and Structure', 'Oral Forms', 'Sentence Completion', 'Idioms & Figures of Speech', 'Antonyms & Synonyms'],
  physics: ['Mechanics', 'Waves & Optics', 'Electricity & Magnetism', 'Thermal Physics', 'Modern Physics', 'Radioactivity'],
  chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Chemical Reactions & Stoichiometry', 'Electrochemistry'],
  biology: ['Cell Biology', 'Genetics & Evolution', 'Ecology', 'Plant Physiology', 'Animal Physiology', 'Reproduction'],
  economics: ['Microeconomics', 'Macroeconomics', 'Market Structures', 'National Income', 'Public Finance', 'Monetary Policy'],
  government: ['Political Concepts', 'Forms of Government', 'Nigerian Politics', 'International Organizations', 'Constitutions'],
  commerce: ['Trade & Commerce', 'Business Organizations', 'Banking & Finance', 'Insurance', 'Marketing'],
  accounting: ['Bookkeeping & Principles', 'Financial Statements', 'Partnership Accounts', 'Company Accounts', 'Departmental Accounts'],
  geography: ['Physical Geography', 'Human Geography', 'Map Reading', 'Regional Geography of Nigeria', 'Environmental Issues'],
  literature: ['Drama & Theatre', 'Poetry Analysis', 'Prose & Fiction', 'Literary Devices & Figures of Speech', 'African & Non-African Literature'],
};

export default function TopicSelectionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    exam?: string;
    exam_type_id?: string;
    section_id?: string;
    subject_id?: string;
    subject_name?: string;
    difficulty?: string;
    question_count?: string;
    time_limit?: string;
    is_timed?: string;
    selected_subjects?: string;
    topic_id?: string;
    topic_name?: string;
    topic?: string;
  }>();

  const examId = parseInt(params.exam_type_id || params.exam || '1', 10);
  const subjectId = parseInt(params.subject_id || params.section_id || '0', 10);
  const subjectName = params.subject_name || 'Mathematics';
  const difficulty = params.difficulty || 'Medium';
  const questionCount = parseInt(params.question_count || '40', 10);
  const timeMinutes = parseInt(params.time_limit || '20', 10);
  const isTimed = params.is_timed !== 'false';

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [modalTopicName, setModalTopicName] = useState<string>('');
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      setLoading(true);
      try {
        let fetchedTopicNames: string[] = [];
        if (subjectId > 0) {
          fetchedTopicNames = await examService.getSectionTopics(subjectId);
        }

        if (!fetchedTopicNames || fetchedTopicNames.length === 0) {
          // Check fallback by subject name
          const key = subjectName.toLowerCase().trim();
          const matchedFallback = Object.keys(DEFAULT_FALLBACK_TOPICS).find(k => key.includes(k));
          if (matchedFallback) {
            fetchedTopicNames = DEFAULT_FALLBACK_TOPICS[matchedFallback];
          } else {
            fetchedTopicNames = [
              'Number Systems',
              'Algebra',
              'Geometry',
              'Trigonometry',
              'Mensuration',
              'Advanced Problem Solving',
            ];
          }
        }

        // Check user subscription status
        const isSubscribed = Boolean((user as any)?.is_premium || (user as any)?.has_active_subscription || (user?.scholar_tier && user.scholar_tier.toLowerCase() !== 'free'));

        const topicItems: TopicItem[] = fetchedTopicNames.map((name, index) => ({
          id: `topic-${index + 1}`,
          name: name,
          // If user is subscribed, all topics unlocked. Otherwise, first 3 are free, rest locked
          isLocked: !isSubscribed && index >= 3,
        }));

        if (isMounted) {
          setTopics(topicItems);
          const targetTopicQuery = (params.topic_name || params.topic || params.topic_id || '').toString().toLowerCase().trim();
          let matched: TopicItem | undefined;
          if (targetTopicQuery) {
            matched = topicItems.find(t => 
              t.name.toLowerCase().includes(targetTopicQuery) || 
              targetTopicQuery.includes(t.name.toLowerCase())
            );
          }

          if (matched) {
            matched.isLocked = false;
            setSelectedTopics([matched.name]);
          } else {
            // Pre-select the first available unlocked topic or first 3
            const initialSelected = topicItems
              .filter(t => !t.isLocked)
              .slice(0, 3)
              .map(t => t.name);
            setSelectedTopics(initialSelected.length > 0 ? initialSelected : [topicItems[0].name]);
          }
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, [subjectId, subjectName]);

  const handleTopicPress = (topic: TopicItem) => {
    if (topic.isLocked) {
      setModalTopicName(topic.name);
      setShowSubscriptionModal(true);
      return;
    }

    // Toggle selection
    if (selectedTopics.includes(topic.name)) {
      if (selectedTopics.length === 1) {
        // Keep at least one selected
        return;
      }
      setSelectedTopics(prev => prev.filter(t => t !== topic.name));
    } else {
      setSelectedTopics(prev => [...prev, topic.name]);
    }
  };

  const handleContinue = async () => {
    if (selectedTopics.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one topic to continue.');
      return;
    }

    if (isStarting) return;
    setIsStarting(true);

    try {
      const selectedSubjectsList: number[] = params.selected_subjects
        ? JSON.parse(params.selected_subjects)
        : subjectId > 0
        ? [subjectId]
        : [1];

      const cachedExams = examService.getCachedExamsSync() || [];
      let currentExam = cachedExams.find(e => e.id === examId);
      if (!currentExam) {
        try {
          const allExams = await examService.getExams();
          currentExam = allExams.find(e => e.id === examId);
        } catch {}
      }

      const isSectionExam = isSectionBasedExam(currentExam?.name);

      const practiceConfig: Record<string, any> = {
        question_count: questionCount,
        difficulty: difficulty,
      };

      selectedSubjectsList.forEach(subId => {
        practiceConfig[String(subId)] = {
          question_count: questionCount,
          difficulty: difficulty,
          topics: selectedTopics,
        };
      });

      const newAttempt = await examService.startExam({
        exam_type_id: examId,
        mode: 'Practice',
        selected_section_ids: selectedSubjectsList,
        time_limit_override: isTimed ? timeMinutes : undefined,
        question_count: questionCount,
        difficulty: difficulty,
        topics: selectedTopics,
        practice_config: practiceConfig,
      });

      if (isSectionExam) {
        router.push({
          pathname: '/(exam)/ielts-session',
          params: {
            attempt_id: String(newAttempt.id),
            exam: String(examId),
            exam_type_id: String(examId),
            mode: 'Practice',
            sections: JSON.stringify(selectedSubjectsList),
            section_order: selectedSubjectsList.join(','),
            difficulty: difficulty,
            question_count: String(questionCount),
            time_limit: isTimed ? String(timeMinutes) : '0',
            is_timed: isTimed ? 'true' : 'false',
          },
        });
      } else {
        router.push({
          pathname: '/(exam)/session',
          params: {
            attempt_id: String(newAttempt.id),
            exam_type_id: String(examId),
            mode: 'Practice',
            sections: JSON.stringify(selectedSubjectsList),
            difficulty: difficulty,
            question_count: String(questionCount),
            time_limit: isTimed ? String(timeMinutes) : '0',
            is_timed: isTimed ? 'true' : 'false',
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to start practice session with topics:', error);
      const errorMsg = getSubscriptionErrorMessage(
        error,
        'Failed to start practice session. Please check your connection and try again.'
      );

      if (isSubscriptionError(error)) {
        setModalTopicName(selectedTopics[0] || '');
        setSubscriptionMessage(errorMsg);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Unable to Start Practice', errorMsg);
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/practice'))}
            style={styles.backButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>{subjectName}</AppText>
          <TouchableOpacity
            style={styles.streakBadge}
            onPress={() => router.push('/streak')}
            activeOpacity={0.8}
          >
            <AppText style={styles.streakEmoji}>🔥</AppText>
            <AppText style={styles.streakText}>{user?.streak ?? 0}</AppText>
          </TouchableOpacity>
        </View>

        {/* Topic List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7E57C2" />
            <AppText style={styles.loadingText}>Loading topics...</AppText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {topics.map((topic, index) => {
              const isSelected = selectedTopics.includes(topic.name);
              const isLocked = topic.isLocked;

              return (
                <TouchableOpacity
                  key={topic.id || index}
                  style={[
                    styles.topicCard,
                    isSelected && !isLocked && styles.topicCardSelected,
                  ]}
                  onPress={() => handleTopicPress(topic)}
                  activeOpacity={0.7}
                >
                  {/* Topic Index Number */}
                  <View
                    style={[
                      styles.indexCircle,
                      isSelected && !isLocked && styles.indexCircleSelected,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.indexNumber,
                        isSelected && !isLocked && styles.indexNumberSelected,
                      ]}
                    >
                      {index + 1}
                    </AppText>
                  </View>

                  {/* Topic Name & Subtitle */}
                  <View style={styles.topicInfo}>
                    <AppText
                      style={[
                        styles.topicTitle,
                        isLocked && styles.topicTitleLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {topic.name}
                    </AppText>
                    {isLocked && (
                      <AppText style={styles.subscriptionRequiredText}>
                        Subscription required
                      </AppText>
                    )}
                  </View>

                  {/* Action Icon / Checkmark */}
                  {isLocked ? (
                    <View style={styles.lockIconContainer}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleSelected,
                      ]}
                    >
                      {isSelected && (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Bottom CTA Button */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (selectedTopics.length === 0 || isStarting) && styles.continueButtonDisabled,
            ]}
            disabled={selectedTopics.length === 0 || isStarting}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.continueButtonContent}>
                <AppText style={styles.continueButtonText}>Continue</AppText>
                <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Subscription Modal */}
        <SubscriptionRequiredModal
          visible={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSubscriptionMessage(undefined);
          }}
          subjectName={subjectName}
          topicName={modalTopicName}
          customMessage={subscriptionMessage}
        />
      </View>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topicCardSelected: {
    borderColor: '#EDE9FE',
    backgroundColor: '#FAFAFF',
  },
  indexCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  indexCircleSelected: {
    backgroundColor: '#EDE9FE',
  },
  indexNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  indexNumberSelected: {
    color: '#7E57C2',
  },
  topicInfo: {
    flex: 1,
    marginRight: 12,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-SemiBold',
    lineHeight: 20,
  },
  topicTitleLocked: {
    color: '#374151',
  },
  subscriptionRequiredText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  lockIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#7E57C2',
    borderColor: '#7E57C2',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#7E57C2',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
