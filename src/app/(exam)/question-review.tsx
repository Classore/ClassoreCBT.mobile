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
import { BLANK_REGEX, hasBlanks, normalizeBlankToken } from '@/utils/questionFormatter';

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
  const [contextText, setContextText] = useState<string>('');
  const [contextTitle, setContextTitle] = useState<string>('');
  const [isContextExpanded, setIsContextExpanded] = useState<boolean>(true);
  const [blankViewMode, setBlankViewMode] = useState<'filled' | 'blank'>('filled');
  const [blankAnswers, setBlankAnswers] = useState<{
    correct: Record<string, string>;
    user: Record<string, string>;
  }>({ correct: {}, user: {} });
  const [blankItems, setBlankItems] = useState<
    Array<{
      key: string;
      label: string;
      correctAnswer: string;
      userAnswer: string;
      isCorrect: boolean;
    }>
  >([]);
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
                  setInstructions(q.instructions || '');
                  setContextText(grp.context_text || '');
                  setContextTitle(grp.group_title || '');
                  setSubjectName(sec.section_name || params.subject_name || 'General');

                  // Determine status
                  let qStatus: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                  if ((resp.score_awarded || 0) > 0) {
                    qStatus = 'correct';
                  } else if (resp.selected_choice || resp.written_response || resp.audio_response || (resp.metadata && Object.keys(resp.metadata).length > 0)) {
                    qStatus = 'incorrect';
                  }
                  setStatus(qStatus);

                  // Setup choices
                  let mappedChoices: ReviewChoice[] = [];
                  let correctC: ChoiceItem | undefined;
                  if (q.choices && Array.isArray(q.choices)) {
                    mappedChoices = q.choices.map((c, idx) => ({
                      ...c,
                      letter: String.fromCharCode(65 + idx),
                    }));
                    setChoices(mappedChoices);

                    correctC = q.choices.find((c) => c.is_correct);
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

                  // Extract Blank Answers and Info
                  const textToScan = `${q.text || ''} ${grp.context_text || ''}`;
                  const rawTokens = textToScan.match(new RegExp(BLANK_REGEX.source, 'gi')) || [];
                  const detectedList: Array<{ key: string; label: string }> = [];
                  const seenKeys = new Set<string>();
                  let autoIdx = 1;
                  rawTokens.forEach((token) => {
                    const norm = normalizeBlankToken(token, autoIdx);
                    if (!seenKeys.has(norm.key)) {
                      seenKeys.add(norm.key);
                      detectedList.push(norm);
                      autoIdx++;
                    }
                  });

                  const correctMap: Record<string, string> = {};
                  const userMap: Record<string, string> = {};

                  // 1. Check metadata.correct_blanks or correct_answers
                  if (q.metadata) {
                    const metaBlanks = q.metadata.correct_blanks || q.metadata.correct_answers || q.metadata.answers;
                    if (metaBlanks && typeof metaBlanks === 'object') {
                      if (Array.isArray(metaBlanks)) {
                        metaBlanks.forEach((ans, i) => {
                          const strAns = typeof ans === 'string' ? ans : String(ans || '');
                          correctMap[`blank_${i + 1}`] = strAns;
                          correctMap[String(i + 1)] = strAns;
                        });
                      } else {
                        Object.entries(metaBlanks).forEach(([k, v]) => {
                          const norm = normalizeBlankToken(k);
                          const strAns = typeof v === 'string' ? v : (Array.isArray(v) ? v.join(' / ') : String(v || ''));
                          correctMap[norm.key] = strAns;
                          correctMap[norm.label] = strAns;
                        });
                      }
                    }

                    // WordBank / Options lookup
                    if (q.metadata.word_bank || q.metadata.options) {
                      const wb = (q.metadata.word_bank || q.metadata.options) as Array<{ id: string; text?: string; word?: string }>;
                      if (Array.isArray(wb)) {
                        Object.keys(correctMap).forEach((k) => {
                          const val = correctMap[k];
                          const match = wb.find((w) => String(w.id).toLowerCase() === val.toLowerCase());
                          if (match) {
                            correctMap[k] = match.text || match.word || val;
                          }
                        });
                      }
                    }
                  }

                  // 2. Check user's responses in resp.metadata?.blanks or resp.written_response
                  if (resp.metadata && resp.metadata.blanks && typeof resp.metadata.blanks === 'object') {
                    Object.entries(resp.metadata.blanks).forEach(([k, v]) => {
                      const norm = normalizeBlankToken(k);
                      const strAns = typeof v === 'string' ? v : String(v || '');
                      userMap[norm.key] = strAns;
                      userMap[norm.label] = strAns;
                    });
                  } else if (resp.written_response) {
                    try {
                      const parsed = JSON.parse(resp.written_response);
                      if (parsed && typeof parsed === 'object') {
                        Object.entries(parsed).forEach(([k, v]) => {
                          const norm = normalizeBlankToken(k);
                          const strAns = typeof v === 'string' ? v : String(v || '');
                          userMap[norm.key] = strAns;
                          userMap[norm.label] = strAns;
                        });
                      } else {
                        userMap['blank_1'] = resp.written_response;
                        userMap['1'] = resp.written_response;
                      }
                    } catch {
                      userMap['blank_1'] = resp.written_response;
                      userMap['1'] = resp.written_response;
                    }
                  }

                  // 3. If MCQ choices and correctMap has nothing, use choice texts
                  if (correctC && Object.keys(correctMap).length === 0) {
                    const cParts = correctC.text.split(/\s*[\/,;]\s*/);
                    const uChoice = mappedChoices.find((c) => c.id === resp.selected_choice);
                    const uParts = uChoice ? uChoice.text.split(/\s*[\/,;]\s*/) : [];

                    if (detectedList.length > 0) {
                      detectedList.forEach((b, i) => {
                        const cAns = cParts.length === detectedList.length ? cParts[i] : correctC.text;
                        const uAns = uParts.length === detectedList.length ? uParts[i] : (uChoice?.text || '');
                        correctMap[b.key] = cAns;
                        correctMap[b.label] = cAns;
                        if (uAns) {
                          userMap[b.key] = uAns;
                          userMap[b.label] = uAns;
                        }
                      });
                    } else {
                      correctMap['blank_1'] = correctC.text;
                      correctMap['1'] = correctC.text;
                      if (uChoice) {
                        userMap['blank_1'] = uChoice.text;
                        userMap['1'] = uChoice.text;
                      }
                    }
                  }

                  setBlankAnswers({ correct: correctMap, user: userMap });

                  // Build detailed blankItems array for breakdown card
                  const resolvedItems = detectedList.map((b, idx) => {
                    const cAns = correctMap[b.key] || correctMap[b.label] || correctMap[`blank_${idx + 1}`] || '';
                    const uAns = userMap[b.key] || userMap[b.label] || userMap[`blank_${idx + 1}`] || '';
                    const isMatch = Boolean(
                      cAns && uAns && (cAns.trim().toLowerCase() === uAns.trim().toLowerCase() || qStatus === 'correct')
                    );
                    return {
                      key: b.key,
                      label: b.label,
                      correctAnswer: cAns,
                      userAnswer: uAns,
                      isCorrect: isMatch,
                    };
                  });
                  setBlankItems(resolvedItems);
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
  const hasBlanksInContent = hasBlanks(questionText) || hasBlanks(contextText) || blankItems.length > 0;

  const renderTextWithBlanks = (rawText: string, isFilled: boolean, isPassage: boolean = false) => {
    if (!rawText) return null;
    if (!hasBlanks(rawText)) {
      return (
        <AppText style={isPassage ? styles.passageText : styles.questionPromptText}>
          {rawText}
        </AppText>
      );
    }

    const parts = rawText.split(BLANK_REGEX);
    let blankCounter = 0;

    return (
      <AppText style={isPassage ? styles.passageText : styles.questionPromptText}>
        {parts.map((part, index) => {
          if (!part) return null;
          const isBlank = new RegExp(BLANK_REGEX.source, 'i').test(part);
          if (isBlank) {
            blankCounter++;
            const { key, label } = normalizeBlankToken(part, blankCounter);
            const correctAns =
              blankAnswers.correct[key] ||
              blankAnswers.correct[label] ||
              blankAnswers.correct[`blank_${blankCounter}`] ||
              '';

            if (isFilled && correctAns) {
              return (
                <AppText key={`blank-${index}`} style={styles.inlineBlankFilled}>
                  {` [ (${label}) ${correctAns} ] `}
                </AppText>
              );
            }

            return (
              <AppText key={`blank-${index}`} style={styles.inlineBlankSlot}>
                {` [ (${label}) ________ ] `}
              </AppText>
            );
          }

          return <AppText key={`txt-${index}`}>{part}</AppText>;
        })}
      </AppText>
    );
  };

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

          {/* Passage / Reading Context Card (if present) */}
          {contextText ? (
            <View style={styles.contextCard}>
              <TouchableOpacity
                style={styles.contextHeader}
                onPress={() => setIsContextExpanded(!isContextExpanded)}
                activeOpacity={0.7}
              >
                <View style={styles.contextHeaderLeft}>
                  <Feather name="book-open" size={16} color="#4F46E5" style={{ marginRight: 8 }} />
                  <AppText style={styles.contextHeaderText}>
                    {contextTitle || 'Passage / Context'}
                  </AppText>
                </View>
                <Feather
                  name={isContextExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>

              {isContextExpanded && (
                <View style={styles.contextBody}>
                  {renderTextWithBlanks(contextText, blankViewMode === 'filled', true)}
                </View>
              )}
            </View>
          ) : null}

          {/* Question Prompt Card */}
          <View style={styles.questionCard}>
            <View style={styles.questionCardHeaderRow}>
              {instructions ? (
                <AppText style={styles.instructionText}>{instructions}</AppText>
              ) : <View style={{ flex: 1 }} />}

              {hasBlanksInContent && (
                <View style={styles.blankToggleWrap}>
                  <TouchableOpacity
                    style={[styles.blankToggleBtn, blankViewMode === 'blank' && styles.blankToggleBtnActive]}
                    onPress={() => setBlankViewMode('blank')}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="minus"
                      size={12}
                      color={blankViewMode === 'blank' ? '#6D28D9' : '#64748B'}
                      style={{ marginRight: 4 }}
                    />
                    <AppText
                      style={[
                        styles.blankToggleText,
                        blankViewMode === 'blank' && styles.blankToggleTextActive,
                      ]}
                    >
                      Blank View
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.blankToggleBtn, blankViewMode === 'filled' && styles.blankToggleBtnActive]}
                    onPress={() => setBlankViewMode('filled')}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="check-circle"
                      size={12}
                      color={blankViewMode === 'filled' ? '#16A34A' : '#64748B'}
                      style={{ marginRight: 4 }}
                    />
                    <AppText
                      style={[
                        styles.blankToggleText,
                        blankViewMode === 'filled' && styles.blankToggleTextActive,
                      ]}
                    >
                      Filled View
                    </AppText>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {renderTextWithBlanks(questionText, blankViewMode === 'filled', false)}
          </View>

          {/* Blanks & Answers Breakdown Card */}
          {blankItems.length > 0 && (
            <View style={styles.blanksBreakdownCard}>
              <View style={styles.blanksBreakdownHeader}>
                <Feather name="check-square" size={15} color="#6D28D9" style={{ marginRight: 6 }} />
                <AppText style={styles.blanksBreakdownTitle}>Blanks Breakdown</AppText>
              </View>

              <View style={styles.blanksBreakdownList}>
                {blankItems.map((item, idx) => (
                  <View key={item.key || idx} style={styles.blankBreakdownRow}>
                    <View style={styles.blankIndexBadge}>
                      <AppText style={styles.blankIndexBadgeText}>({item.label})</AppText>
                    </View>

                    <View style={styles.blankBreakdownContent}>
                      <View style={styles.blankAnswerLine}>
                        <AppText style={styles.blankAnswerLabel}>Correct: </AppText>
                        <AppText style={styles.blankCorrectText}>{item.correctAnswer || 'Not specified'}</AppText>
                      </View>

                      <View style={styles.blankAnswerLine}>
                        <AppText style={styles.blankAnswerLabel}>Your Answer: </AppText>
                        <AppText
                          style={[
                            styles.blankUserText,
                            item.isCorrect ? styles.blankUserTextCorrect : styles.blankUserTextWrong,
                          ]}
                        >
                          {item.userAnswer || 'No answer provided'}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.blankStatusIconWrap}>
                      {item.isCorrect ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      ) : (
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Choices List (if available) */}
          {choices.length > 0 && (
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
          )}

          {/* Explanation Box */}
          <View style={styles.explanationBox}>
            <AppText style={styles.explanationHeader}>Explanation</AppText>
            <AppText style={styles.explanationBody}>
              {explanation || 'No explanation provided for this question.'}
            </AppText>

            {examples.length > 0 && (
              <View style={styles.examplesContainer}>
                <AppText style={styles.examplesHeader}>Examples:</AppText>
                {examples.map((ex, idx) => (
                  <AppText key={idx} style={styles.exampleItem}>
                    {ex}
                  </AppText>
                ))}
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
  // Context / Passage styles
  contextCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
  },
  contextHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contextHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  contextBody: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  passageText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '400',
  },

  // Question Card and Blank Toggle styles
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  questionCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  blankToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    alignSelf: 'flex-start',
  },
  blankToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  blankToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  blankToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  blankToggleTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  inlineBlankSlot: {
    color: '#6D28D9',
    backgroundColor: '#EDE9FE',
    fontWeight: '700',
  },
  inlineBlankFilled: {
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 18,
    flex: 1,
  },
  questionPromptText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },

  // Blanks & Answers Breakdown Card
  blanksBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  blanksBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  blanksBreakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  blanksBreakdownList: {
    gap: 10,
  },
  blankBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  blankIndexBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  blankIndexBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  blankBreakdownContent: {
    flex: 1,
    gap: 4,
  },
  blankAnswerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  blankAnswerLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  blankCorrectText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
  },
  blankUserText: {
    fontSize: 13,
    fontWeight: '700',
  },
  blankUserTextCorrect: {
    color: '#15803D',
  },
  blankUserTextWrong: {
    color: '#DC2626',
  },
  blankStatusIconWrap: {
    marginLeft: 10,
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
