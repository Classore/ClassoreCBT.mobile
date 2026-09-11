import { api } from './api';
import { storage } from './storage';

export interface AchievementItem {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  icon_type?: string;
  unlocked: boolean;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  earned_date?: string | null;
}

export interface AchievementSummary {
  total: number;
  unlocked_count: number;
  in_progress_count: number;
  completion_percentage: number;
}

export interface AchievementResponse {
  summary: AchievementSummary;
  achievements: AchievementItem[];
}

const ACHIEVEMENTS_STORAGE_KEY = '@classore_cached_achievements';
let memoryCachedAchievements: AchievementResponse | null = null;

export const achievementService = {
  getCachedAchievementsSync: (): AchievementResponse | null => {
    return memoryCachedAchievements;
  },

  getCachedAchievements: async (): Promise<AchievementResponse | null> => {
    if (memoryCachedAchievements) return memoryCachedAchievements;
    const stored = await storage.get<AchievementResponse>(ACHIEVEMENTS_STORAGE_KEY);
    if (stored) {
      memoryCachedAchievements = stored;
      return stored;
    }
    return null;
  },

  getAchievements: async (): Promise<AchievementResponse> => {
    try {
      const response = await api.get('/api/user/gamification/achievements/');
      const data = response.data;

      let normalized: AchievementResponse;

      if (data && Array.isArray(data.achievements)) {
        normalized = {
          summary: data.summary || {
            total: data.achievements.length,
            unlocked_count: data.achievements.filter((a: any) => a.unlocked).length,
            in_progress_count: data.achievements.filter((a: any) => !a.unlocked).length,
            completion_percentage: Math.round(
              (data.achievements.filter((a: any) => a.unlocked).length / (data.achievements.length || 1)) * 100
            ),
          },
          achievements: data.achievements,
        };
      } else if (Array.isArray(data)) {
        // Fallback for flat array responses
        const unlockedCount = data.length;
        normalized = {
          summary: {
            total: data.length,
            unlocked_count: unlockedCount,
            in_progress_count: 0,
            completion_percentage: 100,
          },
          achievements: data.map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            code: item.code || `ach_${idx + 1}`,
            title: item.title,
            description: item.description,
            category: item.category || 'General',
            icon: item.icon,
            icon_type: item.icon_type,
            unlocked: true,
            current_value: 1,
            target_value: 1,
            progress_percentage: 100,
            earned_date: item.earned_date,
          })),
        };
      } else {
        normalized = {
          summary: { total: 0, unlocked_count: 0, in_progress_count: 0, completion_percentage: 0 },
          achievements: [],
        };
      }

      memoryCachedAchievements = normalized;
      await storage.set(ACHIEVEMENTS_STORAGE_KEY, normalized);
      return normalized;
    } catch (error) {
      console.warn('[achievementService] Network failed, falling back to cache:', error);
      const cached = await achievementService.getCachedAchievements();
      if (cached) return cached;
      throw error;
    }
  },
};
