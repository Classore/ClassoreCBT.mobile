import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { examService, ChoiceItem } from '@/services/exam';

interface ReviewChoice extends ChoiceItem {
  letter: string;
}

export default function QuestionReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    attempt_id?: string;
    question_id?: string;
    question_number?: string;
    total_questions?: string;
    subject_name?: string;
    status?: 'correct' | 'incorrect' | 'unattempted';
  }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [questionText, setQuestionText] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>(params.subject_name || 'General');
  const [status, setStatus] = useState<'correct' | 'incorrect' | 'unattempted'>(params.status || 'incorrect');
  const [choices, setChoices] = useState<ReviewChoice[]>([]);
  const [userAnswerId, setUserAnswerId] = useState<number | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [examples, setExamples] = useState<string[]>([]);
  const [questionNumber, setQuestionNumber] = useState<number>(Number(params.question_number) || 1);
  const [totalQuestions, setTotalQuestions] = useState<number>(Number(params.total_questions) || 100);

  useEffect(() => {
    const loadQuestionData = async () => {
      if (!params.attempt_id || !params.question_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const attemptData = await examService.getAttemptReview(Number(params.attempt_id));
        if (attemptData && attemptData.sections) {
          const targetQId = Number(params.question_id);
          let calculatedTotal = 0;
          let calculatedQNum = 0;

          attemptData.sections.forEach((sec) => {
            sec.question_groups?.forEach((grp) => {
              grp.responses?.forEach((resp) => {
                calculatedTotal++;
                const q = resp.question;
                if (q.id === targetQId) {
                  calculatedQNum = calculatedTotal;
                  setQuestionText(q.text || '');
                  setInstructions(q.instructions || 'Choose the option that best completes the sentence.');
                  setSubjectName(sec.section_name || params.subject_name || 'General');

                  // Determine status
                  let qStatus: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                  if ((resp.score_awarded || 0) > 0) {
                    qStatus = 'correct';
                  } else if (resp.selected_choice || resp.written_response || resp.audio_response) {
                    qStatus = 'incorrect';
                  }
                  setStatus(qStatus);

                  // Setup choices
                  if (q.choices && Array.isArray(q.choices)) {
                    const mappedChoices: ReviewChoice[] = q.choices.map((c, idx) => ({
                      ...c,
                      letter: String.fromCharCode(65 + idx),
                    }));
                    setChoices(mappedChoices);

                    const correctC = q.choices.find((c) => c.is_correct);
                    if (correctC) {
                      setCorrectAnswerId(correctC.id);
                    }
                  }

                  if (resp.selected_choice) {
                    setUserAnswerId(resp.selected_choice);
                  }

                  // Explanation extraction
                  const expl = q.explanation || resp.ai_feedback || q.hint_explanation || '';
                  setExplanation(expl);

                  // Extract example sentences if provided in metadata or split explanation
                  if (q.metadata && Array.isArray(q.metadata.examples)) {
                    setExamples(q.metadata.examples);
                  } else if (expl.toLowerCase().includes('example')) {
                    const parts = expl.split(/examples?:/i);
                    if (parts.length > 1) {
                      setExplanation(parts[0].trim());
                      const rawExamples = parts[1]
                        .split('\n')
                        .map((e) => e.trim())
                        .filter((e) => e.length > 0);
                      setExamples(rawExamples);
                    }
                  }
                }
              });
            });
          });

          if (calculatedTotal > 0 && !params.total_questions) {
            setTotalQuestions(calculatedTotal);
          }
          if (calculatedQNum > 0 && !params.question_number) {
            setQuestionNumber(calculatedQNum);
          }
        }
      } catch (err) {
        console.warn('Failed to load question review details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionData();
  }, [params.attempt_id, params.question_id]);

  const streakCount = user?.streak ?? 120;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(exam)/review-answers' as any))}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>Review Answer</AppText>

        <TouchableOpacity
          style={styles.streakBadge}
          onPress={() => router.push('/streak')}
          activeOpacity={0.8}
        >
          <AppText style={{ fontSize: 13, marginRight: 4 }}>🔥</AppText>
          <AppText style={styles.streakText}>{streakCount}</AppText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <AppText style={styles.loadingText}>Loading question review...</AppText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Question Title & Counter */}
          <AppText style={styles.questionCounterTitle}>
            Question {questionNumber} of {totalQuestions}
          </AppText>

          {/* Badges: Status + Subject */}
          <View style={styles.badgesRow}>
            {status === 'incorrect' && (
              <View style={[styles.statusBadge, styles.statusBadgeRed]}>
                <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                <AppText style={[styles.statusBadgeText, { color: '#EF4444' }]}>Incorrect</AppText>
              </View>
            )}
            {status === 'correct' && (
              <View style={[styles.statusBadge, styles.statusBadgeGreen]}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <AppText style={[styles.statusBadgeText, { color: '#10B981' }]}>Correct</AppText>
              </View>
            )}
            {status === 'unattempted' && (
              <View style={[styles.statusBadge, styles.statusBadgeOrange]}>
                <View style={[styles.statusDot, { backgroundColor: '#F97316' }]} />
                <AppText style={[styles.statusBadgeText, { color: '#F97316' }]}>Unattempted</AppText>
              </View>
            )}

            <View style={styles.subjectBadge}>
              <AppText style={styles.subjectBadgeText}>{subjectName}</AppText>
            </View>
          </View>

          {/* Question Prompt Card */}
          <View style={styles.questionCard}>
            {instructions ? (
              <AppText style={styles.instructionText}>{instructions}</AppText>
            ) : null}
            <AppText style={styles.questionPromptText}>{questionText}</AppText>
          </View>

          {/* Choices List */}
          <View style={styles.choicesList}>
            {choices.map((choice) => {
              const isUserAnswer = choice.id === userAnswerId;
              const isCorrectAnswer = choice.id === correctAnswerId || choice.is_correct;

              let cardStyle = styles.choiceCardDefault;
              let circleStyle = styles.choiceCircleDefault;
              let circleTextStyle = styles.choiceCircleTextDefault;

              if (isUserAnswer && !isCorrectAnswer) {
                // Incorrect user answer: Red outline and background tint
                cardStyle = styles.choiceCardUserWrong;
                circleStyle = styles.choiceCircleWrong;
                circleTextStyle = styles.choiceCircleTextWrong;
              } else if (isCorrectAnswer) {
                // Correct answer: Green outline and background tint
                cardStyle = styles.choiceCardCorrect;
                circleStyle = styles.choiceCircleCorrect;
                circleTextStyle = styles.choiceCircleTextCorrect;
              }

              return (
                <View key={choice.id} style={[styles.choiceCard, cardStyle]}>
                  <View style={[styles.choiceCircle, circleStyle]}>
                    <AppText style={[styles.choiceCircleText, circleTextStyle]}>
                      {choice.letter}
                    </AppText>
                  </View>

                  <AppText style={styles.choiceText} numberOfLines={3}>
                    {choice.text}
                  </AppText>

                  {/* Pills on the right */}
                  {isUserAnswer && !isCorrectAnswer && (
                    <View style={styles.userAnswerPill}>
                      <AppText style={styles.userAnswerPillText}>Your Answer</AppText>
                    </View>
                  )}
                  {isCorrectAnswer && (
                    <View style={styles.correctAnswerPill}>
                      <AppText style={styles.correctAnswerPillText}>Correct Answer</AppText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Explanation Box */}
          <View style={styles.explanationBox}>
            <AppText style={styles.explanationHeader}>Explanation</AppText>
            <AppText style={styles.explanationBody}>
              {explanation ||
                '"Neither...nor" takes a singular verb that agrees with the nearest subject. Here, "coach" is singular, so the correct verb is "has".'}
            </AppText>

            {examples.length > 0 ? (
              <View style={styles.examplesContainer}>
                <AppText style={styles.examplesHeader}>Examples:</AppText>
                {examples.map((ex, idx) => (
                  <AppText key={idx} style={styles.exampleItem}>
                    {ex}
                  </AppText>
                ))}
              </View>
            ) : (
              <View style={styles.examplesContainer}>
                <AppText style={styles.examplesHeader}>Examples:</AppText>
                <AppText style={styles.exampleItem}>
                  Neither the boy nor his friends <AppText style={styles.exampleBold}>has</AppText> finished their homework.•
                </AppText>
                <AppText style={styles.exampleItem}>
                  Neither you nor I <AppText style={styles.exampleBold}>am</AppText> going to the party.•
                </AppText>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={22} color="#6D28D9" />
          <AppText style={[styles.bottomBarLabel, { color: '#6D28D9' }]}>Home</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => router.replace('/(tabs)/practice')}
          activeOpacity={0.7}
        >
          <Ionicons name="book-outline" size={22} color="#9CA3AF" />
          <AppText style={styles.bottomBarLabel}>Practice</AppText>
        </TouchableOpacity>

        {/* Center Plus Button */}
        <TouchableOpacity
          style={styles.centerFabButton}
          onPress={() => router.replace('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => router.replace('/(tabs)/reports')}
          activeOpacity={0.7}
        >
          <Ionicons name="stats-chart-outline" size={21} color="#9CA3AF" />
          <AppText style={styles.bottomBarLabel}>Reports</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => router.replace('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={22} color="#9CA3AF" />
          <AppText style={styles.bottomBarLabel}>Profile</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  backButton: {
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  questionCounterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeRed: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeOrange: {
    backgroundColor: '#FFEDD5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subjectBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 18,
  },
  questionPromptText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  choicesList: {
    gap: 12,
    marginBottom: 20,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  choiceCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  choiceCardUserWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  choiceCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  choiceCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  choiceCircleDefault: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceCircleWrong: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  choiceCircleCorrect: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  choiceCircleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  choiceCircleTextDefault: {
    color: '#1E293B',
  },
  choiceCircleTextWrong: {
    color: '#DC2626',
  },
  choiceCircleTextCorrect: {
    color: '#16A34A',
  },
  choiceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  userAnswerPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  userAnswerPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  correctAnswerPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  correctAnswerPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  explanationBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  explanationHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 8,
  },
  explanationBody: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  examplesContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9D5FF',
  },
  examplesHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 6,
  },
  exampleItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 4,
  },
  exampleBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bottomBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  centerFabButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    top: -14,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
