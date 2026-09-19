import { AppText } from '@/components/AppText';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Platform, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { examService, UserAttempt, UserResponseItem, isSectionBasedExam, resolveNumericExamId } from '@/services/exam';
import { guestService } from '@/services/guest';
import { storage } from '@/services/storage';
import { BASE_URL } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatQuestionText } from '@/utils/questionFormatter';
import {
  SubscriptionRequiredModal,
  isSubscriptionError,
  getSubscriptionErrorMessage,
} from '@/components/SubscriptionRequiredModal';
import { ExamSupportModal } from '@/components/ExamSupportModal';
import { navigateWithFrom } from '@/utils/helpNavigation';

export default function ExamSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    attempt_id?: string;
    exam_type_id?: string;
    mode?: string;
    sections?: string;
    time_limit?: string;
    exam_name?: string;
    is_guest?: string;
  }>();

  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [examName, setExamName] = useState<string>(params.exam_name || '');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  // In-place re-authentication for 401 recovery (Zero-Data-Loss)
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);

  // Active indices
  const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);

  // Modals
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Calculator States
  const [calcExpression, setCalcExpression] = useState('');
  const [calcResult, setCalcResult] = useState('0');

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(7200);

  // Fetch or initialize exam attempt
  useEffect(() => {
    let isMounted = true;

    const initExam = async () => {
      try {
        setIsLoading(true);
        let currentAttempt: UserAttempt | null = null;

        if (params.attempt_id) {
          try {
            const res = await examService.resumeExam(Number(params.attempt_id));
            if (res.status === 'Completed' || res.timer_info?.is_expired) {
              await storage.remove('@classore_active_attempt').catch(() => {});
              examService.clearActiveAttemptId();
              router.replace({
                pathname: '/(exam)/test-result',
                params: { attempt_id: String(params.attempt_id) }
              });
              return;
            }
            currentAttempt = res;
            if (res.timer_info?.remaining_seconds !== undefined) {
              setSecondsRemaining(res.timer_info.remaining_seconds);
            }
          } catch (e: any) {
            console.warn('Failed to resume attempt:', e);
            if (e?.response?.data?.is_completed || e?.response?.data?.status === 'Completed' || e?.response?.status === 400) {
              await storage.remove('@classore_active_attempt').catch(() => {});
              examService.clearActiveAttemptId();
              router.replace({
                pathname: '/(exam)/test-result',
                params: { attempt_id: String(params.attempt_id) }
              });
              return;
            }
          }
        }

        // Check if this exam is a section/language proficiency exam (IELTS, TOEFL, etc.)
        const allExams = await examService.getExams();
        const fallbackDefaultExamId = (allExams && allExams.length > 0) ? allExams[0].id : 1;
        let targetExamId = currentAttempt?.exam_type || resolveNumericExamId(params.exam_type_id || (params as any).exam, fallbackDefaultExamId);
        const targetExamObj = allExams.find(e => e.id === targetExamId);
        const isSectionExam = isSectionBasedExam(targetExamObj?.name, currentAttempt?.sections);

        if (isSectionExam) {
          router.replace({
            pathname: '/(exam)/ielts-session',
            params: {
              attempt_id: currentAttempt ? String(currentAttempt.id) : params.attempt_id,
              exam: String(targetExamId || 42),
              exam_type_id: String(targetExamId || 42),
              mode: params.mode || 'Standard',
              sections: params.sections,
            }
          });
          return;
        }

        if (!currentAttempt) {
          let selectedSectionIds: number[] | undefined;
          if (params.sections) {
            try {
              selectedSectionIds = typeof params.sections === 'string' ? JSON.parse(params.sections) : params.sections;
            } catch {
              selectedSectionIds = undefined;
            }
          }
          const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;

          try {
            const newAttempt = await examService.startExam({
              exam_type_id: targetExamId || 41,
              mode: (params.mode as any) || 'Standard',
              selected_section_ids: selectedSectionIds,
              time_limit_override: params.mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
            });
            const res = await examService.resumeExam(newAttempt.id);
            currentAttempt = res;
            if (res.timer_info?.remaining_seconds !== undefined) {
              setSecondsRemaining(res.timer_info.remaining_seconds);
            }
          } catch (err: any) {
            console.error('Backend start exam call failed:', err);
            const errorMsg = getSubscriptionErrorMessage(
              err,
              'Failed to start exam session.'
            );
            if (isSubscriptionError(err)) {
              setSubscriptionMessage(errorMsg);
              setShowSubscriptionModal(true);
              return;
            }
            Alert.alert('Unable to Start Exam', errorMsg, [
              { text: 'Go Back', onPress: () => router.canGoBack() ? router.back() : router.replace('/') }
            ]);
            return;
          }
        }

        if (isMounted) {
          const resolvedName = params.exam_name || currentAttempt?.exam_name || (currentAttempt as any)?.exam_title || targetExamObj?.name;
          if (resolvedName) {
            setExamName(resolvedName);
          }
        }

        if (isMounted && currentAttempt) {
          setAttempt(currentAttempt);
          const resolvedTitle = targetExamObj?.name || currentAttempt.exam_name || (currentAttempt as any)?.exam_title || params.exam_name || 'Standard Exam';
          storage.set('@classore_active_attempt', {
            id: currentAttempt.id,
            exam_type: targetExamId,
            title: resolvedTitle,
            is_section_based: false,
          }).catch(() => {});
          
          // Populate existing answers and bookmarks if any
          const initialAnswers: Record<number, number> = {};
          const initialBookmarks: number[] = [];
          currentAttempt.sections?.forEach(sec => {
            sec.question_groups?.forEach(grp => {
              grp.responses?.forEach(resp => {
                if (resp.selected_choice) {
                  initialAnswers[resp.question.id] = resp.selected_choice;
                }
                if (resp.is_bookmarked && resp.question?.id) {
                  initialBookmarks.push(resp.question.id);
                }
              });
            });
          });
          setUserAnswers(initialAnswers);
          setBookmarkedQuestions(initialBookmarks);

          // Time limit fallback if not set by resume timer_info
          if (!currentAttempt.time_limit_override && currentAttempt.time_limit_override) {
            setSecondsRemaining(currentAttempt.time_limit_override * 60);
          }
        }
      } catch (error) {
        console.error('Failed to initialize exam session:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initExam();

    return () => {
      isMounted = false;
    };
  }, [params.attempt_id, params.exam_type_id]);

  // Countdown timer interval
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleTimeExpired();
      return;
    }
    const interval = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const timeString = useMemo(() => {
    const h = Math.floor(secondsRemaining / 3600).toString().padStart(2, '0');
    const m = Math.floor((secondsRemaining % 3600) / 60).toString().padStart(2, '0');
    const s = (secondsRemaining % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [secondsRemaining]);

  // Flattened questions for the currently active section
  const currentSection = attempt?.sections?.[activeSubjectIndex];
  const sectionQuestions = useMemo(() => {
    if (!currentSection) return [];
    const list: { response: UserResponseItem; group: any }[] = [];
    currentSection.question_groups?.forEach(grp => {
      grp.responses?.forEach(resp => {
        list.push({ response: resp, group: grp });
      });
    });
    return list;
  }, [currentSection]);

  // Overall & Per-Subject Exam Statistics
  const examStats = useMemo(() => {
    let total = 0;
    let answered = 0;
    let bookmarked = 0;

    const subjectsBreakdown: {
      name: string;
      total: number;
      answered: number;
      unanswered: number;
      index: number;
    }[] = [];

    if (attempt?.sections && attempt.sections.length > 0) {
      attempt.sections.forEach((sec, idx) => {
        let secTotal = 0;
        let secAnswered = 0;

        sec.question_groups?.forEach(grp => {
          grp.responses?.forEach(resp => {
            secTotal += 1;
            total += 1;
            const qId = resp.question?.id;
            if (qId) {
              if (userAnswers[qId] !== undefined && userAnswers[qId] !== null) {
                secAnswered += 1;
                answered += 1;
              }
              if (bookmarkedQuestions.includes(qId)) {
                bookmarked += 1;
              }
            }
          });
        });

        subjectsBreakdown.push({
          name: sec.section_name || `Subject ${idx + 1}`,
          total: secTotal,
          answered: secAnswered,
          unanswered: Math.max(0, secTotal - secAnswered),
          index: idx,
        });
      });
    } else {
      total = sectionQuestions.length > 0 ? sectionQuestions.length : 40;
      answered = Object.keys(userAnswers).length;
      bookmarked = bookmarkedQuestions.length;
    }

    const unanswered = Math.max(0, total - answered);

    return {
      total,
      answered,
      unanswered,
      bookmarked,
      subjectsBreakdown,
      hasMultipleSubjects: subjectsBreakdown.length > 1,
    };
  }, [attempt?.sections, userAnswers, bookmarkedQuestions, sectionQuestions.length]);

  // Keep @classore_active_attempt and recent attempts synchronized with real-time dynamic answered count
  useEffect(() => {
    if (!attempt?.id) return;
    const resolvedTitle = examName || attempt.exam_name || (attempt as any).exam_title || 'Standard Exam';
    const activeData = {
      id: attempt.id,
      exam_type: attempt.exam_type || 41,
      title: resolvedTitle,
      is_section_based: false,
      total_questions: examStats.total,
      answered_questions: examStats.answered,
      status: 'in_progress',
      timestamp: Date.now(),
    };
    storage.set('@classore_active_attempt', activeData).catch(() => {});
    examService.saveRecentAttempt(activeData).catch(() => {});
  }, [attempt?.id, attempt?.exam_type, attempt?.exam_name, examName, examStats.total, examStats.answered]);

  const currentItem = sectionQuestions[activeQuestionIndex];
  const currentQuestion = currentItem?.response?.question;

  // Handle Option Select & Auto-save
  const handleSelectOption = async (choiceId: number) => {
    if (!currentQuestion) return;

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: choiceId,
    }));

    // Auto-save to backend if attempt ID exists
    if (attempt?.id) {
      try {
        await examService.autoSave(attempt.id, {
          responses: [
            {
              question_id: currentQuestion.id,
              choice_id: choiceId,
            }
          ]
        });
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }
  };

  const toggleBookmark = async (qId: number) => {
    const isCurrentlyBookmarked = bookmarkedQuestions.includes(qId);
    const nextState = !isCurrentlyBookmarked;

    setBookmarkedQuestions(prev => 
      isCurrentlyBookmarked ? prev.filter(id => id !== qId) : [...prev, qId]
    );

    if (attempt?.id) {
      try {
        await examService.autoSave(attempt.id, {
          responses: [{ question_id: qId, is_bookmarked: nextState }]
        });
      } catch (err) {
        console.warn('Bookmark sync error:', err);
      }

      try {
        if (nextState) {
          await examService.saveQuestion(qId);
        } else {
          await examService.removeSavedQuestion(qId);
        }
      } catch (err) {
        console.warn('Saved-question sync error:', err);
      }
    }
  };

  // Auto-save heartbeat every 2 minutes to keep session warm and back up answers
  useEffect(() => {
    if (!attempt?.id) return;
    const interval = setInterval(async () => {
      try {
        const answeredIds = Object.keys(userAnswers).map(Number);
        if (answeredIds.length > 0) {
          const autoSavePayload = answeredIds.map(qId => ({
            question_id: qId,
            choice_id: userAnswers[qId] || null,
            is_bookmarked: bookmarkedQuestions.includes(qId),
          }));
          await examService.autoSave(attempt.id, { responses: autoSavePayload });
        }
      } catch (err) {
        console.warn('Exam auto-save heartbeat warning (non-fatal):', err);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [attempt?.id, userAnswers, bookmarkedQuestions]);

  const handleTimeExpired = () => {
    Alert.alert('Time Up!', 'Your examination time has elapsed. Your answers will now be submitted.', [
      { text: 'OK', onPress: executeSubmit }
    ]);
  };

  const handleInPlaceReauth = async () => {
    if (!reauthPassword.trim()) {
      setReauthError('Please enter your password.');
      return;
    }
    const targetEmail = user?.email || (await storage.get('@classore_last_email'));
    if (!targetEmail) {
      setReauthError('Account email not found. Please log in again.');
      return;
    }

    try {
      setIsReauthenticating(true);
      setReauthError(null);
      const res = await axios.post(`${BASE_URL}/api/auth/login/`, {
        username: targetEmail,
        password: reauthPassword.trim(),
      });
      const newToken = res.data?.token || res.data?.access || res.data?.key;
      if (newToken) {
        await login(newToken, res.data?.refresh || undefined);
        setShowReauthModal(false);
        setReauthPassword('');
        // Retry submission immediately with new authenticated session!
        await executeSubmit();
      } else {
        setReauthError('No authentication token returned by server.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.response?.data?.message || 'Invalid password. Please try again.';
      setReauthError(msg);
    } finally {
      setIsReauthenticating(false);
    }
  };

  const executeSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (attempt?.id) {
        const allAnsweredQIds = new Set(Object.keys(userAnswers).map(Number));
        const allBookmarkedQIds = new Set(bookmarkedQuestions);
        const allQIds = new Set([...allAnsweredQIds, ...allBookmarkedQIds]);
        const responsesPayload = Array.from(allQIds).map(qId => ({
          question_id: qId,
          choice_id: userAnswers[qId] || null,
          is_bookmarked: allBookmarkedQIds.has(qId),
        }));

        // Zero-Data-Loss: Always cache pending submission locally before firing API call
        const pendingKey = `@classore_pending_submission_${attempt.id}`;
        await storage.set(pendingKey, {
          attempt_id: attempt.id,
          responses: responsesPayload,
          saved_at: Date.now(),
        });

        const submitRes = await examService.submitExam(attempt.id, { responses: responsesPayload });
        await storage.set('@classore_last_attempt_id', attempt.id);
        await storage.remove(pendingKey);
        await storage.remove('@classore_active_attempt');
        examService.saveRecentAttempt({
          id: attempt.id,
          exam_type: attempt.exam_type || 41,
          title: (attempt as any)?.exam_name || params.exam_name || examName || 'Practice Test',
          total_questions: examStats.total,
          answered_questions: examStats.answered,
          status: 'completed',
          is_section_based: false,
          timestamp: Date.now(),
        }).catch(() => {});
        const isGuest = params.is_guest === 'true' || !user;
        if (isGuest) {
          try {
            await guestService.incrementGuestAttemptsCount();
          } catch (e) {
            console.warn('Could not increment guest attempts count:', e);
          }
        }

        setShowSubmitModal(false);
        setShowReauthModal(false);
        router.replace({
          pathname: '/(exam)/test-result',
          params: { 
            attempt_id: attempt?.id ? String(attempt.id) : undefined,
            exam_name: (attempt as any)?.exam_name || params.exam_name || examName || 'Practice Test',
            is_ielts: 'false',
            total_score: submitRes?.total_score !== undefined ? String(submitRes.total_score) : '',
            is_guest: isGuest ? 'true' : undefined,
          }
        });
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      const is401 = err?.response?.status === 401 || err?.status === 401;
      if (is401) {
        // Open in-place re-authentication modal to avoid losing candidate responses
        setShowSubmitModal(false);
        setShowReauthModal(true);
      } else {
        const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Could not submit test. Please try again.';
        Alert.alert('Submit Failed', errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrompt = () => {
    setShowSubmitModal(true);
  };

  const headerExamTitle = useMemo(() => {
    const raw = (examName || params.exam_name || '').trim();
    if (!raw) return 'Exam Simulation';
    const lower = raw.toLowerCase();
    if (lower.includes('simulation') || lower.includes('test') || lower.includes('exam')) {
      return raw;
    }
    return `${raw} Simulation`;
  }, [examName, params.exam_name]);

  // Calculator Logic
  const handleCalcPress = (btn: string) => {
    if (btn === 'AC') {
      setCalcExpression('');
      setCalcResult('0');
    } else if (btn === '=') {
      try {
        if (!calcExpression) return;
        const evalStr = calcExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + evalStr)();
        if (result === Infinity || Number.isNaN(result)) {
          setCalcResult('Error');
        } else {
          const formatted = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(6)).toString();
          setCalcResult(formatted);
          setCalcExpression(formatted);
        }
      } catch (e) {
        setCalcResult('Error');
      }
    } else {
      setCalcExpression(prev => prev + btn);
    }
  };

  // Fallback data when running standalone mock
  const fallbackSubjects = ['Mathematics', 'Use of English', 'Physics', 'Chemistry'];
  const subjectsList = attempt?.sections?.map(s => s.section_name) || fallbackSubjects;

  const fallbackOptions = [
    { id: 1, text: '2πr' },
    { id: 2, text: 'πr²' },
    { id: 3, text: 'πd' },
    { id: 4, text: '2πr²' }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#6D28D9" />
        <AppText style={{ marginTop: 12, color: '#6B7280' }}>Loading Exam Session...</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowExit(true)}>
            <Feather name="menu" size={20} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>{headerExamTitle}</AppText>
          <View style={styles.timerBadge}>
            <AppText style={styles.timerText}>{timeString}</AppText>
          </View>
        </View>

        {/* Subjects Horizontal List */}
        <View style={styles.subjectsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {subjectsList.map((subject, idx) => {
              const isActive = activeSubjectIndex === idx;
              return (
                <TouchableOpacity 
                  key={subject} 
                  style={[styles.subjectPill, isActive && styles.subjectPillActive]}
                  onPress={() => {
                    setActiveSubjectIndex(idx);
                    setActiveQuestionIndex(0);
                  }}
                >
                  <AppText style={[styles.subjectText, isActive && styles.subjectTextActive]}>
                    {subject}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Question Area */}
        <ScrollView style={styles.questionArea} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <AppText style={styles.questionNumberText}>
              Question {activeQuestionIndex + 1} of {sectionQuestions.length || 40}
            </AppText>
            <TouchableOpacity 
              style={styles.bookmarkButton} 
              onPress={() => currentQuestion && toggleBookmark(currentQuestion.id)}
            >
              <Ionicons 
                name={currentQuestion && bookmarkedQuestions.includes(currentQuestion.id) ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={currentQuestion && bookmarkedQuestions.includes(currentQuestion.id) ? '#F59E0B' : '#6B7280'} 
              />
            </TouchableOpacity>
          </View>

          {/* Passage / Context Text if present */}
          {currentItem?.group?.context_text ? (
            <View style={styles.passageCard}>
              <AppText style={styles.passageTitle}>{currentItem.group.group_title || 'Reading Passage'}</AppText>
              <AppText style={styles.passageText}>{formatQuestionText(currentItem.group.context_text)}</AppText>
            </View>
          ) : null}

          {/* Question Text */}
          <AppText style={styles.questionText}>
            {formatQuestionText(currentQuestion?.text) || 'Which of the following is the correct formula for calculating the area of a circle?'}
          </AppText>

          {/* Options */}
          <View style={styles.optionsList}>
            {(currentQuestion?.choices && currentQuestion.choices.length > 0 
              ? currentQuestion.choices 
              : fallbackOptions
            ).map((opt, optIdx) => {
              const label = String.fromCharCode(65 + optIdx); // A, B, C, D
              const isSelected = currentQuestion 
                ? userAnswers[currentQuestion.id] === opt.id 
                : userAnswers[0] === opt.id;

              return (
                <TouchableOpacity 
                  key={opt.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(opt.id)}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {label}
                  </AppText>
                  <AppText style={styles.optionContent}>{opt.text}</AppText>
                  {isSelected && (
                    <View style={styles.checkedCircle}>
                      <Feather name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Previous / Next Navigation Buttons */}
        <View style={styles.navButtonsContainer}>
          <TouchableOpacity 
            style={[styles.prevButton, activeQuestionIndex === 0 && { opacity: 0.5 }]}
            disabled={activeQuestionIndex === 0}
            onPress={() => setActiveQuestionIndex(prev => Math.max(prev - 1, 0))}
          >
            <AppText style={styles.prevButtonText}>Previous</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton, 
              activeQuestionIndex >= sectionQuestions.length - 1 && { opacity: 0.5 }
            ]}
            disabled={activeQuestionIndex >= sectionQuestions.length - 1}
            onPress={() => setActiveQuestionIndex(prev => Math.min(prev + 1, sectionQuestions.length - 1))}
          >
            <AppText style={styles.nextButtonText}>Next</AppText>
          </TouchableOpacity>
        </View>

        {/* Bottom Tab Bar Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBarItem} onPress={() => setShowCalculator(true)}>
            <Ionicons name="calculator-outline" size={24} color="#6B7280" />
            <AppText style={styles.bottomBarText}>Calculator</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomBarItem} onPress={() => setShowPalette(true)}>
            <Feather name="grid" size={24} color="#6B7280" />
            <AppText style={styles.bottomBarText}>Palette</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bottomBarItem} 
            onPress={handleSubmitPrompt}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Feather name="flag" size={24} color="#EF4444" />
            )}
            <AppText style={[styles.bottomBarText, { color: '#EF4444' }]}>Submit</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.bottomBarItem}
            onPress={() => setShowSupportModal(true)}
          >
            <Feather name="headphones" size={24} color="#6B7280" />
            <AppText style={styles.bottomBarText}>Support</AppText>
          </TouchableOpacity>
        </View>

      </View>

      {/* Calculator Modal */}
      <Modal visible={showCalculator} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorCard}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Calculator</AppText>
              <TouchableOpacity onPress={() => setShowCalculator(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.calcDisplay}>
              <AppText style={styles.calcDisplayText} numberOfLines={1} adjustsFontSizeToFit>
                {calcExpression || calcResult}
              </AppText>
            </View>
            <View style={styles.calcGrid}>
              {['(', ')', '%', 'AC', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.calcBtn, 
                    btn === 'AC' || btn === '=' ? styles.calcBtnPurple : null
                  ]}
                  onPress={() => handleCalcPress(btn)}
                  activeOpacity={0.7}
                >
                  <AppText style={[
                    styles.calcBtnText, 
                    btn === 'AC' || btn === '=' ? styles.calcBtnTextWhite : null
                  ]}>{btn}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Question Palette Modal */}
      <Modal visible={showPalette} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.paletteCard}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Question Palette</AppText>
              <TouchableOpacity onPress={() => setShowPalette(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.paletteLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6D28D9' }]} /><AppText style={styles.legendText}>Answered</AppText></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><AppText style={styles.legendText}>Current</AppText></View>
              <View style={styles.legendItem}><Ionicons name="bookmark" size={13} color="#F59E0B" style={{ marginRight: 4 }} /><AppText style={styles.legendText}>Bookmarked</AppText></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' }]} /><AppText style={styles.legendText}>Unanswered</AppText></View>
            </View>
            <ScrollView style={styles.paletteScroll}>
              <View style={styles.paletteGrid}>
                {(sectionQuestions.length > 0 ? sectionQuestions : Array.from({ length: 40 })).map((item: any, i) => {
                  const num = i + 1;
                  const qId = item?.response?.question?.id;
                  const isAnswered = qId ? !!userAnswers[qId] : false;
                  const isCurrent = i === activeQuestionIndex;
                  const isBookmarked = qId ? bookmarkedQuestions.includes(qId) : false;

                  return (
                    <TouchableOpacity 
                      key={num} 
                      style={[
                        styles.paletteBtn, 
                        styles.paletteBtnDefault,
                        isAnswered && styles.paletteBtnAnswered,
                        isCurrent && styles.paletteBtnCurrent,
                        isBookmarked && !isAnswered && styles.paletteBtnBookmarked,
                      ]}
                      onPress={() => {
                        setActiveQuestionIndex(i);
                        setShowPalette(false);
                      }}
                    >
                      <AppText style={[
                        styles.paletteBtnText, 
                        styles.paletteBtnTextDefault,
                        (isAnswered || isCurrent) && styles.paletteBtnTextAnswered
                      ]}>{num}</AppText>
                      {isBookmarked && (
                        <View style={styles.paletteBookmarkDot}>
                          <Ionicons name="bookmark" size={9} color="#F59E0B" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.paletteSubmitBtn} 
              onPress={() => {
                setShowPalette(false);
                setShowSubmitModal(true);
              }}
            >
              <Feather name="flag" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <AppText style={styles.paletteSubmitBtnText}>Submit Examination</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Exit Test Modal */}
      <Modal visible={showExit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.exitCard}>
            <View style={styles.exitHeader}>
              <View style={styles.exitIconBg}>
                <Feather name="log-out" size={24} color="#EF4444" />
              </View>
              <TouchableOpacity onPress={() => setShowExit(false)} style={styles.closeExitBtn}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <AppText style={styles.exitTitle}>Exit Test?</AppText>
            <AppText style={styles.exitSubtitle}>Are you sure you want to exit the test?</AppText>
            <AppText style={styles.exitDesc}>Your progress will be saved up to your last answer.</AppText>
            
            <View style={styles.exitActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowExit(false)}>
                <AppText style={styles.cancelBtnText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={() => { setShowExit(false); router.replace('/(tabs)'); }}>
                <AppText style={styles.exitBtnText}>Exit Test</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submit Test Confirmation Modal */}
      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.submitModalCard}>
            <View style={styles.submitModalHeader}>
              <View style={styles.submitIconBg}>
                <Feather name="check-circle" size={26} color="#6D28D9" />
              </View>
              <TouchableOpacity 
                onPress={() => !isSubmitting && setShowSubmitModal(false)} 
                style={styles.closeExitBtn}
                disabled={isSubmitting}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <AppText style={styles.submitModalTitle}>Submit Examination?</AppText>
            <AppText style={styles.submitModalSubtitle}>
              Are you sure you want to finalize and submit your test?
            </AppText>
            
            {/* Quick Stats Summary */}
            <View style={styles.submitStatsBox}>
              <View style={styles.submitStatItem}>
                <AppText style={styles.submitStatValue}>{examStats.answered}</AppText>
                <AppText style={styles.submitStatLabel}>Answered</AppText>
              </View>
              <View style={styles.submitStatDivider} />
              <View style={styles.submitStatItem}>
                <AppText style={[styles.submitStatValue, examStats.unanswered > 0 && { color: '#D97706' }]}>
                  {examStats.unanswered}
                </AppText>
                <AppText style={styles.submitStatLabel}>Unanswered</AppText>
              </View>
              <View style={styles.submitStatDivider} />
              <View style={styles.submitStatItem}>
                <AppText style={styles.submitStatValue}>{examStats.total}</AppText>
                <AppText style={styles.submitStatLabel}>Total Qs</AppText>
              </View>
              {examStats.bookmarked > 0 && (
                <>
                  <View style={styles.submitStatDivider} />
                  <View style={styles.submitStatItem}>
                    <AppText style={styles.submitStatValue}>{examStats.bookmarked}</AppText>
                    <AppText style={styles.submitStatLabel}>Marked</AppText>
                  </View>
                </>
              )}
            </View>

            {/* Subject-by-Subject Breakdown (for multi-subject exams like JAMB) */}
            {examStats.hasMultipleSubjects && (
              <View style={styles.submitSubjectsBox}>
                <AppText style={styles.submitSubjectsTitle}>Subject Progress (Tap to switch)</AppText>
                <ScrollView style={styles.submitSubjectsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {examStats.subjectsBreakdown.map((subj) => (
                    <TouchableOpacity
                      key={subj.name}
                      style={styles.submitSubjectRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActiveSubjectIndex(subj.index);
                        setActiveQuestionIndex(0);
                        setShowSubmitModal(false);
                      }}
                    >
                      <View style={styles.submitSubjectInfo}>
                        <AppText style={styles.submitSubjectName} numberOfLines={1}>
                          {subj.name}
                        </AppText>
                        <AppText style={styles.submitSubjectCount}>
                          {subj.answered} of {subj.total} answered
                        </AppText>
                      </View>
                      <View style={[
                        styles.submitSubjectBadge,
                        subj.unanswered === 0 ? styles.submitSubjectBadgeComplete : styles.submitSubjectBadgePending
                      ]}>
                        <AppText style={[
                          styles.submitSubjectBadgeText,
                          subj.unanswered === 0 ? styles.submitSubjectBadgeTextComplete : styles.submitSubjectBadgeTextPending
                        ]}>
                          {subj.unanswered === 0 ? 'Done' : `${subj.unanswered} left`}
                        </AppText>
                      </View>
                      <Feather name="chevron-right" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <AppText style={styles.submitModalDesc}>
              Once submitted, your responses will be evaluated and graded immediately.
            </AppText>
            
            <View style={styles.submitModalActions}>
              <TouchableOpacity 
                style={styles.cancelSubmitBtn} 
                onPress={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                <AppText style={styles.cancelSubmitBtnText}>Keep Practicing</AppText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmSubmitBtn, isSubmitting && { opacity: 0.7 }]} 
                onPress={executeSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <AppText style={styles.confirmSubmitBtnText}>Yes, Submit</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-Place Re-Authentication Modal on 401 (Zero-Data-Loss) */}
      <Modal
        visible={showReauthModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isReauthenticating) setShowReauthModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.submitModalCard}>
            <View style={styles.submitModalHeader}>
              <View style={[styles.submitIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="lock-closed" size={24} color="#D97706" />
              </View>
              <TouchableOpacity 
                onPress={() => setShowReauthModal(false)}
                style={styles.closeExitBtn}
                disabled={isReauthenticating}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <AppText style={styles.submitModalTitle}>Session Expired</AppText>
            <AppText style={styles.submitModalSubtitle}>
              Your test is finished and your answers are safely saved. Please enter your password to finalize and grade your submission.
            </AppText>

            <View style={styles.reauthInputWrap}>
              <AppText style={styles.reauthInputLabel}>Account Password</AppText>
              <TextInput
                style={styles.reauthInput}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={reauthPassword}
                onChangeText={(t) => {
                  setReauthPassword(t);
                  if (reauthError) setReauthError(null);
                }}
                autoCapitalize="none"
              />
              {reauthError ? (
                <AppText style={styles.reauthErrorText}>{reauthError}</AppText>
              ) : null}
            </View>

            <View style={styles.submitModalActions}>
              <TouchableOpacity 
                style={styles.cancelSubmitBtn} 
                onPress={() => setShowReauthModal(false)}
                disabled={isReauthenticating}
              >
                <AppText style={styles.cancelSubmitBtnText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmSubmitBtn, isReauthenticating && { opacity: 0.7 }]} 
                onPress={handleInPlaceReauth}
                disabled={isReauthenticating}
              >
                {isReauthenticating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <AppText style={styles.confirmSubmitBtnText}>Authorize & Submit</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          router.replace('/(tabs)/bundles' as any);
        }}
      />

      <ExamSupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        examTitle={examName || 'Exam Session'}
        currentQuestionNumber={activeQuestionIndex + 1}
        attemptId={attempt?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timerBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    color: '#6D28D9',
    fontWeight: '700',
    fontSize: 13,
  },
  subjectsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subjectPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  subjectPillActive: {
    backgroundColor: '#6D28D9',
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  subjectTextActive: {
    color: '#FFFFFF',
  },
  questionArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  bookmarkButton: {
    padding: 4,
  },
  passageCard: {
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  passageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  passageText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionCardSelected: {
    borderColor: '#6D28D9',
    backgroundColor: '#F5F3FF',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    width: 28,
  },
  optionLabelSelected: {
    color: '#6D28D9',
  },
  optionContent: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  checkedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  prevButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calculatorCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  calcDisplay: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  calcDisplayText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  calcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  calcBtn: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcBtnPurple: {
    backgroundColor: '#6D28D9',
  },
  calcBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  calcBtnTextWhite: {
    color: '#FFFFFF',
  },
  paletteCard: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  paletteLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
  paletteScroll: {
    maxHeight: 300,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteBtn: {
    width: '17%',
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteBtnDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paletteBtnAnswered: {
    backgroundColor: '#6D28D9',
  },
  paletteBtnCurrent: {
    backgroundColor: '#F59E0B',
  },
  paletteBtnBookmarked: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFBEB',
  },
  paletteBookmarkDot: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  paletteBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paletteBtnTextDefault: {
    color: '#374151',
  },
  paletteBtnTextAnswered: {
    color: '#FFFFFF',
  },
  paletteSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6D28D9',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  paletteSubmitBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exitCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  exitHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exitIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeExitBtn: {
    padding: 4,
  },
  exitTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  exitSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  exitDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  exitActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  exitBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Submit Confirmation Modal Styles
  submitModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  submitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  submitIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  submitModalSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 14,
    lineHeight: 18,
  },
  submitStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  submitStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  submitStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6D28D9',
  },
  submitStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  submitStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  submitSubjectsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 155,
  },
  submitSubjectsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submitSubjectsScroll: {
    maxHeight: 120,
  },
  submitSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  submitSubjectInfo: {
    flex: 1,
    marginRight: 8,
  },
  submitSubjectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  submitSubjectCount: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  submitSubjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  submitSubjectBadgeComplete: {
    backgroundColor: '#DEF7EC',
  },
  submitSubjectBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  submitSubjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitSubjectBadgeTextComplete: {
    color: '#03543F',
  },
  submitSubjectBadgeTextPending: {
    color: '#92400E',
  },
  submitModalDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 16,
  },
  submitModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reauthInputWrap: {
    width: '100%',
    marginBottom: 20,
  },
  reauthInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  reauthInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  reauthErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '600',
  },
});
