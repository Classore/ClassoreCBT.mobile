import React, { useState, useEffect, useRef } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { handleHelpBack } from '@/utils/helpNavigation';
import {
  achievementService,
  AchievementItem,
  AchievementResponse,
} from '@/services/achievement';

// Animated Skeleton Loader for Achievements
function AchievementsSkeleton({ shimmerAnim }: { shimmerAnim: Animated.Value }) {
  return (
    <Animated.View style={{ opacity: shimmerAnim, gap: 14 }}>
      {/* Hero Skeleton */}
      <View style={styles.heroSkeletonCard}>
        <View style={[styles.skeletonLine, { width: 100, height: 14, backgroundColor: 'rgba(255,255,255,0.25)' }]} />
        <View style={[styles.skeletonLine, { width: 140, height: 26, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 8 }]} />
        <View style={[styles.skeletonLine, { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
      </View>

      {/* Card Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.skeletonIcon} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skeletonLine, { width: '65%', height: 16 }]} />
            <View style={[styles.skeletonLine, { width: '85%', height: 12 }]} />
            <View style={[styles.skeletonLine, { width: '40%', height: 10 }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [data, setData] = useState<AchievementResponse | null>(() =>
    achievementService.getCachedAchievementsSync()
  );
  const [loading, setLoading] = useState<boolean>(!data);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const fetchAchievements = async (isRefresh = false) => {
    if (!data && !isRefresh) {
      setLoading(true);
    }
    try {
      const res = await achievementService.getAchievements();
      setData(res);
    } catch (e) {
      console.error('[AchievementsScreen] Error fetching achievements:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAchievements(true);
  };

  const summary = data?.summary || {
    total: 0,
    unlocked_count: 0,
    in_progress_count: 0,
    completion_percentage: 0,
  };

  const allItems = data?.achievements || [];
  // Deduplicate achievements in case backend returns items with duplicate IDs
  const seenAchievementKeys = new Set<string | number>();
  const uniqueAchievements = allItems.filter((item, index) => {
    const uniqueKey = item.code ? `code_${item.code}` : (item.id ? `id_${item.id}` : `idx_${index}`);
    if (seenAchievementKeys.has(uniqueKey)) return false;
    seenAchievementKeys.add(uniqueKey);
    return true;
  });

  const filteredAchievements = uniqueAchievements.filter((item) => {
    if (activeTab === 'unlocked') return item.unlocked;
    if (activeTab === 'in_progress') return !item.unlocked;
    return true;
  });

  const renderIcon = (item: AchievementItem) => {
    const key = (item.icon_type || item.icon || item.code || '').toLowerCase();
    const isUnlocked = item.unlocked;

    if (key.includes('fire') || key.includes('streak')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? '#FFF7ED' : '#F3F4F6' }]}>
          <Text style={{ fontSize: 24 }}>🔥</Text>
        </View>
      );
    }
    if (key.includes('practice') || key.includes('master') || key.includes('clipboard')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? '#ECFDF5' : '#F3F4F6' }]}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={24}
            color={isUnlocked ? '#10B981' : '#9CA3AF'}
          />
        </View>
      );
    }
    if (key.includes('chart') || key.includes('performer') || key.includes('score')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? '#FEF3C7' : '#F3F4F6' }]}>
          <Feather name="bar-chart-2" size={24} color={isUnlocked ? '#F59E0B' : '#9CA3AF'} />
        </View>
      );
    }
    if (key.includes('trophy') || key.includes('contest') || key.includes('podium') || key.includes('award')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? '#F5F3FF' : '#F3F4F6' }]}>
          <Ionicons name="trophy-outline" size={24} color={isUnlocked ? '#7C3AED' : '#9CA3AF'} />
        </View>
      );
    }
    if (key.includes('bookmark') || key.includes('saved')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? '#EFF6FF' : '#F3F4F6' }]}>
          <Feather name="bookmark" size={22} color={isUnlocked ? '#3B82F6' : '#9CA3AF'} />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { backgroundColor: isUnlocked ? '#EFF6FF' : '#F3F4F6' }]}>
        <Feather name="target" size={24} color={isUnlocked ? '#3B82F6' : '#9CA3AF'} />
      </View>
    );
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6D28D9" />
          }
        >
          {loading && !data ? (
            <AchievementsSkeleton shimmerAnim={shimmerAnim} />
          ) : (
            <>
              {/* Hero Banner Card */}
              <LinearGradient
                colors={['#43188F', '#581C87', '#6B21A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroHeaderRow}>
                  <View style={styles.heroBadge}>
                    <Ionicons name="trophy" size={13} color="#FBBF24" style={{ marginRight: 5 }} />
                    <Text style={styles.heroBadgeText}>Milestones & Badges</Text>
                  </View>
                  <Text style={styles.heroPercentageText}>{summary.completion_percentage}% Done</Text>
                </View>

                <View style={styles.heroMainRow}>
                  <View>
                    <Text style={styles.heroHugeNumber}>
                      {summary.unlocked_count}{' '}
                      <Text style={styles.heroSubNumber}>/ {summary.total}</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>Badges Unlocked</Text>
                  </View>
                </View>

                {/* Progress Bar Track */}
                <View style={styles.heroProgressTrack}>
                  <View
                    style={[
                      styles.heroProgressFill,
                      { width: `${Math.max(4, summary.completion_percentage)}%` },
                    ]}
                  />
                </View>
              </LinearGradient>

              {/* Filter Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('all')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
                    All ({summary.total})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'unlocked' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('unlocked')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'unlocked' && styles.tabButtonTextActive,
                    ]}
                  >
                    Unlocked ({summary.unlocked_count})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === 'in_progress' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('in_progress')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'in_progress' && styles.tabButtonTextActive,
                    ]}
                  >
                    In Progress ({summary.in_progress_count})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Achievements List */}
              {filteredAchievements.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Feather name="award" size={36} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>
                    {activeTab === 'unlocked' ? 'No Badges Unlocked Yet' : 'No Badges Found'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {activeTab === 'unlocked'
                      ? 'Take practice tests and build your study streak to start unlocking your milestone badges!'
                      : 'Keep practicing to unlock all your milestones!'}
                  </Text>
                </View>
              ) : (
                filteredAchievements.map((item, index) => {
                  const isUnlocked = item.unlocked;

                  return (
                    <View
                      key={`achievement_${item.id}_${item.code || index}_${index}`}
                      style={[styles.card, !isUnlocked && styles.cardLocked]}
                    >
                      {renderIcon(item)}

                      <View style={styles.cardContent}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.cardTitle, !isUnlocked && styles.cardTitleLocked]}>
                            {item.title}
                          </Text>
                          {isUnlocked ? (
                            <View style={styles.unlockedBadge}>
                              <Feather name="check" size={11} color="#16A34A" />
                              <Text style={styles.unlockedBadgeText}>UNLOCKED</Text>
                            </View>
                          ) : (
                            <View style={styles.lockedBadge}>
                              <Feather name="lock" size={10} color="#9CA3AF" />
                              <Text style={styles.lockedBadgeText}>LOCKED</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.cardSubtitle}>{item.description}</Text>

                        {isUnlocked ? (
                          <Text style={styles.cardDate}>
                            Earned {item.earned_date ? `on ${item.earned_date}` : 'Recently'}
                          </Text>
                        ) : (
                          <View style={styles.progressContainer}>
                            <View style={styles.progressTextRow}>
                              <Text style={styles.progressLabel}>Progress</Text>
                              <Text style={styles.progressCount}>
                                {item.current_value} / {item.target_value} ({item.progress_percentage}%)
                              </Text>
                            </View>
                            <View style={styles.progressBarTrack}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  { width: `${Math.max(5, item.progress_percentage)}%` },
                                ]}
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>
      </View>
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroPercentageText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroMainRow: {
    marginBottom: 16,
  },
  heroHugeNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSubNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C7D2FE',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    fontWeight: '600',
    marginTop: 2,
  },
  heroProgressTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 4,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#6D28D9',
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
  },
  cardLocked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EDF2F7',
    opacity: 0.9,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    paddingRight: 8,
  },
  cardTitleLocked: {
    color: '#334155',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 3,
  },
  unlockedBadgeText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '800',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 3,
  },
  lockedBadgeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  cardDate: {
    fontSize: 11.5,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 6,
  },

  // In-Progress Bar inside Card
  progressContainer: {
    marginTop: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6D28D9',
    borderRadius: 3,
  },

  // Skeleton
  heroSkeletonCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  skeletonLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    marginRight: 14,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
});
