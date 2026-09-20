import { api } from './api';
import { storage } from './storage';
import { ExamSection, UserAttempt, AttemptSection, QuestionGroupItem } from './exam';

export interface DemoTest {
  id: number;
  title: string;
  time_limit_minutes: number;
  is_active?: boolean;
  exam_type?: number;
  exam_type_name?: string;
  description?: string;
  questions_count?: number;
}

export interface DemoQuestion {
  id: number;
  type?: 'MCQ' | 'TEXT' | 'AUDIO' | 'MATCHING' | 'GAP_FILL';
  question_type?: 'MCQ' | 'TEXT' | 'AUDIO' | 'MATCHING' | 'GAP_FILL';
  prompt?: string;
  text?: string;
  options?: string[];
  choices?: Array<{ id: number; text: string; is_correct?: boolean }>;
  audio_url?: string | null;
  audio_file?: string | null;
  image?: string | null;
  explanation?: string;
  instructions?: string;
  points?: number;
  section_id?: number;
  section_name?: string;
  group?: any;
  metadata?: any;
}

export interface StartDemoTestResponse {
  attempt_id: number;
  guest_session_id: string;
  demo_test_id?: number;
  demo_title?: string;
  exam_type_id?: number;
  exam_type_name?: string;
  time_limit_minutes?: number;
  time_limit_seconds?: number;
  total_questions?: number;
  questions: any[];
}

export interface DemoAnswerPayload {
  question_id: number;
  answer?: string | number;
  choice_id?: number | null;
  written_response?: string | null;
  time_spent_seconds?: number;
  metadata?: any;
}

export interface SubmitDemoTestResponse {
  message?: string;
  attempt_id: number;
  exam_type?: string;
  demo_title?: string;
  non_ai_score?: number;
  total_possible?: number;
  ai_locked?: boolean;
  summary?: {
    non_ai_score: number;
    non_ai_points_possible: number;
    accuracy_percentage: number;
    total_questions: number;
    non_ai_questions_count: number;
    ai_questions_count: number;
  };
  non_ai_results?: any[];
  ai_questions_preview?: {
    locked: boolean;
    total_locked: number;
    unlock_notice: string;
    subscription_url?: string;
    registration_url?: string;
    questions?: any[];
  };
  preview_ai_assessment?: {
    summary: string;
    locked: boolean;
  };
  [key: string]: any;
}

export interface WalletPreviewData {
  packages?: Array<{
    id: number;
    name: string;
    token_amount: number;
    price_naira: number;
    package_type?: string;
  }>;
  earning_rules?: Array<{
    rule_name: string;
    tokens_earned: number;
  }>;
  sample_transactions?: any[];
  [key: string]: any;
}

export interface SearchResultItem {
  type: 'exam' | 'section' | 'topic';
  id: number;
  title: string;
}

const GUEST_SESSION_KEY = '@classore_guest_session_id';
const GUEST_ATTEMPTS_COUNT_KEY = '@classore_guest_attempts_count';
export const MAX_GUEST_TEST_ATTEMPTS = 3;

