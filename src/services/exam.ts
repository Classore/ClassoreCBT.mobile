import { api } from './api';
import { Platform } from 'react-native';
import { storage } from './storage';

export interface ExamGenerationRules {
  selection_strategy: string;
  total_sections: number;
  required_sections: string[];
  standard_question_counts: Record<string, number | { presented: number, required_to_answer: number }>;
  structured_generation?: Record<string, any>;
}

export interface ExamType {
  id: number;
  name: string;
  description: string;
  is_premium_only: boolean;
  is_published: boolean;
  generation_rules: ExamGenerationRules;
}

export const isSectionBasedExam = (
  examName?: string | null,
  sections?: { name?: string; section_name?: string }[]
): boolean => {
  if (!examName && !sections) return false;
  const nameLower = (examName || '').toLowerCase();
  // Standard non-section-based exams
  if (
    nameLower.includes('jamb') ||
    nameLower.includes('utme') ||
    nameLower.includes('waec') ||
    nameLower.includes('neco') ||
    nameLower.includes('post-utme')
  ) {
    return false;
  }
  if (
    nameLower.includes('ielts') ||
    nameLower.includes('toefl') ||
    nameLower.includes('pte') ||
    nameLower.includes('duolingo')
  ) {
    return true;
  }
  if (
    sections &&
    sections.some(s => {
      const sName = (s.name || s.section_name || '').toLowerCase();
      return ['reading', 'listening', 'writing', 'speaking'].includes(sName);
    })
  ) {
    return true;
  }
  return false;
};

export interface ExamSection {
  id: number;
  exam_type: number;
  name: string;
  parent: number | null;
  default_time_minutes: number;
  is_published: boolean;
  sub_sections?: number[];
  topics?: string[];
}

export interface ExamTierConfig {
  id: number;
  exam_type: number;
  has_free_tier: boolean;
  freemium_daily_attempts_per_section: number;
  freemium_max_questions_per_section: number;
  total_questions?: number;
  duration_minutes?: number;
  difficulty?: string;
  reward_xp?: number;
}

export interface ChoiceItem {
  id: number;
  text: string;
  is_correct?: boolean;
  image?: string | null;
  order?: number;
}
export type Choice = ChoiceItem;

export interface QuestionData {
  id: number;
  text: string;
  instructions?: string;
  explanation?: string | null;
  hint_explanation?: string | null;
  question_type: 'MCQ' | 'TEXT' | 'AUDIO' | 'MATCHING' | 'GAP_FILL' | 'LABELING';
  choices?: ChoiceItem[];
  points?: number;
  prep_time_seconds?: number;
  recording_time_seconds?: number;
  metadata?: Record<string, any>;
  section_id?: number;
  section_name?: string;
  image?: string | null;
  audio_file?: string | null;
}

export interface UserResponseItem {
  id: number;
  selected_choice?: number | null;
  written_response?: string | null;
  audio_response?: string | null;
  audio_start_time?: number | null;
  audio_end_time?: number | null;
  bulk_audio_file?: string | null;
  ielts_speaking_criteria?: any;
  score_awarded?: number;
  ai_feedback?: string | null;
  time_spent_seconds?: number;
  metadata?: Record<string, any> | null;
  is_bookmarked?: boolean;
  question: QuestionData;
}

export interface QuestionGroupItem {
  group_id: number | string;
  group_title?: string;
  group_type?: string;
  context_text?: string;
  context_media?: string;
  responses: UserResponseItem[];
}

export interface AttemptSection {
  section_id: number;
  section_name: string;
  question_groups: QuestionGroupItem[];
}

export interface UserAttempt {
  id: number;
  exam_type: number;
  exam_name?: string;
  exam_title?: string;
  mode: 'Standard' | 'Practice';
  time_limit_override?: number | null;
  start_time: string;
  end_time?: string | null;
  total_score?: number | null;
  status: string;
  bulk_audio_file?: string | null;
  sections: AttemptSection[];
}

export interface RecentAttemptRecord {
  id: number;
  exam_type: number;
  title: string;
  total_questions?: number;
  answered_questions?: number;
  status: 'in_progress' | 'completed' | string;
  is_section_based?: boolean;
  timestamp: number;
}

