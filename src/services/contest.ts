import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contest {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  prize_pool: string;
  entry_fee_tokens: number;
  is_hot: boolean;
  exam_type: number;
  participants_count: number;
  has_joined: boolean;
  user_rank: number | null;
  user_score: number | null;
  status: 'live' | 'upcoming' | 'past';
  // UI extensions matching design specifications
  category?: string;
  duration_minutes?: number;
  questions_count?: number;
  total_marks?: number;
  sponsored_by?: string;
  prize_fund?: string;
  starts_in?: string;
  date_formatted?: string;
  entry_fee_formatted?: string;
  target_audience?: string;
}

export interface ContestStats {
  contests_joined: number;
  total_score: number;
  avg_rank: number;
  current_rank: number;
  total_participants?: number;
}

const REGISTERED_CONTESTS_KEY = '@classore_registered_contests';

const MOCK_CONTESTS: Contest[] = [
  {
    id: 1,
    title: 'Science Genius Contest',
    description: 'Challenge your knowledge and compete with the best minds across the country. Top performers win amazing prizes!',
    category: 'Science',
    target_audience: 'Jambites',
    questions_count: 100,
    duration_minutes: 50,
    total_marks: 100,
    entry_fee_tokens: 12000,
    entry_fee_formatted: '#12,000',
    prize_pool: '₦1,000,000',
    prize_fund: '#300,000',
    sponsored_by: 'Classore',
    participants_count: 1678,
    starts_in: '6d 09h 30m',
    date_formatted: 'Sat, 10th Sept 2026 - 10:00 AM',
    start_time: new Date(Date.now() + 6 * 86400000 + 9 * 3600000 + 30 * 60000).toISOString(),
    end_time: new Date(Date.now() + 6 * 86400000 + 11 * 3600000).toISOString(),
    is_hot: true,
    exam_type: 1,
    has_joined: false,
    user_rank: null,
    user_score: null,
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'English Pro Contest',
    description: 'Master the use of English, grammar, syntax, and vocabulary in this national speed contest.',
    category: 'English',
    target_audience: 'All Students',
    questions_count: 40,
    duration_minutes: 40,
    total_marks: 40,
    entry_fee_tokens: 5000,
    entry_fee_formatted: '#5,000',
    prize_pool: '₦500,000',
    prize_fund: '#150,000',
    sponsored_by: 'Classore',
    participants_count: 2568,
    starts_in: '5d 12h 45m',
    date_formatted: 'Sun, 11th Sept 2026 - 02:00 PM',
    start_time: new Date(Date.now() + 5 * 86400000 + 12 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 5 * 86400000 + 14 * 3600000).toISOString(),
    is_hot: false,
    exam_type: 1,
    has_joined: false,
    user_rank: null,
    user_score: null,
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'JAMB Master Challenge',
    description: 'Comprehensive 4-subject challenge covering Physics, Chemistry, Biology, and English.',
    category: '4 Science Subjects',
    target_audience: 'Jambites',
    questions_count: 200,
    duration_minutes: 40,
    total_marks: 200,
    entry_fee_tokens: 8000,
    entry_fee_formatted: '#8,000',
    prize_pool: '₦500,000',
    prize_fund: '#200,000',
    sponsored_by: 'Classore',
    participants_count: 2568,
    starts_in: '2d 12h 45m',
    date_formatted: 'Fri, 16th Sept 2026 - 11:00 AM',
    start_time: new Date(Date.now() + 2 * 86400000 + 12 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 2 * 86400000 + 15 * 3600000).toISOString(),
    is_hot: true,
    exam_type: 1,
    has_joined: false,
    user_rank: null,
    user_score: null,
    status: 'upcoming',
  },
];

