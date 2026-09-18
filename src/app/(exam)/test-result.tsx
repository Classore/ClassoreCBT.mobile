import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { examService, isSectionBasedExam } from '@/services/exam';
import { soundManager } from '@/services/soundManager';

export function getIeltsDescriptor(score: number): string {
  if (score >= 9.0) return 'Expert User';
  if (score >= 8.0) return 'Very Good User';
  if (score >= 7.0) return 'Good User';
  if (score >= 6.0) return 'Competent User';
  if (score >= 5.0) return 'Modest User';
  if (score >= 4.0) return 'Limited User';
  if (score >= 3.0) return 'Extremely Limited User';
  if (score >= 2.0) return 'Intermittent User';
  return 'Non User';
}

export function calculateCefr(score: number): string {
  if (score >= 8.5) return 'C2 (Mastery)';
  if (score >= 7.0) return 'C1 (Effective Operational Proficiency)';
  if (score >= 5.5) return 'B2 (Vantage)';
  if (score >= 4.0) return 'B1 (Threshold)';
  if (score >= 3.0) return 'A2 (Waystage)';
  return 'A1 (Breakthrough)';
}

export interface AiFeedbackItem {
  question_id?: number;
  score_awarded?: number;
  max_score?: number;
  // Writing Rubric Criteria
  task_achievement?: string;
  task_achievement_score?: number;
  coherence_cohesion?: string;
  coherence_cohesion_score?: number;
  lexical_resource?: string;
  grammatical_range?: string;
  // Speaking Rubric Criteria
  fluency_coherence?: string;
  fluency_coherence_score?: number;
  vocabulary?: string;
  vocabulary_score?: number;
  grammar?: string;
  grammar_score?: number;
  pronunciation_na?: string;
  pronunciation?: string;
  pronunciation_score?: number;
  ai_feedback?: string;
  detailed_feedback?: string;
  // Media & Transcript
  audio_response?: string;
  audio_start_time?: number | null;
  audio_end_time?: number | null;
  written_response?: string;
  question_text?: string;
  [key: string]: any;
}

export function parseSpeakingFeedback(rawFeedback: any): AiFeedbackItem | null {
  if (!rawFeedback) return null;
  let parsed = rawFeedback;
  if (typeof rawFeedback === 'string') {
    try {
      parsed = JSON.parse(rawFeedback);
    } catch {
      return { ai_feedback: rawFeedback };
    }
  }
  if (typeof parsed === 'object' && parsed !== null) {
    let result = { ...parsed };
    if (typeof result.ai_feedback === 'string' && result.ai_feedback.trim().startsWith('{')) {
      try {
        const nested = JSON.parse(result.ai_feedback);
        result = { ...result, ...nested };
      } catch {}
    }
    if (typeof result.raw_feedback === 'string' && result.raw_feedback.trim().startsWith('{')) {
      try {
        const nested = JSON.parse(result.raw_feedback);
        result = { ...result, ...nested };
      } catch {}
    }
    return result;
  }
  return null;
}

export interface IeltsSectionDef {
  label: string;
  key: string;
  altKeys: string[];
  icon: any;
  color: string;
  bg: string;
}