export interface ExamStartRequest {
  exam_type_id: number;
  mode?: 'Standard' | 'Practice';
  selected_section_ids?: number[];
  time_limit_override?: number;
  question_count?: number;
  difficulty?: string;
  topics?: string[];
  practice_config?: Record<string, any>;
}

export interface AutoSavePayload {
  responses: {
    question_id: number;
    choice_id?: number | null;
    written_response?: string | null;
    time_spent_seconds?: number;
    is_bookmarked?: boolean;
    metadata?: Record<string, any>;
  }[];
}

export interface SubmitExamPayload {
  responses: {
    question_id: number;
    choice_id?: number | null;
    written_response?: string | null;
    time_spent_seconds?: number;
    is_bookmarked?: boolean;
    metadata?: Record<string, any>;
  }[];
}

const EXAMS_CACHE_KEY = '@classore_cached_exams';
let memoryCachedExams: ExamType[] | null = null;

const SECTIONS_CACHE_KEY_PREFIX = '@classore_cached_sections_';
const memoryCachedSections: Record<number, ExamSection[]> = {};

const TIER_CONFIGS_CACHE_KEY = '@classore_cached_tier_configs';
let memoryCachedTierConfigs: ExamTierConfig[] | null = null;
const memoryCachedAggregateReports: Record<string, any> = {};

const ACTIVE_ATTEMPT_ID_KEY = '@classore_active_attempt_id';
let memoryActiveAttemptId: number | null = null;

export const resolveNumericExamId = (
  rawExam: any,
  fallbackId: number = 1
): number => {
  if (rawExam === undefined || rawExam === null) {
    return fallbackId;
  }
  const examStr = Array.isArray(rawExam) ? String(rawExam[0]) : String(rawExam);
  const trimmed = examStr.trim();
  if (!trimmed || trimmed === 'NaN' || trimmed === 'undefined' || trimmed === 'null') {
    return fallbackId;
  }

  // 1. Direct positive integer string or number
  const parsed = parseInt(trimmed, 10);
  if (!isNaN(parsed) && parsed > 0 && String(parsed) === trimmed) {
    return parsed;
  }

  // 2. Try looking up in memory-cached exams
  const lower = trimmed.toLowerCase();
  const cachedList = memoryCachedExams;
  if (cachedList && cachedList.length > 0) {
    const matched = cachedList.find(
      e =>
        String(e.id) === trimmed ||
        e.name.toLowerCase() === lower ||
        e.name.toLowerCase().includes(lower)
    );
    if (matched) {
      return matched.id;
    }
  }

  // 3. Known fallback aliases
  if (lower.includes('jamb') || lower.includes('utme')) {
    return 1;
  }
  if (lower.includes('waec') || lower.includes('ssce') || lower.includes('wassce')) {
    return 2;
  }
  if (lower.includes('neco')) {
    return 3;
  }
  if (lower.includes('ielts')) {
    return 42;
  }

  // 4. If parsed was a valid positive number
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return fallbackId;
};

