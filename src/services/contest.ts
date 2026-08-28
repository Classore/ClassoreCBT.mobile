import api from './api';

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
}

export interface ContestStats {
  contests_joined: number;
  total_score: number;
  avg_rank: number;
  current_rank: number;
}

export const contestService = {
  getContests: async (status?: 'live' | 'upcoming' | 'past'): Promise<Contest[]> => {
    const url = status ? `/api/user/contests/?status=${status}` : '/api/user/contests/';
    const response = await api.get(url);
    return response.data.results ? response.data.results : response.data;
  },

  getMyStats: async (): Promise<ContestStats> => {
    const response = await api.get('/api/user/contests/my-stats/');
    return response.data;
  },

  joinContest: async (contestId: number): Promise<{ message: string }> => {
    const response = await api.post(`/api/user/contests/${contestId}/join/`);
    return response.data;
  },

  getLeaderboard: async (contestId: number): Promise<any[]> => {
    const response = await api.get(`/api/user/contests/${contestId}/leaderboard/`);
    return response.data;
  },
};
