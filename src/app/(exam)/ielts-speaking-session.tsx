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
import { mediaCache, resolveMediaUrl } from '@/services/mediaCache';
import { soundManager } from '@/services/soundManager';
import { Audio } from 'expo-av';
import {
  SubscriptionRequiredModal,
  isSubscriptionError,
  getSubscriptionErrorMessage,
} from '@/components/SubscriptionRequiredModal';
import { formatQuestionText } from '@/utils/questionFormatter';

type SpeakingSubState = 'get-ready' | 'listen' | 'recording';

const FALLBACK_SPEAKING_STRUCTURE: AttemptSection = {
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
            instructions: 'Answer clearly and naturally.',
            prep_time_seconds: 5,
            recording_time_seconds: 45
          }
        },
        {
          id: 102,
          question: {
            id: 102,
            question_type: 'AUDIO',
            text: 'What do you like most about your hometown?',
            instructions: 'Provide specific examples.',
            prep_time_seconds: 5,
            recording_time_seconds: 45
          }
        },
        {
          id: 103,
          question: {
            id: 103,
            question_type: 'AUDIO',
            text: 'Has your hometown changed much since you were a child?',
            instructions: 'Describe the developments.',
            prep_time_seconds: 5,
            recording_time_seconds: 45
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
            instructions: 'You should say:\n• What the book is\n• When you read it\n• What it is about\n• And explain why you liked it.',
            prep_time_seconds: 60,
            recording_time_seconds: 120
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
            instructions: 'Discuss reading trends and digital media.',
            prep_time_seconds: 5,
            recording_time_seconds: 60
          }
        },
        {
          id: 302,
          question: {
            id: 302,
            question_type: 'AUDIO',
            text: 'What are the main advantages of reading physical books versus digital e-books?',
            instructions: 'Compare convenience, focus, and comprehension.',
            prep_time_seconds: 5,
            recording_time_seconds: 60
          }
        }
      ]
    }
  ]
};