export const examService = {
  getCachedExamsSync: (): ExamType[] | null => {
    return memoryCachedExams;
  },

  getCachedExams: async (): Promise<ExamType[] | null> => {
    if (memoryCachedExams && memoryCachedExams.length > 0) {
      return memoryCachedExams;
    }
    const stored = await storage.get<ExamType[]>(EXAMS_CACHE_KEY);
    if (stored && stored.length > 0) {
      memoryCachedExams = stored;
      return stored;
    }
    return null;
  },

  getExams: async (options?: { forceRefresh?: boolean }): Promise<ExamType[]> => {
    try {
      const response = await api.get('/api/admin/exams/?is_published=true');
      const freshExams: ExamType[] = response.data.results ? response.data.results : response.data;
      if (Array.isArray(freshExams) && freshExams.length > 0) {
        memoryCachedExams = freshExams;
        await storage.set(EXAMS_CACHE_KEY, freshExams);
        // Trigger background prefetch for sections & tier configs
        examService.prefetchExamMetadata(freshExams).catch(() => {});
      }
      return freshExams;
    } catch (error) {
      // Fallback to cache if network request fails
      const cached = await examService.getCachedExams();
      if (cached && cached.length > 0) {
        console.warn('[examService] Network failed, falling back to cached exams');
        // Trigger prefetch in case cached exams exist but sections need warming
        examService.prefetchExamMetadata(cached).catch(() => {});
        return cached;
      }
      throw error;
    }
  },

  prefetchExamMetadata: async (exams?: ExamType[]): Promise<void> => {
    try {
      const targetExams = exams || (await examService.getCachedExams()) || [];
      if (!targetExams || targetExams.length === 0) return;

      // Prefetch tier configs if not already in memory
      if (!memoryCachedTierConfigs) {
        await examService.getExamTierConfigs().catch(() => {});
      }

      // Prefetch sections for all exams in parallel without blocking UI
      await Promise.allSettled(
        targetExams.map(exam => examService.getSections(exam.id))
      );
    } catch (e) {
      console.warn('[examService] Background metadata prefetch failed:', e);
    }
  },

  getCachedSectionsSync: (examTypeId: number): ExamSection[] | null => {
    const numericId = Number(examTypeId);
    if (!numericId || isNaN(numericId) || numericId <= 0) return null;
    return memoryCachedSections[numericId] || null;
  },

  getCachedSections: async (examTypeId: number): Promise<ExamSection[] | null> => {
    const numericId = Number(examTypeId);
    if (!numericId || isNaN(numericId) || numericId <= 0) return null;
    if (memoryCachedSections[numericId] && memoryCachedSections[numericId].length > 0) {
      return memoryCachedSections[numericId];
    }
    const stored = await storage.get<ExamSection[]>(`${SECTIONS_CACHE_KEY_PREFIX}${numericId}`);
    if (stored && stored.length > 0) {
      memoryCachedSections[numericId] = stored;
      return stored;
    }
    return null;
  },

  getSections: async (examTypeId: number, options?: { forceRefresh?: boolean }): Promise<ExamSection[]> => {
    const numericId = Number(examTypeId);
    if (!numericId || isNaN(numericId) || numericId <= 0) {
      console.warn(`[examService.getSections] Invalid examTypeId passed: ${examTypeId}`);
      return [];
    }
    try {
      const response = await api.get(`/api/admin/sections/?exam_type_id=${numericId}&is_published=true`);
      const freshSections: ExamSection[] = response.data.results ? response.data.results : response.data;
      if (Array.isArray(freshSections) && freshSections.length > 0) {
        memoryCachedSections[numericId] = freshSections;
        await storage.set(`${SECTIONS_CACHE_KEY_PREFIX}${numericId}`, freshSections);
        return freshSections;
      }
    } catch (adminError) {
      // /api/admin/sections/ may fail for unauthenticated guests
    }

    // Public / guest fallback endpoint: /api/user/sections/
    try {
      const userRes = await api.get(`/api/user/sections/?exam_type_id=${numericId}`);
      const freshSections: ExamSection[] = userRes.data.results ? userRes.data.results : userRes.data;
      if (Array.isArray(freshSections) && freshSections.length > 0) {
        memoryCachedSections[numericId] = freshSections;
        await storage.set(`${SECTIONS_CACHE_KEY_PREFIX}${numericId}`, freshSections);
        return freshSections;
      }
    } catch (userError) {
      console.warn(`[examService] /api/user/sections/ fallback failed for exam ${numericId}:`, userError);
    }

    try {
      const cached = await examService.getCachedSections(numericId);
      if (cached && cached.length > 0) {
        console.warn(`[examService] Network failed, falling back to cached sections for exam ${numericId}`);
        return cached;
      }
    } catch {}

    return [];
  },

  getSectionTopics: async (sectionId: number): Promise<string[]> => {
    try {
      const response = await api.get(`/api/user/sections/${sectionId}/topics/`);
      const raw = response.data?.topics || response.data?.results || response.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw
          .map((t: any) => {
            if (typeof t === 'string') return t;
            return t.topic_tag || t.name || t.title || '';
          })
          .filter((t: string) => Boolean(t) && t !== '[object Object]');
      }
      return [];
    } catch (error) {
      console.warn(`[examService] Failed to fetch topics for section ${sectionId}:`, error);
      return [];
    }
  },

  getCachedTierConfigsSync: (): ExamTierConfig[] | null => {
    return memoryCachedTierConfigs;
  },

  getCachedTierConfigs: async (): Promise<ExamTierConfig[] | null> => {
    if (memoryCachedTierConfigs && memoryCachedTierConfigs.length > 0) {
      return memoryCachedTierConfigs;
    }
    const stored = await storage.get<ExamTierConfig[]>(TIER_CONFIGS_CACHE_KEY);
    if (stored && stored.length > 0) {
      memoryCachedTierConfigs = stored;
      return stored;
    }
    return null;
  },

  getExamTierConfigs: async (options?: { forceRefresh?: boolean }): Promise<ExamTierConfig[]> => {
    try {
      const response = await api.get('/api/admin/exam-tier-configs/');
      const freshConfigs: ExamTierConfig[] = response.data.results ? response.data.results : response.data;
      if (Array.isArray(freshConfigs) && freshConfigs.length > 0) {
        memoryCachedTierConfigs = freshConfigs;
        await storage.set(TIER_CONFIGS_CACHE_KEY, freshConfigs);
      }
      return freshConfigs;
    } catch (error) {
      const cached = await examService.getCachedTierConfigs();
      if (cached && cached.length > 0) {
        console.warn('[examService] Network failed, falling back to cached tier configs');
        return cached;
      }
      throw error;
    }
  },
  setActiveAttemptId(id: number): void {
    if (id && !isNaN(id) && id > 0) {
      memoryActiveAttemptId = id;
      storage.set(ACTIVE_ATTEMPT_ID_KEY, id).catch(() => {});
    }
  },

  getActiveAttemptIdSync(): number | null {
    return memoryActiveAttemptId;
  },

  async getActiveAttemptId(): Promise<number | null> {
    if (memoryActiveAttemptId && !isNaN(memoryActiveAttemptId) && memoryActiveAttemptId > 0) {
      return memoryActiveAttemptId;
    }
    const stored = await storage.get<number>(ACTIVE_ATTEMPT_ID_KEY);
    if (stored && !isNaN(stored) && stored > 0) {
      memoryActiveAttemptId = stored;
      return stored;
    }
    return null;
  },

  clearActiveAttemptId(): void {
    memoryActiveAttemptId = null;
    storage.remove(ACTIVE_ATTEMPT_ID_KEY).catch(() => {});
  },

  parseAttemptId(raw?: string | number | string[]): number | null {
    if (!raw) return null;
    const str = Array.isArray(raw) ? raw[0] : String(raw);
    const parsed = parseInt(str, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  },

  startExam: async (payload: ExamStartRequest): Promise<UserAttempt> => {
    const response = await api.post('/api/user/exam/start/', payload);
    if (response.data && response.data.id) {
      const attempt = response.data;
      examService.setActiveAttemptId(attempt.id);
      const isIelts = attempt.exam_type === 42 || payload.exam_type_id === 42;
      const activeRecord: RecentAttemptRecord = {
        id: attempt.id,
        exam_type: attempt.exam_type || payload.exam_type_id || (isIelts ? 42 : 41),
        title: attempt.exam_name || (attempt as any).exam_title || (isIelts ? 'IELTS Academic Test' : 'Standard Exam'),
        status: 'in_progress',
        is_section_based: isIelts || Boolean(attempt.sections && attempt.sections.length > 0),
        timestamp: Date.now(),
      };
      storage.set('@classore_active_attempt', activeRecord).catch(() => {});
      examService.saveRecentAttempt(activeRecord).catch(() => {});
    }
    return response.data;
  },

  autoSave: async (attemptId: number, payload: AutoSavePayload): Promise<{ message: string }> => {
    const response = await api.patch(`/api/user/exam/${attemptId}/auto-save/`, payload);
    return response.data;
  },

  uploadAudio: async (attemptId: number, questionId: number, audioUri: string, mimeType = 'audio/wav'): Promise<{ message: string; response_id: number }> => {
    const formData = new FormData();
    formData.append('question_id', String(questionId));

    const ext = mimeType.includes('m4a') ? 'm4a' : (mimeType.includes('mp3') ? 'mp3' : 'wav');
    const fileName = `collated_speaking_${attemptId}.${ext}`;

    if (Platform.OS === 'web') {
      const audioBlob = await (await fetch(audioUri)).blob();
      formData.append('audio_file', audioBlob, fileName);
    } else {
      formData.append('audio_file', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      } as any);
    }

    const response = await api.post(`/api/user/exam/${attemptId}/upload-audio/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitBulkAudio: async (
    attemptId: number, 
    audioUri: string, 
    metadata: { questionId: number; start: number; end: number }[],
    mimeType = 'audio/wav'
  ): Promise<{ message: string; processed: any[] }> => {
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));

    const ext = mimeType.includes('m4a') ? 'm4a' : (mimeType.includes('mp3') ? 'mp3' : 'wav');
    const fileName = `bulk_speaking_${attemptId}.${ext}`;

    if (Platform.OS === 'web') {
      const audioBlob = await (await fetch(audioUri)).blob();
      formData.append('audio_file', audioBlob, fileName);
    } else {
      formData.append('audio_file', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      } as any);
    }

    const response = await api.post(`/api/user/exam/${attemptId}/submit-bulk-audio/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitExam: async (attemptId: number, payload: SubmitExamPayload): Promise<{ message: string; total_score: number; streak?: number; ai_feedbacks?: any[]; ai_assessment_status?: string; ai_skip_reason?: string; [key: string]: any }> => {
    const response = await api.post(`/api/user/exam/${attemptId}/submit/`, payload);
    examService.clearActiveAttemptId();
    storage.remove('@classore_active_attempt').catch(() => {});
    try {
      const existing = (await storage.get<RecentAttemptRecord[]>('@classore_recent_attempts')) || [];
      const updated = existing.map(item => item.id === attemptId ? { ...item, status: 'completed' as const } : item);
      await storage.set('@classore_recent_attempts', updated);
    } catch (e) {}
    return response.data;
  },

  getLastAttemptDetails: async (examTypeId: number): Promise<any> => {
    const numericId = Number(examTypeId);
    if (!numericId || isNaN(numericId) || numericId <= 0) return null;
    const response = await api.get(`/api/user/exam/last-attempt-details/?exam_type_id=${numericId}`);
    return response.data;
  },

  getDetailedAnalytics: async (attemptId: number): Promise<any> => {
    const response = await api.get(`/api/user/exam/${attemptId}/detailed-analytics/`);
    return response.data;
  },

  getTopicAnalysis: async (attemptId: number): Promise<any> => {
    const response = await api.get(`/api/user/exam/${attemptId}/topic-analysis/`);
    return response.data;
  },

  getGlobalWeakTopics: async (params?: { exam?: string; subject?: string; sort?: string }): Promise<any> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await api.get(`/api/user/exam/weak-topics/?${query}`);
    return response.data;
  },

  getCachedAggregateReportSync: (examType: string = 'Overview', timeframe: string = 'This Week'): any | null => {
    const key = `${(examType || 'all').toLowerCase()}_${(timeframe || 'week').toLowerCase().replace(/\s+/g, '_')}`;
    return memoryCachedAggregateReports[key] || null;
  },

  getCachedAggregateReport: async (examType: string = 'Overview', timeframe: string = 'This Week'): Promise<any | null> => {
    const key = `${(examType || 'all').toLowerCase()}_${(timeframe || 'week').toLowerCase().replace(/\s+/g, '_')}`;
    if (memoryCachedAggregateReports[key]) {
      return memoryCachedAggregateReports[key];
    }
    const storageKey = `@classore_cached_aggregate_report_${key}`;
    const stored = await storage.get<any>(storageKey);
    if (stored) {
      memoryCachedAggregateReports[key] = stored;
      return stored;
    }
    return null;
  },

  getAggregateReport: async (examType: string = 'Overview', timeframe: string = 'This Week'): Promise<any> => {
    const key = `${(examType || 'all').toLowerCase()}_${(timeframe || 'week').toLowerCase().replace(/\s+/g, '_')}`;
    const storageKey = `@classore_cached_aggregate_report_${key}`;
    try {
      const response = await api.get(`/api/user/exam/aggregate-report/?exam_type=${encodeURIComponent(examType)}&timeframe=${encodeURIComponent(timeframe)}`);
      if (response.data) {
        memoryCachedAggregateReports[key] = response.data;
        await storage.set(storageKey, response.data);
      }
      return response.data;
    } catch (error) {
      const cached = await examService.getCachedAggregateReport(examType, timeframe);
      if (cached) {
        console.warn(`[examService] Network failed for ${examType} aggregate report, returning cached version`);
        return cached;
      }
      throw error;
    }
  },

  resumeExam: async (attemptId: number): Promise<UserAttempt & { timer_info: { total_seconds: number; elapsed_seconds: number; remaining_seconds: number; is_expired: boolean } }> => {
    if (attemptId && !isNaN(attemptId) && attemptId > 0) {
      examService.setActiveAttemptId(attemptId);
    }
    const response = await api.get(`/api/user/exam/${attemptId}/resume/`);
    if (response.data && response.data.id) {
      const attempt = response.data;
      const isIelts = attempt.exam_type === 42;
      let totalQ = attempt.total_questions;
      let answeredQ = attempt.answered_questions;
      if ((!totalQ || totalQ <= 0) && Array.isArray(attempt.sections)) {
        let secTotal = 0;
        let secAns = 0;
        attempt.sections.forEach((sec: any) => {
          sec.question_groups?.forEach((grp: any) => {
            secTotal += grp.responses?.length || 0;
            grp.responses?.forEach((r: any) => {
              if (
                (r.selected_choice !== null && r.selected_choice !== undefined) ||
                (typeof r.written_response === 'string' && r.written_response.trim().length > 0) ||
                (r.metadata && Object.keys(r.metadata).length > 0) ||
                r.audio_response
              ) {
                secAns++;
              }
            });
          });
        });
        if (secTotal > 0) {
          totalQ = secTotal;
          if (answeredQ === undefined || answeredQ === null) {
            answeredQ = secAns;
          }
        }
      }

      const activeRecord: RecentAttemptRecord = {
        id: attempt.id,
        exam_type: attempt.exam_type || (isIelts ? 42 : 41),
        title: attempt.exam_name || (attempt as any).exam_title || (isIelts ? 'IELTS Academic Test' : 'Standard Exam'),
        status: 'in_progress',
        is_section_based: isIelts || Boolean(attempt.sections && attempt.sections.length > 0),
        total_questions: totalQ || (isIelts ? 40 : 60),
        answered_questions: answeredQ ?? 0,
        timestamp: Date.now(),
      };
      storage.set('@classore_active_attempt', activeRecord).catch(() => {});
      examService.saveRecentAttempt(activeRecord).catch(() => {});
    }
    return response.data;
  },

  reportIssue: async (
    attemptId: number, 
    data: { question_id?: number; issue_type: string; description: string }
  ): Promise<{ message: string; report_id: number }> => {
    const response = await api.post(`/api/user/exam/${attemptId}/report-issue/`, {
      question: data.question_id,
      issue_type: data.issue_type,
      description: data.description,
    });
    return response.data;
  },

  getCachedSavedQuestions: async (): Promise<any[]> => {
    return (await storage.get<any[]>('@classore_cached_saved_questions')) || [];
  },

  getSavedQuestions: async (params?: { exam_type_id?: number; section_id?: number }): Promise<any[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.exam_type_id && !isNaN(Number(params.exam_type_id))) {
        query.append('exam_type_id', String(Number(params.exam_type_id)));
      }
      if (params?.section_id && !isNaN(Number(params.section_id))) {
        query.append('section_id', String(Number(params.section_id)));
      }
      const response = await api.get(`/api/user/saved-questions/?${query.toString()}`);
      const freshQuestions = response.data.results ? response.data.results : response.data;
      if (Array.isArray(freshQuestions)) {
        await storage.set('@classore_cached_saved_questions', freshQuestions);
      }
      return freshQuestions;
    } catch (error) {
      console.warn('[examService] Network failed for saved questions, returning cached list:', error);
      return await examService.getCachedSavedQuestions();
    }
  },

  saveQuestion: async (questionId: number, notes?: string): Promise<any> => {
    const response = await api.post('/api/user/saved-questions/', { question: questionId, notes });
    // Re-fetch or clear cache to ensure sync
    examService.getSavedQuestions().catch(() => {});
    return response.data;
  },

  removeSavedQuestion: async (questionId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/user/saved-questions/remove-by-question/${questionId}/`);
    // Update local cache
    const current = await examService.getCachedSavedQuestions();
    const updated = current.filter((item: any) => item.question?.id !== questionId && item.question_id !== questionId);
    await storage.set('@classore_cached_saved_questions', updated);
    return response.data;
  },

  getLeaderboard: async (params?: { exam_type_id?: number; period?: string }): Promise<{ leaderboard: any[]; current_user_stats: any }> => {
    const query = new URLSearchParams();
    if (params?.exam_type_id && !isNaN(Number(params.exam_type_id))) {
      query.append('exam_type_id', String(Number(params.exam_type_id)));
    }
    if (params?.period) query.append('period', params.period);
    const response = await api.get(`/api/user/exam/leaderboard/?${query.toString()}`);
    return response.data;
  },

  getAttemptReview: async (attemptId: number): Promise<UserAttempt> => {
    const response = await api.get(`/api/user/exam/${attemptId}/`);
    return response.data;
  },

  explainQuestion: async (attemptId: number, questionId: number): Promise<any> => {
    const response = await api.post(`/api/user/exam/${attemptId}/explain-question/`, { question_id: questionId });
    return response.data;
  },

  explainMistakes: async (attemptId: number): Promise<any> => {
    const response = await api.post(`/api/user/exam/${attemptId}/explain-mistakes/`);
    return response.data;
  },

  createRemedialPractice: async (attemptId: number): Promise<{ message: string; target_topics: string[]; attempt: UserAttempt }> => {
    const response = await api.post(`/api/user/exam/${attemptId}/remedial-practice/`);
    return response.data;
  },

  getShareCard: async (attemptId: number): Promise<any> => {
    const response = await api.get(`/api/user/exam/${attemptId}/share-card/`);
    return response.data;
  },

  getExamHistory: async (params?: { exam_type_id?: number; status?: string; mode?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.exam_type_id && !isNaN(Number(params.exam_type_id))) {
      query.append('exam_type_id', String(Number(params.exam_type_id)));
    }
    if (params?.status) query.append('status', params.status);
    if (params?.mode) query.append('mode', params.mode);
    const response = await api.get(`/api/user/exam/?${query.toString()}`);
    return response.data.results ? response.data.results : response.data;
  },

  getLeadershipProfile: async (userId?: string | number): Promise<any> => {
    try {
      const url = userId ? `/api/user/leadership-profile/${userId}/` : '/api/user/leadership-profile/me/';
      const response = await api.get(url);
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('[examService] Failed to fetch leadership profile:', error);
      return null;
    }
    return null;
  },

  saveRecentAttempt: async (record: RecentAttemptRecord): Promise<void> => {
    try {
      const existing = (await storage.get<RecentAttemptRecord[]>('@classore_recent_attempts')) || [];
      const filtered = existing.filter(a => a.id !== record.id);
      const updated = [record, ...filtered].slice(0, 10);
      await storage.set('@classore_recent_attempts', updated);
    } catch (e) {
      console.warn('Failed to save recent attempt locally:', e);
    }
  },

  getRecentAttempts: async (): Promise<RecentAttemptRecord[]> => {
    try {
      return (await storage.get<RecentAttemptRecord[]>('@classore_recent_attempts')) || [];
    } catch (e) {
      return [];
    }
  },
};
