import { api } from './api';
import { storage } from './storage';
import { ExamSection } from './exam';

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
  type: 'MCQ' | 'TEXT' | 'AUDIO';
  prompt: string;
  options?: string[];
  audio_url?: string | null;
}

export interface StartDemoTestResponse {
  attempt_id: number;
  guest_session_id: string;
  questions: DemoQuestion[];
}

export interface DemoAnswerPayload {
  question_id: number;
  answer: string;
}

export interface SubmitDemoTestResponse {
  attempt_id: number;
  non_ai_score: number;
  total_possible: number;
  ai_locked: boolean;
  message: string;
  preview_ai_assessment?: {
    summary: string;
    locked: boolean;
  };
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
    answers: DemoAnswerPayload[]
  ): Promise<SubmitDemoTestResponse> => {
    const response = await api.post(`/api/user/demo-tests/${attemptId}/submit/`, { answers });
    return response.data;
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