export default function IELTSSpeakingSessionScreen() {
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
  const [speakingSection, setSpeakingSection] = useState<AttemptSection | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0); // 0 = Part 1, 1 = Part 2, 2 = Part 3
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  // Derived current group and question pointers
  const activeGroup = speakingSection?.question_groups[activeGroupIndex];
  const currentResponse = activeGroup?.responses[currentResponseIndex];
  const currentQ = currentResponse?.question;

  // Authentic IELTS timing helper functions:
  // Part 1: 5s get-ready buffer, 45s maximum recording per question (authentic answer is 20-30s)
  // Part 2: 60s (1 min) preparation countdown, 120s (2 mins) maximum speech recording
  // Part 3: 5s get-ready buffer, 60s maximum recording per question
  const getPrepDuration = (question?: any, groupIndex?: number) => {
    if (question?.prep_time_seconds && question.prep_time_seconds > 0) {
      return question.prep_time_seconds;
    }
    const grpIdx = groupIndex !== undefined ? groupIndex : activeGroupIndex;
    if (grpIdx === 1) {
      return 60; // 1 minute (60s) prep time for Part 2 Candidate Task Card
    }
    return 5; // 5s get-ready buffer for Part 1 & Part 3
  };

  const getRecordingDuration = (question?: any, groupIndex?: number) => {
    if (question?.recording_time_seconds && question.recording_time_seconds > 0) {
      return question.recording_time_seconds;
    }
    const grpIdx = groupIndex !== undefined ? groupIndex : activeGroupIndex;
    if (grpIdx === 1) {
      return 120; // Exactly 2:00 (120s) for Part 2 Long Turn
    }
    if (grpIdx === 2) {
      return 60; // 60s for Part 3 Discussion
    }
    return 45; // 45s for Part 1 Introduction
  };

  const getListenDuration = (question?: any, groupIndex?: number) => {
    const grpIdx = groupIndex !== undefined ? groupIndex : activeGroupIndex;
    if (grpIdx === 1) {
      return 15; // Brief intro for Part 2
    }
    return 10; // Prompt listening time for Part 1 & Part 3
  };

  // Sub-state machine: 'get-ready' -> 'listen' -> 'recording'
  const [subState, setSubState] = useState<SpeakingSubState>('get-ready');
  
  // Timers
  const [totalTimeLeft, setTotalTimeLeft] = useState(900); // 15:00
  const [getReadyCountdown, setGetReadyCountdown] = useState(5); // 00:05
  const [listenTimeLeft, setListenTimeLeft] = useState(10); // Prompt listening time
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(45); // Candidate speech recording time

  // Candidate Notes (useful for Part 2 Long Turn)
  const [prepNotes, setPrepNotes] = useState('');
  const [showNotesInRecording, setShowNotesInRecording] = useState(false);

  // Bookmarks & Modal
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [isOverviewVisible, setIsOverviewVisible] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Audio Recording & Playback
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const collatedRecordingRef = useRef<Audio.Recording | null>(null);
  const collatedAudioUriRef = useRef<string | null>(null);
  const isRecorderPausedRef = useRef<boolean>(false);
  const questionTimestampsRef = useRef<{ questionId: number; start: number; end: number }[]>([]);
  const currentQStartTimeRef = useRef<number>(0);
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingQuestionAudio, setIsPlayingQuestionAudio] = useState(false);
  const [questionAudioLoading, setQuestionAudioLoading] = useState(false);
  const [questionAudioPosition, setQuestionAudioPosition] = useState(0);
  const [questionAudioDuration, setQuestionAudioDuration] = useState(0);

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
      if (collatedRecordingRef.current) {
        collatedRecordingRef.current.stopAndUnloadAsync().catch(() => {});
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
        const attemptId = examService.parseAttemptId(params.attempt_id) || (await examService.getActiveAttemptId());
        if (attemptId) {
          const res = await examService.resumeExam(attemptId);
          setAttempt(res);
          setTotalTimeLeft(res.timer_info?.remaining_seconds ?? 900);
          
          const speakSec = res.sections?.find(s => 
            s.section_name.toLowerCase().includes('speaking')
          ) || (res.sections && res.sections.length > 0 ? res.sections[0] : undefined);
          
          if (speakSec && speakSec.question_groups && speakSec.question_groups.length > 0) {
            setSpeakingSection(speakSec);
            const firstQ = speakSec.question_groups[0]?.responses[0]?.question;
            setGetReadyCountdown(getPrepDuration(firstQ, 0));
            setListenTimeLeft(getListenDuration(firstQ, 0));
            setRecordingTimeLeft(getRecordingDuration(firstQ, 0));
          } else {
            console.warn('Attempt has no questions in speaking section, using fallback speaking structure');
            setAttempt(null);
            setSpeakingSection(FALLBACK_SPEAKING_STRUCTURE);
            const firstQ = FALLBACK_SPEAKING_STRUCTURE.question_groups[0]?.responses[0]?.question;
            setGetReadyCountdown(getPrepDuration(firstQ, 0));
            setListenTimeLeft(getListenDuration(firstQ, 0));
            setRecordingTimeLeft(getRecordingDuration(firstQ, 0));
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
          console.warn('No active attempt ID found for speaking session, using fallback speaking structure');
          setAttempt(null);
          setSpeakingSection(FALLBACK_SPEAKING_STRUCTURE);
          const firstQ = FALLBACK_SPEAKING_STRUCTURE.question_groups[0]?.responses[0]?.question;
          setGetReadyCountdown(getPrepDuration(firstQ, 0));
          setListenTimeLeft(getListenDuration(firstQ, 0));
          setRecordingTimeLeft(getRecordingDuration(firstQ, 0));
        }
      } catch (e: any) {
        console.warn('Could not initialize speaking session, using fallback speaking structure:', e);
        setAttempt(null);
        setSpeakingSection(FALLBACK_SPEAKING_STRUCTURE);
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

  // Load and play question audio received from backend during 'listen' subState
  useEffect(() => {
    let isCancelled = false;

    const playQuestionAudio = async () => {
      if (subState !== 'listen' || !speakingSection) return;

      const activeGroup = speakingSection.question_groups[activeGroupIndex];
      const currentResponse = activeGroup?.responses[currentResponseIndex];
      const currentQ = currentResponse?.question;
      if (!currentQ) return;

      if (sound) {
        try {
          await sound.setOnPlaybackStatusUpdate(null);
          await sound.unloadAsync();
        } catch {}
        setSound(null);
      }

      const rawAudioUrl = 
        (currentQ as any)?.audio_file || 
        (currentQ as any)?.audio || 
        (currentResponse as any)?.audio_file || 
        (activeGroup as any)?.context_media || 
        (activeGroup as any)?.audio_file;

      if (rawAudioUrl) {
        try {
          setQuestionAudioLoading(true);
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
          const cachedUri = await mediaCache.getCachedAudioUri(rawAudioUrl);
          
          if (isCancelled) return;

          if (cachedUri) {
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: cachedUri },
              { shouldPlay: true },
              (status) => {
                if (status.isLoaded) {
                  setQuestionAudioPosition(status.positionMillis || 0);
                  setQuestionAudioDuration(status.durationMillis || 0);
                  if (status.durationMillis && status.positionMillis !== undefined) {
                    const remainingSec = Math.max(1, Math.ceil((status.durationMillis - status.positionMillis) / 1000));
                    setListenTimeLeft(remainingSec);
                  }
                  if (status.didJustFinish && !isCancelled) {
                    setIsPlayingQuestionAudio(false);
                    newSound.setOnPlaybackStatusUpdate(null);
                    // Automatically transition to recording state when question audio finishes!
                    handleListenComplete();
                  }
                }
              }
            );
            if (isCancelled) {
              newSound.setOnPlaybackStatusUpdate(null);
              newSound.unloadAsync().catch(() => {});
              return;
            }
            setSound(newSound);
            setIsPlayingQuestionAudio(true);
            soundManager.registerAndPlay(newSound, () => {
              setIsPlayingQuestionAudio(false);
            });
          }
        } catch (err) {
          console.warn('Question audio playback error:', err);
        } finally {
          if (!isCancelled) {
            setQuestionAudioLoading(false);
          }
        }
      } else {
        // Fallback when no audio URL exists: set authentic listen timeout
        setListenTimeLeft(getListenDuration(currentQ, activeGroupIndex));
      }
    };

    if (subState === 'listen') {
      playQuestionAudio();
    } else {
      if (sound) {
        soundManager.stopCurrent();
        setSound(null);
        setIsPlayingQuestionAudio(false);
      }
    }

    return () => {
      isCancelled = true;
      if (sound) {
        soundManager.stopCurrent();
      }
    };
  }, [subState, activeGroupIndex, currentResponseIndex, speakingSection]);

  // 1. Get-Ready Countdown Timer
  useEffect(() => {
    if (subState !== 'get-ready') return;

    const timer = setInterval(() => {
      setGetReadyCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [subState]);

  // When getReadyCountdown hits 0, trigger handleGetReadyComplete
  useEffect(() => {
    if (subState === 'get-ready' && getReadyCountdown === 0) {
      handleGetReadyComplete();
    }
  }, [subState, getReadyCountdown]);

  // 2. Listen Countdown Timer (fallback for reading prompt if audio is not uploaded or fails)
  useEffect(() => {
    if (subState !== 'listen') return;

    const timer = setInterval(() => {
      setListenTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [subState]);

  // When listenTimeLeft hits 0, trigger handleListenComplete
  useEffect(() => {
    if (subState === 'listen' && listenTimeLeft === 0) {
      handleListenComplete();
    }
  }, [subState, listenTimeLeft]);

  // 3. Candidate Speech Recording Timer (45s Part 1, 120s Part 2, 60s Part 3)
  useEffect(() => {
    if (subState !== 'recording') return;

    const timer = setInterval(() => {
      setRecordingTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [subState]);

  // When recordingTimeLeft hits 0, trigger handleNextAnswer (recording finishes!)
  useEffect(() => {
    if (subState === 'recording' && recordingTimeLeft === 0) {
      handleNextAnswer();
    }
  }, [subState, recordingTimeLeft]);

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

  // Audio Recording Methods (Collated Session Architecture)
  const startRecording = async () => {
    try {
      if (!audioPermission) {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== 'granted') return;
        setAudioPermission(true);
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      // If a collated recorder is already active and paused, resume it smoothly
      if (collatedRecordingRef.current && isRecorderPausedRef.current) {
        try {
          const status = await collatedRecordingRef.current.getStatusAsync();
          currentQStartTimeRef.current = (status?.durationMillis || 0) / 1000.0;
          await collatedRecordingRef.current.startAsync();
          isRecorderPausedRef.current = false;
          setRecording(collatedRecordingRef.current);
          return;
        } catch (resumeErr) {
          console.warn('Failed to resume collated recording, recreating:', resumeErr);
          try {
            await collatedRecordingRef.current.stopAndUnloadAsync();
            const uri = collatedRecordingRef.current.getURI();
            if (uri) collatedAudioUriRef.current = uri;
          } catch {}
          collatedRecordingRef.current = null;
          isRecorderPausedRef.current = false;
        }
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      collatedRecordingRef.current = newRecording;
      currentQStartTimeRef.current = 0.0;
      isRecorderPausedRef.current = false;
      setRecording(newRecording);
    } catch (err) {
      console.warn('Failed to start audio recording:', err);
    }
  };

  const pauseRecording = async () => {
    if (!collatedRecordingRef.current || isRecorderPausedRef.current) return;
    try {
      let durationSec = 0;
      try {
        const status = await collatedRecordingRef.current.getStatusAsync();
        durationSec = (status?.durationMillis || 0) / 1000.0;
      } catch {}

      await collatedRecordingRef.current.pauseAsync();
      isRecorderPausedRef.current = true;
      setRecording(null);

      if (currentQ?.id && subState === 'recording') {
        const start = Number(currentQStartTimeRef.current.toFixed(2));
        const end = Number(Math.max(start + 0.5, durationSec).toFixed(2));
        if (end - start >= 1.0) {
          questionTimestampsRef.current = [
            ...questionTimestampsRef.current.filter(t => t.questionId !== currentQ.id),
            { questionId: currentQ.id, start, end }
          ];
        }
      }
    } catch (err) {
      console.warn('Failed to pause collated recording, stopping instead:', err);
      try {
        await collatedRecordingRef.current.stopAndUnloadAsync();
        const uri = collatedRecordingRef.current.getURI();
        if (uri) collatedAudioUriRef.current = uri;
      } catch {}
      collatedRecordingRef.current = null;
      isRecorderPausedRef.current = false;
      setRecording(null);
    }
  };

  const stopAndFinalizeCollatedAudio = async (): Promise<string | null> => {
    if (collatedRecordingRef.current) {
      try {
        if (!isRecorderPausedRef.current && currentQ?.id && subState === 'recording') {
          try {
            const status = await collatedRecordingRef.current.getStatusAsync();
            const durationSec = (status?.durationMillis || 0) / 1000.0;
            const start = Number(currentQStartTimeRef.current.toFixed(2));
            const end = Number(Math.max(start + 0.5, durationSec).toFixed(2));
            if (end - start >= 1.0) {
              questionTimestampsRef.current = [
                ...questionTimestampsRef.current.filter(t => t.questionId !== currentQ.id),
                { questionId: currentQ.id, start, end }
              ];
            }
          } catch {}
        }
        await collatedRecordingRef.current.stopAndUnloadAsync();
        const uri = collatedRecordingRef.current.getURI();
        if (uri) collatedAudioUriRef.current = uri;
      } catch (err) {
        console.warn('Failed to stop/unload collated audio recording:', err);
      }
      collatedRecordingRef.current = null;
      isRecorderPausedRef.current = false;
      setRecording(null);
    }
    return collatedAudioUriRef.current;
  };

  const stopRecording = async () => {
    return await stopAndFinalizeCollatedAudio();
  };

  // Transitions
  const handleGetReadyComplete = () => {
    setListenTimeLeft(getListenDuration(currentQ, activeGroupIndex));
    setSubState('listen');
  };

  const handleStartNow = () => {
    handleGetReadyComplete();
  };

  const handleListenComplete = async () => {
    if (subState === 'recording') return; // Guard against re-entry
    const duration = getRecordingDuration(currentQ, activeGroupIndex);
    setRecordingTimeLeft(duration);
    setSubState('recording');
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

    // In 'recording' state: candidate has finished speaking for this prompt.
    // Pause recording instead of uploading per-question, accumulating candidate speech into 1 collated file.
    await pauseRecording();
    const activeGroup = speakingSection?.question_groups[activeGroupIndex];

    // Move to next question or next part
    if (activeGroup && currentResponseIndex < activeGroup.responses.length - 1) {
      const nextIdx = currentResponseIndex + 1;
      const nextQ = activeGroup.responses[nextIdx]?.question;
      setCurrentResponseIndex(nextIdx);
      setGetReadyCountdown(getPrepDuration(nextQ, activeGroupIndex));
      setListenTimeLeft(getListenDuration(nextQ, activeGroupIndex));
      setRecordingTimeLeft(getRecordingDuration(nextQ, activeGroupIndex));
      setSubState('get-ready');
    } else if (speakingSection && activeGroupIndex < speakingSection.question_groups.length - 1) {
      const nextGrpIdx = activeGroupIndex + 1;
      const nextGrp = speakingSection.question_groups[nextGrpIdx];
      const nextQ = nextGrp?.responses[0]?.question;
      setActiveGroupIndex(nextGrpIdx);
      setCurrentResponseIndex(0);
      setGetReadyCountdown(getPrepDuration(nextQ, nextGrpIdx));
      setListenTimeLeft(getListenDuration(nextQ, nextGrpIdx));
      setRecordingTimeLeft(getRecordingDuration(nextQ, nextGrpIdx));
      setSubState('get-ready');
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
    const collatedUri = await stopAndFinalizeCollatedAudio();
    try {
      setIsSubmitting(true);
      const attemptId = attempt?.id || Number(params.attempt_id);

      // Check if this exam attempt has further sections after speaking
      const fullSectionNames = params.section_names
        ? params.section_names.split(',').map(s => s.trim())
        : (attempt?.sections ? attempt.sections.map(s => s.section_name) : ['Speaking']);

      const currentSecName = speakingSection?.section_name || 'Speaking';
      let currentSectionIdxInList = fullSectionNames.findIndex(
        s => s.toLowerCase() === currentSecName.toLowerCase() || 
             currentSecName.toLowerCase().includes(s.toLowerCase()) || 
             s.toLowerCase().includes(currentSecName.toLowerCase())
      );
      if (currentSectionIdxInList === -1) {
        currentSectionIdxInList = params.section_index ? parseInt(String(params.section_index), 10) : 0;
      }

      const hasNextSection = currentSectionIdxInList < fullSectionNames.length - 1;

      // Submit collated speaking audio with per-question timestamps
      if (collatedUri && attemptId && speakingSection) {
        if (speakingSection !== FALLBACK_SPEAKING_STRUCTURE) {
          try {
            const metadata = questionTimestampsRef.current;
            if (metadata.length > 0) {
              await examService.submitBulkAudio(attemptId, collatedUri, metadata, 'audio/m4a');
            }
          } catch (uploadErr) {
            console.warn('Speaking bulk audio upload warning:', uploadErr);
          }
        }
      }

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

      // No more sections: submit the entire exam
      let submitRes: any = null;
      if (attemptId && !isNaN(attemptId)) {
        submitRes = await examService.submitExam(attemptId, { responses: [] });
        await storage.remove('@classore_active_attempt');
        examService.saveRecentAttempt({
          id: attemptId,
          exam_type: 42,
          title: params.exam_name || 'IELTS Speaking Test',
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
          exam_name: params.exam_name || 'IELTS Speaking Test',
          is_ielts: 'true',
          section_names: params.section_names || 'Speaking',
          total_score: submitRes?.total_score !== undefined ? String(submitRes.total_score) : '',
          streak: submitRes?.streak !== undefined ? String(submitRes.streak) : '',
          ai_feedbacks: submitRes?.ai_feedbacks ? JSON.stringify(submitRes.ai_feedbacks) : '',
          ai_assessment_status: submitRes?.ai_assessment_status || '',
          ai_skip_reason: submitRes?.ai_skip_reason || '',
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

  const isBookmarked = currentQ?.id ? bookmarkedQuestions.includes(currentQ.id) : false;

  // Title calculation: strictly "IELTS Speaking"
  const screenTitle = useMemo(() => {
    if (params.exam_name && params.exam_name.toLowerCase().includes('speaking')) {
      return params.exam_name;
    }
    if (speakingSection?.section_name && speakingSection.section_name.toLowerCase().includes('speaking')) {
      return speakingSection.section_name;
    }
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
  const { mins: listenMins, secs: listenSecs } = formatDigits(listenTimeLeft);
  const { mins: recordingMins, secs: recordingSecs } = formatDigits(recordingTimeLeft);

  const renderCueCard = (question?: any) => {
    if (!question) return null;

    let topic = question.text ? formatQuestionText(question.text) : '';
    topic = topic.replace(/^Long Turn\s*[-–:]\s*/i, '').trim();

    const rawInstructions = question.instructions ? formatQuestionText(question.instructions) : '';

    let bulletLines: string[] = [];
    if (rawInstructions) {
      bulletLines = rawInstructions
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
    } else if (topic.includes('\n')) {
      const parts = topic.split('\n').map((l: string) => l.trim()).filter(Boolean);
      topic = parts[0] || topic;
      bulletLines = parts.slice(1);
    }

    return (
      <View style={styles.cueCardContainer}>
        <View style={styles.cueCardHeader}>
          <View style={styles.cueCardBadge}>
            <Feather name="file-text" size={13} color="#4C1D95" />
            <Text style={styles.cueCardBadgeText}>Candidate Task Card</Text>
          </View>
          <Text style={styles.cueCardPartTag}>Part 2 Topic</Text>
        </View>

        <Text style={styles.cueCardTopic}>{topic}</Text>

        {bulletLines.length > 0 && (
          <View style={styles.cueCardBulletsContainer}>
            {bulletLines.map((line: string, idx: number) => {
              const lower = line.toLowerCase();
              const isLead = lower.startsWith('you should say') || lower.startsWith('describe ') || lower.startsWith('talk about');
              if (isLead) {
                return (
                  <Text key={idx} style={styles.cueCardLeadText}>
                    {line}
                  </Text>
                );
              }
              const cleanBullet = line.replace(/^[•\-\*\d+\.]\s*/, '');
              return (
                <View key={idx} style={styles.cueCardBulletRow}>
                  <View style={styles.cueCardBulletDot} />
                  <Text style={styles.cueCardBulletText}>{cleanBullet}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

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
                    const grp = speakingSection?.question_groups[idx];
                    const q = grp?.responses[0]?.question;
                    setGetReadyCountdown(getPrepDuration(q, idx));
                    setListenTimeLeft(getListenDuration(q, idx));
                    setRecordingTimeLeft(getRecordingDuration(q, idx));
                    setSubState('get-ready');
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

          {/* Section Headers (No on-screen question prompt text or cue card text) */}
          <View style={styles.textIntroSection}>
            <Text style={styles.sectionHeading}>
              {activeGroupIndex === 0 
                ? 'Part 1: Introduction & Interview' 
                : activeGroupIndex === 1 
                ? 'Part 2: Individual Long Turn' 
                : 'Part 3: Two-way Discussion'}
            </Text>
            <Text style={styles.sectionDescription}>
              Question {currentResponseIndex + 1} of {activeGroup?.responses?.length || 1}
            </Text>
          </View>

          {/* ======================================================== */}
          {/* STATE 1: GET READY (Mockup 3 & Mockup 1)                 */}
          {/* ======================================================== */}
          {subState === 'get-ready' && (
            <View style={styles.stateContainer}>
              {/* Circular Soft Purple Microphone Icon */}
              <View style={styles.getReadyMicCircle}>
                <Ionicons name="mic-outline" size={48} color="#4C1D95" />
              </View>

              <Text style={styles.stateTitle}>
                {activeGroupIndex === 1 ? 'Preparation Time' : 'Get Ready'}
              </Text>
              <Text style={styles.stateSubtitle}>
                {activeGroupIndex === 1
                  ? 'You have 1 minute to read the task card and prepare your talk.'
                  : 'Please listen carefully to the examiner audio and respond clearly.'}
              </Text>
              <Text style={styles.stateSubtitleSub}>
                {activeGroupIndex === 1 ? 'Speaking begins in' : `Question ${currentResponseIndex + 1} will start in`}
              </Text>

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
                      Speak clearly and naturally into your microphone when recording begins.
                    </Text>
                  </View>
                </View>
              )}

              {/* Part 2 Candidate Task Card (Visible during 1-minute preparation) */}
              {activeGroupIndex === 1 && renderCueCard(currentQ)}

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
                      placeholder="Jot down keywords or key points for your talk..."
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
              <Text style={styles.stateSubtitleDark}>
                {questionAudioLoading ? 'Loading examiner audio...' : 'The examiner is speaking the question audio'}
              </Text>

              {/* Notice Banner with amber dot */}
              <View style={styles.noticeBanner}>
                <View style={styles.amberDot} />
                <Text style={styles.noticeBannerText}>
                  Recording will start automatically, when the question ends.
                </Text>
              </View>

              {/* Part 2 Candidate Task Card during Examiner Intro */}
              {activeGroupIndex === 1 && renderCueCard(currentQ)}

              {/* Digital Timer */}
              <View style={styles.countdownRow}>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{listenMins}</Text>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
                <Text style={styles.countdownColon}>:</Text>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{listenSecs}</Text>
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
              <View style={[styles.pulseContainer, activeGroupIndex === 1 && styles.pulseContainerCompact]}>
                {/* Outer Ring 2 */}
                <Animated.View 
                  style={[
                    styles.pulseRing2, 
                    activeGroupIndex === 1 && styles.pulseRing2Compact,
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
                    activeGroupIndex === 1 && styles.pulseRing1Compact,
                    { 
                      transform: [{ scale: pulseAnim1 }],
                      opacity: pulseOpacity1,
                    }
                  ]} 
                />
                {/* Center Solid Circle */}
                <View style={[styles.pulseCoreCircle, activeGroupIndex === 1 && styles.pulseCoreCircleCompact]}>
                  <Feather name="mic" size={activeGroupIndex === 1 ? 24 : 36} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.stateTitle}>Recording your answer</Text>
              <Text style={styles.stateSubtitleMulti}>
                Your recording will automatically stop when{'\n'}the question is over
              </Text>

              {/* Digital Timer */}
              <View style={styles.countdownRow}>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{recordingMins}</Text>
                  <Text style={styles.countdownUnit}>Minutes</Text>
                </View>
                <Text style={styles.countdownColon}>:</Text>
                <View style={styles.countdownCol}>
                  <Text style={styles.countdownNumber}>{recordingSecs}</Text>
                  <Text style={styles.countdownUnit}>Seconds</Text>
                </View>
              </View>

              <Text style={styles.timeLeftLabel}>Time Left</Text>

              {/* Part 2 Candidate Task Card (Pinned while speaking for 2 minutes) */}
              {activeGroupIndex === 1 && renderCueCard(currentQ)}

              {/* Display candidate notes if written during prep */}
              {prepNotes.trim().length > 0 && (
                <View style={styles.prepNotesPreview}>
                  <View style={styles.prepNotesPreviewHeader}>
                    <Feather name="edit-3" size={13} color="#4C1D95" />
                    <Text style={styles.prepNotesPreviewTitle}>Your Scratchpad Notes</Text>
                  </View>
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
            onPress={subState === 'get-ready' ? handleStartNow : handleNextAnswer}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryActionButtonText}>
              {subState === 'get-ready' ? (activeGroupIndex === 1 ? 'Start Speaking' : 'Start Now') : 'Next'}
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
  pulseContainerCompact: {
    width: 110,
    height: 110,
    marginVertical: 6,
  },
  pulseRing2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#7C3AED',
  },
  pulseRing2Compact: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  pulseRing1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7C3AED',
  },
  pulseRing1Compact: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  pulseCoreCircleCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  // Candidate Task Card (Part 2 Cue Card)
  cueCardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 16,
    marginVertical: 12,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cueCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  cueCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C1D95',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cueCardPartTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  cueCardTopic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  cueCardBulletsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  cueCardLeadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  cueCardBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingRight: 8,
  },
  cueCardBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
    marginTop: 6,
    marginRight: 8,
  },
  cueCardBulletText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    flex: 1,
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
    marginTop: 14,
    width: '100%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prepNotesPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  prepNotesPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
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
