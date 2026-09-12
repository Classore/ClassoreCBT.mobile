import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
  Easing,
  GestureResponderEvent,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService, UserAttempt, AttemptSection, QuestionGroupItem, UserResponseItem } from '@/services/exam';
import { storage } from '@/services/storage';
import { Audio } from 'expo-av';
import {
  SubscriptionRequiredModal,
  isSubscriptionError,
  getSubscriptionErrorMessage,
} from '@/components/SubscriptionRequiredModal';
import { formatQuestionText } from '@/utils/questionFormatter';

export default function IELTSListeningSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    attempt_id?: string;
    exam?: string;
    exam_type_id?: string;
    exam_name?: string;
    section_index?: string;
    section_order?: string;
    section_names?: string;
    mode?: string;
  }>();

  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  // Exam structure pointers
  const [listeningSection, setListeningSection] = useState<AttemptSection | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0); // 0 = Section 1, 1 = Section 2, 2 = Section 3
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0); // 0 to 9 (10 questions per section)

  // Timers
  const [totalTimeLeft, setTotalTimeLeft] = useState(3540); // 59:00 as in mockup

  // Answer Text State
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Bookmarks & Overview Modal
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [isOverviewVisible, setIsOverviewVisible] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Audio Playback State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(24000); // 00:24 as initial demo in mockup
  const [audioDuration, setAudioDuration] = useState(60000); // 01:00
  const progressBarWidth = useRef(0);

  // Waveform Bar Animations (28 symmetrical bars)
  const waveformHeights = useRef(
    Array.from({ length: 28 }, (_, i) => {
      // Symmetrical height distribution (taller in middle, shorter at edges)
      const distFromCenter = Math.abs(i - 13.5);
      const baseH = Math.max(12, 54 - distFromCenter * 3.2);
      return new Animated.Value(baseH);
    })
  ).current;

  // Set up audio mode on mount
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
        });
      } catch (e) {
        console.warn('Audio mode setup error:', e);
      }
    })();

    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Initialize Exam Attempt & Data
  useEffect(() => {
    const initListening = async () => {
      try {
        if (params.attempt_id) {
          const res = await examService.resumeExam(Number(params.attempt_id));
          setAttempt(res);
          setTotalTimeLeft(res.timer_info?.remaining_seconds ?? 3540);

          const listSec = res.sections.find(s =>
            s.section_name.toLowerCase().includes('listening')
          ) || res.sections[0];

          if (listSec) {
            setListeningSection(listSec);
          }

          // Initial answers & bookmarks
          const initialBookmarks: number[] = [];
          const initialAnswers: Record<number, string> = {};

          res.sections?.forEach(sec => {
            sec.question_groups?.forEach(grp => {
              grp.responses?.forEach(resp => {
                if (resp.is_bookmarked && resp.question?.id) {
                  initialBookmarks.push(resp.question.id);
                }
                if (resp.written_response && resp.question?.id) {
                  initialAnswers[resp.question.id] = resp.written_response;
                }
              });
            });
          });

          setBookmarkedQuestions(initialBookmarks);
          setAnswers(initialAnswers);
        } else {
          const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
          const newAttempt = await examService.startExam({
            exam_type_id: examId,
            mode: 'Standard',
          });
          const res = await examService.resumeExam(newAttempt.id);
          setAttempt(res);
          setTotalTimeLeft(res.timer_info?.remaining_seconds ?? 3540);

          const listSec = res.sections.find(s =>
            s.section_name.toLowerCase().includes('listening')
          ) || res.sections[0];

          if (listSec) {
            setListeningSection(listSec);
          }
        }
      } catch (e: any) {
        if (isSubscriptionError(e)) {
          const errorMsg = getSubscriptionErrorMessage(
            e,
            'You do not have an active subscription or bundle to access IELTS Listening.'
          );
          setSubscriptionMessage(errorMsg);
          setShowSubscriptionModal(true);
          return;
        }
        console.warn('Could not initialize listening session, generating mock session structure:', e);
        // Fallback IELTS structure matching the mockups (3 sections, 10 questions each)
        const mockStructure: AttemptSection = {
          section_id: 2,
          section_name: 'IELTS Listening',
          question_groups: [
            {
              group_id: 1,
              group_title: 'Section 1',
              group_type: 'Short Answer & Note Completion',
              context_text: 'Listen to the recording and answer questions 1 to 10.',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 101 + i,
                question: {
                  id: 101 + i,
                  question_type: 'TEXT',
                  text: `Question ${i + 1}`,
                  instructions: 'Listen to the recording and answer the question',
                },
              })),
            },
            {
              group_id: 2,
              group_title: 'Section 2',
              group_type: 'Sentence Completion & Matching',
              context_text: 'Listen to the talk about local community facilities and answer questions 11 to 20.',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 201 + i,
                question: {
                  id: 201 + i,
                  question_type: 'TEXT',
                  text: `Question ${i + 1}`,
                  instructions: 'Listen to the recording and answer the question',
                },
              })),
            },
            {
              group_id: 3,
              group_title: 'Section 3',
              group_type: 'Academic Discussion & Notes',
              context_text: 'Listen to two university students discussing their research project and answer questions 21 to 30.',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 301 + i,
                question: {
                  id: 301 + i,
                  question_type: 'TEXT',
                  text: `Question ${i + 1}`,
                  instructions: 'Listen to the recording and answer the question',
                },
              })),
            },
          ],
        };
        setListeningSection(mockStructure);
      } finally {
        setLoading(false);
      }
    };

    initListening();
  }, [params.attempt_id]);

  // Overall Timer countdown
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTotalTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  // Simulated / live audio playback timer loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioPosition(prev => {
          if (prev >= audioDuration) {
            setIsPlaying(false);
            return audioDuration;
          }
          return prev + 500;
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, audioDuration]);

  // Animated Waveform loop when playing
  useEffect(() => {
    if (isPlaying) {
      const anims = waveformHeights.map((anim, idx) => {
        const distFromCenter = Math.abs(idx - 13.5);
        const maxH = Math.max(22, 64 - distFromCenter * 3);
        const minH = Math.max(8, 20 - distFromCenter * 1.2);
        const dur = 280 + ((idx * 55) % 300);

        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: maxH,
              duration: dur,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minH,
              duration: dur,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
          ])
        );
      });

      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      // Reset to resting height
      waveformHeights.forEach((anim, idx) => {
        const distFromCenter = Math.abs(idx - 13.5);
        const baseH = Math.max(12, 54 - distFromCenter * 3.2);
        anim.setValue(baseH);
      });
    }
  }, [isPlaying]);

  // Format mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAudioTime = (millis: number) => {
    const totalSecs = Math.floor(millis / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio Controls
  const togglePlayPause = async () => {
    setIsPlaying(prev => !prev);
  };

  const handleRewind10 = () => {
    setAudioPosition(prev => Math.max(0, prev - 10000));
  };

  const handleForward10 = () => {
    setAudioPosition(prev => Math.min(audioDuration, prev + 10000));
  };

  const handleProgressBarPress = (e: GestureResponderEvent) => {
    if (progressBarWidth.current <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, clickX / progressBarWidth.current));
    setAudioPosition(Math.floor(ratio * audioDuration));
  };

  // Answer change handler
  const handleAnswerChange = (questionId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));

    if (attempt?.id) {
      examService.autoSave(attempt.id, {
        responses: [{ question_id: questionId, written_response: text }],
      }).catch(err => console.warn('Auto-save warning:', err));
    }
  };

  // Bookmark toggle
  const toggleBookmark = async (questionId: number) => {
    const isCurrentlyBookmarked = bookmarkedQuestions.includes(questionId);
    const nextState = !isCurrentlyBookmarked;

    setBookmarkedQuestions(prev =>
      isCurrentlyBookmarked ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );

    if (attempt?.id) {
      try {
        await examService.autoSave(attempt.id, {
          responses: [{ question_id: questionId, is_bookmarked: nextState }],
        });
      } catch (err) {
        console.warn('Bookmark auto-save warning:', err);
      }

      try {
        if (nextState) {
          await examService.saveQuestion(questionId);
        } else {
          await examService.removeSavedQuestion(questionId);
        }
      } catch (err) {
        console.warn('Saved-questions sync warning:', err);
      }
    }
  };

  // Navigation between questions & sections
  const activeGroup = listeningSection?.question_groups[activeGroupIndex];
  const totalQuestionsInSection = activeGroup?.responses?.length || 10;
  const currentResponse = activeGroup?.responses[currentResponseIndex];
  const currentQ = currentResponse?.question;
  const isBookmarked = currentQ?.id ? bookmarkedQuestions.includes(currentQ.id) : false;
  const currentAnswerText = (currentQ?.id && answers[currentQ.id]) || '';

  const isLastQuestionOfSection = !activeGroup || currentResponseIndex >= activeGroup.responses.length - 1;
  const isLastSection = !listeningSection || activeGroupIndex >= listeningSection.question_groups.length - 1;
  const isLastQuestionOfTest = isLastQuestionOfSection && isLastSection;

  const handleNextQuestion = () => {
    if (activeGroup && currentResponseIndex < activeGroup.responses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
    } else if (listeningSection && activeGroupIndex < listeningSection.question_groups.length - 1) {
      // Transition to next Section (e.g. Section 1 -> Section 2)
      setActiveGroupIndex(prev => prev + 1);
      setCurrentResponseIndex(0);
    } else {
      // Final section completed -> Submit
      handleSubmit();
    }
  };

  const examStats = useMemo(() => {
    if (!listeningSection?.question_groups) {
      return { total: 0, answered: 0, unanswered: 0, bookmarked: 0 };
    }
    let total = 0;
    let answered = 0;
    let bookmarked = 0;

    listeningSection.question_groups.forEach(grp => {
      grp.responses?.forEach(resp => {
        total += 1;
        const qId = resp.question?.id;
        if (qId && answers[qId] && answers[qId].trim().length > 0) {
          answered += 1;
        }
        if (qId && bookmarkedQuestions.includes(qId)) {
          bookmarked += 1;
        }
      });
    });

    return {
      total,
      answered,
      unanswered: Math.max(0, total - answered),
      bookmarked,
    };
  }, [listeningSection, answers, bookmarkedQuestions]);

  const handleSubmit = () => {
    setIsOverviewVisible(false);
    setShowSubmitModal(true);
  };

  const executeSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 1. Stop audio playback immediately
      if (sound) {
        sound.unloadAsync().catch(() => {});
        setSound(null);
        setIsPlaying(false);
      }

      // 2. Build responses payload
      const responsesPayload: any[] = [];
      listeningSection?.question_groups?.forEach(grp => {
        grp.responses?.forEach(resp => {
          const qId = resp.question?.id;
          if (!qId) return;

          const item: any = { question_id: qId };
          let hasData = false;

          const answerText = answers[qId];
          if (answerText && answerText.trim().length > 0) {
            item.written_response = answerText.trim();
            hasData = true;
          }

          if (bookmarkedQuestions.includes(qId)) {
            item.is_bookmarked = true;
            hasData = true;
          }

          if (hasData) {
            responsesPayload.push(item);
          }
        });
      });

      const attemptId = attempt?.id || Number(params.attempt_id);

      // Save responses for listening
      if (attemptId && !isNaN(attemptId) && responsesPayload.length > 0) {
        await examService.autoSave(attemptId, { responses: responsesPayload }).catch(err => {
          console.warn('Auto-save warning in listening session:', err);
        });
      }

      // Check if this exam attempt has further sections
      const fullSectionNames = params.section_names
        ? params.section_names.split(',').map(s => s.trim())
        : (attempt?.sections ? attempt.sections.map(s => s.section_name) : ['Listening']);

      const currentSecName = listeningSection?.section_name || 'Listening';
      let currentSectionIdxInList = fullSectionNames.findIndex(
        s => s.toLowerCase() === currentSecName.toLowerCase() || 
             currentSecName.toLowerCase().includes(s.toLowerCase()) || 
             s.toLowerCase().includes(currentSecName.toLowerCase())
      );
      if (currentSectionIdxInList === -1) {
        currentSectionIdxInList = params.section_index ? parseInt(String(params.section_index), 10) : 0;
      }

      const hasNextSection = currentSectionIdxInList < fullSectionNames.length - 1;

      if (hasNextSection) {
        const nextSectionIndex = currentSectionIdxInList + 1;
        const nextSectionName = fullSectionNames[nextSectionIndex];
        const completedSessionsCount = currentSectionIdxInList + 1;

        setShowSubmitModal(false);
        setIsOverviewVisible(false);

        const commonParams = {
          attempt_id: String(attemptId || ''),
          exam: params.exam || params.exam_type_id || '42',
          exam_id: params.exam || params.exam_type_id || '42',
          exam_name: params.exam_name || 'IELTS Academic',
          section_index: String(nextSectionIndex),
          section_name: nextSectionName,
          section_order: params.section_order,
          section_names: params.section_names || fullSectionNames.join(','),
          mode: params.mode,
        };

        if (completedSessionsCount % 2 === 0) {
          router.replace({
            pathname: '/(exam)/ielts-break',
            params: {
              ...commonParams,
              next_section_index: String(nextSectionIndex),
              next_section_name: nextSectionName,
            },
          });
        } else {
          if (nextSectionName.toLowerCase().includes('speaking')) {
            router.replace({
              pathname: '/(exam)/ielts-speaking-instructions',
              params: commonParams,
            });
          } else if (nextSectionName.toLowerCase().includes('listening')) {
            router.replace({
              pathname: '/(exam)/ielts-listening-instructions',
              params: commonParams,
            });
          } else {
            router.replace({
              pathname: '/(exam)/ielts-section-instructions',
              params: commonParams,
            });
          }
        }
        return;
      }

      // If this is the final section of the test, submit the entire exam
      let submitRes: any = null;
      if (attemptId && !isNaN(attemptId)) {
        submitRes = await examService.submitExam(attemptId, { responses: responsesPayload });
        await storage.remove('@classore_active_attempt');
        examService.saveRecentAttempt({
          id: attemptId,
          exam_type: 42,
          title: params.exam_name || 'IELTS Listening Test',
          total_questions: 40,
          answered_questions: 40,
          status: 'completed',
          is_section_based: true,
          timestamp: Date.now(),
        }).catch(() => {});
      }

      setShowSubmitModal(false);
      setIsOverviewVisible(false);

      router.replace({
        pathname: '/(exam)/test-result',
        params: {
          attempt_id: attemptId ? String(attemptId) : (params.attempt_id || ''),
          exam_name: params.exam_name || 'IELTS Listening Test',
          is_ielts: 'true',
          total_score: submitRes?.total_score !== undefined ? String(submitRes.total_score) : '',
          streak: submitRes?.streak !== undefined ? String(submitRes.streak) : '',
          ai_feedbacks: submitRes?.ai_feedbacks ? JSON.stringify(submitRes.ai_feedbacks) : '',
          ai_assessment_status: submitRes?.ai_assessment_status || '',
          ai_skip_reason: submitRes?.ai_skip_reason || '',
        },
      });
    } catch (err: any) {
      console.warn('Submit warning in listening session:', err);
      const attemptId = attempt?.id || Number(params.attempt_id);

      // Check if we should still try advancing to next section
      const fullSectionNames = params.section_names
        ? params.section_names.split(',').map(s => s.trim())
        : [];
      const currentSecName = listeningSection?.section_name || 'Listening';
      const currentSectionIdxInList = fullSectionNames.findIndex(
        s => s.toLowerCase() === currentSecName.toLowerCase() || s.toLowerCase().includes('listening')
      );

      if (currentSectionIdxInList !== -1 && currentSectionIdxInList < fullSectionNames.length - 1) {
        const nextSectionIndex = currentSectionIdxInList + 1;
        const nextSectionName = fullSectionNames[nextSectionIndex];
        setShowSubmitModal(false);
        setIsOverviewVisible(false);
        router.replace({
          pathname: nextSectionName.toLowerCase().includes('speaking')
            ? '/(exam)/ielts-speaking-instructions'
            : '/(exam)/ielts-section-instructions',
          params: {
            attempt_id: String(attemptId || ''),
            exam: params.exam || params.exam_type_id || '42',
            exam_name: params.exam_name || 'IELTS Academic',
            section_index: String(nextSectionIndex),
            section_name: nextSectionName,
            section_order: params.section_order,
            section_names: params.section_names,
            mode: params.mode,
          },
        });
        return;
      }

      setShowSubmitModal(false);
      setIsOverviewVisible(false);

      router.replace({
        pathname: '/(exam)/test-result',
        params: {
          attempt_id: attemptId ? String(attemptId) : (params.attempt_id || ''),
          exam_name: params.exam_name || 'IELTS Listening',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const screenTitle = useMemo(() => {
    if (params.exam_name) return params.exam_name;
    if (listeningSection?.section_name) return listeningSection.section_name;
    return 'IELTS Listening';
  }, [params.exam_name, listeningSection?.section_name]);

  if (loading || !listeningSection) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#4C1D95" />
          <Text style={styles.loadingText}>Setting up Listening Assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Section Tabs (3 sections of 20 mins)
  const sectionTabs = [
    { title: 'Section 1', duration: '20mins' },
    { title: 'Section 2', duration: '20mins' },
    { title: 'Section 3', duration: '20mins' },
  ];

  const progressPercent = audioDuration > 0 ? (audioPosition / audioDuration) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerMenuButton}
            onPress={() => setIsOverviewVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="menu" size={20} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{screenTitle}</Text>

          <View style={styles.timerBadge}>
            <Text style={styles.timerBadgeText}>{formatTime(totalTimeLeft)}</Text>
          </View>
        </View>

        {/* Section Tabs Row */}
        <View style={styles.sectionTabsContainer}>
          {sectionTabs.map((tab, idx) => {
            const isActive = idx === activeGroupIndex;
            const isCompleted = idx < activeGroupIndex;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.sectionTab,
                  isActive ? styles.sectionTabActive : styles.sectionTabInactive,
                ]}
                onPress={() => {
                  setActiveGroupIndex(idx);
                  setCurrentResponseIndex(0);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={[
                      styles.sectionTabTitle,
                      isActive ? styles.sectionTabTitleActive : styles.sectionTabTitleInactive,
                    ]}
                  >
                    {tab.title}
                  </Text>
                  {isCompleted && !isActive && (
                    <Feather name="check" size={12} color="#059669" />
                  )}
                </View>
                <Text
                  style={[
                    styles.sectionTabSub,
                    isActive ? styles.sectionTabSubActive : styles.sectionTabSubInactive,
                  ]}
                >
                  {tab.duration}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Subheader: Range Label + Bookmark */}
          <View style={styles.subheaderRow}>
            <Text style={styles.questionRangeLabel}>
              Question 1-10
            </Text>

            <TouchableOpacity
              style={[
                styles.bookmarkButton,
                isBookmarked && styles.bookmarkButtonActive,
              ]}
              onPress={() => currentQ?.id && toggleBookmark(currentQ.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isBookmarked ? "#4C1D95" : "#4B5563"}
              />
            </TouchableOpacity>
          </View>

          {/* Question Title & Prompt */}
          <Text style={styles.questionTitle}>
            Question {currentResponseIndex + 1}
          </Text>
          <Text style={styles.questionPrompt}>
            {currentQ?.text ? formatQuestionText(currentQ.text) : (currentQ?.instructions || 'Listen to the recording and answer the question')}
          </Text>

          {/* Audio Player Section */}
          <View style={styles.audioPlayerSection}>
            {/* Waveform Equalizer */}
            <View style={styles.waveformContainer}>
              {waveformHeights.map((animH, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: animH },
                  ]}
                />
              ))}
            </View>

            {/* Time Indicators */}
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatAudioTime(audioPosition)}</Text>
              <Text style={styles.timeText}>{formatAudioTime(audioDuration)}</Text>
            </View>

            {/* Scrubber / Progress Bar */}
            <TouchableOpacity
              style={styles.progressBarWrapper}
              activeOpacity={1}
              onPress={handleProgressBarPress}
              onLayout={e => {
                progressBarWidth.current = e.nativeEvent.layout.width;
              }}
            >
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFilled, { width: `${progressPercent}%` }]} />
              </View>
              {/* Scrubber Knob */}
              <View
                style={[
                  styles.scrubberThumb,
                  { left: `${Math.max(0, Math.min(97, progressPercent))}%` },
                ]}
              />
            </TouchableOpacity>

            {/* Audio Controls Row (-10s, Play/Pause, +10s) */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleRewind10}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="rewind-10" size={30} color="#111827" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayPause}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={28}
                  color="#FFFFFF"
                  style={isPlaying ? undefined : { marginLeft: 3 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleForward10}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="fast-forward-10" size={30} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Answer Input Section */}
          <View style={styles.answerSection}>
            <View style={styles.answerHeaderRow}>
              <Text style={styles.answerSectionTitle}>Answer the question below</Text>
              <Text style={styles.charCountText}>
                {currentAnswerText.length}/100
              </Text>
            </View>

            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInputArea}
                placeholder="Type your answer here..."
                placeholderTextColor="#9CA3AF"
                value={currentAnswerText}
                onChangeText={txt => currentQ?.id && handleAnswerChange(currentQ.id, txt)}
                multiline
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Bar: Question Counter & Next Button */}
        <View style={styles.bottomCardContainer}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCounterCol}>
              <Text style={styles.bottomQuestionLabel}>Question</Text>
              <Text style={styles.bottomQuestionNumber}>
                {currentResponseIndex + 1} of {totalQuestionsInSection}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.nextButton,
                isLastQuestionOfTest && styles.submitButton,
              ]}
              onPress={handleNextQuestion}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.nextButtonContent}>
                  {isLastQuestionOfTest && (
                    <Feather name="flag" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.nextButtonText}>
                    {isLastQuestionOfTest ? 'Submit' : isLastQuestionOfSection ? 'Next Section' : 'Next Question'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hamburger Overview Modal */}
        <Modal
          visible={isOverviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOverviewVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Listening Test Overview</Text>
                <TouchableOpacity
                  onPress={() => setIsOverviewVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Feather name="x" size={18} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }}>
                {listeningSection.question_groups.map((grp, gIdx) => (
                  <View key={gIdx} style={styles.modalGroupItem}>
                    <View style={styles.modalGroupHeader}>
                      <Text style={styles.modalGroupName}>
                        {grp.group_title || `Section ${gIdx + 1}`}
                      </Text>
                      <Text style={styles.modalGroupStatus}>
                        {gIdx === activeGroupIndex
                          ? 'In Progress'
                          : gIdx < activeGroupIndex
                          ? 'Completed'
                          : 'Upcoming'}
                      </Text>
                    </View>
                    <View style={styles.modalQuestionRow}>
                      {grp.responses.map((resp, rIdx) => {
                        const isCurrent =
                          gIdx === activeGroupIndex && rIdx === currentResponseIndex;
                        const isQBookmarked =
                          resp.question?.id && bookmarkedQuestions.includes(resp.question.id);
                        const hasAnswer =
                          resp.question?.id && answers[resp.question.id]?.trim().length > 0;

                        return (
                          <TouchableOpacity
                            key={rIdx}
                            style={[
                              styles.modalQBadge,
                              isCurrent && styles.modalQBadgeCurrent,
                              Boolean(hasAnswer) && !isCurrent && styles.modalQBadgeAnswered,
                              Boolean(isQBookmarked) && styles.modalQBadgeBookmarked,
                            ]}
                            onPress={() => {
                              setActiveGroupIndex(gIdx);
                              setCurrentResponseIndex(rIdx);
                              setIsOverviewVisible(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.modalQBadgeText,
                                Boolean(isCurrent || hasAnswer) && styles.modalQBadgeTextActive,
                              ]}
                            >
                              Q{rIdx + 1}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.submitModalButton}
                onPress={() => {
                  setIsOverviewVisible(false);
                  handleSubmit();
                }}
              >
                <Feather name="flag" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.submitModalButtonText}>Finish & Submit Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* In-App Submit Confirmation Modal */}
        <Modal 
          visible={showSubmitModal} 
          transparent 
          animationType="fade"
          onRequestClose={() => !isSubmitting && setShowSubmitModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.submitConfirmCard}>
              <View style={styles.submitConfirmHeader}>
                <View style={styles.submitConfirmIconBg}>
                  <Feather name="check-circle" size={26} color="#6D28D9" />
                </View>
                <TouchableOpacity 
                  onPress={() => !isSubmitting && setShowSubmitModal(false)} 
                  style={styles.modalCloseBtn}
                  disabled={isSubmitting}
                >
                  <Feather name="x" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.submitConfirmTitle}>Submit Listening Test?</Text>
              <Text style={styles.submitConfirmSubtitle}>
                Are you sure you want to finalize and submit your listening assessment?
              </Text>
              
              {/* Quick Stats Summary */}
              <View style={styles.submitStatsBox}>
                <View style={styles.submitStatItem}>
                  <Text style={styles.submitStatValue}>{examStats.answered}</Text>
                  <Text style={styles.submitStatLabel}>Answered</Text>
                </View>
                <View style={styles.submitStatDivider} />
                <View style={styles.submitStatItem}>
                  <Text style={styles.submitStatValue}>{examStats.unanswered}</Text>
                  <Text style={styles.submitStatLabel}>Unanswered</Text>
                </View>
                <View style={styles.submitStatDivider} />
                <View style={styles.submitStatItem}>
                  <Text style={styles.submitStatValue}>{examStats.total}</Text>
                  <Text style={styles.submitStatLabel}>Total Qs</Text>
                </View>
              </View>

              <Text style={styles.submitConfirmDesc}>
                Once submitted, your responses will be evaluated and graded immediately.
              </Text>
              
              <View style={styles.submitConfirmActions}>
                <TouchableOpacity 
                  style={styles.cancelSubmitBtn} 
                  onPress={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelSubmitBtnText}>Keep Practicing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmSubmitBtn, isSubmitting && { opacity: 0.7 }]} 
                  onPress={executeSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.confirmSubmitBtnText}>Yes, Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>

      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
        subjectName="Listening"
        examName={params.exam_name || 'IELTS Academic'}
        customMessage={subscriptionMessage}
        onViewBundles={() => {
          setShowSubscriptionModal(false);
          router.replace('/(tabs)/bundles' as any);
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
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 42 : 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  timerBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  timerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // Section Tabs Row
  sectionTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  sectionTab: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTabActive: {
    backgroundColor: '#4C1D95',
  },
  sectionTabInactive: {
    backgroundColor: '#F3F4F6',
  },
  sectionTabTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTabTitleActive: {
    color: '#FFFFFF',
  },
  sectionTabTitleInactive: {
    color: '#374151',
  },
  sectionTabSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTabSubActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sectionTabSubInactive: {
    color: '#6B7280',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Subheader Row
  subheaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButtonActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#EDE9FE',
  },

  // Question Info
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  questionPrompt: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Audio Player Section
  audioPlayerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 75,
    gap: 4,
    marginVertical: 10,
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#5B21B6',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarWrapper: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#5B21B6',
    borderRadius: 2,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#5B21B6',
    top: 3,
    marginLeft: -7,
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    marginTop: 14,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  // Answer Section
  answerSection: {
    marginTop: 8,
  },
  answerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  answerSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  charCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 160,
    padding: 16,
  },
  textInputArea: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
    flex: 1,
  },

  // Bottom Card Bar
  bottomCardContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: '#FFFFFF',
  },
  bottomCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomCounterCol: {
    justifyContent: 'center',
  },
  bottomQuestionLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  bottomQuestionNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  nextButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#DC2626',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGroupItem: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalGroupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalGroupStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalQuestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalQBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalQBadgeCurrent: {
    backgroundColor: '#4C1D95',
  },
  modalQBadgeAnswered: {
    backgroundColor: '#8B5CF6',
  },
  modalQBadgeBookmarked: {
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  modalQBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalQBadgeTextActive: {
    color: '#FFFFFF',
  },
  submitModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  submitModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Submit Confirmation Modal Styles
  submitConfirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  submitConfirmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  submitConfirmIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitConfirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  submitConfirmSubtitle: {
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
  submitConfirmDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 16,
  },
  submitConfirmActions: {
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
});
