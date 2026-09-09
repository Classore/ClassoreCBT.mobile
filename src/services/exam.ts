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
  if (
    nameLower.includes('ielts') ||
    nameLower.includes('toefl') ||
    nameLower.includes('pte') ||
    nameLower.includes('duolingo') ||
    nameLower.includes('english')
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
  image?: string | null;
  order?: number;
}

export interface QuestionData {
  id: number;
  text: string;
  instructions?: string;
  question_type: 'MCQ' | 'TEXT' | 'AUDIO' | 'MATCHING' | 'GAP_FILL' | 'LABELING';
  choices?: ChoiceItem[];
  points?: number;
  prep_time_seconds?: number;
  recording_time_seconds?: number;
  metadata?: Record<string, any>;
  section_id?: number;
  section_name?: string;
}

export interface UserResponseItem {
  id: number;
  selected_choice?: number | null;
  written_response?: string | null;
  audio_response?: string | null;
  score_awarded?: number;
  ai_feedback?: string | null;
  time_spent_seconds?: number;
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
  mode: 'Standard' | 'Practice';
  time_limit_override?: number | null;
  start_time: string;
  end_time?: string | null;
  total_score?: number | null;
  status: string;
  sections: AttemptSection[];
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
      }
      return freshExams;
    } catch (error) {
      // Fallback to cache if network request fails
      const cached = await examService.getCachedExams();
      if (cached && cached.length > 0) {
        console.warn('[examService] Network failed, falling back to cached exams');
        return cached;
      }
      throw error;
    }
  },

  getCachedSectionsSync: (examTypeId: number): ExamSection[] | null => {
    return memoryCachedSections[examTypeId] || null;
  },

  getCachedSections: async (examTypeId: number): Promise<ExamSection[] | null> => {
    if (memoryCachedSections[examTypeId] && memoryCachedSections[examTypeId].length > 0) {
      return memoryCachedSections[examTypeId];
    }
    const stored = await storage.get<ExamSection[]>(`${SECTIONS_CACHE_KEY_PREFIX}${examTypeId}`);
    if (stored && stored.length > 0) {
      memoryCachedSections[examTypeId] = stored;
      return stored;
    }
    return null;
  },

  getSections: async (examTypeId: number, options?: { forceRefresh?: boolean }): Promise<ExamSection[]> => {
    try {
      const response = await api.get(`/api/admin/sections/?exam_type_id=${examTypeId}&is_published=true`);
      const freshSections: ExamSection[] = response.data.results ? response.data.results : response.data;
      if (Array.isArray(freshSections) && freshSections.length > 0) {
        memoryCachedSections[examTypeId] = freshSections;
        await storage.set(`${SECTIONS_CACHE_KEY_PREFIX}${examTypeId}`, freshSections);
      }
      return freshSections;
    } catch (error) {
      const cached = await examService.getCachedSections(examTypeId);
      if (cached && cached.length > 0) {
        console.warn(`[examService] Network failed, falling back to cached sections for exam ${examTypeId}`);
        return cached;
      }
      throw error;
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

  startExam: async (payload: ExamStartRequest): Promise<UserAttempt> => {
    const response = await api.post('/api/user/exam/start/', payload);
    return response.data;
  },

  autoSave: async (attemptId: number, payload: AutoSavePayload): Promise<{ message: string }> => {
    const response = await api.patch(`/api/user/exam/${attemptId}/auto-save/`, payload);
    return response.data;
  },

  uploadAudio: async (attemptId: number, questionId: number, audioUri: string, mimeType = 'audio/wav'): Promise<{ message: string; response_id: number }> => {
    const formData = new FormData();
    formData.append('question_id', String(questionId));

    if (Platform.OS === 'web') {
      const audioBlob = await (await fetch(audioUri)).blob();
      formData.append('audio_file', audioBlob, 'response.wav');
    } else {
      formData.append('audio_file', {
        uri: audioUri,
        type: mimeType,
        name: 'response.wav',
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

    if (Platform.OS === 'web') {
      const audioBlob = await (await fetch(audioUri)).blob();
      formData.append('audio_file', audioBlob, 'bulk_speaking.wav');
    } else {
      formData.append('audio_file', {
        uri: audioUri,
        type: mimeType,
        name: 'bulk_speaking.wav',
      } as any);
    }

    const response = await api.post(`/api/user/exam/${attemptId}/submit-bulk-audio/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitExam: async (attemptId: number, payload: SubmitExamPayload): Promise<{ message: string; total_score: number }> => {
    const response = await api.post(`/api/user/exam/${attemptId}/submit/`, payload);
    return response.data;
  },

  getLastAttemptDetails: async (examTypeId: number): Promise<any> => {
    const response = await api.get(`/api/user/exam/last-attempt-details/?exam_type_id=${examTypeId}`);
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

  getAggregateReport: async (examType: string, timeframe: string): Promise<any> => {
    const response = await api.get(`/api/user/exam/aggregate-report/?exam_type=${encodeURIComponent(examType)}&timeframe=${encodeURIComponent(timeframe)}`);
    return response.data;
  },

  resumeExam: async (attemptId: number): Promise<UserAttempt & { timer_info: { total_seconds: number; elapsed_seconds: number; remaining_seconds: number; is_expired: boolean } }> => {
    const response = await api.get(`/api/user/exam/${attemptId}/resume/`);
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

  getSavedQuestions: async (params?: { exam_type_id?: number; section_id?: number }): Promise<any[]> => {
    const query = new URLSearchParams();
    if (params?.exam_type_id) query.append('exam_type_id', String(params.exam_type_id));
    if (params?.section_id) query.append('section_id', String(params.section_id));
    const response = await api.get(`/api/user/saved-questions/?${query.toString()}`);
    return response.data.results ? response.data.results : response.data;
  },

  saveQuestion: async (questionId: number, notes?: string): Promise<any> => {
    const response = await api.post('/api/user/saved-questions/', { question: questionId, notes });
    return response.data;
  },

  removeSavedQuestion: async (questionId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/user/saved-questions/remove-by-question/${questionId}/`);
    return response.data;
  },

  getLeaderboard: async (params?: { exam_type_id?: number; period?: string }): Promise<{ leaderboard: any[]; current_user_stats: any }> => {
    const query = new URLSearchParams();
    if (params?.exam_type_id) query.append('exam_type_id', String(params.exam_type_id));
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
    if (params?.exam_type_id) query.append('exam_type_id', String(params.exam_type_id));
    if (params?.status) query.append('status', params.status);
    if (params?.mode) query.append('mode', params.mode);
    const response = await api.get(`/api/user/exam/?${query.toString()}`);
    return response.data.results ? response.data.results : response.data;
  },
};
