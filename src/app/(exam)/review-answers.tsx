import { useAuth } from '@/context/AuthContext';
import { examService } from '@/services/exam';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ReviewQuestion {
  id: number;
  questionNumber: number;
  text?: string;
  status: 'correct' | 'incorrect' | 'unattempted';
  userAnswer?: string;
  correctAnswer: string;
  aiExplanation?: string | null;
  isBookmarked?: boolean;
  questionType?: string;
  isSpeaking?: boolean;
}

export default function ReviewAnswersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();

  const [loading, setLoading] = useState<boolean>(Boolean(params.attempt_id));
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [bookmarkedList, setBookmarkedList] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
  } | null>(null);

  const [subjectsList, setSubjectsList] = useState<Array<{ name: string; icon: string; count: string }>>([]);
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, ReviewQuestion[]>>({});

  React.useEffect(() => {
    const loadReviewData = async () => {
      if (!params.attempt_id) {
        setError('No exam session ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [analytics, attemptData] = await Promise.all([
          examService.getDetailedAnalytics(Number(params.attempt_id)).catch(() => null),
          examService.getAttemptReview(Number(params.attempt_id)).catch(() => null),
        ]);

        if (analytics) {
          setStats({
            total: analytics.total_questions_attempted || 0,
            correct: analytics.correct_answers || 0,
            incorrect: analytics.wrong_answers || 0,
            unattempted: analytics.skipped_questions || 0,
          });

          if (analytics.subjects && Array.isArray(analytics.subjects) && analytics.subjects.length > 0) {
            const icons = ['book-open-outline', 'function-variant', 'atom', 'flask-outline'];
            const subItems = analytics.subjects.map((s: any, idx: number) => ({
              name: s.section_name,
              icon: icons[idx % icons.length],
              count: `${s.correct_answers ?? 0} / ${s.total_questions ?? 0}`,
            }));
            setSubjectsList(subItems);
            setActiveSubject(prev => prev || analytics.subjects[0].section_name);
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
                const isSpeaking = q.question_type === 'AUDIO' || 
                  sec.section_name?.toLowerCase().includes('speaking') || 
                  Boolean(resp.audio_response);
                const isWriting = q.question_type === 'TEXT' || 
                  sec.section_name?.toLowerCase().includes('writing');

                let qStatus: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                if ((resp.score_awarded || 0) > 0) {
                  qStatus = 'correct';
                } else if (resp.selected_choice || resp.written_response || resp.audio_response) {
                  qStatus = 'incorrect';
                }

                let userAnsText = '';
                let correctAnsText = '';

                if (isSpeaking) {
                  if (resp.written_response) {
                    const cleanSnippet = resp.written_response.replace(/\s+/g, ' ').trim();
                    userAnsText = cleanSnippet.length > 32 ? `"${cleanSnippet.slice(0, 32)}..."` : `"${cleanSnippet}"`;
                  } else if (resp.audio_response) {
                    userAnsText = '🎙️ Audio Recording';
                  }

                  if (resp.score_awarded !== undefined && resp.score_awarded !== null) {
                    correctAnsText = `Band ${Math.min(9.0, Math.max(0.0, parseFloat(String(resp.score_awarded)))).toFixed(1)} / 9.0`;
                  } else {
                    correctAnsText = 'AI Evaluated';
                  }
                } else if (isWriting) {
                  if (resp.written_response) {
                    const cleanSnippet = resp.written_response.replace(/\s+/g, ' ').trim();
                    userAnsText = cleanSnippet.length > 32 ? `"${cleanSnippet.slice(0, 32)}..."` : `"${cleanSnippet}"`;
                  }

                  if (resp.score_awarded !== undefined && resp.score_awarded !== null) {
                    correctAnsText = `Band ${Math.min(9.0, Math.max(0.0, parseFloat(String(resp.score_awarded)))).toFixed(1)} / 9.0`;
                  } else {
                    correctAnsText = 'AI Evaluated';
                  }
                } else {
                  if (q.choices && resp.selected_choice) {
                    const userChoiceIdx = q.choices.findIndex((c: any) => c.id === resp.selected_choice);
                    if (userChoiceIdx !== -1) userAnsText = String.fromCharCode(65 + userChoiceIdx);
                  }

                  correctAnsText = 'A';
                  if (q.choices) {
                    const correctChoiceIdx = q.choices.findIndex((c: any) => c.is_correct);
                    if (correctChoiceIdx !== -1) correctAnsText = String.fromCharCode(65 + correctChoiceIdx);
                  }
                }

                const isBk = Boolean((resp as any).is_bookmarked);
                if (isBk) {
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
                  isBookmarked: isBk,
                  questionType: q.question_type,
                  isSpeaking,
                });
              });
            });

            grouped[sec.section_name] = list;
          });

          setQuestionsBySubject(grouped);
          if (bookmarks.length > 0) setBookmarkedList(bookmarks);
          
          if (!activeSubject && Object.keys(grouped).length > 0) {
            setActiveSubject(Object.keys(grouped)[0]);
          }
        }
      } catch (err: any) {
        console.warn('Could not load review data:', err);
        setError('Failed to load review answers.');
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [params.attempt_id]);

  const subjects = subjectsList;
  const questions = (activeSubject && questionsBySubject[activeSubject]) || [];

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
      Alert.alert('AI Diagnosis', 'Classore AI analyzed your incorrect answers and recommends focusing on core questions.');
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
            <Text style={styles.streakText}>{user?.streak || 0}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading questions and review data...</Text>
          </View>
        ) : error || (!stats && Object.keys(questionsBySubject).length === 0) ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#94A3B8" />
            <Text style={styles.errorTitle}>No Review Available</Text>
            <Text style={styles.errorSubtitle}>{error || 'No review data found for this session.'}</Text>
            {/* <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Go to Home</Text>
            </TouchableOpacity> */}
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 4-Metric Summary Bar Card */}
            {stats && (
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
            )}

            {/* Switch Subject */}
            {subjects.length > 1 && (
              <>
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
              </>
            )}

            {/* Subject Breakdown Card */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewSubjectTitle}>{activeSubject || 'Subject'}</Text>
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
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q) => {
                    const isBookmarked = bookmarkedList.includes(q.id);
                    return (
                      <TouchableOpacity
                        key={q.id}
                        style={styles.questionRow}
                        activeOpacity={0.7}
                        onPress={() => {
                          router.push({
                            pathname: '/(exam)/question-review' as any,
                            params: {
                              attempt_id: params.attempt_id,
                              question_id: String(q.id),
                              question_number: String(q.questionNumber),
                              total_questions: String(questions.length),
                              subject_name: activeSubject,
                              status: q.status,
                            },
                          });
                        }}
                      >
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
                            <Text style={styles.answerText} numberOfLines={1}>
                              {q.isSpeaking ? 'Speech: ' : 'Your Answer: '}
                              <Text style={styles.answerBold}>{q.userAnswer}</Text>
                            </Text>
                          )}
                        </View>

                        <Text style={styles.correctAnswerText}>
                          {q.isSpeaking || q.questionType === 'AUDIO' || q.questionType === 'TEXT' ? 'AI Assessment: ' : 'Correct Answer: '}
                          <Text style={styles.answerBold}>{q.correctAnswer}</Text>
                        </Text>

                        {/* Action: Bookmark */}
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleBookmark(q.id);
                          }}
                          style={styles.actionIconBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {isBookmarked ? (
                            <Feather name="bookmark" size={16} color="#7C3AED" />
                          ) : (
                            <Feather name="bookmark" size={16} color="#CBD5E1" />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyQuestionsCard}>
                    <Text style={styles.emptyQuestionsText}>No questions found matching this filter.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* AI Explanation Callout Card */}
            {stats && stats.incorrect > 0 && (
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
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
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
  emptyQuestionsCard: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyQuestionsText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
