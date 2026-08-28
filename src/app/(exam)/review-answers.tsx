import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService, UserAttempt } from '@/services/exam';

interface ReviewQuestion {
  id: number;
  questionNumber: number;
  text?: string;
  status: 'correct' | 'incorrect' | 'unattempted';
  userAnswer?: string;
  correctAnswer: string;
  aiExplanation?: string | null;
  isBookmarked?: boolean;
}

export default function ReviewAnswersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();

  const [loading, setLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState('Use of English');
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [bookmarkedList, setBookmarkedList] = useState<number[]>([1]);

  const [stats, setStats] = useState({
    total: 400,
    correct: 205,
    incorrect: 195,
    unattempted: 3,
  });

  const [subjectsList, setSubjectsList] = useState([
    { name: 'Use of English', icon: 'book-open-outline', count: '100 / 100' },
    { name: 'Mathematics', icon: 'function-variant', count: '100 / 100' },
    { name: 'Physics', icon: 'atom', count: '100 / 100' },
    { name: 'Chemistry', icon: 'flask-outline', count: '100 / 100' },
  ]);

  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, ReviewQuestion[]>>({});

  const fallbackQuestions: ReviewQuestion[] = [
    { id: 1, questionNumber: 1, text: 'Which of the following is a noun?', status: 'correct', userAnswer: 'C', correctAnswer: 'C' },
    { id: 2, questionNumber: 2, text: 'Identify the misplaced modifier in the sentence.', status: 'incorrect', userAnswer: 'B', correctAnswer: 'D' },
    { id: 3, questionNumber: 3, text: 'Choose the nearest in meaning to the italicized word.', status: 'correct', userAnswer: 'A', correctAnswer: 'A' },
    { id: 4, questionNumber: 4, text: 'Complete the sentence with the appropriate idiom.', status: 'unattempted', correctAnswer: 'B' },
    { id: 5, questionNumber: 5, text: 'Select the option that best completes the gap.', status: 'incorrect', userAnswer: 'C', correctAnswer: 'B' },
    { id: 6, questionNumber: 6, text: 'What is the tone of the speaker?', status: 'correct', userAnswer: 'A', correctAnswer: 'A' },
    { id: 7, questionNumber: 7, text: 'Which word has the same vowel sound as "seat"?', status: 'correct', userAnswer: 'D', correctAnswer: 'D' },
    { id: 8, questionNumber: 8, text: 'Identify the antonym of the given word.', status: 'incorrect', userAnswer: 'A', correctAnswer: 'C' },
    { id: 9, questionNumber: 9, text: 'Select the correct stress pattern.', status: 'correct', userAnswer: 'B', correctAnswer: 'B' },
    { id: 10, questionNumber: 10, text: 'What is the central theme of the passage?', status: 'correct', userAnswer: 'C', correctAnswer: 'C' },
  ];

  React.useEffect(() => {
    const loadReviewData = async () => {
      if (!params.attempt_id) return;
      try {
        setLoading(true);
        const [analytics, attemptData] = await Promise.all([
          examService.getDetailedAnalytics(Number(params.attempt_id)).catch(() => null),
          examService.getAttemptReview(Number(params.attempt_id)).catch(() => null),
        ]);

        if (analytics) {
          setStats({
            total: analytics.total_questions_attempted || 400,
            correct: analytics.correct_answers || 0,
            incorrect: analytics.wrong_answers || 0,
            unattempted: analytics.skipped_questions || 0,
          });

          if (analytics.subjects && Array.isArray(analytics.subjects) && analytics.subjects.length > 0) {
            const icons = ['book-open-outline', 'function-variant', 'atom', 'flask-outline'];
            const subItems = analytics.subjects.map((s: any, idx: number) => ({
              name: s.section_name,
              icon: icons[idx % icons.length],
              count: `${s.correct_answers} / ${s.total_questions}`,
            }));
            setSubjectsList(subItems);
            if (!analytics.subjects.find((s: any) => s.section_name === activeSubject)) {
              setActiveSubject(analytics.subjects[0].section_name);
            }
          }
        }

        if (attemptData && attemptData.sections) {
          const grouped: Record<string, ReviewQuestion[]> = {};
          const bookmarks: number[] = [];

          attemptData.sections.forEach(sec => {
            const list: ReviewQuestion[] = [];
            let qNum = 1;

            sec.question_groups?.forEach(grp => {
              grp.responses?.forEach(resp => {
                const q = resp.question;
                let qStatus: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                if ((resp.score_awarded || 0) > 0) {
                  qStatus = 'correct';
                } else if (resp.selected_choice || resp.written_response || resp.audio_response) {
                  qStatus = 'incorrect';
                }

                let userAnsText = '';
                if (q.choices && resp.selected_choice) {
                  const userChoiceIdx = q.choices.findIndex((c: any) => c.id === resp.selected_choice);
                  if (userChoiceIdx !== -1) userAnsText = String.fromCharCode(65 + userChoiceIdx);
                }

                let correctAnsText = 'A';
                if (q.choices) {
                  const correctChoiceIdx = q.choices.findIndex((c: any) => c.is_correct);
                  if (correctChoiceIdx !== -1) correctAnsText = String.fromCharCode(65 + correctChoiceIdx);
                }

                if (resp.is_bookmarked) {
                  bookmarks.push(q.id);
                }

                list.push({
                  id: q.id,
                  questionNumber: qNum++,
                  text: q.text,
                  status: qStatus,
                  userAnswer: userAnsText || undefined,
                  correctAnswer: correctAnsText,
                  aiExplanation: resp.ai_feedback,
                  isBookmarked: resp.is_bookmarked,
                });
              });
            });

            grouped[sec.section_name] = list;
          });

          setQuestionsBySubject(grouped);
          if (bookmarks.length > 0) setBookmarkedList(bookmarks);
        }
      } catch (err) {
        console.warn('Could not load review data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [params.attempt_id]);

  const subjects = subjectsList;
  const questions = questionsBySubject[activeSubject] || fallbackQuestions;

  const toggleBookmark = async (id: number) => {
    const isBookmarked = bookmarkedList.includes(id);
    if (isBookmarked) {
      setBookmarkedList(bookmarkedList.filter(item => item !== id));
      await examService.removeSavedQuestion(id).catch(() => {});
    } else {
      setBookmarkedList([...bookmarkedList, id]);
      await examService.saveQuestion(id).catch(() => {});
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (activeFilter === 'all') return true;
    return q.status === activeFilter;
  });

  const handleAIExplanation = async () => {
    if (!params.attempt_id) {
      Alert.alert('AI Diagnosis', 'Classore AI analyzed your incorrect answers and recommends focusing on core algebraic theorems and passage inference.');
      return;
    }
    try {
      const data = await examService.explainMistakes(Number(params.attempt_id));
      Alert.alert(
        'Classore AI Diagnostic Report',
        data.ai_diagnosis || `Analyzed ${data.analyzed_count} incorrect questions. Review each solution for full step-by-step working.`,
        [{ text: 'Great, thanks!' }]
      );
    } catch (e: any) {
      Alert.alert('AI Diagnosis', 'Classore AI analyzed your incorrect answers. Review your questions above for complete step-by-step working.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Answer</Text>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => router.push('/streak')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 4-Metric Summary Bar Card */}
          <View style={styles.summaryBarCard}>
            <View style={styles.summaryBarCol}>
              <Text style={[styles.summaryBarValue, { color: '#16A34A' }]}>{stats.correct}</Text>
              <Text style={styles.summaryBarLabel}>Correct</Text>
            </View>
            <View style={styles.summaryBarDivider} />
            <View style={styles.summaryBarCol}>
              <Text style={[styles.summaryBarValue, { color: '#DC2626' }]}>{stats.incorrect}</Text>
              <Text style={styles.summaryBarLabel}>Incorrect</Text>
            </View>
            <View style={styles.summaryBarDivider} />
            <View style={styles.summaryBarCol}>
              <Text style={[styles.summaryBarValue, { color: '#EA580C' }]}>{stats.unattempted}</Text>
              <Text style={styles.summaryBarLabel}>Unattempted</Text>
            </View>
            <View style={styles.summaryBarDivider} />
            <View style={styles.summaryBarCol}>
              <Text style={[styles.summaryBarValue, { color: '#4C1D95' }]}>{stats.total}</Text>
              <Text style={styles.summaryBarLabel}>Total Questions</Text>
            </View>
          </View>

          {/* Switch Subject */}
          <Text style={styles.sectionHeading}>Switch Subject</Text>
          <Text style={styles.sectionSubtitle}>Review your performance by subject</Text>

          {/* Subject Circles Selector */}
          <View style={styles.subjectSelectorRow}>
            {subjects.map((sub) => {
              const isActive = activeSubject === sub.name;
              return (
                <TouchableOpacity 
                  key={sub.name} 
                  style={styles.subjectCircleItem}
                  onPress={() => setActiveSubject(sub.name)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.subjectCircleBg,
                    isActive ? styles.subjectCircleActive : styles.subjectCircleInactive,
                  ]}>
                    <MaterialCommunityIcons 
                      name={sub.icon as any} 
                      size={22} 
                      color={isActive ? '#FFFFFF' : '#7C3AED'} 
                    />
                  </View>
                  <Text style={[styles.subjectCircleName, isActive && styles.subjectCircleNameActive]} numberOfLines={2}>
                    {sub.name}
                  </Text>
                  <Text style={styles.subjectCircleCount}>{sub.count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subject Breakdown Card */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.reviewSubjectTitle}>{activeSubject}</Text>
              <View style={styles.questionsPill}>
                <Text style={styles.questionsPillText}>{questions.length} Questions</Text>
              </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  activeFilter === 'correct' && styles.filterPillActiveGreen
                ]}
                onPress={() => setActiveFilter(activeFilter === 'correct' ? 'all' : 'correct')}
              >
                <Feather name="check" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.filterPillText}>Correct ({questions.filter(q => q.status === 'correct').length})</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  activeFilter === 'incorrect' && styles.filterPillActiveRed
                ]}
                onPress={() => setActiveFilter(activeFilter === 'incorrect' ? 'all' : 'incorrect')}
              >
                <Feather name="x" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.filterPillText}>Incorrect ({questions.filter(q => q.status === 'incorrect').length})</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  activeFilter === 'unattempted' && styles.filterPillActiveOrange
                ]}
                onPress={() => setActiveFilter(activeFilter === 'unattempted' ? 'all' : 'unattempted')}
              >
                <Feather name="minus" size={12} color="#EA580C" style={{ marginRight: 4 }} />
                <Text style={styles.filterPillText}>Unattempted ({questions.filter(q => q.status === 'unattempted').length})</Text>
              </TouchableOpacity>
            </View>

            {/* Question Items List */}
            <View style={styles.questionsList}>
              {filteredQuestions.map((q) => {
                const isBookmarked = bookmarkedList.includes(q.id);
                return (
                  <View key={q.id} style={styles.questionRow}>
                    <Text style={styles.questionIndex}>{q.questionNumber}</Text>

                    {/* Status Badge */}
                    {q.status === 'correct' && (
                      <View style={[styles.statusIconCircle, { backgroundColor: '#10B981' }]}>
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                    {q.status === 'incorrect' && (
                      <View style={[styles.statusIconCircle, { backgroundColor: '#EF4444' }]}>
                        <Feather name="x" size={12} color="#FFFFFF" />
                      </View>
                    )}
                    {q.status === 'unattempted' && (
                      <View style={[styles.statusIconCircle, { backgroundColor: '#F97316' }]}>
                        <Feather name="minus" size={12} color="#FFFFFF" />
                      </View>
                    )}

                    {/* Answer Details */}
                    <View style={styles.answerDetails}>
                      {q.status === 'unattempted' ? (
                        <Text style={styles.unattemptedText}>Unattempted</Text>
                      ) : (
                        <Text style={styles.answerText}>
                          Your Answer: <Text style={styles.answerBold}>{q.userAnswer}</Text>
                        </Text>
                      )}
                    </View>

                    <Text style={styles.correctAnswerText}>
                      Correct Answer: <Text style={styles.answerBold}>{q.correctAnswer}</Text>
                    </Text>

                    {/* Action: Bookmark or Chevron */}
                    <TouchableOpacity 
                      onPress={() => toggleBookmark(q.id)}
                      style={styles.actionIconBtn}
                    >
                      {isBookmarked ? (
                        <Feather name="bookmark" size={16} color="#7C3AED" />
                      ) : (
                        <Feather name="bookmark" size={16} color="#CBD5E1" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI Explanation Callout Card */}
          <View style={styles.aiCard}>
            <View style={styles.aiIconBg}>
              <MaterialCommunityIcons name="robot" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiTitle}>{stats.incorrect} incorrect answers found.</Text>
              <Text style={styles.aiSubtitle}>
                Review your wrong answers with AI explanation.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={handleAIExplanation}
              activeOpacity={0.85}
            >
              <Text style={styles.aiButtonText}>✨ AI Explanation</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    backgroundColor: '#FAFAFA',
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // 4-Metric Summary Bar
  summaryBarCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBarValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  summaryBarLabel: {
    fontSize: 9.5,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryBarDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },

  // Switch Subject
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 16,
  },
  subjectSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subjectCircleItem: {
    alignItems: 'center',
    width: '23%',
  },
  subjectCircleBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectCircleActive: {
    backgroundColor: '#4C1D95',
  },
  subjectCircleInactive: {
    backgroundColor: '#F5F3FF',
  },
  subjectCircleName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 14,
  },
  subjectCircleNameActive: {
    color: '#4C1D95',
    fontWeight: '800',
  },
  subjectCircleCount: {
    fontSize: 9.5,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Review Breakdown Card
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewSubjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  questionsPill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionsPillText: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  filterPillActiveGreen: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  filterPillActiveRed: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  filterPillActiveOrange: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },

  // Questions List
  questionsList: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  questionIndex: {
    width: 20,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  statusIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  answerDetails: {
    flex: 1,
  },
  answerText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  unattemptedText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  answerBold: {
    fontWeight: '800',
    color: '#111827',
  },
  correctAnswerText: {
    fontSize: 11.5,
    color: '#6B7280',
    marginRight: 10,
  },
  actionIconBtn: {
    padding: 4,
  },

  // AI Card
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  aiIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  aiTextContainer: {
    flex: 1,
    paddingRight: 6,
  },
  aiTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 10.5,
    color: '#6B7280',
  },
  aiButton: {
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  aiButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
});