export const contestService = {
  getContests: async (status?: 'live' | 'upcoming' | 'past'): Promise<Contest[]> => {
    try {
      const url = status ? `/api/user/contests/?status=${status}` : '/api/user/contests/';
      const response = await api.get(url);
      const data: Contest[] = response.data.results ? response.data.results : response.data;
      if (Array.isArray(data) && data.length > 0) {
        const storedRegistered = await contestService.getRegisteredContestIds();
        return data.map((c) => ({
          ...c,
          has_joined: storedRegistered.includes(c.id) || c.has_joined,
        }));
      }
    } catch {
      // Fallback to mock data if API is offline
    }

    const storedRegistered = await contestService.getRegisteredContestIds();
    const filtered = status
      ? MOCK_CONTESTS.filter((c) => c.status === status)
      : MOCK_CONTESTS;

    return filtered.map((c) => ({
      ...c,
      has_joined: storedRegistered.includes(c.id) || c.has_joined,
    }));
  },

  getContestById: async (contestId: number | string): Promise<Contest> => {
    const idNum = Number(contestId);
    try {
      const response = await api.get(`/api/user/contests/${idNum}/`);
      if (response.data) {
        const storedRegistered = await contestService.getRegisteredContestIds();
        return {
          ...response.data,
          has_joined: storedRegistered.includes(idNum) || response.data.has_joined,
        };
      }
    } catch {
      // Fallback to mock search
    }

    const storedRegistered = await contestService.getRegisteredContestIds();
    const found = MOCK_CONTESTS.find((c) => c.id === idNum) || MOCK_CONTESTS[0];
    return {
      ...found,
      has_joined: storedRegistered.includes(found.id) || found.has_joined,
    };
  },

  getMyStats: async (): Promise<ContestStats> => {
    try {
      const response = await api.get('/api/user/contests/my-stats/');
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const storedRegistered = await contestService.getRegisteredContestIds();

    return {
      contests_joined: storedRegistered.length,
      total_score: 0,
      avg_rank: 0,
      current_rank: 0,
      total_participants: 0,
    };
  },

  joinContest: async (contestId: number): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/api/user/contests/${contestId}/join/`);
      await contestService.markAsRegistered(contestId);
      return response.data;
    } catch {
      // If mock/demo mode, record registration locally
      await contestService.markAsRegistered(contestId);
      return { message: 'Successfully registered for contest' };
    }
  },

  getLeaderboard: async (contestId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/api/user/contests/${contestId}/leaderboard/`);
      if (response.data && Array.isArray(response.data)) return response.data;
    } catch {
      // Fallback mock leaderboard
    }

    return [
      { rank: 1, name: 'Blessing A.', score: 99, verified: true, is_current_user: false },
      { rank: 2, name: 'Daniel O.', score: 98, verified: true, is_current_user: false },
      { rank: 3, name: 'Victory M.', score: 98, verified: true, is_current_user: false },
      { rank: 4, name: 'Faith N.', score: 93, verified: false, is_current_user: false },
      { rank: 5, name: 'Michael T.', score: 91, verified: false, is_current_user: false },
      { rank: 6, name: 'Precious K.', score: 90, verified: false, is_current_user: false },
      { rank: 7, name: 'Emmanuel B.', score: 90, verified: false, is_current_user: false },
      { rank: 8, name: 'Sarah L.', score: 90, verified: false, is_current_user: false },
    ];
  },

  getRegisteredContestIds: async (): Promise<number[]> => {
    try {
      const val = await AsyncStorage.getItem(REGISTERED_CONTESTS_KEY);
      if (val) return JSON.parse(val);
    } catch {
      // ignore
    }
    return [1]; // By default, Science Genius Contest has registered = true in mock
  },

  markAsRegistered: async (contestId: number): Promise<void> => {
    try {
      const current = await contestService.getRegisteredContestIds();
      if (!current.includes(contestId)) {
        current.push(contestId);
        await AsyncStorage.setItem(REGISTERED_CONTESTS_KEY, JSON.stringify(current));
      }
    } catch {
      // ignore
    }
  },
};
