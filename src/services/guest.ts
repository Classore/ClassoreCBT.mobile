import { api } from './api';
import { storage } from './storage';

export interface DemoTest {
  id: number;
  title: string;
  time_limit_minutes: number;
  is_active?: boolean;
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

export const guestService = {
  getStoredGuestSessionId: async (): Promise<string | null> => {
    return await storage.get<string>(GUEST_SESSION_KEY);
  },

  setStoredGuestSessionId: async (id: string): Promise<void> => {
    await storage.set(GUEST_SESSION_KEY, id);
  },

  // 1. List Demo Tests
  getDemoTests: async (): Promise<DemoTest[]> => {
    const response = await api.get('/api/user/demo-tests/');
    return response.data?.results ? response.data.results : (Array.isArray(response.data) ? response.data : []);
  },

  // 2. Start Demo Test
  startDemoTest: async (demoId: number): Promise<StartDemoTestResponse> => {
    const response = await api.post(`/api/user/demo-tests/${demoId}/start/`);
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
  getSections: async (examTypeId?: number): Promise<any[]> => {
    const params = examTypeId ? `?exam_type_id=${examTypeId}` : '';
    const response = await api.get(`/api/user/sections/${params}`);
    return response.data?.results ? response.data.results : (Array.isArray(response.data) ? response.data : []);
  },

  // 8. Get Topics for Section (Guest)
  getTopics: async (sectionId: number): Promise<Array<{ topic_tag: string }>> => {
    const response = await api.get(`/api/user/sections/${sectionId}/topics/`);
    return response.data?.results ? response.data.results : (Array.isArray(response.data) ? response.data : []);
  }
};