export const ALL_IELTS_SECTIONS: IeltsSectionDef[] = [
  { label: 'Reading', key: 'Reading Band', altKeys: ['Reading', 'Reading Score'], icon: 'book-outline', color: '#7C3AED', bg: '#F3E8FF' },
  { label: 'Listening', key: 'Listening Band', altKeys: ['Listening', 'Listening Score'], icon: 'headset-outline', color: '#2563EB', bg: '#DBEAFE' },
  { label: 'Writing', key: 'Writing Band', altKeys: ['Writing', 'Writing Score'], icon: 'create-outline', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Speaking', key: 'Speaking Band', altKeys: ['Speaking', 'Speaking Score'], icon: 'mic-outline', color: '#059669', bg: '#D1FAE5' },
];

export function getSectionScore(item: IeltsSectionDef, scores: Record<string, number>): number | null {
  if (!scores || typeof scores !== 'object') return null;
  for (const k of [item.key, item.label, ...item.altKeys]) {
    if (scores[k] !== undefined && scores[k] !== null) {
      const val = parseFloat(String(scores[k]));
      if (!isNaN(val)) return val;
    }
  }
  const foundKey = Object.keys(scores).find(k => k.toLowerCase().includes(item.label.toLowerCase()));
  if (foundKey && scores[foundKey] !== undefined && scores[foundKey] !== null) {
    const val = parseFloat(String(scores[foundKey]));
    if (!isNaN(val)) return val;
  }
  return null;
}

export function roundIeltsBand(score: number): number {
  const floor = Math.floor(score);
  const decimal = score - floor;
  if (decimal < 0.25) {
    return floor;
  } else if (decimal < 0.75) {
    return floor + 0.5;
  } else {
    return floor + 1.0;
  }
}

export default function TestResultScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    attempt_id?: string;
    exam_name?: string;
    is_ielts?: string;
    total_score?: string;
    streak?: string;
    ai_feedbacks?: string;
    ai_assessment_status?: string;
    ai_skip_reason?: string;
    section_names?: string;
    section_order?: string;
    sections?: string;
  }>();

  // Initial detection
  const detectedIsIelts = Boolean(
    params.is_ielts === 'true' ||
    (params.exam_name && (params.exam_name.toLowerCase().includes('ielts') || params.exam_name.toLowerCase().includes('toefl')))
  );

  // Stop any audio playing when screen blurs or unmounts
  useFocusEffect(
    useCallback(() => {
      return () => {
        soundManager.stopCurrent();
      };
    }, [])
  );

  const initialScore = params.total_score && !isNaN(parseFloat(params.total_score))
    ? parseFloat(params.total_score)
    : null;

  const [isIelts, setIsIelts] = useState<boolean>(detectedIsIelts);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(initialScore === null && Boolean(params.attempt_id));
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(Boolean(params.attempt_id));
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(initialScore);
  const [totalScore, setTotalScore] = useState<number | null>(detectedIsIelts ? 9.0 : 400);
  const [correctAnswers, setCorrectAnswers] = useState<number | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<number | null>(null);
  const [skippedQuestions, setSkippedQuestions] = useState<number | null>(null);
  const [timeUsedFormatted, setTimeUsedFormatted] = useState<string>('-');
  const [performanceTag, setPerformanceTag] = useState<string>(
    initialScore !== null && detectedIsIelts ? getIeltsDescriptor(initialScore) : 'Good Performance'
  );
  const [examTitle, setExamTitle] = useState<string>(params.exam_name || (detectedIsIelts ? 'IELTS Academic Test' : 'JAMB Practice Test'));
  const [error, setError] = useState<string | null>(null);

  // IELTS Specific State
  const [scorePerSection, setScorePerSection] = useState<Record<string, number>>({});
  const [cefrLevel, setCefrLevel] = useState<string | null>(() => {
    if (detectedIsIelts && initialScore !== null) {
      return calculateCefr(initialScore);
    }
    return null;
  });
  const [readingWpm, setReadingWpm] = useState<number | null>(null);
  const [listeningAccuracy, setListeningAccuracy] = useState<number | null>(null);
  const [aiAssessmentStatus, setAiAssessmentStatus] = useState<string | null>(params.ai_assessment_status || null);
  const [aiFeedbacks, setAiFeedbacks] = useState<AiFeedbackItem[]>(() => {
    if (params.ai_feedbacks) {
      try {
        const parsed = JSON.parse(params.ai_feedbacks);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processAnalyticsData = useCallback((data: any) => {
    if (!data) return;
    setAnalyticsData(data);

    const examName = data.exam_name || params.exam_name || '';
    const examNameLower = examName.toLowerCase();

    // Explicit check for non-IELTS exams (e.g. JAMB, WAEC, NECO)
    const isExplicitNonIelts = 
      params.is_ielts === 'false' ||
      examNameLower.includes('jamb') ||
      examNameLower.includes('utme') ||
      examNameLower.includes('waec') ||
      examNameLower.includes('neco') ||
      examNameLower.includes('post-utme');

    // IELTS section bands check (only if actual IELTS band keys exist)
    const hasIeltsBandScores = Boolean(
      data.score_per_section && typeof data.score_per_section === 'object' && (
        data.score_per_section['Reading Band'] !== undefined ||
        data.score_per_section['Listening Band'] !== undefined ||
        data.score_per_section['Writing Band'] !== undefined ||
        data.score_per_section['Speaking Band'] !== undefined
      )
    );

    const isIeltsTest = !isExplicitNonIelts && Boolean(
      params.is_ielts === 'true' ||
      data.exam_type === 42 ||
      data.exam_type_id === 42 ||
      examNameLower.includes('ielts') ||
      examNameLower.includes('toefl') ||
      hasIeltsBandScores ||
      isSectionBasedExam(examName, data.subjects) ||
      detectedIsIelts
    );
    setIsIelts(isIeltsTest);
    if (examName) setExamTitle(examName);

    // Section bands update
    const secScores = (data.score_per_section && typeof data.score_per_section === 'object')
      ? data.score_per_section
      : {};
    if (Object.keys(secScores).length > 0) {
      setScorePerSection(secScores);
    }
    if (data.ai_assessment_status) {
      setAiAssessmentStatus(data.ai_assessment_status);
    }

    // Score parsing
    if (isIeltsTest) {
      const dataSecNames: string[] = [];
      if (data?.sections && Array.isArray(data.sections)) {
        data.sections.forEach((s: any) => {
          const name = s.section_name || s.name || '';
          if (name) dataSecNames.push(name.toLowerCase());
        });
      }
      if (data?.subjects && Array.isArray(data.subjects)) {
        data.subjects.forEach((s: any) => {
          const name = s.section_name || s.name || '';
          if (name) dataSecNames.push(name.toLowerCase());
        });
      }

      const rawParamsStr = [params.section_names, params.section_order, params.sections, params.exam_name].filter(Boolean).join(',').toLowerCase();

      const matchedSecs = ALL_IELTS_SECTIONS.filter(sec => {
        const labelLower = sec.label.toLowerCase();
        if (dataSecNames.length > 0 && dataSecNames.some((d: string) => d.includes(labelLower))) return true;
        if (rawParamsStr && rawParamsStr.includes(labelLower)) return true;
        if (getSectionScore(sec, secScores) !== null) return true;
        return false;
      });

      const effectiveSecs = matchedSecs.length > 0 ? matchedSecs : ALL_IELTS_SECTIONS;
      const activeScores: number[] = [];

      effectiveSecs.forEach(sec => {
        const val = getSectionScore(sec, secScores);
        if (val !== null && !isNaN(val) && val > 0) {
          activeScores.push(val);
        }
      });

      let rawScore: number | null = null;
      if (activeScores.length > 0) {
        const sum = activeScores.reduce((acc, curr) => acc + curr, 0);
        rawScore = roundIeltsBand(sum / activeScores.length);
      } else {
        rawScore = data.total_score !== undefined
          ? parseFloat(String(data.total_score))
          : (data.overall_band !== undefined ? parseFloat(String(data.overall_band)) : initialScore);
      }

      if (rawScore !== null && !isNaN(rawScore)) {
        setScore(rawScore);
        setTotalScore(9.0);
        setPerformanceTag(getIeltsDescriptor(rawScore));
        setCefrLevel(data.cefr_level || data.cefr || calculateCefr(rawScore));
      }

      // Reading Diagnostic WPM (support both assessments.reading and root)
      const wpm = data.assessments?.reading?.reading_speed_wpm ?? data.reading_speed_wpm;
      if (wpm !== undefined && wpm !== null) {
        setReadingWpm(Math.round(wpm));
      }
      // Listening Diagnostic Accuracy (support both assessments.listening and root)
      const listeningAcc = data.assessments?.listening?.accuracy_percentage ?? data.listening_diagnostic?.accuracy_percentage;
      if (listeningAcc !== undefined && listeningAcc !== null) {
        setListeningAccuracy(Math.round(listeningAcc));
      }
      if (data.ai_feedbacks && Array.isArray(data.ai_feedbacks) && data.ai_feedbacks.length > 0) {
        setAiFeedbacks(data.ai_feedbacks);
      }
    } else {
      // JAMB / Standard non-IELTS test
      const s = data.total_score !== undefined ? Math.round(data.total_score) : (initialScore !== null ? Math.round(initialScore) : 0);
      const maxS = data.max_total_score ? Math.round(data.max_total_score) : (data.total_questions_attempted || 400);
      setScore(s);
      setTotalScore(maxS);
      const pct = maxS > 0 ? (s / maxS) * 100 : 0;
      if (pct >= 70) setPerformanceTag('Excellent Performance');
      else if (pct >= 50) setPerformanceTag('Good Performance');
      else setPerformanceTag('Needs Improvement');
    }

    setCorrectAnswers(data.correct_answers ?? null);
    setWrongAnswers(data.wrong_answers ?? null);
    setSkippedQuestions(data.skipped_questions ?? null);

    if (data.total_time_taken !== undefined) {
      const totalSec = Math.round(data.total_time_taken);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const sec = totalSec % 60;
      if (h > 0) {
        setTimeUsedFormatted(`${h}h ${m}m`);
      } else if (m > 0) {
        setTimeUsedFormatted(`${m}m ${sec}s`);
      } else {
        setTimeUsedFormatted(`${sec}s`);
      }
    }
  }, [detectedIsIelts, initialScore, params.exam_name, params.is_ielts, params.section_names, params.section_order, params.sections]);

  const processAttemptResponses = useCallback((attemptData: any) => {
    if (!attemptData || !attemptData.sections) return;
    const extractedFeedbacks: AiFeedbackItem[] = [];

    attemptData.sections.forEach((sec: any) => {
      const isSpeakingSec = sec.section_name && sec.section_name.toLowerCase().includes('speaking');
      sec.question_groups?.forEach((grp: any) => {
        grp.responses?.forEach((resp: any) => {
          const isAudioResp = Boolean(resp.audio_response || resp.question?.question_type === 'AUDIO' || isSpeakingSec);
          const rawFb = resp.ai_feedback || resp.ielts_speaking_criteria;

          if (isAudioResp || resp.question?.question_type === 'TEXT') {
            const parsed = parseSpeakingFeedback(rawFb);
            if (parsed || resp.audio_response || resp.written_response) {
              extractedFeedbacks.push({
                question_id: resp.question?.id || resp.id,
                score_awarded: resp.score_awarded ?? parsed?.score_awarded ?? parsed?.score,
                audio_response: resp.audio_response || resp.bulk_audio_file || attemptData?.bulk_audio_file,
                audio_start_time: resp.audio_start_time,
                audio_end_time: resp.audio_end_time,
                written_response: resp.written_response,
                question_text: resp.question?.text,
                ...(parsed || {}),
              });
            }
          }
        });
      });
    });

    if (extractedFeedbacks.length > 0) {
      setAiFeedbacks(prev => {
        const merged = [...prev];
        extractedFeedbacks.forEach(item => {
          const idx = merged.findIndex(m => m.question_id === item.question_id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...item };
          } else {
            merged.push(item);
          }
        });
        return merged;
      });
    }
  }, []);

  const fetchResults = useCallback(async (isPolling = false) => {
    if (!params.attempt_id) {
      if (initialScore === null) {
        setError('No exam session ID provided.');
      }
      setLoading(false);
      setAnalyticsLoading(false);
      return;
    }

    const attemptId = Number(params.attempt_id);
    if (!isPolling) {
      if (initialScore === null) {
        setLoading(true);
      } else {
        setAnalyticsLoading(true);
      }
    }
    setAnalyticsError(null);
    setError(null);

    let foundAnalytics = false;

    // 1. Fetch attempt responses (candidate audio, Deepgram transcript, rubric feedback)
    try {
      const attemptData = await examService.resumeExam(attemptId);
      if (attemptData) {
        processAttemptResponses(attemptData);
      }
    } catch (attemptErr) {
      console.warn('Attempt responses fetch error:', attemptErr);
    }

    // 2. Primary: Detailed Analytics Endpoint
    try {
      const data = await examService.getDetailedAnalytics(attemptId);
      if (data) {
        processAnalyticsData(data);
        foundAnalytics = true;
      }
    } catch (primaryErr) {
      console.warn('Detailed analytics not ready or endpoint returned error:', primaryErr);
    }

    // 3. Fallback: Full Attempt Review Endpoint
    if (!foundAnalytics) {
      try {
        const reviewData = await examService.getAttemptReview(attemptId);
        if (reviewData) {
          processAnalyticsData({
            ...reviewData,
            total_score: reviewData.total_score,
            exam_name: (reviewData as any).exam_name || params.exam_name,
          });
          foundAnalytics = true;
        }
      } catch (reviewErr) {
        console.warn('Attempt review fallback error:', reviewErr);
      }
    }

    // 4. Fallback: Last Attempt Details Endpoint
    if (!foundAnalytics) {
      try {
        const lastAttempt = await examService.getLastAttemptDetails(detectedIsIelts ? 42 : 41);
        if (lastAttempt && (lastAttempt.total_score !== undefined || lastAttempt.score !== undefined)) {
          processAnalyticsData(lastAttempt);
          foundAnalytics = true;
        }
      } catch (lastErr) {
        console.warn('Last attempt details fallback error:', lastErr);
      }
    }

    setLoading(false);
    setAnalyticsLoading(false);

    if (!foundAnalytics && initialScore === null) {
      setError('Could not retrieve results. Please check your connection and try again.');
    } else if (!foundAnalytics && initialScore !== null) {
      setAnalyticsError('Detailed skill analytics could not be retrieved.');
    }
  }, [params.attempt_id, initialScore, processAnalyticsData, processAttemptResponses, detectedIsIelts]);

  useEffect(() => {
    fetchResults();

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [fetchResults]);

  // Active IELTS Sections considering selected/done practice sections
  const activeIeltsSections = useMemo(() => {
    if (!isIelts) return ALL_IELTS_SECTIONS;

    const dataSecNames: string[] = [];
    if (analyticsData?.sections && Array.isArray(analyticsData.sections)) {
      analyticsData.sections.forEach((s: any) => {
        const name = s.section_name || s.name || '';
        if (name) dataSecNames.push(name.toLowerCase());
      });
    }
    if (analyticsData?.subjects && Array.isArray(analyticsData.subjects)) {
      analyticsData.subjects.forEach((s: any) => {
        const name = s.section_name || s.name || '';
        if (name) dataSecNames.push(name.toLowerCase());
      });
    }

    const rawParamsStr = [
      params.section_names,
      params.section_order,
      params.sections,
      params.exam_name,
    ].filter(Boolean).join(',').toLowerCase();

    const matched = ALL_IELTS_SECTIONS.filter(sec => {
      const labelLower = sec.label.toLowerCase();

      // Check data.sections or data.subjects
      if (dataSecNames.length > 0) {
        if (dataSecNames.some(d => d.includes(labelLower))) return true;
      }

      // Check router params string
      if (rawParamsStr) {
        if (rawParamsStr.includes(labelLower)) return true;
      }

      // Check scorePerSection
      const val = getSectionScore(sec, scorePerSection);
      if (val !== null && val !== undefined) return true;

      return false;
    });

    if (matched.length > 0) {
      return matched;
    }

    return ALL_IELTS_SECTIONS;
  }, [isIelts, analyticsData, params.section_names, params.section_order, params.sections, params.exam_name, scorePerSection]);

  // Dynamically compute AI evaluation progress tailored specifically to the tests that were taken
  const aiEvaluationInfo = useMemo(() => {
    if (!isIelts) {
      return { isEvaluating: false, pendingSections: [] as string[], readySections: [] as string[], title: '', message: '' };
    }

    if (analyticsData?.ai_assessment_status === 'Skipped' || analyticsData?.ai_assessment_status === 'Completed') {
      return { isEvaluating: false, pendingSections: [] as string[], readySections: [] as string[], title: '', message: '' };
    }

    const hasWriting = activeIeltsSections.some(s => s.label.toLowerCase() === 'writing');
    const hasSpeaking = activeIeltsSections.some(s => s.label.toLowerCase() === 'speaking');
    const hasReading = activeIeltsSections.some(s => s.label.toLowerCase() === 'reading');
    const hasListening = activeIeltsSections.some(s => s.label.toLowerCase() === 'listening');

    const writingDef = ALL_IELTS_SECTIONS.find(s => s.label === 'Writing');
    const speakingDef = ALL_IELTS_SECTIONS.find(s => s.label === 'Speaking');

    const writingScore = writingDef ? getSectionScore(writingDef, scorePerSection) : null;
    const speakingScore = speakingDef ? getSectionScore(speakingDef, scorePerSection) : null;

    // Section is pending evaluation only if it was actually taken in this exam attempt
    // and its band score has not yet been computed / awarded
    const isWritingPending = hasWriting && (writingScore === undefined || writingScore === null || writingScore === 0);
    const isSpeakingPending = hasSpeaking && (speakingScore === undefined || speakingScore === null || speakingScore === 0);

    const pendingSections: string[] = [];
    if (isWritingPending) pendingSections.push('Writing');
    if (isSpeakingPending) pendingSections.push('Speaking');

    // If neither Writing nor Speaking is pending (or neither was taken, e.g. Reading/Listening only test), no AI evaluation
    if (pendingSections.length === 0) {
      return { isEvaluating: false, pendingSections: [] as string[], readySections: [] as string[], title: '', message: '' };
    }

    const readySections: string[] = [];
    if (hasReading) readySections.push('Reading');
    if (hasListening) readySections.push('Listening');
    if (hasWriting && !isWritingPending) readySections.push('Writing');
    if (hasSpeaking && !isSpeakingPending) readySections.push('Speaking');

    const pendingText = pendingSections.join(' & ');
    const verb = pendingSections.length > 1 ? 'are' : 'is';

    let message = '';
    if (readySections.length > 0) {
      const readyText = readySections.join(' & ');
      message = `Deterministic scoring (${readyText}) is ready. ${pendingText} ${verb} currently being evaluated by our AI examiner.`;
    } else {
      if (pendingSections.length === 1 && pendingSections[0] === 'Speaking') {
        message = 'Your Speaking audio is currently being evaluated by our AI examiner.';
      } else if (pendingSections.length === 1 && pendingSections[0] === 'Writing') {
        message = 'Your Writing response is currently being evaluated by our AI examiner.';
      } else {
        message = `${pendingText} responses ${verb} currently being evaluated by our AI examiner.`;
      }
    }

    return {
      isEvaluating: true,
      pendingSections,
      readySections,
      title: 'AI Evaluation in Progress',
      message
    };
  }, [isIelts, analyticsData?.ai_assessment_status, activeIeltsSections, scorePerSection]);

  const isAiEvaluating = aiEvaluationInfo.isEvaluating;

  // Polling for async AI evaluation if Celery is running
  useEffect(() => {
    if (isAiEvaluating && pollCountRef.current < 6 && params.attempt_id) {
      pollTimerRef.current = setTimeout(() => {
        pollCountRef.current += 1;
        fetchResults(true);
      }, 3500);
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isAiEvaluating, fetchResults, params.attempt_id]);

  // Calculations for donut
  const displayScore = score !== null ? (isIelts ? score.toFixed(1) : String(score)) : '--';
  const percentage = isIelts
    ? Math.min(100, Math.round(((score ?? 0) / 9.0) * 100))
    : (totalScore && totalScore > 0 ? Math.round(((score ?? 0) / totalScore) * 100) : 0);

  const totalIeltsQuestions = analyticsData?.total_questions_attempted || analyticsData?.total_questions || (activeIeltsSections.length * 40);

  const correctPct = totalScore && totalScore > 0 && correctAnswers !== null
    ? Math.round((correctAnswers / (isIelts ? totalIeltsQuestions : totalScore)) * 100)
    : null;
  const wrongPct = totalScore && totalScore > 0 && wrongAnswers !== null
    ? Math.round((wrongAnswers / (isIelts ? totalIeltsQuestions : totalScore)) * 100)
    : null;
  const skippedPct = totalScore && totalScore > 0 && skippedQuestions !== null
    ? Math.round((skippedQuestions / (isIelts ? totalIeltsQuestions : totalScore)) * 100)
    : null;

  // SVG Circular progress
  const size = 190;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {examTitle}
          </Text>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => router.push('/streak')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak || params.streak || 0}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Analyzing test results...</Text>
          </View>
        ) : error && score === null ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#94A3B8" />
            <Text style={styles.errorTitle}>Result Unavailable</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => fetchResults(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: '#F3F4F6', marginTop: 10 }]} 
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={[styles.retryButtonText, { color: '#4B5563' }]}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* AI Evaluation in progress banner */}
            {isAiEvaluating && (
              <View style={styles.evaluatingBanner}>
                <ActivityIndicator size="small" color="#6D28D9" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.evaluatingTitle}>{aiEvaluationInfo.title}</Text>
                  <Text style={styles.evaluatingSub}>
                    {aiEvaluationInfo.message}
                  </Text>
                </View>
              </View>
            )}

            {/* Headline */}
            <View style={styles.headlineContainer}>
              <Text style={styles.mainTitle}>
                {percentage >= 70 ? 'Great Job! 🎉' : percentage >= 50 ? 'Good Effort! 👏' : 'Keep Practicing! 💪'}
              </Text>
              <Text style={styles.mainSubtitle}>
                {isIelts 
                  ? (activeIeltsSections.length < 4
                      ? `You've completed your IELTS practice session (${activeIeltsSections.map((s: any) => s.label).join(', ')})`
                      : "You've completed your IELTS examination")
                  : "You've completed the standard practice simulation"}
              </Text>
            </View>

            {/* Score Donut */}
            <View style={styles.donutContainer}>
              <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={isIelts ? '#6D28D9' : '#7C3AED'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>

              <View style={styles.donutInner}>
                <Text style={styles.donutLabel}>
                  {isIelts ? 'Overall Band' : 'Your Score'}
                </Text>
                <Text style={styles.donutScore}>{displayScore}</Text>
                <Text style={styles.donutTotal}>
                  {isIelts ? `${displayScore} / 9.0` : `${displayScore} / ${totalScore || 400}`}
                </Text>
                <View style={[styles.performanceBadge, isIelts && { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.performanceBadgeText, isIelts && { color: '#6D28D9' }]}>
                    {performanceTag}
                  </Text>
                </View>
              </View>
            </View>

            {/* CEFR Level Pill for IELTS */}
            {isIelts && cefrLevel && (
              <View style={styles.cefrContainer}>
                <View style={styles.cefrBadge}>
                  <Ionicons name="ribbon-outline" size={16} color="#6D28D9" style={{ marginRight: 6 }} />
                  <Text style={styles.cefrText}>CEFR Level: {cefrLevel}</Text>
                </View>
              </View>
            )}

            {/* Detailed Analytics In-Flight Banner */}
            {isIelts && analyticsLoading && !isAiEvaluating && (
              <View style={styles.analyticsLoadingBanner}>
                <ActivityIndicator size="small" color="#7C3AED" style={{ marginRight: 8 }} />
                <Text style={styles.analyticsLoadingText}>
                  Retrieving section diagnostics & skill band analytics...
                </Text>
              </View>
            )}

            {/* Detailed Analytics Error Banner */}
            {isIelts && analyticsError && !analyticsLoading && (
              <View style={styles.analyticsErrorBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.analyticsErrorText}>{analyticsError}</Text>
                </View>
                <TouchableOpacity onPress={() => fetchResults(false)} style={styles.inlineRetryBtn}>
                  <Text style={styles.inlineRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* IELTS Skill Band Breakdown (Considers active/selected practice sections) */}
            {isIelts && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>
                  {activeIeltsSections.length < 4 ? 'IELTS Practice Skill Breakdown' : 'IELTS Skill Breakdown'}
                </Text>
                <View style={styles.ieltsGrid}>
                  {activeIeltsSections.map(item => {
                    const foundVal = getSectionScore(item, scorePerSection);
                    const isPending = (foundVal === undefined || foundVal === null || foundVal === 0) &&
                                      aiEvaluationInfo.pendingSections.includes(item.label);
                    const isCardLoading = analyticsLoading && (foundVal === undefined || foundVal === null);

                    const valDisplay = foundVal !== undefined && foundVal !== null 
                      ? `${parseFloat(String(foundVal)).toFixed(1)}` 
                      : (isPending ? '...' : '--');

                    return (
                      <View key={item.key} style={styles.ieltsSkillCard}>
                        <View style={[styles.ieltsIconBg, { backgroundColor: item.bg }]}>
                          <Ionicons name={item.icon} size={20} color={item.color} />
                        </View>
                        <Text style={styles.ieltsSkillLabel}>{item.label}</Text>
                        
                        {isCardLoading ? (
                          <View style={styles.skillLoadingBox}>
                            <ActivityIndicator size="small" color={item.color} />
                            <Text style={[styles.evaluatingMini, { color: item.color }]}>Fetching...</Text>
                          </View>
                        ) : (
                          <View style={styles.ieltsScoreRow}>
                            <Text style={[styles.ieltsSkillScore, { color: item.color }]}>
                              {valDisplay}
                            </Text>
                            <Text style={styles.ieltsSkillMax}>/ 9.0</Text>
                          </View>
                        )}

                        {isPending && !isCardLoading && (
                          <Text style={styles.evaluatingMini}>AI Grading</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 4-Metric Grid (Diagnostics & Stats) */}
            <View style={styles.metricsGrid}>
              {/* Correct Answers */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#DCFCE7' }]}>
                    <Feather name="check" size={14} color="#16A34A" />
                  </View>
                  <Text style={styles.metricLabel}>Correct</Text>
                </View>
                {analyticsLoading && correctAnswers === null ? (
                  <View style={styles.metricLoadingBox}>
                    <ActivityIndicator size="small" color="#16A34A" />
                  </View>
                ) : (
                  <>
                    <Text style={styles.metricValue}>{correctAnswers !== null ? correctAnswers : '--'}</Text>
                    <Text style={[styles.metricSub, { color: '#16A34A' }]}>
                      {correctPct !== null ? `${correctPct}%` : 'accuracy'}
                    </Text>
                  </>
                )}
              </View>

              {/* Incorrect Answers */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="x" size={14} color="#DC2626" />
                  </View>
                  <Text style={styles.metricLabel}>Incorrect</Text>
                </View>
                {analyticsLoading && wrongAnswers === null ? (
                  <View style={styles.metricLoadingBox}>
                    <ActivityIndicator size="small" color="#DC2626" />
                  </View>
                ) : (
                  <>
                    <Text style={styles.metricValue}>{wrongAnswers !== null ? wrongAnswers : '--'}</Text>
                    <Text style={[styles.metricSub, { color: '#DC2626' }]}>
                      {wrongPct !== null ? `${wrongPct}%` : 'reviewable'}
                    </Text>
                  </>
                )}
              </View>

              {/* Unattempted or Speed */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: isIelts && readingWpm ? '#EFF6FF' : '#FFEDD5' }]}>
                    <Feather name={isIelts && readingWpm ? "zap" : "minus"} size={14} color={isIelts && readingWpm ? "#2563EB" : "#EA580C"} />
                  </View>
                  <Text style={styles.metricLabel}>
                    {isIelts && readingWpm ? 'Reading Speed' : 'Unattempted'}
                  </Text>
                </View>
                {analyticsLoading && readingWpm === null && skippedQuestions === null ? (
                  <View style={styles.metricLoadingBox}>
                    <ActivityIndicator size="small" color={isIelts ? "#2563EB" : "#EA580C"} />
                  </View>
                ) : (
                  <>
                    <Text style={styles.metricValue}>
                      {isIelts && readingWpm ? `${readingWpm} WPM` : (skippedQuestions !== null ? skippedQuestions : '--')}
                    </Text>
                    <Text style={[styles.metricSub, { color: isIelts && readingWpm ? '#2563EB' : '#EA580C' }]}>
                      {isIelts && readingWpm ? 'words / min' : (skippedPct !== null ? `${skippedPct}%` : 'skipped')}
                    </Text>
                  </>
                )}
              </View>

              {/* Time Used */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#F1F5F9' }]}>
                    <Feather name="clock" size={14} color="#64748B" />
                  </View>
                  <Text style={styles.metricLabel}>Time Used</Text>
                </View>
                {analyticsLoading && timeUsedFormatted === '-' ? (
                  <View style={styles.metricLoadingBox}>
                    <ActivityIndicator size="small" color="#64748B" />
                  </View>
                ) : (
                  <>
                    <Text style={styles.metricValue}>{timeUsedFormatted}</Text>
                    <Text style={[styles.metricSub, { color: '#94A3B8' }]}>total duration</Text>
                  </>
                )}
              </View>
            </View>

            {/* Rank Banner for Standard Exams */}
            {!isIelts && (
              <TouchableOpacity 
                style={styles.rankCard}
                onPress={() => router.push('/(exam)/leaderboard')}
                activeOpacity={0.8}
              >
                <View style={styles.rankIconBg}>
                  <Ionicons name="bar-chart" size={18} color="#7C3AED" />
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankLabel}>Your Rank</Text>
                  <Text style={styles.rankValue}>Top {Math.max(1, 100 - percentage)}%</Text>
                  <Text style={styles.rankSub}>Based on your score</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {/* View Subject Performance Button (for standard exams like JAMB) */}
            {!isIelts && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push({
                  pathname: '/(exam)/subject-performance',
                  params: { 
                    attempt_id: params.attempt_id,
                    exam_name: examTitle,
                    is_ielts: 'false',
                  }
                })}
                activeOpacity={0.85}
              >
                <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>View Subject Performance</Text>
              </TouchableOpacity>
            )}

            {/* Review Answers Button */}
            <TouchableOpacity 
              style={[styles.actionButton, !isIelts && { backgroundColor: '#F5F3FF', borderWidth: 1.5, borderColor: '#7C3AED', marginTop: 12 }]}
              onPress={() => router.push({
                pathname: '/(exam)/review-answers',
                params: { 
                  attempt_id: params.attempt_id,
                  exam_name: examTitle,
                  is_ielts: String(isIelts),
                }
              })}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={18} color={!isIelts ? '#7C3AED' : '#FFFFFF'} style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, !isIelts && { color: '#7C3AED' }]}>Review Answers & Explanations</Text>
            </TouchableOpacity>

            {/* Topic & Skill Performance */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#7C3AED', marginTop: 12 }]}
              onPress={() => router.push({
                pathname: '/(exam)/topic-performance',
                params: { 
                  attempt_id: params.attempt_id,
                  exam_name: examTitle,
                  is_ielts: String(isIelts),
                }
              })}
              activeOpacity={0.85}
            >
              <Ionicons name="analytics-outline" size={18} color="#7C3AED" style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>View Topic & Skill Mastery</Text>
            </TouchableOpacity>

            {/* Return to Home / Practice */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 }]}
              onPress={() => router.replace('/(tabs)/practice')}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: '#4B5563' }]}>Done</Text>
            </TouchableOpacity>

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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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

  // Evaluating Banner
  evaluatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  evaluatingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
    marginBottom: 2,
  },
  evaluatingSub: {
    fontSize: 11.5,
    color: '#6D28D9',
    lineHeight: 16,
  },
  evaluatingMini: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 2,
  },
  analyticsLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: 14,
  },
  analyticsLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
    flex: 1,
  },
  analyticsErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 14,
  },
  analyticsErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  inlineRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    marginLeft: 10,
  },
  inlineRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  skillLoadingBox: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLoadingBox: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
    marginTop: 8,
  },
  rankIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankInfo: {
    flex: 1,
  },
  rankLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  rankValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },
  rankSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Headline
  headlineContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Donut
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  donutInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  donutScore: {
    fontSize: 38,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 44,
  },
  donutTotal: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  performanceBadge: {
    marginTop: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  performanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // CEFR
  cefrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cefrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cefrText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
  },

  // Section Heading
  sectionContainer: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  // IELTS 4-Grid
  ieltsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  ieltsSkillCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  ieltsIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ieltsSkillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  ieltsScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ieltsSkillScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  ieltsSkillMax: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 3,
  },

  // 4-Metric Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  // AI Feedback Cards
  aiFeedbackCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  aiFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiFeedbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  rubricRow: {
    marginBottom: 6,
  },
  rubricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  rubricValue: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },
  aiFeedbackDetailed: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 4,
    paddingTop: 4,
  },
  aiFeedbackQuestionText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 16,
  },
  rubricCriteriaContainer: {
    gap: 8,
    marginBottom: 8,
  },
  rubricBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rubricTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rubricScorePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rubricScorePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  examinerSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  examinerSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  examinerSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  mediaSection: {
    marginTop: 10,
  },
  mediaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mediaSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  audioProgressCol: {
    flex: 1,
    justifyContent: 'center',
  },
  audioProgressBarBg: {
    height: 6,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  audioProgressBarFill: {
    height: 6,
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  audioTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  audioTimeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  transcriptBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 10,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transcriptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  transcriptText: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 17,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButton: {
    backgroundColor: '#7C3AED',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Center / Error / Loading
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
