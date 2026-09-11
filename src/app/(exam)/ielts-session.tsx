import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { mediaCache } from '@/services/mediaCache';
import { examService, UserAttempt, AttemptSection, QuestionGroupItem, UserResponseItem } from '@/services/exam';
import { 
  MultiSelectQuestion, 
  TFNGQuestion, 
  GapFillQuestion, 
  WordBankQuestion, 
  MatchingQuestion, 
  DiagramLabelingQuestion,
  IELTSChartCard,
  IELTSWritingEditor,
  AudioResponseQuestion,
} from '@/components/ielts';
import { 
  SubscriptionRequiredModal, 
  isSubscriptionError, 
  getSubscriptionErrorMessage 
} from '@/components/SubscriptionRequiredModal';

export default function IELTSSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    attempt_id?: string; 
    exam?: string; 
    exam_type_id?: string; 
    exam_name?: string;
    section_order?: string; 
    sections?: string; 
    mode?: string;
    time_limit?: string;
    section_index?: string;
  }>();
  
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const initialSectionIndex = params.section_index ? Math.max(0, parseInt(String(params.section_index), 10) || 0) : 0;
  const [activeSectionIndex, setActiveSectionIndex] = useState(initialSectionIndex);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  // Listening Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Writing Visual Preview State
  const [isPromptImageExpanded, setIsPromptImageExpanded] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [writingElapsedSeconds, setWritingElapsedSeconds] = useState(0);
  const tabsScrollViewRef = useRef<ScrollView>(null);


  useEffect(() => {
    let isMounted = true;

    const initIelts = async () => {
      try {
        let currentAttempt: UserAttempt;
        if (params.attempt_id) {
          const res = await examService.resumeExam(Number(params.attempt_id));
          currentAttempt = res;
          if (res.timer_info?.remaining_seconds !== undefined) {
            setTimeLeft(res.timer_info.remaining_seconds);
          }
        } else {
          const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
          let order: number[] | undefined;
          if (params.section_order) {
            order = params.section_order.split(',').map(Number);
          } else if (params.sections) {
            try {
              order = typeof params.sections === 'string' ? JSON.parse(params.sections) : params.sections;
            } catch {
              order = undefined;
            }
          }
          const mode = (params.mode as any) || 'Standard';
          const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;

          const newAttempt = await examService.startExam({
            exam_type_id: examId,
            mode: mode,
            selected_section_ids: order,
            time_limit_override: mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
          });
          const res = await examService.resumeExam(newAttempt.id);
          currentAttempt = res;
          if (res.timer_info?.remaining_seconds !== undefined) {
            setTimeLeft(res.timer_info.remaining_seconds);
          }
        }

        // Sort sections according to section_order if available
        if (params.section_order && currentAttempt.sections) {
          const orderMap = new Map(params.section_order.split(',').map((id, index) => [Number(id), index]));
          currentAttempt.sections.sort((a, b) => {
            const indexA = orderMap.has(a.section_id) ? orderMap.get(a.section_id)! : 999;
            const indexB = orderMap.has(b.section_id) ? orderMap.get(b.section_id)! : 999;
            return indexA - indexB;
          });
        }
        
        if (isMounted) {
          setAttempt(currentAttempt);
          const initialBookmarks: number[] = [];
          currentAttempt.sections?.forEach(sec => {
            sec.question_groups?.forEach(grp => {
              grp.responses?.forEach(resp => {
                if ((resp as any).is_bookmarked && resp.question?.id) {
                  initialBookmarks.push(resp.question.id);
                }
              });
            });
          });
          setBookmarkedQuestions(initialBookmarks);
        }
      } catch (e: any) {
        console.error('Could not initialize live IELTS attempt:', e);
        const errorMsg = getSubscriptionErrorMessage(
          e,
          'Could not initialize exam session.'
        );
        if (isSubscriptionError(e)) {
          setSubscriptionMessage(errorMsg);
          setShowSubscriptionModal(true);
        } else {
          Alert.alert('Error', errorMsg, [
            { text: 'Go Back', onPress: () => router.canGoBack() ? router.back() : router.replace('/') }
          ]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    initIelts();

    return () => {
      isMounted = false;
    };
  }, [params.attempt_id, params.exam, params.exam_type_id, params.section_order]);

  // Sync active section if passed as route param
  useEffect(() => {
    if (params.section_index !== undefined && params.section_index !== null) {
      const targetIdx = parseInt(String(params.section_index), 10);
      if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx !== activeSectionIndex) {
        setActiveSectionIndex(targetIdx);
        setActiveGroupIndex(0);
        setCurrentResponseIndex(0);
      }
    }
  }, [params.section_index]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!loading && attempt) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            executeSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, attempt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeSection = attempt?.sections[activeSectionIndex];
  const activeGroup = activeSection?.question_groups[activeGroupIndex];
  const currentResponse = activeGroup?.responses[currentResponseIndex];

  useEffect(() => {
    const isWriting = (activeSection?.section_name || '').toLowerCase().includes('writing');
    if (!isWriting) return;
    const interval = setInterval(() => {
      setWritingElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSection?.section_name]);

  // Map of all responses in the current section for the palette
  const allSectionResponses = useMemo(() => {
    if (!activeSection) return [];
    return activeSection.question_groups.flatMap(g => g.responses);
  }, [activeSection]);

  // Exam stats across all sections for submit confirmation modal
  const examStats = useMemo(() => {
    if (!attempt?.sections) return { total: 0, answered: 0, unanswered: 0, bookmarked: 0 };
    let total = 0;
    let answered = 0;
    let bookmarked = 0;
    attempt.sections.forEach(sec => {
      sec.question_groups?.forEach(grp => {
        grp.responses?.forEach(resp => {
          total += 1;
          if (resp.selected_choice !== null && resp.selected_choice !== undefined) {
            answered += 1;
          } else if (resp.written_response || resp.audio_response) {
            answered += 1;
          }
          if ((resp as any).is_bookmarked) {
            bookmarked += 1;
          }
        });
      });
    });
    return {
      total,
      answered,
      unanswered: Math.max(0, total - answered),
      bookmarked,
    };
  }, [attempt]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const navigationTabs = useMemo(() => {
    if (!activeSection?.question_groups || activeSection.question_groups.length === 0) {
      return [];
    }

    const isWriting = (activeSection.section_name || '').toLowerCase().includes('writing');
    if (isWriting) {
      return activeSection.question_groups.map((group, idx) => {
        const isTask2 = idx === 1 || (group.group_title || '').toLowerCase().includes('task 2');
        return {
          id: group.group_id,
          title: group.group_title || `Task ${idx + 1}`,
          subtitle: isTask2 ? '40 mins · 250 words' : '20 mins · 150 words',
          groupIndices: [idx],
          startQuestionNumber: idx + 1,
          endQuestionNumber: idx + 1,
          firstGroupIndex: idx,
        };
      });
    }

    // Cumulative question ranges for each group
    const groupRanges: { startQ: number; endQ: number }[] = [];
    let cumulativeQ = 1;
    activeSection.question_groups.forEach((group) => {
      const len = group.responses?.length || 1;
      groupRanges.push({
        startQ: cumulativeQ,
        endQ: cumulativeQ + len - 1,
      });
      cumulativeQ += len;
    });

    // Check if groups can be merged by Passage or Part
    const passageKeyRegex = /(Passage\s+\d+|Part\s+\d+|Section\s+\d+)/i;
    const groupsWithKeys = activeSection.question_groups.map((group, idx) => {
      const tag = (group as any).topic_tag;
      const titleMatch = (group.group_title || '').match(passageKeyRegex);
      const key = tag || (titleMatch ? titleMatch[1] : null);
      return { group, idx, key };
    });

    const hasPassageKeys = groupsWithKeys.some(g => g.key !== null);

    if (hasPassageKeys) {
      const mergedTabs: {
        id: string | number;
        title: string;
        subtitle: string;
        groupIndices: number[];
        startQuestionNumber: number;
        endQuestionNumber: number;
        firstGroupIndex: number;
      }[] = [];
      let currentTab: typeof mergedTabs[0] | null = null;
      let lastKey = '';

      groupsWithKeys.forEach(({ group, idx, key }) => {
        const tabKey = key || `Part ${mergedTabs.length + 1}`;
        if (currentTab && tabKey.toLowerCase() === lastKey.toLowerCase()) {
          currentTab.groupIndices.push(idx);
          currentTab.endQuestionNumber = groupRanges[idx].endQ;
          currentTab.subtitle = `Questions ${currentTab.startQuestionNumber}–${currentTab.endQuestionNumber}`;
        } else {
          const cleanTitle = tabKey.replace(/\b\w/g, (c: string) => c.toUpperCase());
          const startQ = groupRanges[idx].startQ;
          const endQ = groupRanges[idx].endQ;
          const subtitle = startQ === endQ ? `Question ${startQ}` : `Questions ${startQ}–${endQ}`;

          currentTab = {
            id: `tab-${tabKey}-${idx}`,
            title: cleanTitle,
            subtitle,
            groupIndices: [idx],
            startQuestionNumber: startQ,
            endQuestionNumber: endQ,
            firstGroupIndex: idx,
          };
          mergedTabs.push(currentTab);
          lastKey = tabKey;
        }
      });

      return mergedTabs;
    }

    // Fallback: each group is its own tab
    return activeSection.question_groups.map((group, idx) => {
      const startQ = groupRanges[idx].startQ;
      const endQ = groupRanges[idx].endQ;
      const subtitle = startQ === endQ ? `Question ${startQ}` : `Questions ${startQ}–${endQ}`;

      let cleanTitle = group.group_title?.trim() || `Part ${idx + 1}`;
      if (cleanTitle.length > 20) {
        const parenMatch = cleanTitle.match(/\(([^)]+)\)/);
        cleanTitle = parenMatch ? parenMatch[1] : `Part ${idx + 1}`;
      }

      return {
        id: group.group_id || idx,
        title: cleanTitle,
        subtitle,
        groupIndices: [idx],
        startQuestionNumber: startQ,
        endQuestionNumber: endQ,
        firstGroupIndex: idx,
      };
    });
  }, [activeSection]);

  const activeTab = useMemo(() => {
    return navigationTabs.find(tab => tab.groupIndices.includes(activeGroupIndex)) || navigationTabs[0];
  }, [navigationTabs, activeGroupIndex]);

  useEffect(() => {
    if (activeTab && tabsScrollViewRef.current && navigationTabs.length > 3) {
      const activeIdx = navigationTabs.findIndex(t => t.id === activeTab.id);
      if (activeIdx >= 0) {
        const approximateTabWidth = 140;
        const scrollX = Math.max(0, (activeIdx * approximateTabWidth) - 30);
        tabsScrollViewRef.current.scrollTo({ x: scrollX, animated: true });
      }
    }
  }, [activeTab?.id, navigationTabs.length]);

  const handlePlayAudio = async (audioUri: string) => {
    try {
      if (sound) {
        if (isPlayingAudio) {
          await sound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          if (params.mode === 'Standard' && hasPlayedAudio) {
            Alert.alert('Audio Limit', 'In Standard IELTS Listening, the audio track can only be played once.');
            return;
          }
          await sound.playAsync();
          setIsPlayingAudio(true);
        }
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const cachedAudioUri = await mediaCache.getCachedAudioUri(audioUri);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: cachedAudioUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis || 0);
            setAudioDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlayingAudio(false);
              setHasPlayedAudio(true);
            }
          }
        }
      );
      setSound(newSound);
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const handleSelectOption = async (choiceId: number) => {
    if (!attempt || !currentResponse) return;
    
    // Optimistic update
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    resp.selected_choice = choiceId;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{ 
          question_id: currentResponse.question.id, 
          choice_id: choiceId,
          time_spent_seconds: 15 // Approx
        }]
      });
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  };

  const handleSelectMultiChoice = async (selectedIds: number[]) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const newMeta = { ...(resp.metadata || {}), selected_choices: selectedIds };
    resp.metadata = newMeta;
    resp.selected_choice = selectedIds[0] || null;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          choice_id: selectedIds[0] || null,
          metadata: newMeta,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save multi-choice failed:', e);
    }
  };

  const handleSelectTFNG = async (val: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const format = currentResponse.question.metadata?.format || 'TFNG';
    const key = format === 'YNNG' ? 'ynng_answer' : 'tfng_answer';
    const newMeta = { ...(resp.metadata || {}), [key]: val };
    resp.metadata = newMeta;
    
    const matchChoice = currentResponse.question.choices?.find(c => c.text.trim().toUpperCase() === val.toUpperCase());
    if (matchChoice) {
      resp.selected_choice = matchChoice.id;
    }
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          choice_id: matchChoice?.id,
          metadata: newMeta,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save TFNG failed:', e);
    }
  };

  const handleUpdateGapFill = async (blankId: string, val: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const existingBlanks = resp.metadata?.blanks || {};
    const newBlanks = { ...existingBlanks, [blankId]: val };
    const newMeta = { ...(resp.metadata || {}), blanks: newBlanks };
    resp.metadata = newMeta;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          metadata: newMeta,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save gap fill failed:', e);
    }
  };

  const handleUpdateMatching = async (itemId: string, optId: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const existingMatches = resp.metadata?.matches || {};
    const newMatches = { ...existingMatches, [itemId]: optId };
    const newMeta = { ...(resp.metadata || {}), matches: newMatches };
    resp.metadata = newMeta;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          metadata: newMeta,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save matching failed:', e);
    }
  };

  const handleClearMatching = async (itemId: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const newMatches = { ...(resp.metadata?.matches || {}) };
    delete newMatches[itemId];
    const newMeta = { ...(resp.metadata || {}), matches: newMatches };
    resp.metadata = newMeta;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          metadata: newMeta,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save matching clear failed:', e);
    }
  };

  const handleUpdateAudioResponse = async (questionId: number, audioUri: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const newMeta = { ...(resp.metadata || {}), audio_uri: audioUri };
    resp.metadata = newMeta;
    resp.audio_response_url = audioUri;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: questionId,
          metadata: newMeta,
          audio_response_url: audioUri,
          time_spent_seconds: 30,
        }]
      });
    } catch (e) {
      console.warn('Auto-save audio response failed:', e);
    }
  };

  const handleUpdateDiagramLabel = async (targetId: string, val: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    const existingLabels = resp.metadata?.labels || {};
    const newLabels = { ...existingLabels, [targetId]: val };
    const newMeta = { ...(resp.metadata || {}), labels: newLabels };
    resp.metadata = newMeta;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          metadata: newMeta,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save labeling failed:', e);
    }
  };

  const handleUpdateWrittenText = async (text: string) => {
    if (!attempt || !currentResponse) return;
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    resp.written_response = text;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{
          question_id: currentResponse.question.id,
          written_response: text,
          time_spent_seconds: 15,
        }]
      });
    } catch (e) {
      console.warn('Auto-save written response failed:', e);
    }
  };

  const toggleBookmark = async (questionId: number) => {
    const isCurrentlyBookmarked = bookmarkedQuestions.includes(questionId);
    const nextState = !isCurrentlyBookmarked;

    // Optimistic UI state update
    setBookmarkedQuestions(prev => 
      isCurrentlyBookmarked ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );

    // Update in-memory attempt state
    if (attempt) {
      const updatedAttempt = { ...attempt };
      updatedAttempt.sections?.forEach(sec => {
        sec.question_groups?.forEach(grp => {
          grp.responses?.forEach(resp => {
            if (resp.question?.id === questionId) {
              (resp as any).is_bookmarked = nextState;
            }
          });
        });
      });
      setAttempt(updatedAttempt);
    }

    // Backend sync
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

  const handleNext = () => {
    if (!activeGroup || !activeSection) return;
    if (currentResponseIndex < activeGroup.responses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
    } else if (activeGroupIndex < activeSection.question_groups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setCurrentResponseIndex(0);
    } else if (attempt && activeSectionIndex < attempt.sections.length - 1) {
      const nextSectionIndex = activeSectionIndex + 1;
      const nextSection = attempt.sections[nextSectionIndex];
      const completedSessionsCount = activeSectionIndex + 1;

      // Unload any playing audio
      if (sound) {
        sound.unloadAsync().catch(() => {});
        setSound(null);
        setIsPlayingAudio(false);
      }

      // Check if a break should be shown after every 2 sessions!
      if (completedSessionsCount % 2 === 0) {
        router.push({
          pathname: '/(exam)/ielts-break',
          params: {
            attempt_id: String(attempt.id),
            exam_id: params.exam || params.exam_type_id || '42',
            exam_name: (attempt as any)?.exam_type_name || params.exam_name || 'IELTS Academic',
            next_section_index: String(nextSectionIndex),
            next_section_name: nextSection.section_name,
            section_order: params.section_order,
            mode: params.mode,
          },
        });
      } else {
        // Between individual sessions (e.g. Session 1 -> Session 2)
        if (nextSection.section_name.toLowerCase().includes('speaking')) {
          router.push({
            pathname: '/(exam)/ielts-speaking-instructions',
            params: { attempt_id: String(attempt.id) },
          });
        } else {
          router.push({
            pathname: '/(exam)/ielts-section-instructions',
            params: {
              attempt_id: String(attempt.id),
              exam: params.exam || params.exam_type_id || '42',
              exam_name: (attempt as any)?.exam_type_name || params.exam_name || 'IELTS Academic',
              section_index: String(nextSectionIndex),
              section_name: nextSection.section_name,
              section_order: params.section_order,
              mode: params.mode,
            },
          });
        }
      }
    } else {
      setShowSubmitModal(true);
    }
  };

  const handlePrevious = () => {
    if (!activeGroup || !activeSection) return;
    if (currentResponseIndex > 0) {
      setCurrentResponseIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      setActiveGroupIndex(prev => prev - 1);
      setCurrentResponseIndex(activeSection.question_groups[activeGroupIndex - 1].responses.length - 1);
    }
  };

  const executeSubmit = async () => {
    if (!attempt) return;
    try {
      setIsSubmitting(true);
      const responsesPayload: any[] = [];
      attempt.sections?.forEach(sec => {
        sec.question_groups?.forEach(grp => {
          grp.responses?.forEach(resp => {
            const item: any = { question_id: resp.question.id };
            let hasData = false;

            if (resp.selected_choice !== null && resp.selected_choice !== undefined) {
              item.choice_id = resp.selected_choice;
              hasData = true;
            }
            if (resp.written_response) {
              item.written_response = resp.written_response;
              hasData = true;
            }
            if (resp.metadata && Object.keys(resp.metadata).length > 0) {
              item.metadata = resp.metadata;
              hasData = true;
            }
            if ((resp as any).is_bookmarked || bookmarkedQuestions.includes(resp.question.id)) {
              item.is_bookmarked = true;
              hasData = true;
            }

            if (hasData) {
              responsesPayload.push(item);
            }
          });
        });
      });

      await examService.submitExam(attempt.id, { responses: responsesPayload });
      setShowSubmitModal(false);
      router.replace({
        pathname: '/(exam)/test-result',
        params: { attempt_id: String(attempt.id) }
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Could not submit test. Please try again.';
      Alert.alert('Submit Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrompt = () => {
    setShowSubmitModal(true);
  };

  if (loading || !attempt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading Exam Session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeSection || !activeGroup || !currentResponse) {
     return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#6B7280' }}>No content available for this section.</Text>
          <TouchableOpacity onPress={handleNext} style={[styles.nextButton, { marginTop: 20 }]}>
            <Text style={styles.nextButtonText}>Next Section</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
     );
  }

  const isWritingSection = (activeSection.section_name || '').toLowerCase().includes('writing');
  const isReadingSection = (activeSection.section_name || '').toLowerCase().includes('reading');

  // Compute question range for current activeGroup
  let passageStartQ = 1;
  for (let i = 0; i < activeGroupIndex; i++) {
    passageStartQ += activeSection.question_groups[i]?.responses?.length || 0;
  }
  const passageEndQ = passageStartQ + (activeGroup.responses?.length || 1) - 1;
  const passageRangeText = activeGroup.responses?.length > 0 ? `Questions ${passageStartQ}–${passageEndQ}` : '';
  const globalQuestionNumber = passageStartQ + currentResponseIndex;

  const getQuestionTypeMeta = (response: UserResponseItem) => {
    const q = response.question;
    const format = q.metadata?.format;
    const qType = q.question_type;

    if (format === 'TFNG') {
      return {
        title: 'True / False / Not Given',
        subtitle: q.instructions || `Do the following statements agree with the information given in Reading Passage ${activeGroupIndex + 1}?`,
      };
    }
    if (format === 'YNNG') {
      return {
        title: 'Yes / No / Not Given',
        subtitle: q.instructions || 'Do the following statements agree with the views/claims of the writer?',
      };
    }
    if (qType === 'MATCHING') {
      return {
        title: 'Matching Information',
        subtitle: q.instructions || 'Which paragraph contains the following information? Choose the correct letter, A–D.',
      };
    }
    if (qType === 'GAP_FILL') {
      return {
        title: 'Fill in the Blanks',
        subtitle: q.instructions || 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      };
    }
    if (qType === 'LABELING') {
      return {
        title: 'Diagram Labelling',
        subtitle: q.instructions || 'Label the diagram below using words from the passage or box.',
      };
    }
    if (qType === 'MCQ') {
      const isMulti = q.metadata?.is_multi_select || (q.metadata?.max_choices && q.metadata?.max_choices > 1) || (q.metadata?.max_selections && q.metadata?.max_selections > 1);
      if (isMulti) {
        const count = q.metadata?.max_choices || q.metadata?.max_selections || 2;
        return {
          title: `Choose ${count} Options`,
          subtitle: q.instructions || `Choose ${count} letters, A–E.`,
        };
      }
      return {
        title: 'Multiple Choice',
        subtitle: q.instructions || 'Choose the correct letter, A, B, C or D.',
      };
    }
    return {
      title: activeGroup.group_title || 'Question',
      subtitle: q.instructions || '',
    };
  };

  const getGroupFormatLabel = (grp: QuestionGroupItem) => {
    const parenMatch = grp.group_title?.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      return parenMatch[1];
    }
    if (grp.responses?.[0]) {
      return getQuestionTypeMeta(grp.responses[0]).title;
    }
    return grp.group_title || 'Questions';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setIsPaletteVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="menu" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isWritingSection ? 'IELTS Writing' : isReadingSection ? 'IELTS Reading' : activeSection.section_name}
          </Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Modern Responsive Navigation Tabs (Passages / Tasks / Parts) */}
        {navigationTabs.length > 0 && (
          <View style={styles.tabsWrapper}>
            <ScrollView
              ref={tabsScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.tabsScrollContent,
                navigationTabs.length <= 3 && styles.tabsScrollContentFill,
              ]}
            >
              {navigationTabs.map((tab) => {
                const isTabActive = activeTab?.id === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.modernTab,
                      isTabActive && styles.modernTabActive,
                      navigationTabs.length <= 3 && styles.modernTabFill,
                    ]}
                    onPress={() => {
                      setActiveGroupIndex(tab.firstGroupIndex);
                      setCurrentResponseIndex(0);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.modernTabTitle, isTabActive && styles.modernTabTitleActive]}
                      numberOfLines={1}
                    >
                      {tab.title}
                    </Text>
                    {tab.subtitle ? (
                      <Text
                        style={[styles.modernTabSub, isTabActive && styles.modernTabSubActive]}
                        numberOfLines={1}
                      >
                        {tab.subtitle}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isWritingSection ? (() => {
            const isTask2 = (activeGroup.group_title || '').toLowerCase().includes('task 2') || 
                            (currentResponse.question.text || '').toLowerCase().includes('task 2') || 
                            activeGroupIndex === 1;
            const targetMins = isTask2 ? 40 : 20;
            const minWords = isTask2 ? 250 : 150;
            const taskHeading = isTask2 ? 'Task 2' : 'Task 1';
            const promptBody = activeGroup.context_text || currentResponse.question.text || (isTask2 
              ? 'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?'
              : 'The chart below shows the number of visitors to a museum between 2015 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.');
            const promptImage = currentResponse.question.image || activeGroup.context_media;

            return (
              <View style={styles.writingSectionContainer}>
                {/* Time Suggestion & Bookmark Header */}
                <View style={styles.writingBannerRow}>
                  <View style={styles.writingTimeBadge}>
                    <Feather name="clock" size={14} color="#6B7280" />
                    <Text style={styles.writingTimeText}>
                      You should spend about {targetMins} minutes on this task.
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookmarkButton}
                    onPress={() => currentResponse?.question && toggleBookmark(currentResponse.question.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons 
                      name={currentResponse?.question && bookmarkedQuestions.includes(currentResponse.question.id) ? "bookmark" : "bookmark-outline"} 
                      size={20} 
                      color={currentResponse?.question && bookmarkedQuestions.includes(currentResponse.question.id) ? '#F59E0B' : '#6B7280'} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Main Writing Card */}
                <View style={styles.writingCard}>
                  <Text style={styles.writingCardTitle}>{taskHeading}</Text>
                  <Text style={styles.writingCardPrompt}>{promptBody}</Text>

                  {/* Task 1 Line Chart or Prompt Image */}
                  {(!isTask2 || promptImage) && (
                    <IELTSChartCard 
                      imageUrl={promptImage}
                      title={promptImage ? undefined : "Number of Visitors to the Museum (2015–2020)"}
                    />
                  )}

                  <Text style={styles.writingMinWordsNotice}>
                    Write at least {minWords} words.
                  </Text>

                  {/* Rich Toolbar Editor */}
                  <IELTSWritingEditor
                    value={currentResponse.written_response || ''}
                    onChangeText={handleUpdateWrittenText}
                    targetMinutes={targetMins}
                    minWords={minWords}
                    elapsedSeconds={writingElapsedSeconds}
                    placeholder="Type your essay / response here..."
                  />
                </View>

                {/* Full-width Next CTA Button */}
                <TouchableOpacity 
                  style={styles.fullNextButton}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fullNextButtonText}>
                    {activeGroupIndex < activeSection.question_groups.length - 1 ? 'Next Task' : 'Submit Test'}
                  </Text>
                </TouchableOpacity>

                {activeGroupIndex > 0 && (
                  <TouchableOpacity 
                    style={styles.subtlePrevButton}
                    onPress={handlePrevious}
                    activeOpacity={0.7}
                  >
                    <Feather name="chevron-left" size={16} color="#6B7280" />
                    <Text style={styles.subtlePrevButtonText}>Previous Task</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })() : (
            <>
              {/* Passage Reading Card */}
              {(activeGroup.context_text || activeGroup.context_media) && (
                <View style={styles.passageCard}>
                  <View style={styles.passageHeaderRow}>
                    <Text style={styles.passageNumberText}>
                      {activeTab ? activeTab.title : (activeGroup.group_title || `Passage ${activeGroupIndex + 1}`)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.bookmarkButton}
                      onPress={() => currentResponse?.question && toggleBookmark(currentResponse.question.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons 
                        name={currentResponse?.question && bookmarkedQuestions.includes(currentResponse.question.id) ? "bookmark" : "bookmark-outline"} 
                        size={20} 
                        color={currentResponse?.question && bookmarkedQuestions.includes(currentResponse.question.id) ? '#F59E0B' : '#6B7280'} 
                      />
                    </TouchableOpacity>
                  </View>

                  {activeGroup.context_text && (
                    <Text style={styles.passageBodyText}>{activeGroup.context_text}</Text>
                  )}
                </View>
              )}

              {/* Listening Audio Control Card */}
              {activeSection.section_name.toLowerCase().includes('listening') && (activeGroup.context_media || (activeGroup as any).audio_file || currentResponse.question.audio_file) && (
                <View style={styles.audioPlayerCard}>
                  <View style={styles.audioPlayerLeft}>
                    <TouchableOpacity
                      style={[styles.audioPlayBtn, isPlayingAudio && styles.audioPauseBtn]}
                      onPress={() => handlePlayAudio(activeGroup.context_media || (activeGroup as any).audio_file || currentResponse.question.audio_file)}
                      disabled={params.mode === 'Standard' && hasPlayedAudio && !isPlayingAudio}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={isPlayingAudio ? "pause" : "play"} 
                        size={22} 
                        color="#FFF" 
                      />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.audioPlayerTitle}>
                        {activeGroup.group_title || `Part ${activeGroupIndex + 1} Audio`}
                      </Text>
                      <Text style={styles.audioPlayerSub}>
                        {params.mode === 'Standard' ? 'Plays once in Standard Mode' : 'Practice Audio Track'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.audioPill}>
                    <Ionicons name="volume-medium" size={16} color="#7C3AED" />
                    <Text style={styles.audioPillText}>
                      {audioDuration > 0
                        ? `${Math.floor(audioPosition / 60000)}:${Math.floor((audioPosition % 60000) / 1000).toString().padStart(2, '0')}`
                        : isPlayingAudio ? 'Playing' : 'Audio Ready'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Sub-Group Selector within Active Passage */}
              {activeTab && activeTab.groupIndices.length > 1 ? (
                <View style={styles.subGroupContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subGroupScrollContent}>
                    {activeTab.groupIndices.map((gIdx) => {
                      const grp = activeSection.question_groups[gIdx];
                      const isCurrentGroup = activeGroupIndex === gIdx;
                      
                      let gStartQ = 1;
                      for (let i = 0; i < gIdx; i++) {
                        gStartQ += activeSection.question_groups[i]?.responses?.length || 0;
                      }
                      const gEndQ = gStartQ + (grp.responses?.length || 1) - 1;
                      const gRange = gStartQ === gEndQ ? `Q${gStartQ}` : `Q${gStartQ}–${gEndQ}`;
                      const formatLabel = getGroupFormatLabel(grp);

                      return (
                        <TouchableOpacity
                          key={grp.group_id}
                          style={[styles.subGroupChip, isCurrentGroup && styles.subGroupChipActive]}
                          onPress={() => {
                            setActiveGroupIndex(gIdx);
                            setCurrentResponseIndex(0);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.subGroupDot, isCurrentGroup && styles.subGroupDotActive]} />
                          <Text style={[styles.subGroupChipText, isCurrentGroup && styles.subGroupChipTextActive]}>
                            {gRange}: {formatLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : passageRangeText ? (
                <Text style={styles.questionSectionTitle}>{passageRangeText}</Text>
              ) : null}

              {/* Current Question Card */}
              <View style={styles.questionCard}>
                <View style={styles.questionHeaderContainer}>
                  <View style={styles.questionBadgeCircle}>
                    <Text style={styles.questionBadgeNumber}>{globalQuestionNumber}</Text>
                  </View>
                  <View style={styles.questionTitleColumn}>
                    <Text style={styles.questionTitleText}>
                      {getQuestionTypeMeta(currentResponse).title}
                    </Text>
                    <Text style={styles.questionSubtitleText}>
                      {getQuestionTypeMeta(currentResponse).subtitle}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookmarkButton}
                    onPress={() => currentResponse?.question && toggleBookmark(currentResponse.question.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons 
                      name={currentResponse?.question && bookmarkedQuestions.includes(currentResponse.question.id) ? "bookmark" : "bookmark-outline"} 
                      size={20} 
                      color={currentResponse?.question && bookmarkedQuestions.includes(currentResponse.question.id) ? '#F59E0B' : '#9CA3AF'} 
                    />
                  </TouchableOpacity>
                </View>

                {/* FORMAT 1: True / False / Not Given & Yes / No / Not Given */}
                {(currentResponse.question.metadata?.format === 'TFNG' || currentResponse.question.metadata?.format === 'YNNG') ? (
                  <TFNGQuestion
                    statement={currentResponse.question.text}
                    format={currentResponse.question.metadata?.format}
                    selectedAnswer={currentResponse.metadata?.tfng_answer || currentResponse.metadata?.ynng_answer}
                    onSelect={handleSelectTFNG}
                  />
                ) : currentResponse.question.question_type === 'MATCHING' ? (
                  /* FORMAT 2: Matching Headings / Features / Sentence Endings */
                  <MatchingQuestion
                    items={currentResponse.question.metadata?.items || []}
                    options={currentResponse.question.metadata?.options || []}
                    matches={currentResponse.metadata?.matches || {}}
                    onMatch={handleUpdateMatching}
                    onClearMatch={handleClearMatching}
                  />
                ) : currentResponse.question.question_type === 'LABELING' ? (
                  /* FORMAT 3: Diagram / Map Labelling */
                  <DiagramLabelingQuestion
                    imageUrl={currentResponse.question.image || activeGroup.context_media}
                    labels={currentResponse.metadata?.labels || {}}
                    targets={currentResponse.question.metadata?.targets || []}
                    options={currentResponse.question.metadata?.options}
                    onChangeLabel={handleUpdateDiagramLabel}
                  />
                ) : currentResponse.question.question_type === 'GAP_FILL' && currentResponse.question.metadata?.word_bank ? (
                  /* FORMAT 4: Summary Completion with Word Bank */
                  <WordBankQuestion
                    blanks={currentResponse.metadata?.blanks || {}}
                    blanksConfig={currentResponse.question.metadata?.blanks || []}
                    wordBank={currentResponse.question.metadata?.word_bank || []}
                    onSelectWord={(blankId, wordId) => handleUpdateGapFill(blankId, wordId)}
                    onClearBlank={(blankId) => handleUpdateGapFill(blankId, '')}
                  />
                ) : currentResponse.question.question_type === 'GAP_FILL' ? (
                  /* FORMAT 5: Standard Gap Fill / Sentence Completion */
                  <GapFillQuestion
                    sentence={currentResponse.question.text}
                    blanks={currentResponse.metadata?.blanks || {}}
                    blanksConfig={currentResponse.question.metadata?.blanks || []}
                    maxWords={currentResponse.question.metadata?.max_words || 2}
                    instructionText={currentResponse.question.instructions}
                    onChangeBlank={handleUpdateGapFill}
                  />
                ) : currentResponse.question.question_type === 'AUDIO' ? (
                  /* FORMAT 6: Audio Response / Speaking Question */
                  <AudioResponseQuestion
                    audioUri={currentResponse.metadata?.audio_uri || currentResponse.audio_response_url}
                    instructionText={currentResponse.question.instructions || 'Record your audio response for this question.'}
                    onRecordComplete={(uri) => {
                      handleUpdateAudioResponse(currentResponse.question.id, uri);
                    }}
                    onClearRecord={() => {
                      handleUpdateAudioResponse(currentResponse.question.id, '');
                    }}
                  />
                ) : (currentResponse.question.question_type === 'MCQ' && (
                  currentResponse.question.metadata?.is_multi_select || 
                  (currentResponse.question.metadata?.max_choices && currentResponse.question.metadata?.max_choices > 1) ||
                  (currentResponse.question.metadata?.max_selections && currentResponse.question.metadata?.max_selections > 1)
                )) ? (
                  /* FORMAT 6: Multi-Select MCQ ("Choose 2 or 3 options") */
                  <MultiSelectQuestion
                    choices={currentResponse.question.choices || []}
                    selectedChoiceIds={currentResponse.metadata?.selected_choices || (currentResponse.selected_choice ? [currentResponse.selected_choice] : [])}
                    maxChoices={currentResponse.question.metadata?.max_choices || currentResponse.question.metadata?.max_selections || 2}
                    onSelect={handleSelectMultiChoice}
                  />
                ) : (
                  /* FORMAT 7: Standard Single-Choice MCQ */
                  currentResponse.question.choices && currentResponse.question.choices.length > 0 && (
                    <View style={styles.optionsList}>
                      {currentResponse.question.choices.map((opt, i) => {
                        const isSelected = currentResponse.selected_choice === opt.id;
                        const label = String.fromCharCode(65 + i);
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[
                              styles.optionItem,
                              isSelected && styles.optionItemSelected,
                            ]}
                            onPress={() => handleSelectOption(opt.id)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                              {isSelected && <View style={styles.radioDot} />}
                            </View>
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                              <Text style={styles.optionLabel}>{label}. </Text>
                              {opt.text}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )
                )}
              </View>

              {/* Full-width Purple Next Button */}
              <TouchableOpacity 
                style={styles.fullNextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.fullNextButtonText}>
                  {currentResponseIndex < activeGroup.responses.length - 1 
                    ? 'Next' 
                    : activeGroupIndex < activeSection.question_groups.length - 1 
                      ? 'Next Passage' 
                      : 'Submit Test'}
                </Text>
              </TouchableOpacity>

              {(currentResponseIndex > 0 || activeGroupIndex > 0) && (
                <TouchableOpacity 
                  style={styles.subtlePrevButton}
                  onPress={handlePrevious}
                  activeOpacity={0.7}
                >
                  <Feather name="chevron-left" size={16} color="#6B7280" />
                  <Text style={styles.subtlePrevButtonText}>Previous Question</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Bottom Utility Bar */}
        <View style={styles.bottomBar}>
          {/* Question Palette */}
          <TouchableOpacity 
            style={styles.bottomBarAction}
            onPress={() => setIsPaletteVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="grid" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Question Palette</Text>
          </TouchableOpacity>

          {/* Submit Test */}
          <TouchableOpacity 
            style={styles.bottomBarAction}
            onPress={() => setShowSubmitModal(true)}
            activeOpacity={0.7}
          >
            <Feather name="flag" size={18} color="#EF4444" />
            <Text style={[styles.bottomBarActionText, { color: '#EF4444', fontWeight: '700' }]}>Submit Test</Text>
          </TouchableOpacity>

          {/* Contact Support */}
          <TouchableOpacity style={styles.bottomBarAction} activeOpacity={0.7}>
            <Feather name="headphones" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Test Confirmation Modal */}
        <Modal 
          visible={showSubmitModal} 
          transparent 
          animationType="fade"
          onRequestClose={() => !isSubmitting && setShowSubmitModal(false)}
        >
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
              <Text style={styles.submitModalTitle}>Submit IELTS Test?</Text>
              <Text style={styles.submitModalSubtitle}>
                Are you sure you want to finalize and submit your test?
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

              <Text style={styles.submitModalDesc}>
                Once submitted, your responses will be evaluated and graded immediately.
              </Text>
              
              <View style={styles.submitModalActions}>
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

        {/* Question Palette Modal */}
        <Modal
          visible={isPaletteVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPaletteVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Question Palette</Text>
                <TouchableOpacity 
                  onPress={() => setIsPaletteVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Status Indicator Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                  <Text style={styles.legendText}>Answered</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Current</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="bookmark" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                  <Text style={styles.legendText}>Bookmarked</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendRing, { borderColor: '#CBD5E1' }]} />
                  <Text style={styles.legendText}>Unanswered</Text>
                </View>
              </View>

              {/* Question Number Grid */}
              <ScrollView style={{ maxHeight: 300 }}>
                <View style={styles.questionGrid}>
                  {allSectionResponses.map((r, idx) => {
                    // Find actual group index and response index for this question
                    let targetGroupIdx = 0;
                    let targetRespIdx = 0;
                    let count = 0;
                    for (let g = 0; g < activeSection.question_groups.length; g++) {
                      const len = activeSection.question_groups[g].responses.length;
                      if (idx < count + len) {
                        targetGroupIdx = g;
                        targetRespIdx = idx - count;
                        break;
                      }
                      count += len;
                    }

                    const isCurrent = activeGroupIndex === targetGroupIdx && currentResponseIndex === targetRespIdx;
                    const isAnswered = r.selected_choice !== null || r.written_response !== null;
                    const isQBookmarked = bookmarkedQuestions.includes(r.question?.id);

                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.gridCircle,
                          isAnswered && styles.gridCircleAnswered,
                          isCurrent && !isAnswered && styles.gridCircleCurrent,
                          isQBookmarked && !isAnswered && styles.gridCircleBookmarked,
                        ]}
                        onPress={() => {
                          setActiveGroupIndex(targetGroupIdx);
                          setCurrentResponseIndex(targetRespIdx);
                          setIsPaletteVisible(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.gridCircleText,
                            isAnswered && styles.gridCircleTextAnswered,
                            isCurrent && !isAnswered && styles.gridCircleTextCurrent,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                        {isQBookmarked && (
                          <View style={styles.paletteBookmarkDot}>
                            <Ionicons name="bookmark" size={10} color="#F59E0B" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
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
        subjectName={activeSection?.section_name || ((params as any).section_name as string)}
        examName={(attempt as any)?.exam_type_name || (params.exam_name as string) || 'IELTS Academic'}
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
  timerBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },
  // Modern Responsive Navigation Tabs
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'center',
  },
  tabsScrollContentFill: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  modernTab: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  modernTabFill: {
    flex: 1,
    minWidth: 0,
  },
  modernTabActive: {
    backgroundColor: '#4C1D95',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  modernTabTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  modernTabTitleActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modernTabSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modernTabSubActive: {
    color: '#DDD6FE',
  },

  // Writing Section Content
  writingSectionContainer: {
    marginBottom: 20,
  },
  writingBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  writingTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  writingTimeText: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '600',
  },
  writingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  writingCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  writingCardPrompt: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 16,
  },
  writingMinWordsNotice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 14,
    marginBottom: 14,
  },

  // Question Header (Purple Circle + Title & Subtitle)
  questionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  questionBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  questionBadgeNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  questionTitleColumn: {
    flex: 1,
  },
  questionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  questionSubtitleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Full-width Next CTA
  fullNextButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fullNextButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtlePrevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    marginBottom: 16,
  },
  subtlePrevButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Sub-Group Selector within Active Passage
  subGroupContainer: {
    marginBottom: 14,
  },
  subGroupScrollContent: {
    paddingVertical: 2,
    gap: 8,
  },
  subGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  subGroupChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  subGroupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  subGroupDotActive: {
    backgroundColor: '#7C3AED',
  },
  subGroupChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  subGroupChipTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Passage Card
  passageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  passageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  passageNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    lineHeight: 22,
  },
  passageBodyText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 21,
  },

  // Questions Subtitle
  questionSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  // Question Card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionItemSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
    backgroundColor: '#FAF5FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#7C3AED',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  optionText: {
    flex: 1,
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 19,
  },
  optionTextSelected: {
    color: '#111827',
    fontWeight: '700',
  },
  optionLabel: {
    fontWeight: '800',
  },

  // Navigation Buttons
  navigationButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  prevButton: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C3AED',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Bottom Utility Bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  bottomBarAction: {
    alignItems: 'center',
  },
  bottomBarActionText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 4,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
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
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  legendRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  gridCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCircleAnswered: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  gridCircleCurrent: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  gridCircleBookmarked: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFBEB',
  },
  paletteBookmarkDot: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  questionBookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  gridCircleTextAnswered: {
    color: '#FFFFFF',
  },
  gridCircleTextCurrent: {
    color: '#F59E0B',
  },

  // Submit Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
  closeExitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
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

  // Audio Player Styles
  audioPlayerCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioPlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPauseBtn: {
    backgroundColor: '#EF4444',
  },
  audioPlayerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  audioPlayerSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 4,
  },
  audioPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },

  // Writing Styles
  writingContainer: {
    marginTop: 12,
  },
  writingVisualCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  writingVisualToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F1F5F9',
  },
  writingVisualTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  writingPromptImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#FFF',
  },
  wordCounterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  writingInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  wordCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  wordCountPillMet: {
    backgroundColor: '#D1FAE5',
  },
  wordCountPillUnmet: {
    backgroundColor: '#FEE2E2',
  },
  wordCountPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  writingTextInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 250,
    lineHeight: 22,
  },
  questionInstructionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  questionInstructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
});