export const guestService = {
  getStoredGuestSessionId: async (): Promise<string | null> => {
    return await storage.get<string>(GUEST_SESSION_KEY);
  },

  setStoredGuestSessionId: async (id: string): Promise<void> => {
    await storage.set(GUEST_SESSION_KEY, id);
  },

  getGuestAttemptsCount: async (): Promise<number> => {
    const count = await storage.get<number>(GUEST_ATTEMPTS_COUNT_KEY);
    return typeof count === 'number' ? count : 0;
  },

  incrementGuestAttemptsCount: async (): Promise<number> => {
    const current = await guestService.getGuestAttemptsCount();
    const updated = current + 1;
    await storage.set(GUEST_ATTEMPTS_COUNT_KEY, updated);
    return updated;
  },

  hasExceededGuestAttempts: async (): Promise<boolean> => {
    const count = await guestService.getGuestAttemptsCount();
    return count >= MAX_GUEST_TEST_ATTEMPTS;
  },

  resetGuestAttemptsCount: async (): Promise<void> => {
    await storage.remove(GUEST_ATTEMPTS_COUNT_KEY);
  },

  // 1. List Demo Tests
  getDemoTests: async (): Promise<DemoTest[]> => {
    const response = await api.get('/api/user/demo-tests/');
    return response.data?.results ? response.data.results : (Array.isArray(response.data) ? response.data : []);
  },

  // 2. Start Demo Test
  startDemoTest: async (demoId: number): Promise<StartDemoTestResponse> => {
    const existingSessionId = await guestService.getStoredGuestSessionId();
    const response = await api.post(`/api/user/demo-tests/${demoId}/start/`, {
      guest_session_id: existingSessionId || undefined,
    });
    if (response.data?.guest_session_id) {
      await storage.set(GUEST_SESSION_KEY, response.data.guest_session_id);
    }
    return response.data;
  },

  // 3. Submit Demo Test
  submitDemoTest: async (
    attemptId: number,
    payload: { responses?: any[]; answers?: any[] } | any[]
  ): Promise<SubmitDemoTestResponse> => {
    let responses: any[] = [];
    if (Array.isArray(payload)) {
      responses = payload;
    } else if (payload && Array.isArray((payload as any).responses)) {
      responses = (payload as any).responses;
    } else if (payload && Array.isArray((payload as any).answers)) {
      responses = (payload as any).answers.map((a: any) => ({
        question_id: a.question_id,
        choice_id: typeof a.answer === 'number' ? a.answer : a.choice_id,
        written_response: typeof a.answer === 'string' ? a.answer : a.written_response,
        time_spent_seconds: a.time_spent_seconds,
        metadata: a.metadata,
      }));
    }
    const response = await api.post(`/api/user/demo-tests/${attemptId}/submit/`, { responses });
    if (response.data) {
      await guestService.setDemoSubmitResult(attemptId, response.data);
    }
    return response.data;
  },

  // Storage for demo submit result
  setDemoSubmitResult: async (attemptId: number | string, result: any): Promise<void> => {
    await storage.set(`@classore_demo_result_${attemptId}`, result);
  },

  getDemoSubmitResult: async (attemptId: number | string): Promise<any | null> => {
    return await storage.get<any>(`@classore_demo_result_${attemptId}`);
  },

  // 3b. Get Demo Test Review from backend with local fallback
  getDemoTestReview: async (attemptId: number | string): Promise<any> => {
    try {
      const response = await api.get(`/api/user/demo-tests/${attemptId}/review/`);
      if (response.data) {
        await guestService.setDemoSubmitResult(attemptId, response.data);
        return response.data;
      }
    } catch (err) {
      console.warn(`[guestService] Could not fetch demo review from endpoint for attempt ${attemptId}:`, err);
    }
    return await guestService.getDemoSubmitResult(attemptId);
  },

  // 4. Sample AI Assessment
  getSampleAiAssessment: async (): Promise<{ summary: string; locked: boolean }> => {
    const response = await api.get('/api/user/demo-tests/sample-ai-assessment/');
    return response.data;
  },

  // 5. Wallet Preview
  getWalletPreview: async (): Promise<WalletPreviewData> => {
    const response = await api.get('/api/wallet/preview/');
    return response.data;
  },

  // 6. Search
  searchQuery: async (q: string): Promise<SearchResultItem[]> => {
    const response = await api.get(`/api/user/search/query/?q=${encodeURIComponent(q)}`);
    return response.data?.results ? response.data.results : (Array.isArray(response.data) ? response.data : []);
  },

  // 7. Get Sections for Exam (Guest)
  getSections: async (examTypeId?: number): Promise<ExamSection[]> => {
    try {
      const numericId = examTypeId !== undefined ? Number(examTypeId) : undefined;
      const validId = numericId && !isNaN(numericId) && numericId > 0 ? numericId : undefined;
      const params = validId ? `?exam_type_id=${validId}` : '';
      const response = await api.get(`/api/user/sections/${params}`);
      const list = response.data?.results ? response.data.results : (Array.isArray(response.data) ? response.data : []);
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.warn(`[guestService] Failed to fetch guest sections for exam ${examTypeId}:`, error);
      return [];
    }
  },

  // 8. Get Topics for Section (Guest)
  getTopics: async (sectionId: number): Promise<string[]> => {
    try {
      const response = await api.get(`/api/user/sections/${sectionId}/topics/`);
      const raw = response.data?.topics || response.data?.results || response.data || [];
      if (Array.isArray(raw)) {
        return raw.map((item: any) => (typeof item === 'string' ? item : item.topic_tag || item.name || item.title || String(item))).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.warn(`[guestService] Failed to fetch topics for section ${sectionId}:`, error);
      return [];
    }
  }
};

export const buildAttemptFromDemoResponse = (demoRes: any): UserAttempt => {
  const grouped: Record<string, {
    section_id: number;
    section_name: string;
    question_groups: Record<string, QuestionGroupItem>;
  }> = {};

  const questionsList = Array.isArray(demoRes?.questions) ? demoRes.questions : [];

  questionsList.forEach((q: any, idx: number) => {
    const secId = q.section_id || 1;
    const secName = q.section_name || 'General';
    const grpId = q.group?.id || `group-${secId}`;
    const grpTitle = q.group?.title || q.group_title || '';
    const grpType = q.group?.group_type || 'STANDALONE';
    const contextText = q.group?.context_text;
    const contextMedia = q.group?.context_media;

    if (!grouped[secName]) {
      grouped[secName] = {
        section_id: secId,
        section_name: secName,
        question_groups: {},
      };
    }

    if (!grouped[secName].question_groups[grpId]) {
      grouped[secName].question_groups[grpId] = {
        group_id: grpId,
        group_title: grpTitle,
        group_type: grpType,
        context_text: contextText,
        context_media: contextMedia,
        responses: [],
      };
    }

    grouped[secName].question_groups[grpId].responses.push({
      id: q.id || idx + 1,
      question: {
        id: q.id,
        text: q.text || q.prompt || '',
        question_type: q.question_type || q.type || 'MCQ',
        instructions: q.instructions,
        explanation: q.explanation,
        hint_explanation: q.hint_explanation,
        points: q.points || 1,
        choices: (q.choices || []).map((c: any) => ({
          id: c.id,
          text: c.text,
          is_correct: c.is_correct,
        })),
        metadata: q.metadata,
        section_id: secId,
        section_name: secName,
        image: q.image,
        audio_file: q.audio_file || q.audio_url,
      },
      selected_choice: null,
      written_response: null,
      audio_response: null,
      metadata: {},
      is_bookmarked: false,
    });
  });

  const sections: AttemptSection[] = Object.values(grouped).map(sec => ({
    section_id: sec.section_id,
    section_name: sec.section_name,
    question_groups: Object.values(sec.question_groups),
  }));

  return {
    id: demoRes.attempt_id,
    exam_type: demoRes.exam_type_id || 1,
    exam_name: demoRes.exam_type_name || demoRes.demo_title || 'Mock Test',
    exam_title: demoRes.demo_title || demoRes.exam_type_name || 'Mock Test',
    mode: 'Practice',
    time_limit_override: demoRes.time_limit_minutes,
    start_time: new Date().toISOString(),
    status: 'In Progress',
    sections,
  };
};