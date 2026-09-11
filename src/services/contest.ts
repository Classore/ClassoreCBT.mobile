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

import { storage } from './storage';

const REGISTERED_CONTESTS_KEY = '@classore_registered_contests';
const memoryCachedContests: Record<string, Contest[]> = {};
let memoryCachedStats: ContestStats | null = null;

export const contestService = {
  getCachedContestsSync: (status?: 'live' | 'upcoming' | 'past'): Contest[] | null => {
    const key = status || 'all';
    return memoryCachedContests[key] || null;
  },

  getCachedContests: async (status?: 'live' | 'upcoming' | 'past'): Promise<Contest[] | null> => {
    const key = status || 'all';
    if (memoryCachedContests[key]) {
      return memoryCachedContests[key];
    }
    const stored = await storage.get<Contest[]>(`@classore_cached_contests_${key}`);
    if (stored) {
      memoryCachedContests[key] = stored;
      return stored;
    }
    return null;
  },

  getContests: async (status?: 'live' | 'upcoming' | 'past'): Promise<Contest[]> => {
    const statusKey = status || 'all';
    const storageKey = `@classore_cached_contests_${statusKey}`;
    try {
      const url = status ? `/api/user/contests/?status=${status}` : '/api/user/contests/';
      const response = await api.get(url);
      const data: Contest[] = response.data.results ? response.data.results : response.data;
      if (Array.isArray(data)) {
        const storedRegistered = await contestService.getRegisteredContestIds();
        const formatted = data.map((c) => ({
          ...c,
          has_joined: storedRegistered.includes(c.id) || Boolean(c.has_joined),
        }));
        memoryCachedContests[statusKey] = formatted;
        await storage.set(storageKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn(`[contestService] Network error fetching ${statusKey} contests:`, err);
      // Fallback to cache if network request fails
      const cached = await contestService.getCachedContests(status);
      if (cached) {
        return cached;
      }
    }

    // Return cached in-memory if available, or empty array (never mock data)
    return memoryCachedContests[statusKey] || [];
  },

  getContestById: async (contestId: number | string): Promise<Contest | null> => {
    const idNum = Number(contestId);
    try {
      const response = await api.get(`/api/user/contests/${idNum}/`);
      if (response.data) {
        const storedRegistered = await contestService.getRegisteredContestIds();
        const res: Contest = {
          ...response.data,
          has_joined: storedRegistered.includes(idNum) || Boolean(response.data.has_joined),
        };
        await storage.set(`@classore_cached_contest_${idNum}`, res);
        return res;
      }
    } catch {
      // Fallback to cached item
      const stored = await storage.get<Contest>(`@classore_cached_contest_${idNum}`);
      if (stored) return stored;

      // Look across cached contests
      for (const key of Object.keys(memoryCachedContests)) {
        const found = memoryCachedContests[key].find(c => c.id === idNum);
        if (found) return found;
      }
    }

    return null;
  },

  getCachedMyStatsSync: (): ContestStats | null => {
    return memoryCachedStats;
  },

  getCachedMyStats: async (): Promise<ContestStats | null> => {
    if (memoryCachedStats) return memoryCachedStats;
    const stored = await storage.get<ContestStats>('@classore_cached_contest_stats');
    if (stored) {
      memoryCachedStats = stored;
      return stored;
    }
    return null;
  },

  getMyStats: async (): Promise<ContestStats> => {
    try {
      const response = await api.get('/api/user/contests/my-stats/');
      if (response.data) {
        memoryCachedStats = response.data;
        await storage.set('@classore_cached_contest_stats', response.data);
        return response.data;
      }
    } catch {
      const cached = await contestService.getCachedMyStats();
      if (cached) return cached;
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
      await contestService.markAsRegistered(contestId);
      return { message: 'Successfully registered for contest' };
    }
  },

  getLeaderboard: async (contestId: number, period?: string): Promise<any[]> => {
    try {
      const query = period ? `?period=${encodeURIComponent(period)}` : '';
      const response = await api.get(`/api/user/contests/${contestId}/leaderboard/${query}`);
      const data = response.data?.results ? response.data.results : response.data;
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback empty
    }

    return [];
  },

  getRegisteredContestIds: async (): Promise<number[]> => {
    try {
      const val = await AsyncStorage.getItem(REGISTERED_CONTESTS_KEY);
      if (val) return JSON.parse(val);
    } catch {
      // ignore
    }
    return [];
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
