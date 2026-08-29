import { api } from './api';
import { ExamType } from './exam';

export interface SearchHistoryItem {
  id: number;
  query: string;
  created_at: string;
}

export interface SearchResults {
  exams: ExamType[];
  subjects: string[];
}

export const searchService = {
  getHistory: async (): Promise<SearchHistoryItem[]> => {
    const response = await api.get('/api/user/search/history/');
    return response.data;
  },

  addHistory: async (query: string): Promise<SearchHistoryItem> => {
    const response = await api.post('/api/user/search/history/', { query });
    return response.data;
  },

  deleteHistoryItem: async (id: number): Promise<void> => {
    await api.delete(`/api/user/search/history/${id}/`);
  },

  clearHistory: async (): Promise<void> => {
    await api.delete('/api/user/search/history/clear/');
  },

  search: async (query: string): Promise<SearchResults> => {
    const response = await api.get(`/api/user/search/query/?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};
