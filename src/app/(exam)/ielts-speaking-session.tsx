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
  Easing
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

type SpeakingSubState = 'get-ready' | 'listen' | 'recording';

export default function IELTSSpeakingSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string; exam?: string; exam_type_id?: string; exam_name?: string }>();
  
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  // Exam structure pointers
  const [speakingSection, setSpeakingSection] = useState<AttemptSection | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0); // 0 = Part 1, 1 = Part 2, 2 = Part 3
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  // Sub-state machine: 'get-ready' -> 'listen' -> 'recording'
  const [subState, setSubState] = useState<SpeakingSubState>('get-ready');
  
  // Timers
  const [totalTimeLeft, setTotalTimeLeft] = useState(900); // 15:00
  const [getReadyCountdown, setGetReadyCountdown] = useState(5); // 00:05
  const [questionTimeLeft, setQuestionTimeLeft] = useState(208); // 03:28 as in mockup

  // Candidate Notes (useful for Part 2 Long Turn)
  const [prepNotes, setPrepNotes] = useState('');
  const [showNotesInRecording, setShowNotesInRecording] = useState(false);

  // Bookmarks & Modal
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [isOverviewVisible, setIsOverviewVisible] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Audio Recording & Playback
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Concentric Mic Pulse Animations for 'recording'
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.25)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.15)).current;

  // Waveform Bar Animations for 'listen' (21 symmetrical bars)
  const waveformHeights = useRef(
    Array.from({ length: 21 }, (_, i) => {
      // Base height higher in center, shorter at ends
      const distFromCenter = Math.abs(i - 10);
      const baseH = Math.max(12, 58 - distFromCenter * 4.2);
      return new Animated.Value(baseH);
    })
  ).current;

  // Request audio permission on mount
  useEffect(() => {
    (async () => {
      try {
        const perm = await Audio.requestPermissionsAsync();
        setAudioPermission(perm.status === 'granted');
      } catch (e) {
        console.warn('Audio permission error:', e);
      }
    })();

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Initialize Exam Attempt & Data
  useEffect(() => {
    const initIelts = async () => {
      try {
        if (params.attempt_id) {
          const res = await examService.resumeExam(Number(params.attempt_id));
          setAttempt(res);
          setTotalTimeLeft(res.timer_info?.remaining_seconds ?? 900);
          
          const speakSec = res.sections.find(s => 
            s.section_name.toLowerCase().includes('speaking')
          ) || res.sections[0];
          
          if (speakSec) {
            setSpeakingSection(speakSec);
          }

          const initialBookmarks: number[] = [];
          res.sections?.forEach(sec => {
            sec.question_groups?.forEach(grp => {
              grp.responses?.forEach(resp => {
                if (resp.is_bookmarked && resp.question?.id) {
                  initialBookmarks.push(resp.question.id);
                }
              });
            });
          });
          setBookmarkedQuestions(initialBookmarks);
        } else {
          const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
          const newAttempt = await examService.startExam({
            exam_type_id: examId,
            mode: 'Standard',
          });
          const res = await examService.resumeExam(newAttempt.id);
          setAttempt(res);
          setTotalTimeLeft(res.timer_info?.remaining_seconds ?? 900);
          const speakSec = res.sections.find(s => 
            s.section_name.toLowerCase().includes('speaking')
          ) || res.sections[0];
          if (speakSec) {
            setSpeakingSection(speakSec);
          }
        }
      } catch (e: any) {
        if (isSubscriptionError(e)) {
          const errorMsg = getSubscriptionErrorMessage(
            e,
            'You do not have an active subscription or bundle to access IELTS Speaking.'
          );
          setSubscriptionMessage(errorMsg);
          setShowSubscriptionModal(true);
          return;
        }
        console.warn('Could not initialize speaking session, generating mock session structure:', e);
        // Fallback IELTS structure matching the mockups
        const mockStructure: AttemptSection = {
          section_id: 1,
          section_name: 'IELTS Speaking',
          question_groups: [
            {
              group_id: 1,
              group_title: 'Part 1',
              group_type: 'Introduction & Interview',
              context_text: 'The examiner will ask you general questions about yourself, your home, your work or studies and other familiar topics.',
              responses: [
                {
                  id: 101,
                  question: {
                    id: 101,
                    question_type: 'AUDIO',
                    text: 'Let us talk about your hometown. Where is your hometown located?',
                    instructions: 'Answer clearly and naturally.'
                  }
                },
                {
                  id: 102,
                  question: {
                    id: 102,
                    question_type: 'AUDIO',
                    text: 'What do you like most about your hometown?',
                    instructions: 'Provide specific examples.'
                  }
                },
                {
                  id: 103,
                  question: {
                    id: 103,
                    question_type: 'AUDIO',
                    text: 'Has your hometown changed much since you were a child?',
                    instructions: 'Describe the developments.'
                  }
                }
              ]
            },
            {
              group_id: 2,
              group_title: 'Part 2',
              group_type: 'Long Turn',
              context_text: 'Long Turn - Talk about a book you have read.',
              responses: [
                {
                  id: 201,
                  question: {
                    id: 201,
                    question_type: 'AUDIO',
                    text: 'Long Turn - Talk about a book you have read.',
                    instructions: 'You should say:\n• What the book is\n• When you read it\n• What it is about\n• And explain why you liked it.'
                  }
                }
              ]
            },
            {
              group_id: 3,
              group_title: 'Part 3',
              group_type: 'Discussion',
              context_text: 'The examiner will ask further questions connected to the topic in Part 2.',
              responses: [
                {
                  id: 301,
                  question: {
                    id: 301,
                    question_type: 'AUDIO',
                    text: 'Do people in your country read as many books today as in the past?',
                    instructions: 'Discuss reading trends and digital media.'
                  }
                },
                {
                  id: 302,
                  question: {
                    id: 302,
                    question_type: 'AUDIO',
                    text: 'What are the main advantages of reading physical books versus digital e-books?',
                    instructions: 'Compare convenience, focus, and comprehension.'
                  }
                }
              ]
            }
          ]
        };
        setSpeakingSection(mockStructure);
      } finally {
        setLoading(false);
      }
    };
    initIelts();
  }, [params.attempt_id]);

  // Total Timer countdown
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTotalTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  // Concentric Rings Pulse Animation for 'recording'
  useEffect(() => {
    if (subState === 'recording') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.3,
              duration: 1200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1.0,
              duration: 1200,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity1, {
              toValue: 0.08,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity1, {
              toValue: 0.28,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.55,
              duration: 1200,
              delay: 200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1.0,
              duration: 1200,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity2, {
              toValue: 0.03,
              duration: 1200,
              delay: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity2, {
              toValue: 0.16,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [subState]);

  // Animated Waveform loop for 'listen'
  useEffect(() => {
    if (subState === 'listen') {
      const anims = waveformHeights.map((anim, idx) => {
        const distFromCenter = Math.abs(idx - 10);
        const maxH = Math.max(20, 68 - distFromCenter * 4);
        const minH = Math.max(8, 22 - distFromCenter * 1.5);
        const dur = 320 + ((idx * 45) % 280);

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
    }
  }, [subState]);

  // Sub-State Timers & Auto-Transitions
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (subState === 'get-ready') {
      timer = setInterval(() => {
        setGetReadyCountdown(prev => {
          if (prev <= 1) {
            handleGetReadyComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (subState === 'listen') {
      timer = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleListenComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (subState === 'recording') {
      timer = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleNextAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [subState]);

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDigits = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return { mins, secs };
  };

  // Audio Recording Methods
  const startRecording = async () => {
    try {
      if (!audioPermission) {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== 'granted') return;
        setAudioPermission(true);
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (err) {
      console.warn('Failed to start audio recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      return uri;
    } catch (err) {
      console.warn('Failed to stop audio recording:', err);
      return null;
    }
  };

  // Transitions
  const handleGetReadyComplete = () => {
    setSubState('listen');
    setQuestionTimeLeft(208); // 03:28 display as in mockup
  };

  const handleStartNow = () => {
    handleGetReadyComplete();
  };

  const handleListenComplete = async () => {
    setSubState('recording');
    setQuestionTimeLeft(208); // 03:28 as in mockup
    await startRecording();
  };

  const handleNextAnswer = async () => {
    if (subState === 'listen') {
      await handleListenComplete();
      return;
    }

    if (subState === 'get-ready') {
      handleGetReadyComplete();
      return;
    }

    // In 'recording' state:
    const uri = await stopRecording();
    const activeGroup = speakingSection?.question_groups[activeGroupIndex];
    
    if (uri && attempt && activeGroup) {
      const q = activeGroup.responses[currentResponseIndex];
      if (q?.question?.id) {
        examService.uploadAudio(attempt.id, q.question.id, uri).catch(err => {
          console.warn('Audio upload warning:', err);
        });
      }
    }

    // Move to next question or next part
    if (activeGroup && currentResponseIndex < activeGroup.responses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
      setSubState('get-ready');
      setGetReadyCountdown(5);
    } else if (speakingSection && activeGroupIndex < speakingSection.question_groups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setCurrentResponseIndex(0);
      setSubState('get-ready');
      setGetReadyCountdown(5);
      setPrepNotes('');
    } else {
      handleSubmit();
    }
  };

  const toggleBookmark = async (questionId: number) => {
    const isCurrentlyBookmarked = bookmarkedQuestions.includes(questionId);
    const nextState = !isCurrentlyBookmarked;

    setBookmarkedQuestions(prev => 
      isCurrentlyBookmarked ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );

    if (attempt?.id) {
      try {
        await examService.autoSave(attempt.id, {
          responses: [{ question_id: questionId, is_bookmarked: nextState }]
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

  const handleSubmit = () => {
    setIsOverviewVisible(false);
    setShowSubmitModal(true);
  };

  const executeSubmit = async () => {
    if (recording) {
      await stopRecording();
    }
    try {
      setIsSubmitting(true);
      const attemptId = attempt?.id || Number(params.attempt_id);
      if (attemptId && !isNaN(attemptId)) {
        await examService.submitExam(attemptId, { responses: [] });
        await storage.remove('@classore_active_attempt');
        examService.saveRecentAttempt({
          id: attemptId,
          exam_type: 42,
          title: 'IELTS Speaking Test',
          total_questions: 10,
          answered_questions: 10,
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
          exam_name: params.exam_name || 'IELTS Speaking',
        }
      });
    } catch (err: any) {
      console.warn('Submit warning:', err);
      const attemptId = attempt?.id || Number(params.attempt_id);
      setShowSubmitModal(false);
      setIsOverviewVisible(false);
      router.replace({
        pathname: '/(exam)/test-result',
        params: {
          attempt_id: attemptId ? String(attemptId) : (params.attempt_id || ''),
          exam_name: params.exam_name || 'IELTS Speaking',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGroup = speakingSection?.question_groups[activeGroupIndex];
  const currentResponse = activeGroup?.responses[currentResponseIndex];
  const currentQ = currentResponse?.question;
  const isBookmarked = currentQ?.id ? bookmarkedQuestions.includes(currentQ.id) : false;

  // Title calculation: "IELTS Speaking" or "TOEFL Speaking"
  const screenTitle = useMemo(() => {
    if (params.exam_name) return params.exam_name;
    if (speakingSection?.section_name) return speakingSection.section_name;
    return 'IELTS Speaking';
  }, [params.exam_name, speakingSection?.section_name]);

  if (loading || !speakingSection) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#4C1D95" />
          <Text style={styles.loadingText}>Setting up Speaking Assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Part tabs data
  const partTabs = [
    { title: 'Part 1', duration: '4-5 Mins' },
    { title: 'Part 2', duration: '4-5 Mins' },
    { title: 'Part 3', duration: '4-5 Mins' },
  ];

  const { mins: countdownMins, secs: countdownSecs } = formatDigits(getReadyCountdown);
  const { mins: timerMins, secs: timerSecs } = formatDigits(questionTimeLeft);

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
            <Text style={styles.timerBadgeText}>{formatTotalTime(totalTimeLeft)}</Text>
          </View>
        </View>

        {/* Part Tabs Row */}
        <View style={styles.partTabsContainer}>
          {partTabs.map((tab, idx) => {
            const isActive = idx === activeGroupIndex;
            const isCompleted = idx < activeGroupIndex;
            const isHighlighted = isActive || isCompleted;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.partTab,
                  isHighlighted ? styles.partTabActive : styles.partTabInactive
                ]}
                onPress={() => {
                  if (idx <= activeGroupIndex) {
                    setActiveGroupIndex(idx);
                    setCurrentResponseIndex(0);
                    setSubState('get-ready');
                    setGetReadyCountdown(5);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.partTabTitle,
                  isHighlighted ? styles.partTabTitleActive : styles.partTabTitleInactive
                ]}>
                  {tab.title}
                </Text>
                <Text style={[
                  styles.partTabSub,
                  isHighlighted ? styles.partTabSubActive : styles.partTabSubInactive
                ]}>
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
          {/* Subheader: Part Label + Bookmark */}
          <View style={styles.subheaderRow}>
            <Text style={styles.partNumberLabel}>
              Part {activeGroupIndex + 1}
            </Text>

            <TouchableOpacity 
              style={[
                styles.bookmarkButton,
                isBookmarked && styles.bookmarkButtonActive
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

          {/* Section & Question Titles */}
          {activeGroupIndex === 0 && (
            <View style={styles.textIntroSection}>
              <Text style={styles.sectionHeading}>Introduction & Interview</Text>
              <Text style={styles.sectionDescription}>
                The examiner will ask you general questions about yourself, your home, your work or studies and other familiar topics.
              </Text>
            </View>
          )}

          {activeGroupIndex === 1 && (
            <View style={styles.textIntroSection}>
              <Text style={styles.sectionHeading}>
                {currentQ?.text?.includes('Long Turn') 
                  ? currentQ.text 
                  : `Long Turn - ${currentQ?.text || 'Talk about a book you have read.'}`}
              </Text>

              {/* Part 2 Cue Card Bullets */}
              <View style={styles.cueCardBox}>
                <Text style={styles.cueCardIntro}>You should say:</Text>
                <Text style={styles.cueBullet}>• What the book is</Text>
                <Text style={styles.cueBullet}>• When you read it</Text>
                <Text style={styles.cueBullet}>• What it is about</Text>
                <Text style={styles.cueBullet}>• And explain why you liked it.</Text>
              </View>
            </View>
          )}

          {activeGroupIndex === 2 && (
            <View style={styles.textIntroSection}>
              <Text style={styles.sectionHeading}>Two-way Discussion</Text>
              <Text style={styles.sectionDescription}>
                The examiner will ask further questions connected to the topic in Part 2.
              </Text>
            </View>
          )}

          {/* ======================================================== */}
          {/* STATE 1: GET READY (Mockup 3 & Mockup 1)                 */}
          {/* ======================================================== */}
          {subState === 'get-ready' && (
            <View style={styles.stateContainer}>
              {/* Circular Soft Purple Microphone Icon */}
              <View style={styles.getReadyMicCircle}>
                <Ionicons name="mic-outline" size={48} color="#4C1D95" />
              </View>

              <Text style={styles.stateTitle}>Get Ready</Text>
              <Text style={styles.stateSubtitle}>Please listen carefully and respond clearly.</Text>
              <Text style={styles.stateSubtitleSub}>Part {activeGroupIndex + 1} will start in</Text>

              {/* Digital Countdown */}
              <View style={styles.countdownRow}>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{countdownMins}</Text>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
                <Text style={styles.countdownColon}>:</Text>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{countdownSecs}</Text>
                  <Text style={styles.countdownUnit}>Seconds</Text>
                </View>
              </View>

              {/* Tip Card (as seen in Mockup 3) */}
              {activeGroupIndex === 0 && (
                <View style={styles.tipCard}>
                  <Feather name="info" size={18} color="#4C1D95" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>Tip</Text>
                    <Text style={styles.tipDescription}>
                      Speak clearly and naturally. There are no right or wrong answers.
                    </Text>
                  </View>
                </View>
              )}

              {/* Part 2 Quick Scratchpad Notes Toggle */}
              {activeGroupIndex === 1 && (
                <View style={styles.scratchpadContainer}>
                  <TouchableOpacity 
                    style={styles.scratchpadToggle}
                    onPress={() => setShowNotesInRecording(!showNotesInRecording)}
                  >
                    <Feather name="edit-3" size={14} color="#4C1D95" />
                    <Text style={styles.scratchpadToggleText}>
                      {showNotesInRecording ? 'Hide Scratchpad Notes' : 'Open Scratchpad for Quick Notes'}
                    </Text>
                  </TouchableOpacity>

                  {showNotesInRecording && (
                    <TextInput
                      style={styles.scratchpadInput}
                      placeholder="Jot down keywords or key points for your 2-minute talk..."
                      placeholderTextColor="#9CA3AF"
                      value={prepNotes}
                      onChangeText={setPrepNotes}
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* STATE 2: LISTEN TO THE QUESTION (Mockup 4)               */}
          {/* ======================================================== */}
          {subState === 'listen' && (
            <View style={styles.stateContainer}>
              {/* Animated Waveform Visualizer */}
              <View style={styles.waveformContainer}>
                {waveformHeights.map((animH, i) => (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.waveformBar, 
                      { height: animH }
                    ]} 
                  />
                ))}
              </View>

              <Text style={styles.stateTitle}>Listen to the Question</Text>
              <Text style={styles.stateSubtitleDark}>The examiner is asking the question</Text>

              {/* Notice Banner with amber dot */}
              <View style={styles.noticeBanner}>
                <View style={styles.amberDot} />
                <Text style={styles.noticeBannerText}>
                  Recording will start automatically, when the question ends.
                </Text>
              </View>

              {/* Digital Timer */}
              <View style={styles.countdownRow}>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{timerMins}</Text>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
                <Text style={styles.countdownColon}>:</Text>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{timerSecs}</Text>
                  <Text style={styles.countdownUnit}>Seconds</Text>
                </View>
              </View>

              <Text style={styles.timeLeftLabel}>Time Left</Text>
            </View>
          )}

          {/* ======================================================== */}
          {/* STATE 3: RECORDING YOUR ANSWER (Mockup 2)                */}
          {/* ======================================================== */}
          {subState === 'recording' && (
            <View style={styles.stateContainer}>
              {/* Concentric Pulsating Microphone Circle */}
              <View style={styles.pulseContainer}>
                {/* Outer Ring 2 */}
                <Animated.View 
                  style={[
                    styles.pulseRing2, 
                    { 
                      transform: [{ scale: pulseAnim2 }],
                      opacity: pulseOpacity2,
                    }
                  ]} 
                />
                {/* Outer Ring 1 */}
                <Animated.View 
                  style={[
                    styles.pulseRing1, 
                    { 
                      transform: [{ scale: pulseAnim1 }],
                      opacity: pulseOpacity1,
                    }
                  ]} 
                />
                {/* Center Solid Circle */}
                <View style={styles.pulseCoreCircle}>
                  <Feather name="mic" size={36} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.stateTitle}>Recording your answer</Text>
              <Text style={styles.stateSubtitleMulti}>
                Your recording will automatically stop when{'\n'}the question is over
              </Text>

              {/* Digital Timer */}
              <View style={styles.countdownRow}>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{timerMins}</Text>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
                <Text style={styles.countdownColon}>:</Text>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{timerSecs}</Text>
                  <Text style={styles.countdownUnit}>Seconds</Text>
                </View>
              </View>

              <Text style={styles.timeLeftLabel}>Time Left</Text>

              {/* Display candidate notes if written during prep */}
              {prepNotes.trim().length > 0 && (
                <View style={styles.prepNotesPreview}>
                  <Text style={styles.prepNotesPreviewTitle}>Your Notes:</Text>
                  <Text style={styles.prepNotesPreviewText}>{prepNotes}</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Full-Width Primary Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={subState === 'get-ready' && activeGroupIndex === 0 ? handleStartNow : handleNextAnswer}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryActionButtonText}>
              {subState === 'get-ready' && activeGroupIndex === 0 ? 'Start Now' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hamburger Overview / Progress Modal */}
        <Modal
          visible={isOverviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOverviewVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Speaking Test Overview</Text>
                <TouchableOpacity 
                  onPress={() => setIsOverviewVisible(false)} 
                  style={styles.modalCloseBtn}
                >
                  <Feather name="x" size={18} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }}>
                {speakingSection.question_groups.map((grp, gIdx) => (
                  <View key={gIdx} style={styles.modalGroupItem}>
                    <View style={styles.modalGroupHeader}>
                      <Text style={styles.modalGroupName}>
                        {grp.group_title || `Part ${gIdx + 1}`}
                      </Text>
                      <Text style={styles.modalGroupStatus}>
                        {gIdx === activeGroupIndex ? 'In Progress' : (gIdx < activeGroupIndex ? 'Completed' : 'Upcoming')}
                      </Text>
                    </View>
                    <View style={styles.modalQuestionRow}>
                      {grp.responses.map((resp, rIdx) => {
                        const isCurrent = gIdx === activeGroupIndex && rIdx === currentResponseIndex;
                        const isQBookmarked = resp.question?.id && bookmarkedQuestions.includes(resp.question.id);
                        return (
                          <View 
                            key={rIdx} 
                            style={[
                              styles.modalQBadge,
                              isCurrent && styles.modalQBadgeCurrent,
                              gIdx < activeGroupIndex && styles.modalQBadgeDone,
                              Boolean(isQBookmarked) && styles.modalQBadgeBookmarked
                            ]}
                          >
                            <Text style={[
                              styles.modalQBadgeText,
                              isCurrent && styles.modalQBadgeTextActive
                            ]}>
                              Q{rIdx + 1}
                            </Text>
                          </View>
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
                  setShowSubmitModal(true);
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
              <Text style={styles.submitConfirmTitle}>Submit Speaking Test?</Text>
              <Text style={styles.submitConfirmSubtitle}>
                Are you sure you want to finalize and submit your speaking assessment?
              </Text>

              <Text style={styles.submitConfirmDesc}>
                Once submitted, your recorded audio responses will be uploaded and evaluated.
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
        subjectName="Speaking"
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

  // Part Tabs Row
  partTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  partTab: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partTabActive: {
    backgroundColor: '#4C1D95',
  },
  partTabInactive: {
    backgroundColor: '#F3F4F6',
  },
  partTabTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  partTabTitleActive: {
    color: '#FFFFFF',
  },
  partTabTitleInactive: {
    color: '#374151',
  },
  partTabSub: {
    fontSize: 11,
    marginTop: 2,
  },
  partTabSubActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  partTabSubInactive: {
    color: '#6B7280',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Subheader Row
  subheaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partNumberLabel: {
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

  // Section Text & Prompts
  textIntroSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },
  cueCardBox: {
    marginTop: 6,
    gap: 4,
  },
  cueCardIntro: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  cueBullet: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    paddingLeft: 6,
  },

  // Central Dynamic State Container
  stateContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  // State 1: Get Ready Mic Icon
  getReadyMicCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stateSubtitleSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  stateSubtitleDark: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  stateSubtitleMulti: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Digital Countdown / Timer Display
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  countdownCol: {
    alignItems: 'center',
    minWidth: 70,
  },
  countdownNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: '#5B21B6',
    letterSpacing: 0.5,
  },
  countdownUnit: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
  },
  countdownColon: {
    fontSize: 36,
    fontWeight: '800',
    color: '#CBD5E1',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  timeLeftLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 6,
  },

  // Tip Card (Get Ready)
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F7FC',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    width: '100%',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },

  // Waveform Visualizer (Listen State)
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 90,
    gap: 4,
    marginVertical: 20,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#4C1D95',
  },

  // Notice Banner (Listen State)
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    width: '100%',
    gap: 10,
  },
  amberDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  noticeBannerText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    lineHeight: 17,
  },

  // Concentric Mic Pulse (Recording State)
  pulseContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  pulseRing2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#7C3AED',
  },
  pulseRing1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7C3AED',
  },
  pulseCoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },

  // Scratchpad & Prep Notes
  scratchpadContainer: {
    width: '100%',
    marginTop: 14,
  },
  scratchpadToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
  },
  scratchpadToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4C1D95',
  },
  scratchpadInput: {
    marginTop: 10,
    minHeight: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 13,
    color: '#1F2937',
  },
  prepNotesPreview: {
    marginTop: 16,
    width: '100%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prepNotesPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  prepNotesPreviewText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },

  // Bottom Action Bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  primaryActionButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  modalQBadgeDone: {
    backgroundColor: '#E0E7FF',
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
