import React, { useState, useEffect, useCallback } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { examService, ChoiceItem } from '@/services/exam';
import { guestService } from '@/services/guest';
import { resolveMediaUrl } from '@/services/mediaCache';
import { createAudioPlayer, AudioPlayer as ExpoAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { soundManager } from '@/services/soundManager';
import { BLANK_REGEX, hasBlanks, normalizeBlankToken } from '@/utils/questionFormatter';
import { parseSpeakingFeedback, AiFeedbackItem } from './test-result';

interface ReviewChoice extends ChoiceItem {
  letter: string;
}

interface FlatQuestionItem {
  qId: number;
  qNum: number;
  subjectName: string;
  question: any;
  response: any;
  group: any;
  attemptBulkAudio?: string | null;
  aiFeedback?: any;
}

interface AudioPlayerProps {
  audioUrl: string;
  label?: string;
  accentColor?: string;
  startTime?: number | null;
  endTime?: number | null;
}

function AudioPlayer({ audioUrl, label, accentColor = '#7C3AED', startTime, endTime }: AudioPlayerProps) {
  const [sound, setSound] = useState<ExpoAudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const hasRange = typeof startTime === 'number' && typeof endTime === 'number' && endTime > startTime;
  const startSec = hasRange ? (startTime as number) : 0;
  const endSec = hasRange ? (endTime as number) : 0;
  const segmentDurationSec = hasRange ? (endSec - startSec) : duration;

  useEffect(() => {
    return () => {
      if (sound) {
        soundManager.onSoundFinished(sound);
        try {
          sound.remove();
        } catch {}
      }
    };
  }, [sound]);

  useEffect(() => {
    if (sound) {
      soundManager.onSoundFinished(sound);
      try {
        sound.remove();
      } catch {}
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    }
  }, [audioUrl, startTime, endTime]);

  const togglePlayback = async () => {
    if (!audioUrl) return;
    try {
      if (sound) {
        if (isPlaying) {
          sound.pause();
          setIsPlaying(false);
        } else {
          if (hasRange && position >= segmentDurationSec) {
            await sound.seekTo(startSec);
            setPosition(0);
          }
          await soundManager.registerAndPlay(sound, () => {
            setIsPlaying(false);
            setSound(null);
            setPosition(0);
          });
          sound.play();
          setIsPlaying(true);
        }
      } else {
        setIsLoading(true);
        const resolved = resolveMediaUrl(audioUrl);
        if (!resolved) {
          setIsLoading(false);
          return;
        }

        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        const newSound = createAudioPlayer({ uri: resolved });
        if (hasRange && startSec > 0) {
          await newSound.seekTo(startSec);
        }

        newSound.addListener('playbackStatusUpdate', (status) => {
          const currentPos = status.currentTime || 0;
          const totalDur = status.duration || 0;
          setDuration(totalDur);

          if (hasRange) {
            const relativePos = Math.max(0, currentPos - startSec);
            setPosition(Math.min(segmentDurationSec, relativePos));
            if (currentPos >= endSec || status.didJustFinish) {
              newSound.pause();
              newSound.seekTo(startSec).catch(() => {});
              setIsPlaying(false);
              setPosition(0);
              soundManager.onSoundFinished(newSound);
            }
          } else {
            setPosition(currentPos);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              soundManager.onSoundFinished(newSound);
            }
          }
        });

        await soundManager.registerAndPlay(newSound, () => {
          setIsPlaying(false);
          setSound(null);
          setPosition(0);
        });

        newSound.play();
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.warn('Audio playback error in question-review:', err);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveDuration = hasRange ? segmentDurationSec : duration;
  const progressPct = effectiveDuration > 0 ? Math.min(100, Math.round((position / effectiveDuration) * 100)) : 0;

  return (
    <View style={styles.audioPlayerCard}>
      {label ? (
        <View style={styles.audioPlayerLabelRow}>
          <Ionicons name="volume-medium-outline" size={16} color={accentColor} style={{ marginRight: 6 }} />
          <AppText style={[styles.audioPlayerLabel, { color: accentColor }]}>{label}</AppText>
        </View>
      ) : null}
      <View style={styles.audioPlayerRow}>
        <TouchableOpacity
          style={[styles.audioPlayButton, { backgroundColor: accentColor }]}
          onPress={togglePlayback}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <View style={styles.audioProgressCol}>
          <View style={styles.audioProgressBarBg}>
            <View style={[styles.audioProgressBarFill, { width: `${progressPct}%`, backgroundColor: accentColor }]} />
          </View>
          <View style={styles.audioTimeRow}>
            <AppText style={styles.audioTimeText}>{formatTime(position)}</AppText>
            <AppText style={styles.audioTimeText}>{formatTime(duration)}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
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
  const [flatQuestions, setFlatQuestions] = useState<FlatQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Question details state
  const [questionText, setQuestionText] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [contextText, setContextText] = useState<string>('');
  const [contextTitle, setContextTitle] = useState<string>('');
  const [isContextExpanded, setIsContextExpanded] = useState<boolean>(true);
  const [subjectName, setSubjectName] = useState<string>(params.subject_name || 'General');
  const [status, setStatus] = useState<'correct' | 'incorrect' | 'unattempted'>(params.status || 'incorrect');
  const [questionNumber, setQuestionNumber] = useState<number>(Number(params.question_number) || 1);
  const [totalQuestions, setTotalQuestions] = useState<number>(Number(params.total_questions) || 1);

  // Question type & Speaking specific
  const [questionType, setQuestionType] = useState<string>('MULTIPLE_CHOICE');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingPart, setSpeakingPart] = useState<string | null>(null);
  const [cueCardPrompts, setCueCardPrompts] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState<number | null>(null);

  // Media & AI review
  const [promptAudioUrl, setPromptAudioUrl] = useState<string | null>(null);
  const [candidateAudioUrl, setCandidateAudioUrl] = useState<string | null>(null);
  const [candidateAudioStartTime, setCandidateAudioStartTime] = useState<number | null>(null);
  const [candidateAudioEndTime, setCandidateAudioEndTime] = useState<number | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AiFeedbackItem | null>(null);
  const [scoreAwarded, setScoreAwarded] = useState<number | null>(null);

  // Blanks and choices
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
  const [choices, setChoices] = useState<ReviewChoice[]>([]);
  const [userAnswerId, setUserAnswerId] = useState<number | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [examples, setExamples] = useState<string[]>([]);

  // Function to load and populate a single question item into state
  const populateQuestion = (item: FlatQuestionItem, totalCount: number) => {
    const q = item.question;
    const resp = item.response;
    const grp = item.group;

    setQuestionNumber(item.qNum);
    setTotalQuestions(totalCount);
    setSubjectName(item.subjectName);

    const isSpk = q.question_type === 'AUDIO' || 
      item.subjectName.toLowerCase().includes('speaking') || 
      Boolean(resp.audio_response);
    setIsSpeaking(isSpk);
    setQuestionType(q.question_type || (isSpk ? 'AUDIO' : 'MULTIPLE_CHOICE'));

    setQuestionText(q.text || '');
    setInstructions(q.instructions || '');
    setContextText(grp.context_text || '');
    setContextTitle(grp.group_title || '');

    // Prompt Audio & Candidate Audio
    const promptAudio = q.audio_file || grp.context_media || q.metadata?.audio_url || q.metadata?.audio_file || null;
    setPromptAudioUrl(promptAudio);
    setCandidateAudioUrl(resp.audio_response || resp.bulk_audio_file || item.attemptBulkAudio || null);
    setCandidateAudioStartTime(typeof resp.audio_start_time === 'number' ? resp.audio_start_time : null);
    setCandidateAudioEndTime(typeof resp.audio_end_time === 'number' ? resp.audio_end_time : null);
    setSpeechTranscript(resp.written_response || null);

    // Speaking Part detection
    let detectedPart: string | null = null;
    if (q.speaking_part) {
      detectedPart = q.speaking_part;
    } else if (q.metadata?.speaking_part) {
      detectedPart = q.metadata.speaking_part;
    } else if (grp.group_title && /part\s*[123]/i.test(grp.group_title)) {
      const m = grp.group_title.match(/part\s*[123]/i);
      if (m) detectedPart = m[0].toUpperCase();
    } else if (q.instructions && /part\s*[123]/i.test(q.instructions)) {
      const m = q.instructions.match(/part\s*[123]/i);
      if (m) detectedPart = m[0].toUpperCase();
    }

    // Cue Card Prompts extraction
    let extractedCuePoints: string[] = [];
    if (Array.isArray(q.cue_card_prompts)) {
      extractedCuePoints = q.cue_card_prompts;
    } else if (typeof q.cue_card_prompts === 'string') {
      extractedCuePoints = q.cue_card_prompts.split(/\n+/).map((s: string) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    } else if (Array.isArray(q.metadata?.cue_card_prompts)) {
      extractedCuePoints = q.metadata.cue_card_prompts;
    } else if (Array.isArray(q.metadata?.bullet_points)) {
      extractedCuePoints = q.metadata.bullet_points;
    } else if (q.text && /you should say/i.test(q.text)) {
      const parts = q.text.split(/you should say:?/i);
      if (parts.length > 1) {
        extractedCuePoints = parts[1].split(/\n+/).map((s: string) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      }
    }

    if (extractedCuePoints.length > 0 && !detectedPart) {
      detectedPart = 'Part 2';
    }
    setSpeakingPart(detectedPart);
    setCueCardPrompts(extractedCuePoints);

    setPrepTime(q.prep_time_seconds || q.metadata?.prep_time_seconds || (detectedPart === 'Part 2' ? 60 : null));
    setRecordingTime(q.recording_time_seconds || q.metadata?.recording_time_seconds || (detectedPart === 'Part 2' ? 120 : null));

    // Status & Score
    let qStatus: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
    if ((resp.score_awarded || 0) > 0) {
      qStatus = 'correct';
    } else if (resp.selected_choice || resp.written_response || resp.audio_response || (resp.metadata && Object.keys(resp.metadata).length > 0)) {
      qStatus = 'incorrect';
    }
    setStatus(qStatus);
    setScoreAwarded(resp.score_awarded !== undefined && resp.score_awarded !== null ? Number(resp.score_awarded) : null);

    // AI Feedback
    const rawAiFb = resp.ai_feedback || resp.metadata?.ai_feedback || resp.ielts_speaking_criteria || resp.ielts_writing_criteria || item.aiFeedback || null;
    setAiFeedback(parseSpeakingFeedback(rawAiFb));

    // Choices
    let mappedChoices: ReviewChoice[] = [];
    let correctC: ChoiceItem | undefined;
    if (q.choices && Array.isArray(q.choices)) {
      mappedChoices = q.choices.map((c: any, idx: number) => ({
        ...c,
        letter: String.fromCharCode(65 + idx),
      }));
      setChoices(mappedChoices);

      correctC = q.choices.find((c: any) => c.is_correct);
      if (correctC) {
        setCorrectAnswerId(correctC.id);
      } else {
        setCorrectAnswerId(null);
      }
    } else {
      setChoices([]);
      setCorrectAnswerId(null);
    }

    if (resp.selected_choice) {
      setUserAnswerId(resp.selected_choice);
    } else {
      setUserAnswerId(null);
    }

    // Explanation
    const expl = q.explanation || (typeof resp.ai_feedback === 'string' && !resp.ai_feedback.startsWith('{') ? resp.ai_feedback : '') || q.hint_explanation || '';
    setExplanation(expl);

    if (q.metadata && Array.isArray(q.metadata.examples)) {
      setExamples(q.metadata.examples);
    } else if (expl && expl.toLowerCase().includes('example')) {
      const parts = expl.split(/examples?:/i);
      if (parts.length > 1) {
        setExplanation(parts[0].trim());
        const rawExamples = parts[1]
          .split('\n')
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
        setExamples(rawExamples);
      }
    } else {
      setExamples([]);
    }

    // Blanks & answers breakdown
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

    if (q.metadata) {
      const metaBlanks = q.metadata.correct_blanks || q.metadata.correct_answers || q.metadata.answers;
      if (metaBlanks && typeof metaBlanks === 'object') {
        if (Array.isArray(metaBlanks)) {
          metaBlanks.forEach((ans: any, i: number) => {
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

    if (resp.metadata && resp.metadata.blanks && typeof resp.metadata.blanks === 'object') {
      Object.entries(resp.metadata.blanks).forEach(([k, v]) => {
        const norm = normalizeBlankToken(k);
        const strAns = typeof v === 'string' ? v : String(v || '');
        userMap[norm.key] = strAns;
        userMap[norm.label] = strAns;
      });
    } else if (resp.written_response && !isSpk) {
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
      }
    }

    setBlankAnswers({ correct: correctMap, user: userMap });

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
  };

  // Stop any playing audio when screen blurs or unmounts
  useFocusEffect(
    useCallback(() => {
      return () => {
        soundManager.stopCurrent();
      };
    }, [])
  );

  useEffect(() => {
    const loadReviewData = async () => {
      if (!params.attempt_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let attemptData: any = null;
        try {
          attemptData = await examService.getAttemptReview(Number(params.attempt_id));
        } catch (fetchErr) {
          console.warn('Direct attempt review fetch failed, trying demo review:', fetchErr);
        }

        const items: FlatQuestionItem[] = [];
        let overallIndex = 1;

        if (attemptData && attemptData.sections) {
          // Map top-level attempt ai_feedbacks by question ID if present
          const aiFeedbacksMap = new Map<number, any>();
          const rawAiFeedbacks = (attemptData as any).ai_feedbacks;
          if (Array.isArray(rawAiFeedbacks)) {
            rawAiFeedbacks.forEach((fb: any) => {
              const qId = fb.question_id || fb.id;
              if (qId) aiFeedbacksMap.set(Number(qId), fb);
            });
          }

          attemptData.sections.forEach((sec: any) => {
            sec.question_groups?.forEach((grp: any) => {
              grp.responses?.forEach((resp: any) => {
                const fbFromAttempt = resp.question?.id ? aiFeedbacksMap.get(resp.question.id) : undefined;
                items.push({
                  qId: resp.question.id,
                  qNum: overallIndex++,
                  subjectName: sec.section_name || 'General',
                  question: resp.question,
                  response: resp,
                  group: grp,
                  attemptBulkAudio: attemptData.bulk_audio_file,
                  aiFeedback: fbFromAttempt,
                });
              });
            });
          });
        } else {
          // Fallback to guest demo results
          const demoReview = await guestService.getDemoTestReview(params.attempt_id);
          if (demoReview && (demoReview.non_ai_results || demoReview.summary)) {
            const nonAi = demoReview.non_ai_results || [];
            const aiQ = demoReview.ai_questions_preview?.questions || [];

            nonAi.forEach((r: any) => {
              items.push({
                qId: r.question_id || overallIndex,
                qNum: overallIndex++,
                subjectName: r.section || 'General',
                question: {
                  id: r.question_id,
                  text: r.question_text || r.prompt,
                  question_type: r.question_type || 'MCQ',
                  explanation: r.explanation,
                  choices: r.choices || (r.selected_choice && r.correct_choice ? [
                    { id: 1, text: r.correct_choice, is_correct: true },
                    ...(r.selected_choice !== r.correct_choice ? [{ id: 2, text: r.selected_choice, is_correct: false }] : [])
                  ] : []),
                  group: {
                    topic_tag: r.topic || 'General',
                  },
                },
                response: {
                  id: r.question_id,
                  selected_choice: r.selected_choice,
                  written_response: r.selected_choice,
                  score_awarded: r.score_awarded || (r.is_correct ? 1 : 0),
                  ai_feedback: r.explanation,
                },
                group: {
                  topic_tag: r.topic || 'General',
                },
              });
            });

            aiQ.forEach((r: any) => {
              items.push({
                qId: r.question_id || overallIndex,
                qNum: overallIndex++,
                subjectName: r.section || 'General',
                question: {
                  id: r.question_id,
                  text: r.prompt,
                  question_type: r.question_type || 'TEXT',
                  explanation: r.message,
                  group: {
                    topic_tag: 'General',
                  },
                },
                response: {
                  id: r.question_id,
                  written_response: r.your_submission,
                  score_awarded: 0,
                  ai_feedback: r.message,
                },
                group: {
                  topic_tag: 'General',
                },
              });
            });
          }
        }

        if (items.length > 0) {
          setFlatQuestions(items);

          // Find targeted question or default to first
          const targetQId = Number(params.question_id);
          let foundIdx = items.findIndex((it) => it.qId === targetQId);
          if (foundIdx === -1) {
            foundIdx = 0;
          }

          setCurrentIndex(foundIdx);
          populateQuestion(items[foundIdx], items.length);
        }
      } catch (err) {
        console.warn('Failed to load question review details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [params.attempt_id, params.question_id]);

  const handleNavigate = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= flatQuestions.length) return;
    soundManager.stopCurrent();
    setCurrentIndex(newIndex);
    populateQuestion(flatQuestions[newIndex], flatQuestions.length);
  };

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
    <AppSafeArea style={styles.safeArea}>
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

          {/* Badges: Status + Subject + Speaking Part + Score */}
          <View style={styles.badgesRow}>
            {isSpeaking && scoreAwarded !== null ? (
              <View style={[styles.statusBadge, styles.statusBadgeSpeaking]}>
                <Ionicons name="mic" size={13} color="#059669" style={{ marginRight: 4 }} />
                <AppText style={[styles.statusBadgeText, { color: '#059669' }]}>
                  Band {scoreAwarded.toFixed(1)}
                </AppText>
              </View>
            ) : status === 'incorrect' ? (
              <View style={[styles.statusBadge, styles.statusBadgeRed]}>
                <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                <AppText style={[styles.statusBadgeText, { color: '#EF4444' }]}>Incorrect</AppText>
              </View>
            ) : status === 'correct' ? (
              <View style={[styles.statusBadge, styles.statusBadgeGreen]}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <AppText style={[styles.statusBadgeText, { color: '#10B981' }]}>Correct</AppText>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusBadgeOrange]}>
                <View style={[styles.statusDot, { backgroundColor: '#F97316' }]} />
                <AppText style={[styles.statusBadgeText, { color: '#F97316' }]}>Unattempted</AppText>
              </View>
            )}

            <View style={styles.subjectBadge}>
              <AppText style={styles.subjectBadgeText}>{subjectName}</AppText>
            </View>

            {isSpeaking && speakingPart && (
              <View style={styles.partBadge}>
                <AppText style={styles.partBadgeText}>{speakingPart}</AppText>
              </View>
            )}
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

          {/* Examiner Question Audio Player (if present) */}
          {promptAudioUrl && (
            <View style={styles.mediaSectionWrap}>
              <AudioPlayer
                audioUrl={promptAudioUrl}
                label="🎧 Examiner Prompt Audio"
                accentColor="#4F46E5"
              />
            </View>
          )}

          {/* Candidate Task Card for Part 2 (Cue Card with bullet points) */}
          {isSpeaking && (speakingPart === 'Part 2' || cueCardPrompts.length > 0) ? (
            <View style={styles.cueCardBox}>
              <View style={styles.cueCardHeader}>
                <MaterialCommunityIcons name="card-text-outline" size={18} color="#92400E" style={{ marginRight: 6 }} />
                <AppText style={styles.cueCardHeaderTitle}>Candidate Task Card</AppText>
                <View style={styles.cueCardPartPill}>
                  <AppText style={styles.cueCardPartPillText}>Part 2</AppText>
                </View>
              </View>

              <AppText style={styles.cueCardPromptText}>
                {questionText.split(/you should say:?/i)[0].trim() || 'Describe a topic or experience.'}
              </AppText>

              <AppText style={styles.cueCardSayTitle}>You should say:</AppText>
              <View style={styles.cueCardBulletList}>
                {cueCardPrompts.map((pt, idx) => (
                  <View key={idx} style={styles.cueCardBulletRow}>
                    <View style={styles.cueCardBulletDot} />
                    <AppText style={styles.cueCardBulletText}>{pt}</AppText>
                  </View>
                ))}
              </View>

              <View style={styles.cueCardFooterRow}>
                <Ionicons name="time-outline" size={14} color="#92400E" style={{ marginRight: 5 }} />
                <AppText style={styles.cueCardFooterText}>
                  Prep: {prepTime ? `${prepTime}s` : '1 min'}  •  Speaking: {recordingTime ? `${recordingTime}s` : '1-2 mins'}
                </AppText>
              </View>
            </View>
          ) : (
            /* Standard Question Card (Part 1, Part 3, or other test questions) */
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
          )}

          {/* Candidate Audio Response Player */}
          {candidateAudioUrl && (
            <View style={styles.mediaSectionWrap}>
              <AudioPlayer
                audioUrl={candidateAudioUrl}
                startTime={candidateAudioStartTime}
                endTime={candidateAudioEndTime}
                label="🎙️ Your Recorded Speech"
                accentColor="#059669"
              />
            </View>
          )}

          {/* Deepgram Speech-to-Text Transcript (Speaking) */}
          {isSpeaking && speechTranscript && (
            <View style={styles.transcriptCard}>
              <View style={styles.transcriptHeader}>
                <Ionicons name="document-text-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                <AppText style={styles.transcriptHeaderTitle}>Speech Transcript</AppText>
                <View style={styles.deepgramPill}>
                  <AppText style={styles.deepgramPillText}>Deepgram STT</AppText>
                </View>
              </View>
              <AppText style={styles.transcriptBody}>"{speechTranscript}"</AppText>
            </View>
          )}

          {/* Candidate Written Response (Writing) */}
          {!isSpeaking && speechTranscript && (
            <View style={styles.transcriptCardWriting}>
              <View style={styles.transcriptHeader}>
                <Ionicons name="document-text-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                <AppText style={styles.transcriptHeaderTitleWriting}>Your Written Response</AppText>
                <View style={styles.essayPill}>
                  <AppText style={styles.essayPillText}>Candidate Response</AppText>
                </View>
              </View>
              <AppText style={styles.transcriptBodyWriting}>"{speechTranscript}"</AppText>
            </View>
          )}

          {/* AI Examiner Rubric Evaluation (Speaking & Writing) */}
          {aiFeedback && (() => {
            const isSpeakingCard = Boolean(
              isSpeaking ||
              aiFeedback.fluency_coherence ||
              aiFeedback.fluency_coherence_score !== undefined ||
              aiFeedback.vocabulary_score !== undefined ||
              candidateAudioUrl
            );

            const rawScore = scoreAwarded !== null 
              ? scoreAwarded 
              : (aiFeedback.score_awarded !== undefined ? Number(aiFeedback.score_awarded) : null);
            const displayScore = rawScore !== null
              ? Math.min(9.0, Math.max(0.0, rawScore)).toFixed(1)
              : null;

            if (isSpeakingCard) {
              return (
                <View style={styles.rubricContainer}>
                  <View style={styles.rubricHeaderRow}>
                    <Ionicons name="mic" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <AppText style={[styles.rubricHeaderTitle, { color: '#065F46' }]}>
                      IELTS Speaking Assessment
                    </AppText>
                    {displayScore !== null && (
                      <View style={styles.rubricOverallBandPill}>
                        <AppText style={styles.rubricOverallBandText}>Band {displayScore} / 9.0</AppText>
                      </View>
                    )}
                  </View>

                  {/* Fluency & Coherence */}
                  {(aiFeedback.fluency_coherence || aiFeedback.fluency_coherence_score !== undefined) && (
                    <View style={styles.rubricCriteriaCard}>
                      <View style={styles.rubricCriteriaTitleRow}>
                        <AppText style={styles.rubricCriteriaName}>Fluency & Coherence</AppText>
                        {aiFeedback.fluency_coherence_score !== undefined && (
                          <View style={styles.rubricScorePill}>
                            <AppText style={styles.rubricScorePillText}>
                              {Math.min(9.0, Math.max(0.0, Number(aiFeedback.fluency_coherence_score))).toFixed(1)} / 9.0
                            </AppText>
                          </View>
                        )}
                      </View>
                      {aiFeedback.fluency_coherence ? (
                        <AppText style={styles.rubricCriteriaDesc}>{aiFeedback.fluency_coherence}</AppText>
                      ) : null}
                    </View>
                  )}

                  {/* Lexical Resource */}
                  {(aiFeedback.vocabulary || aiFeedback.vocabulary_score !== undefined || aiFeedback.lexical_resource) && (
                    <View style={styles.rubricCriteriaCard}>
                      <View style={styles.rubricCriteriaTitleRow}>
                        <AppText style={styles.rubricCriteriaName}>Lexical Resource (Vocabulary)</AppText>
                        {aiFeedback.vocabulary_score !== undefined && (
                          <View style={styles.rubricScorePill}>
                            <AppText style={styles.rubricScorePillText}>
                              {Math.min(9.0, Math.max(0.0, Number(aiFeedback.vocabulary_score))).toFixed(1)} / 9.0
                            </AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.rubricCriteriaDesc}>
                        {aiFeedback.vocabulary || aiFeedback.lexical_resource}
                      </AppText>
                    </View>
                  )}

                  {/* Grammatical Range & Accuracy */}
                  {(aiFeedback.grammar || aiFeedback.grammar_score !== undefined || aiFeedback.grammatical_range) && (
                    <View style={styles.rubricCriteriaCard}>
                      <View style={styles.rubricCriteriaTitleRow}>
                        <AppText style={styles.rubricCriteriaName}>Grammar & Accuracy</AppText>
                        {aiFeedback.grammar_score !== undefined && (
                          <View style={styles.rubricScorePill}>
                            <AppText style={styles.rubricScorePillText}>
                              {Math.min(9.0, Math.max(0.0, Number(aiFeedback.grammar_score))).toFixed(1)} / 9.0
                            </AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.rubricCriteriaDesc}>
                        {aiFeedback.grammar || aiFeedback.grammatical_range}
                      </AppText>
                    </View>
                  )}

                  {/* Overall Examiner Summary */}
                  {(aiFeedback.ai_feedback || aiFeedback.detailed_feedback) && (
                    <View style={styles.examinerSummaryCard}>
                      <View style={styles.examinerSummaryHeader}>
                        <Ionicons name="chatbox-ellipses-outline" size={14} color="#065F46" style={{ marginRight: 5 }} />
                        <AppText style={[styles.examinerSummaryTitle, { color: '#065F46' }]}>Examiner Summary</AppText>
                      </View>
                      <AppText style={styles.examinerSummaryText}>
                        {aiFeedback.ai_feedback || aiFeedback.detailed_feedback}
                      </AppText>
                    </View>
                  )}
                </View>
              );
            }

            // Writing Rubric Card
            return (
              <View style={styles.rubricContainer}>
                <View style={styles.rubricHeaderRow}>
                  <Ionicons name="sparkles" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                  <AppText style={[styles.rubricHeaderTitle, { color: '#6D28D9' }]}>
                    IELTS Writing Assessment
                  </AppText>
                  {displayScore !== null && (
                    <View style={styles.rubricOverallBandPillWriting}>
                      <AppText style={styles.rubricOverallBandTextWriting}>Band {displayScore} / 9.0</AppText>
                    </View>
                  )}
                </View>

                {/* Task Achievement */}
                {(aiFeedback.task_achievement || aiFeedback.task_achievement_score !== undefined) && (
                  <View style={styles.rubricCriteriaCard}>
                    <View style={styles.rubricCriteriaTitleRow}>
                      <AppText style={styles.rubricCriteriaName}>Task Achievement</AppText>
                      {aiFeedback.task_achievement_score !== undefined && (
                        <View style={styles.rubricScorePillWriting}>
                          <AppText style={styles.rubricScorePillTextWriting}>
                            {Math.min(9.0, Math.max(0.0, Number(aiFeedback.task_achievement_score))).toFixed(1)} / 9.0
                          </AppText>
                        </View>
                      )}
                    </View>
                    {aiFeedback.task_achievement ? (
                      <AppText style={styles.rubricCriteriaDesc}>{aiFeedback.task_achievement}</AppText>
                    ) : null}
                  </View>
                )}

                {/* Coherence & Cohesion */}
                {(aiFeedback.coherence_cohesion || aiFeedback.coherence_cohesion_score !== undefined) && (
                  <View style={styles.rubricCriteriaCard}>
                    <View style={styles.rubricCriteriaTitleRow}>
                      <AppText style={styles.rubricCriteriaName}>Coherence & Cohesion</AppText>
                      {aiFeedback.coherence_cohesion_score !== undefined && (
                        <View style={styles.rubricScorePillWriting}>
                          <AppText style={styles.rubricScorePillTextWriting}>
                            {Math.min(9.0, Math.max(0.0, Number(aiFeedback.coherence_cohesion_score))).toFixed(1)} / 9.0
                          </AppText>
                        </View>
                      )}
                    </View>
                    {aiFeedback.coherence_cohesion ? (
                      <AppText style={styles.rubricCriteriaDesc}>{aiFeedback.coherence_cohesion}</AppText>
                    ) : null}
                  </View>
                )}

                {/* Lexical Resource */}
                {aiFeedback.lexical_resource && (
                  <View style={styles.rubricCriteriaCard}>
                    <View style={styles.rubricCriteriaTitleRow}>
                      <AppText style={styles.rubricCriteriaName}>Lexical Resource</AppText>
                    </View>
                    <AppText style={styles.rubricCriteriaDesc}>{aiFeedback.lexical_resource}</AppText>
                  </View>
                )}

                {/* Grammatical Range & Accuracy */}
                {aiFeedback.grammatical_range && (
                  <View style={styles.rubricCriteriaCard}>
                    <View style={styles.rubricCriteriaTitleRow}>
                      <AppText style={styles.rubricCriteriaName}>Grammar & Accuracy</AppText>
                    </View>
                    <AppText style={styles.rubricCriteriaDesc}>{aiFeedback.grammatical_range}</AppText>
                  </View>
                )}

                {/* Overall Examiner Summary */}
                {(aiFeedback.ai_feedback || aiFeedback.detailed_feedback) && (
                  <View style={[styles.examinerSummaryCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
                    <View style={styles.examinerSummaryHeader}>
                      <Ionicons name="chatbox-ellipses-outline" size={14} color="#7C3AED" style={{ marginRight: 5 }} />
                      <AppText style={[styles.examinerSummaryTitle, { color: '#6D28D9' }]}>Examiner Summary</AppText>
                    </View>
                    <AppText style={[styles.examinerSummaryText, { color: '#4C1D95' }]}>
                      {aiFeedback.ai_feedback || aiFeedback.detailed_feedback}
                    </AppText>
                  </View>
                )}
              </View>
            );
          })()}

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

          {/* Multiple Choice Options List (if present) */}
          {choices.length > 0 && (
            <View style={styles.choicesList}>
              {choices.map((choice) => {
                const isUserAnswer = choice.id === userAnswerId;
                const isCorrectAnswer = choice.id === correctAnswerId || choice.is_correct;

                let cardStyle = styles.choiceCardDefault;
                let circleStyle = styles.choiceCircleDefault;
                let circleTextStyle = styles.choiceCircleTextDefault;

                if (isUserAnswer && !isCorrectAnswer) {
                  cardStyle = styles.choiceCardUserWrong;
                  circleStyle = styles.choiceCircleWrong;
                  circleTextStyle = styles.choiceCircleTextWrong;
                } else if (isCorrectAnswer) {
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

          {/* Standard Explanation Box (for non-speaking or general questions) */}
          {!isSpeaking && explanation ? (
            <View style={styles.explanationBox}>
              <AppText style={styles.explanationHeader}>Explanation</AppText>
              <AppText style={styles.explanationBody}>
                {explanation}
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
          ) : null}

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* Sticky Bottom Navigation Footer */}
      <View style={styles.navFooter}>
        <TouchableOpacity
          style={[styles.navFooterBtn, currentIndex <= 0 && styles.navFooterBtnDisabled]}
          disabled={currentIndex <= 0}
          onPress={() => handleNavigate(currentIndex - 1)}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={20} color={currentIndex <= 0 ? '#CBD5E1' : '#1E293B'} />
          <AppText style={[styles.navFooterBtnText, currentIndex <= 0 && styles.navFooterBtnTextDisabled]}>
            Previous
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navFooterCenter}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(exam)/review-answers' as any))}
          activeOpacity={0.7}
        >
          <AppText style={styles.navFooterCenterTitle}>
            Question {questionNumber} of {totalQuestions}
          </AppText>
          <AppText style={styles.navFooterCenterSub}>All Answers</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navFooterBtn, currentIndex >= flatQuestions.length - 1 && styles.navFooterBtnDisabled]}
          disabled={currentIndex >= flatQuestions.length - 1}
          onPress={() => handleNavigate(currentIndex + 1)}
          activeOpacity={0.7}
        >
          <AppText style={[styles.navFooterBtnText, currentIndex >= flatQuestions.length - 1 && styles.navFooterBtnTextDisabled]}>
            Next
          </AppText>
          <Feather name="chevron-right" size={20} color={currentIndex >= flatQuestions.length - 1 ? '#CBD5E1' : '#1E293B'} />
        </TouchableOpacity>
      </View>
    </AppSafeArea>
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
    paddingTop: 12,
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
  statusBadgeSpeaking: {
    backgroundColor: '#D1FAE5',
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
  partBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  partBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
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
  // Audio Player Styles
  audioPlayerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioPlayerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  audioPlayerLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  audioPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioProgressCol: {
    flex: 1,
  },
  audioProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  audioProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  audioTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  audioTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  mediaSectionWrap: {
    marginBottom: 16,
  },

  // Candidate Task Card (Part 2 Cue Card)
  cueCardBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  cueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cueCardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
  },
  cueCardPartPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cueCardPartPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  cueCardPromptText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    lineHeight: 23,
    marginBottom: 12,
  },
  cueCardSayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  cueCardBulletList: {
    gap: 8,
    marginBottom: 14,
    paddingLeft: 4,
  },
  cueCardBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cueCardBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginTop: 6,
  },
  cueCardBulletText: {
    fontSize: 14,
    color: '#78350F',
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  cueCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  cueCardFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },

  // Deepgram Transcript Card
  transcriptCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  transcriptHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    flex: 1,
  },
  deepgramPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deepgramPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  transcriptBody: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#14532D',
    lineHeight: 22,
  },

  // AI Rubric Evaluation Cards
  rubricContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  rubricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rubricHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    flex: 1,
  },
  rubricOverallBandPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rubricOverallBandText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  rubricCriteriaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rubricCriteriaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rubricCriteriaName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  rubricScorePill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rubricScorePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  rubricCriteriaDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  examinerSummaryCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  examinerSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  examinerSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  examinerSummaryText: {
    fontSize: 13,
    color: '#064E3B',
    lineHeight: 19,
  },
  rubricOverallBandPillWriting: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rubricOverallBandTextWriting: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  rubricScorePillWriting: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rubricScorePillTextWriting: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  transcriptCardWriting: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  transcriptHeaderTitleWriting: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B21B6',
    flex: 1,
  },
  transcriptBodyWriting: {
    fontSize: 14,
    color: '#3B0764',
    lineHeight: 22,
  },
  essayPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  essayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // Sticky Bottom Navigation Footer
  navFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  navFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  navFooterBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  navFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  navFooterBtnTextDisabled: {
    color: '#94A3B8',
  },
  navFooterCenter: {
    alignItems: 'center',
  },
  navFooterCenterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  navFooterCenterSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D28D9',
    marginTop: 1,
  },
});
