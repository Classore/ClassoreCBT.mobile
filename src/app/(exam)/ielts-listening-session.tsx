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
import {
  MultiSelectQuestion,
  TFNGQuestion,
  GapFillQuestion,
  WordBankQuestion,
  MatchingQuestion,
  DiagramLabelingQuestion,
} from '@/components/ielts';
import { mediaCache, resolveMediaUrl } from '@/services/mediaCache';

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
  const [totalTimeLeft, setTotalTimeLeft] = useState(1920); // Standard 32:00 (30m continuous audio + 2m review)

  // Answer Text State
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Bookmarks & Overview Modal
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [isOverviewVisible, setIsOverviewVisible] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Audio Playback State (Authentic play-once continuous playback)
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(1);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playedSections, setPlayedSections] = useState<Record<number, boolean>>({});
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
        const attemptId = examService.parseAttemptId(params.attempt_id) || (await examService.getActiveAttemptId());
        if (attemptId) {
          const res = await examService.resumeExam(attemptId);
          setAttempt(res);
          setTotalTimeLeft(res.timer_info?.remaining_seconds ?? 1920);

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
          console.warn('No active attempt ID found for listening session, generating mock session structure');
        }
      } catch (e: any) {
        console.warn('Could not initialize listening session, generating mock session structure:', e);
        // Fallback IELTS authentic 4-part structure (40 questions, 10 per part)
        const mockStructure: AttemptSection = {
          section_id: 2,
          section_name: 'IELTS Listening',
          question_groups: [
            {
              group_id: 1,
              group_title: 'Part 1',
              group_type: 'Form & Note Completion',
              context_text: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
              context_media: 'group_media/ielts_listening_sample.mp3',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 101 + i,
                question: {
                  id: 101 + i,
                  question_type: 'GAP_FILL',
                  text: `Customer Enquiry Notes - Reference #${i + 1}: [blank_${i + 1}]`,
                  instructions: 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER',
                  metadata: {
                    blanks: [{ id: `blank_${i + 1}`, label: `${i + 1}` }],
                    max_words: 2,
                  },
                },
              })),
            },
            {
              group_id: 2,
              group_title: 'Part 2',
              group_type: 'Map & Plan Labelling / Multiple Choice',
              context_text: 'Listen to the guide giving directions at the local arts centre and answer questions 11 to 20.',
              context_media: 'group_media/ielts_listening_sample.mp3',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 201 + i,
                question: {
                  id: 201 + i,
                  question_type: i < 5 ? 'MCQ' : 'TEXT',
                  text: `Question ${11 + i}: What does the speaker mention regarding facility ${i + 1}?`,
                  instructions: i < 5 ? 'Choose the correct letter, A, B, or C.' : 'Answer the question.',
                  choices: i < 5 ? [
                    { id: 2000 + i * 3 + 1, text: 'Open seven days a week' },
                    { id: 2000 + i * 3 + 2, text: 'Requires prior registration' },
                    { id: 2000 + i * 3 + 3, text: 'Available to members only' },
                  ] : undefined,
                },
              })),
            },
            {
              group_id: 3,
              group_title: 'Part 3',
              group_type: 'Academic Discussion & Matching',
              context_text: 'Listen to two university students discussing their environmental research project and answer questions 21 to 30.',
              context_media: 'group_media/ielts_listening_sample.mp3',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 301 + i,
                question: {
                  id: 301 + i,
                  question_type: i < 5 ? 'MATCHING' : 'MCQ',
                  text: `Question ${21 + i}: Research Methodology & Findings`,
                  instructions: i < 5 ? 'Match the proposed solution to the team member.' : 'Choose the correct letter, A, B, or C.',
                  metadata: i < 5 ? {
                    items: [
                      { id: `item_${i + 1}`, text: `Aspect ${i + 1}: Data analysis` },
                    ],
                    options: [
                      { id: 'A', text: 'Sarah' },
                      { id: 'B', text: 'David' },
                      { id: 'C', text: 'Dr. Jenkins' },
                    ],
                  } : undefined,
                  choices: i >= 5 ? [
                    { id: 3000 + i * 3 + 1, text: 'The sample size was inadequate' },
                    { id: 3000 + i * 3 + 2, text: 'Field sensors malfunctioned during the storm' },
                    { id: 3000 + i * 3 + 3, text: 'Data was corroborated by satellite imagery' },
                  ] : undefined,
                },
              })),
            },
            {
              group_id: 4,
              group_title: 'Part 4',
              group_type: 'Academic Lecture & Note Completion',
              context_text: 'Listen to a lecture about ocean conservation and complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
              context_media: 'group_media/ielts_listening_sample.mp3',
              responses: Array.from({ length: 10 }, (_, i) => ({
                id: 401 + i,
                question: {
                  id: 401 + i,
                  question_type: 'GAP_FILL',
                  text: `Ocean Biodiversity Factor ${i + 1}: Marine protected reserves allow species to [blank_${i + 1}].`,
                  instructions: 'Write NO MORE THAN TWO WORDS',
                  metadata: {
                    blanks: [{ id: `blank_${i + 1}`, label: `${31 + i}` }],
                    max_words: 2,
                  },
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

  // Continuous Real Audio Playback (expo-av & mediaCache)
  // Audio plays once continuously per part; scrubber, rewind, and pause are strictly disabled
  // on both Standard Exam and Practice modes per official IELTS CBT standards.
  const playSectionAudio = async (groupIndex: number) => {
    if (playedSections[groupIndex]) {
      return; // Already played once for this section
    }

    const group = listeningSection?.question_groups?.[groupIndex];
    if (!group) return;

    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {}
      setSound(null);
      setIsPlaying(false);
    }

    const rawAudioUrl =
      group.context_media ||
      (group as any).audio_file ||
      (group.responses?.[0]?.question as any)?.audio_file;

    if (!rawAudioUrl) {
      return;
    }

    try {
      setAudioLoading(true);
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const cachedUri = await mediaCache.getCachedAudioUri(rawAudioUrl);
      if (!cachedUri) {
        setAudioLoading(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: cachedUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis || 0);
            setAudioDuration(status.durationMillis || 1);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlayedSections(prev => ({ ...prev, [groupIndex]: true }));
            }
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Continuous audio playback error:', err);
      setIsPlaying(false);
    } finally {
      setAudioLoading(false);
    }
  };

  // Trigger continuous audio playback when part changes
  useEffect(() => {
    let isCancelled = false;

    if (!loading && listeningSection && !playedSections[activeGroupIndex]) {
      playSectionAudio(activeGroupIndex);
    } else if (playedSections[activeGroupIndex] && sound) {
      sound.unloadAsync().catch(() => {});
      setSound(null);
      setIsPlaying(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [activeGroupIndex, loading, listeningSection?.section_id]);

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

  // Helper to update current question response in state & trigger autoSave
  const updateCurrentResponse = (updater: (resp: UserResponseItem) => void, autoSavePayload?: any) => {
    if (!listeningSection) return;

    setListeningSection(prev => {
      if (!prev) return prev;
      const newGroups = [...prev.question_groups];
      const grp = { ...newGroups[activeGroupIndex] };
      const newResponses = [...grp.responses];
      const resp = { ...newResponses[currentResponseIndex] };
      updater(resp);
      newResponses[currentResponseIndex] = resp;
      grp.responses = newResponses;
      newGroups[activeGroupIndex] = grp;
      return { ...prev, question_groups: newGroups };
    });

    const attemptId = attempt?.id || Number(params.attempt_id);
    if (attemptId && !isNaN(attemptId) && autoSavePayload) {
      examService.autoSave(attemptId, { responses: [autoSavePayload] }).catch(err => {
        console.warn('Auto-save warning in listening:', err);
      });
    }
  };

  const handleSelectChoice = (choiceId: number) => {
    const qId = currentQ?.id;
    if (!qId) return;

    updateCurrentResponse(
      (resp) => {
        resp.selected_choice = choiceId;
      },
      { question_id: qId, choice_id: choiceId, time_spent_seconds: 15 }
    );
  };

  const handleSelectMultiChoice = (selectedIds: number[]) => {
    const qId = currentQ?.id;
    if (!qId) return;

    const newMeta = { ...(currentResponse?.metadata || {}), selected_choices: selectedIds };
    updateCurrentResponse(
      (resp) => {
        resp.metadata = newMeta;
        resp.selected_choice = selectedIds[0] || null;
      },
      {
        question_id: qId,
        choice_id: selectedIds[0] || null,
        metadata: newMeta,
        time_spent_seconds: 15,
      }
    );
  };

  const handleUpdateGapFill = (blankId: string, val: string) => {
    const qId = currentQ?.id;
    if (!qId) return;

    const existingBlanks = currentResponse?.metadata?.blanks || {};
    const newBlanks = { ...existingBlanks, [blankId]: val };
    const newMeta = { ...(currentResponse?.metadata || {}), blanks: newBlanks };

    updateCurrentResponse(
      (resp) => {
        resp.metadata = newMeta;
      },
      { question_id: qId, metadata: newMeta, time_spent_seconds: 15 }
    );
  };

  const handleUpdateMatching = (itemId: string, optId: string) => {
    const qId = currentQ?.id;
    if (!qId) return;

    const existingMatches = currentResponse?.metadata?.matches || {};
    const newMatches = { ...existingMatches, [itemId]: optId };
    const newMeta = { ...(currentResponse?.metadata || {}), matches: newMatches };

    updateCurrentResponse(
      (resp) => {
        resp.metadata = newMeta;
      },
      { question_id: qId, metadata: newMeta, time_spent_seconds: 15 }
    );
  };

  const handleClearMatching = (itemId: string) => {
    const qId = currentQ?.id;
    if (!qId) return;

    const newMatches = { ...(currentResponse?.metadata?.matches || {}) };
    delete newMatches[itemId];
    const newMeta = { ...(currentResponse?.metadata || {}), matches: newMatches };

    updateCurrentResponse(
      (resp) => {
        resp.metadata = newMeta;
      },
      { question_id: qId, metadata: newMeta, time_spent_seconds: 15 }
    );
  };

  const handleUpdateDiagramLabel = (targetId: string, label: string) => {
    const qId = currentQ?.id;
    if (!qId) return;

    const existingLabels = currentResponse?.metadata?.labels || {};
    const newLabels = { ...existingLabels, [targetId]: label };
    const newMeta = { ...(currentResponse?.metadata || {}), labels: newLabels };

    updateCurrentResponse(
      (resp) => {
        resp.metadata = newMeta;
      },
      { question_id: qId, metadata: newMeta, time_spent_seconds: 15 }
    );
  };

  // Answer change handler for TEXT questions
  const handleAnswerChange = (questionId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    updateCurrentResponse(
      (resp) => {
        resp.written_response = text;
      },
      { question_id: questionId, written_response: text, time_spent_seconds: 15 }
    );
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

  // Question numbering across all 4 sections in IELTS Listening (1-40)
  const prevQuestionsCount = useMemo(() => {
    if (!listeningSection?.question_groups) return activeGroupIndex * 10;
    let count = 0;
    for (let i = 0; i < activeGroupIndex; i++) {
      count += listeningSection.question_groups[i]?.responses?.length || 10;
    }
    return count;
  }, [listeningSection?.question_groups, activeGroupIndex]);

  const totalQuestionsInTest = useMemo(() => {
    if (!listeningSection?.question_groups) return 40;
    return listeningSection.question_groups.reduce((acc, grp) => acc + (grp.responses?.length || 10), 0);
  }, [listeningSection?.question_groups]);

  const currentGlobalQuestionNumber = prevQuestionsCount + currentResponseIndex + 1;
  const sectionStartQuestionNumber = prevQuestionsCount + 1;
  const sectionEndQuestionNumber = prevQuestionsCount + totalQuestionsInSection;

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
        const hasChoice = resp.selected_choice !== null && resp.selected_choice !== undefined;
        const hasMulti = resp.metadata?.selected_choices && resp.metadata.selected_choices.length > 0;
        const hasBlanks = resp.metadata?.blanks && Object.values(resp.metadata.blanks).some((v: any) => typeof v === 'string' && v.trim().length > 0);
        const hasMatches = resp.metadata?.matches && Object.keys(resp.metadata.matches).length > 0;
        const hasLabels = resp.metadata?.labels && Object.keys(resp.metadata.labels).length > 0;
        const hasText = Boolean(qId && answers[qId] && answers[qId].trim().length > 0);

        if (hasChoice || hasMulti || hasBlanks || hasMatches || hasLabels || hasText) {
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

      // 2. Build responses payload supporting all authentic IELTS formats
      const responsesPayload: any[] = [];
      listeningSection?.question_groups?.forEach(grp => {
        grp.responses?.forEach(resp => {
          const qId = resp.question?.id;
          if (!qId) return;

          const item: any = { question_id: qId };
          let hasData = false;

          if (resp.selected_choice !== null && resp.selected_choice !== undefined) {
            item.choice_id = resp.selected_choice;
            hasData = true;
          }

          if (resp.metadata && Object.keys(resp.metadata).length > 0) {
            item.metadata = resp.metadata;
            hasData = true;
          }

          const answerText = answers[qId] || resp.written_response;
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

      const activeId = attempt?.id || examService.parseAttemptId(params.attempt_id) || examService.getActiveAttemptIdSync();
      const attemptId = activeId || undefined;

      // Save responses for listening
      if (attemptId && responsesPayload.length > 0) {
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
          attempt_id: attemptId ? String(attemptId) : '',
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
          is_ielts: 'true',
          section_names: params.section_names || 'Listening',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strictly "IELTS Listening" at the top of listening session
  const screenTitle = useMemo(() => {
    if (params.exam_name && params.exam_name.toLowerCase().includes('listening')) {
      return params.exam_name;
    }
    if (listeningSection?.section_name && listeningSection.section_name.toLowerCase().includes('listening')) {
      return listeningSection.section_name;
    }
    return 'IELTS Listening';
  }, [params.exam_name, listeningSection?.section_name]);

  // Section Tabs (Standard IELTS Listening has 4 sections)
  // NOTE: Must be above any early return to satisfy React's Rules of Hooks
  const sectionTabs = useMemo(() => {
    if (listeningSection?.question_groups && listeningSection.question_groups.length >= 4) {
      return listeningSection.question_groups.map((grp, idx) => {
        let cleanTitle = `Part ${idx + 1}`;
        const rawTitle = grp.group_title || '';
        const match = rawTitle.match(/(Part\s+\d+|Section\s+\d+)/i);
        if (match) {
          cleanTitle = match[1].replace(/section/i, 'Part');
        } else if (rawTitle && rawTitle.trim().length <= 10) {
          cleanTitle = rawTitle.trim();
        }
        return {
          title: cleanTitle,
          fullTitle: rawTitle || `Part ${idx + 1}`,
          duration: '~8 mins',
        };
      });
    }
    return [
      { title: 'Part 1', fullTitle: 'Part 1', duration: '~8 mins' },
      { title: 'Part 2', fullTitle: 'Part 2', duration: '~8 mins' },
      { title: 'Part 3', fullTitle: 'Part 3', duration: '~8 mins' },
      { title: 'Part 4', fullTitle: 'Part 4', duration: '~8 mins' },
    ];
  }, [listeningSection?.question_groups]);

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

  const isPartAudioPlayed = Boolean(playedSections[activeGroupIndex]);
  const progressPercent = audioDuration > 0 ? Math.min(100, Math.max(0, (audioPosition / audioDuration) * 100)) : 0;

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

        {/* Section Tabs Row (Indicator only - students cannot jump between sections in standard IELTS Listening) */}
        <View style={styles.sectionTabsContainer}>
          {sectionTabs.map((tab, idx) => {
            const isActive = idx === activeGroupIndex;
            const isCompleted = idx < activeGroupIndex;

            return (
              <View
                key={idx}
                style={[
                  styles.sectionTab,
                  isActive ? styles.sectionTabActive : styles.sectionTabInactive,
                  { opacity: isActive ? 1 : isCompleted ? 0.9 : 0.6 },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1, maxWidth: '100%' }}>
                  <Text
                    style={[
                      styles.sectionTabTitle,
                      isActive ? styles.sectionTabTitleActive : styles.sectionTabTitleInactive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.title}
                  </Text>
                  {isCompleted && (
                    <Feather name="check" size={11} color="#059669" />
                  )}
                  {!isCompleted && !isActive && (
                    <Feather name="lock" size={10} color="#9CA3AF" />
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
              </View>
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
              Questions {sectionStartQuestionNumber}–{sectionEndQuestionNumber}
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

          {/* Audio Player Section - Official Continuous Play-Once Standard */}
          <View style={styles.audioPlayerCard}>
            {/* Audio Header & Status */}
            <View style={styles.audioPlayerHeader}>
              <View style={styles.audioTrackBadge}>
                <Ionicons name="headset" size={13} color="#4C1D95" />
                <Text style={styles.audioTrackBadgeText}>Part {activeGroupIndex + 1} Audio Track</Text>
              </View>

              {isPartAudioPlayed ? (
                <View style={styles.audioEndedBadge}>
                  <Feather name="check-circle" size={12} color="#059669" />
                  <Text style={styles.audioEndedText}>Audio Completed</Text>
                </View>
              ) : isPlaying ? (
                <View style={styles.audioPlayingBadge}>
                  <View style={styles.greenLiveDot} />
                  <Text style={styles.audioPlayingText}>Playing Continuously</Text>
                </View>
              ) : audioLoading ? (
                <View style={styles.audioLoadingBadge}>
                  <ActivityIndicator size="small" color="#4C1D95" />
                  <Text style={styles.audioLoadingText}>Loading audio...</Text>
                </View>
              ) : (
                <View style={styles.audioReadyBadge}>
                  <Text style={styles.audioReadyText}>Plays Once Only</Text>
                </View>
              )}
            </View>

            {/* Waveform Equalizer */}
            <View style={styles.waveformContainer}>
              {waveformHeights.map((animH, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: isPlaying ? animH : 8 },
                  ]}
                />
              ))}
            </View>

            {/* Time Indicators */}
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatAudioTime(audioPosition)}</Text>
              <Text style={styles.timeText}>{formatAudioTime(audioDuration)}</Text>
            </View>

            {/* Scrubber / Progress Bar (Strictly Read-Only / Non-Interactive per IELTS CBT Standard) */}
            <View style={styles.progressBarWrapperReadOnly} pointerEvents="none">
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFilled, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Audio Rules Notice Banner */}
            <View style={styles.audioNoticeBanner}>
              <Ionicons name="information-circle-outline" size={15} color="#6D28D9" />
              <Text style={styles.audioNoticeText}>
                {isPartAudioPlayed
                  ? "Recording ended. In accordance with IELTS standards, audio cannot be replayed."
                  : isPlaying
                  ? "Audio is playing once continuously. Scrubbing, rewinding, and pausing are disabled."
                  : "Audio plays once continuously. Ensure your headphones/speakers are ready."}
              </Text>
            </View>

            {/* Manual Start button if autoplay was prevented or awaiting start */}
            {!isPlaying && !isPartAudioPlayed && (
              <TouchableOpacity
                style={styles.startAudioButton}
                onPress={() => playSectionAudio(activeGroupIndex)}
                disabled={audioLoading}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.startAudioButtonText}>
                  {audioLoading ? 'Loading Audio Track...' : `Start Part ${activeGroupIndex + 1} Audio`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Section Information / Context box if available */}
          {activeGroup?.context_text ? (
            <View style={styles.contextBox}>
              <View style={styles.contextBoxHeader}>
                <Feather name="info" size={13} color="#6D28D9" />
                <Text style={styles.contextBoxTitle}>Part {activeGroupIndex + 1} Instructions</Text>
              </View>
              <Text style={styles.contextBoxText}>{activeGroup.context_text}</Text>
            </View>
          ) : null}

          {/* Question Title & Prompt */}
          <Text style={styles.questionTitle}>
            Question {currentGlobalQuestionNumber}
          </Text>
          <Text style={styles.questionPrompt}>
            {currentQ?.text ? formatQuestionText(currentQ.text) : (currentQ?.instructions || 'Listen to the recording and answer the question')}
          </Text>

          {/* Authentic IELTS Question Formats Rendering */}
          <View style={styles.questionContentContainer}>
            {/* FORMAT 1: Matching */}
            {currentQ?.question_type === 'MATCHING' ? (
              <MatchingQuestion
                items={currentQ.metadata?.items || []}
                options={currentQ.metadata?.options || []}
                matches={currentResponse?.metadata?.matches || {}}
                onMatch={handleUpdateMatching}
                onClearMatch={handleClearMatching}
              />
            ) : currentQ?.question_type === 'LABELING' ? (
              /* FORMAT 2: Diagram / Map Labelling */
              <DiagramLabelingQuestion
                imageUrl={currentQ.image || activeGroup?.context_media}
                labels={currentResponse?.metadata?.labels || {}}
                targets={currentQ.metadata?.targets || []}
                options={currentQ.metadata?.options}
                onChangeLabel={handleUpdateDiagramLabel}
              />
            ) : currentQ?.question_type === 'GAP_FILL' && (currentQ.metadata?.word_bank || currentQ.metadata?.options) ? (
              /* FORMAT 3: Summary Completion with Word Bank */
              <WordBankQuestion
                summaryText={currentQ.text}
                instructionText={currentQ.instructions}
                blanks={currentResponse?.metadata?.blanks || {}}
                blanksConfig={currentQ.metadata?.blanks || []}
                wordBank={currentQ.metadata?.word_bank || currentQ.metadata?.options || []}
                onSelectWord={(blankId, wordId) => handleUpdateGapFill(blankId, wordId)}
                onClearBlank={(blankId) => handleUpdateGapFill(blankId, '')}
              />
            ) : currentQ?.question_type === 'GAP_FILL' ? (
              /* FORMAT 4: Standard Gap Fill / Sentence Completion */
              <GapFillQuestion
                sentence={currentQ.text}
                blanks={currentResponse?.metadata?.blanks || {}}
                blanksConfig={currentQ.metadata?.blanks || []}
                maxWords={currentQ.metadata?.max_words || 2}
                instructionText={currentQ.instructions}
                onChangeBlank={handleUpdateGapFill}
              />
            ) : (currentQ?.question_type === 'MCQ' && (
              currentQ.metadata?.is_multi_select || 
              (currentQ.metadata?.max_choices && currentQ.metadata?.max_choices > 1) ||
              (currentQ.metadata?.max_selections && currentQ.metadata?.max_selections > 1)
            )) ? (
              /* FORMAT 5: Multi-Select MCQ ("Choose 2 or 3 options") */
              <MultiSelectQuestion
                choices={currentQ.choices || []}
                maxChoices={currentQ.metadata?.max_choices || currentQ.metadata?.max_selections || 2}
                selectedChoiceIds={currentResponse?.metadata?.selected_choices || []}
                onSelect={handleSelectMultiChoice}
              />
            ) : currentQ?.choices && currentQ.choices.length > 0 ? (
              /* FORMAT 6: Single-Select MCQ Radio Cards */
              <View style={styles.mcqContainer}>
                <Text style={styles.mcqInstruction}>Select one option:</Text>
                {currentQ.choices.map((choice, cIdx) => {
                  const isSelected = currentResponse?.selected_choice === choice.id;
                  const letter = String.fromCharCode(65 + cIdx);

                  return (
                    <TouchableOpacity
                      key={choice.id}
                      style={[
                        styles.mcqCard,
                        isSelected && styles.mcqCardSelected,
                      ]}
                      onPress={() => handleSelectChoice(choice.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.mcqLetterBadge,
                        isSelected && styles.mcqLetterBadgeSelected,
                      ]}>
                        <Text style={[
                          styles.mcqLetterText,
                          isSelected && styles.mcqLetterTextSelected,
                        ]}>
                          {letter}
                        </Text>
                      </View>
                      <Text style={[
                        styles.mcqChoiceText,
                        isSelected && styles.mcqChoiceTextSelected,
                      ]}>
                        {formatQuestionText(choice.text)}
                      </Text>
                      <View style={[
                        styles.mcqRadioOuter,
                        isSelected && styles.mcqRadioOuterSelected,
                      ]}>
                        {isSelected && <View style={styles.mcqRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* FORMAT 7: Short Answer / Text Entry */
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
                    placeholder="Type your answer here (e.g. NO MORE THAN TWO WORDS)..."
                    placeholderTextColor="#9CA3AF"
                    value={currentAnswerText}
                    onChangeText={txt => currentQ?.id && handleAnswerChange(currentQ.id, txt)}
                    multiline
                    textAlignVertical="top"
                    maxLength={200}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Bar: Question Counter & Prev/Next Buttons */}
        <View style={styles.bottomCardContainer}>
          <View style={styles.bottomCard}>
            <View style={styles.bottomCounterCol}>
              <Text style={styles.bottomQuestionLabel}>Question</Text>
              <Text style={styles.bottomQuestionNumber}>
                {currentGlobalQuestionNumber} of {totalQuestionsInTest}
              </Text>
            </View>

            <View style={styles.bottomActionsRow}>
              {currentResponseIndex > 0 && (
                <TouchableOpacity
                  style={styles.prevButton}
                  onPress={() => setCurrentResponseIndex(prev => prev - 1)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Feather name="chevron-left" size={16} color="#4C1D95" />
                  <Text style={styles.prevButtonText}>Prev</Text>
                </TouchableOpacity>
              )}

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
                      {isLastQuestionOfTest ? 'Submit' : isLastQuestionOfSection ? 'Next Section' : 'Next'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
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
                        {grp.group_title || `Part ${gIdx + 1}`}
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
                        const hasAnswer = Boolean(
                          (resp.selected_choice !== null && resp.selected_choice !== undefined) ||
                          (resp.metadata?.selected_choices && resp.metadata.selected_choices.length > 0) ||
                          (resp.metadata?.blanks && Object.values(resp.metadata.blanks).some((v: any) => typeof v === 'string' && v.trim().length > 0)) ||
                          (resp.metadata?.matches && Object.keys(resp.metadata.matches).length > 0) ||
                          (resp.metadata?.labels && Object.keys(resp.metadata.labels).length > 0) ||
                          (resp.question?.id && answers[resp.question.id]?.trim().length > 0)
                        );
                        const isCurrentGroup = gIdx === activeGroupIndex;

                        return (
                          <TouchableOpacity
                            key={rIdx}
                            style={[
                              styles.modalQBadge,
                              isCurrent && styles.modalQBadgeCurrent,
                              Boolean(hasAnswer) && !isCurrent && styles.modalQBadgeAnswered,
                              Boolean(isQBookmarked) && styles.modalQBadgeBookmarked,
                              !isCurrentGroup && { opacity: 0.35 },
                            ]}
                            disabled={!isCurrentGroup}
                            onPress={() => {
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  sectionTab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sectionTabActive: {
    backgroundColor: '#4C1D95',
  },
  sectionTabInactive: {
    backgroundColor: '#F3F4F6',
  },
  sectionTabTitle: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  sectionTabTitleActive: {
    color: '#FFFFFF',
  },
  sectionTabTitleInactive: {
    color: '#374151',
  },
  sectionTabSub: {
    fontSize: 9.5,
    marginTop: 1,
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

  // Audio Player Section (Authentic IELTS Continuous Playback)
  audioPlayerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  audioPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  audioTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  audioTrackBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
  },
  audioPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioPlayingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  audioEndedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioEndedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  audioLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioLoadingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4C1D95',
  },
  audioReadyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audioReadyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 65,
    gap: 4,
    marginVertical: 6,
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
    marginTop: 4,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarWrapperReadOnly: {
    width: '100%',
    height: 8,
    justifyContent: 'center',
    marginVertical: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#5B21B6',
    borderRadius: 2.5,
  },
  audioNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  audioNoticeText: {
    fontSize: 11.5,
    color: '#5B21B6',
    flex: 1,
    lineHeight: 16,
  },
  startAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  startAudioButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    minHeight: 110,
    padding: 14,
  },
  textInputArea: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
    flex: 1,
  },

  // Context & Instructions Box
  contextBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  contextBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contextBoxTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  contextBoxText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },

  // Question Content Container
  questionContentContainer: {
    width: '100%',
    marginTop: 4,
  },

  // MCQ Styles
  mcqContainer: {
    width: '100%',
    marginTop: 6,
  },
  mcqInstruction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  mcqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  mcqCardSelected: {
    borderColor: '#4C1D95',
    backgroundColor: '#FAF5FF',
  },
  mcqLetterBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mcqLetterBadgeSelected: {
    backgroundColor: '#4C1D95',
  },
  mcqLetterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  mcqLetterTextSelected: {
    color: '#FFFFFF',
  },
  mcqChoiceText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  mcqChoiceTextSelected: {
    color: '#111827',
    fontWeight: '600',
  },
  mcqRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  mcqRadioOuterSelected: {
    borderColor: '#4C1D95',
  },
  mcqRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4C1D95',
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
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C1D95',
    marginLeft: 2,
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
