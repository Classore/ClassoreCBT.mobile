import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { contestService, Contest, ContestStats } from '@/services/contest';
import { useNotifications } from '@/context/NotificationContext';

// Animated Skeleton Card for Contest Lists
function ContestCardsSkeleton({ shimmerAnim }: { shimmerAnim: Animated.Value }) {
  return (
    <Animated.View style={{ opacity: shimmerAnim, gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.contestCard}>
          <View style={styles.cardHeader}>
            <View style={styles.skeletonIconBox} />
            <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
              <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
              <View style={[styles.skeletonLine, { width: '45%', height: 12 }]} />
            </View>
          </View>
          <View style={styles.cardStatsRow}>
            <View style={styles.statCol}>
              <View style={[styles.skeletonLine, { width: 44, height: 10, marginBottom: 6 }]} />
              <View style={[styles.skeletonLine, { width: 55, height: 14 }]} />
            </View>
            <View style={styles.statCol}>
              <View style={[styles.skeletonLine, { width: 50, height: 10, marginBottom: 6 }]} />
              <View style={[styles.skeletonLine, { width: 45, height: 14 }]} />
            </View>
            <View style={styles.statCol}>
              <View style={[styles.skeletonLine, { width: 48, height: 10, marginBottom: 6 }]} />
              <View style={[styles.skeletonLine, { width: 60, height: 14 }]} />
            </View>
          </View>
          <View style={[styles.skeletonLine, { width: '100%', height: 44, borderRadius: 12, marginTop: 4 }]} />
        </View>
      ))}
    </Animated.View>
  );
}

export default function ContestZoneListScreen() {
  const router = useRouter();
  const { hasUnread } = useNotifications();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('upcoming');
  const [contestsCache, setContestsCache] = useState<Record<string, Contest[]>>({});
  const [loadingContests, setLoadingContests] = useState(false);
  const [stats, setStats] = useState<ContestStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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

  const currentKey = activeTab;
  const currentContests = contestsCache[currentKey];

  useEffect(() => {
    let isCancelled = false;
    const cacheKey = activeTab;

    // Check synchronous cache
    if (!contestsCache[cacheKey]) {
      const syncData = contestService.getCachedContestsSync(activeTab);
      if (syncData) {
        setContestsCache((prev) => ({ ...prev, [cacheKey]: syncData }));
      }
    }

    const loadData = async () => {
      const hasContests = !!contestsCache[cacheKey] || !!contestService.getCachedContestsSync(activeTab);
      if (!hasContests) {
        setLoadingContests(true);
      }

      try {
        const [statsRes, contestsRes] = await Promise.allSettled([
          stats ? Promise.resolve(stats) : contestService.getMyStats(),
          contestService.getContests(activeTab),
        ]);

        if (isCancelled) return;

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(statsRes.value);
          setLoadingStats(false);
        }

        if (contestsRes.status === 'fulfilled' && contestsRes.value) {
          setContestsCache((prev) => ({ ...prev, [cacheKey]: contestsRes.value }));
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[ContestZone] Error fetching data:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoadingContests(false);
          setLoadingStats(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Contest Zone</AppText>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color="#111827" />
            {hasUnread && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Rank Card */}
          <LinearGradient
            colors={['#43188F', '#581C87', '#6B21A8']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.rankBadge}>
                <Feather name="bar-chart-2" size={13} color="#FFF" style={{ marginRight: 6 }} />
                <AppText style={styles.rankBadgeText}>Your Rank</AppText>
              </View>

              {loadingStats ? (
                <Animated.View style={[styles.heroStatsRow, { opacity: shimmerAnim }]}>
                  <View>
                    <View style={styles.skeletonRankBar} />
                  </View>

                  <View style={styles.divider} />

                  <View>
                    <View style={styles.heroStatHeader}>
                      <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                      <AppText style={styles.heroStatLabel}>Points</AppText>
                    </View>
                    <View style={styles.skeletonStatBar} />
                  </View>

                  <View style={styles.divider} />

                  <View>
                    <View style={styles.heroStatHeader}>
                      <Feather name="users" size={12} color="#E0E7FF" style={{ marginRight: 4 }} />
                      <AppText style={styles.heroStatLabel}>Contests Joined</AppText>
                    </View>
                    <View style={styles.skeletonStatBar} />
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.heroStatsRow}>
                  <View>
                    <AppText style={styles.rankHugeText}>
                      {stats?.current_rank && stats.current_rank > 0 ? stats.current_rank : '--'}
                      <AppText style={styles.rankSmallText}>
                        {' '}
                        / {stats?.total_participants && stats.total_participants > 0 ? Number(stats.total_participants).toLocaleString() : '--'}
                      </AppText>
                    </AppText>
                  </View>

                  <View style={styles.divider} />

                  <View>
                    <View style={styles.heroStatHeader}>
                      <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                      <AppText style={styles.heroStatLabel}>Points</AppText>
                    </View>
                    <AppText style={styles.heroStatValue}>
                      {stats?.total_score != null ? Number(stats.total_score).toLocaleString() : '0'}
                    </AppText>
                  </View>

                  <View style={styles.divider} />

                  <View>
                    <View style={styles.heroStatHeader}>
                      <Feather name="users" size={12} color="#E0E7FF" style={{ marginRight: 4 }} />
                      <AppText style={styles.heroStatLabel}>Contests Joined</AppText>
                    </View>
                    <AppText style={styles.heroStatValue}>{stats?.contests_joined ?? 0}</AppText>
                  </View>
                </View>
              )}

              <AppText style={styles.heroFooterText}>Keep pushing! You can do it! 💪</AppText>
            </View>

            <View style={styles.heroImageContainer}>
              <Image
                source={require('../../../../assets/images/contest-hero-trophy.png')}
                style={styles.heroImage}
                contentFit="contain"
              />
            </View>
          </LinearGradient>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'live' && styles.activeTab]}
              onPress={() => setActiveTab('live')}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={activeTab === 'live' ? '#6D28D9' : '#9CA3AF'}
                style={{ marginRight: 6 }}
              />
              <AppText style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>
                Live Contests
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Feather
                name="calendar"
                size={16}
                color={activeTab === 'upcoming' ? '#6D28D9' : '#9CA3AF'}
                style={{ marginRight: 6 }}
              />
              <AppText style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                Upcoming
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.activeTab]}
              onPress={() => setActiveTab('past')}
            >
              <Feather
                name="clock"
                size={16}
                color={activeTab === 'past' ? '#6D28D9' : '#9CA3AF'}
                style={{ marginRight: 6 }}
              />
              <AppText style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                Past Contests
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Contest Cards List */}
          <View style={styles.contestList}>
            {!currentContests ? (
              <ContestCardsSkeleton shimmerAnim={shimmerAnim} />
            ) : currentContests.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Feather
                    name={activeTab === 'live' ? 'target' : activeTab === 'upcoming' ? 'calendar' : 'clock'}
                    size={28}
                    color="#6D28D9"
                  />
                </View>
                <AppText style={styles.emptyTitle}>
                  No {activeTab === 'live' ? 'Live' : activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Contests
                </AppText>
                <AppText style={styles.emptySubtitle}>
                  {activeTab === 'live'
                    ? 'There are no active contests running at this moment. Tap Upcoming to see what is scheduled next!'
                    : activeTab === 'upcoming'
                    ? 'New contests will be announced soon. Keep practicing to stay sharp!'
                    : 'You have not participated in any completed contests yet.'}
                </AppText>
              </View>
            ) : (
              currentContests.map((contest, index) => {
                const isFirst = index === 0;
                const isRegistered = Boolean(contest.has_joined);

                return (
                  <View key={contest.id} style={styles.contestCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.iconSquare}>
                        {contest.category === 'English' ? (
                          <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#059669" />
                        ) : (
                          <MaterialCommunityIcons name="atom" size={26} color="#7C3AED" />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <AppText style={styles.cardTitle}>{contest.title}</AppText>
                          {isRegistered && (
                            <View style={styles.registeredBadge}>
                              <AppText style={styles.registeredBadgeText}>Registered</AppText>
                            </View>
                          )}
                        </View>
                        <AppText style={styles.cardSubtitle}>
                          {contest.questions_count ? `${contest.questions_count} Questions • ` : ''}
                          {contest.duration_minutes ? `${contest.duration_minutes} mins • ` : ''}
                          {contest.category || 'General'}
                        </AppText>
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.cardStatsRow}>
                      <View style={styles.statCol}>
                        <View style={styles.statHeader}>
                          <Feather name="clock" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                          <AppText style={styles.statLabel}>Starts in</AppText>
                        </View>
                        <AppText style={styles.statValue}>
                          {contest.starts_in || '--'}
                        </AppText>
                      </View>

                      <View style={styles.statCol}>
                        <View style={styles.statHeader}>
                          <Feather name="users" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                          <AppText style={styles.statLabel}>Registered</AppText>
                        </View>
                        <AppText style={styles.statValue}>
                          {Number(contest.participants_count ?? 0).toLocaleString()}
                        </AppText>
                      </View>

                      <View style={styles.statCol}>
                        <View style={styles.statHeader}>
                          <Ionicons
                            name="gift-outline"
                            size={12}
                            color="#DC2626"
                            style={{ marginRight: 4 }}
                          />
                          <AppText style={styles.statLabel}>
                            {isFirst ? 'Win' : 'Prize Pool'}
                          </AppText>
                        </View>
                        <AppText style={styles.statValue}>
                          {contest.prize_pool || '--'}
                        </AppText>
                      </View>
                    </View>

                    {/* Button */}
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (activeTab === 'past') {
                          router.push({
                            pathname: '/(tabs)/contest/leaderboard',
                            params: { contestId: contest.id },
                          });
                        } else {
                          router.push({
                            pathname: '/(tabs)/contest/details',
                            params: {
                              id: contest.id,
                              registered: isRegistered ? 'true' : 'false',
                            },
                          });
                        }
                      }}
                    >
                      <AppText style={styles.viewDetailsText}>
                        {activeTab === 'past' ? 'View Leaderboard' : 'View Details'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  iconButton: {
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
    fontWeight: '700',
    color: '#111827',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    minHeight: 150,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    paddingRight: 60,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rankHugeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rankSmallText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E0E7FF',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 10,
  },
  heroStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroStatLabel: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '500',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroFooterText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '500',
  },
  heroImageContainer: {
    position: 'absolute',
    right: 4,
    bottom: -4,
    width: 110,
    height: 120,
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6D28D9',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#6D28D9',
  },
  contestList: {
    gap: 16,
  },
  contestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  registeredBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  registeredBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginBottom: 12,
  },
  statCol: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  viewDetailsButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#4C1D95',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  viewDetailsText: {
    color: '#4C1D95',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 40,
    fontSize: 14,
  },
  skeletonRankBar: {
    width: 80,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 4,
  },
  skeletonStatBar: {
    width: 48,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 4,
  },
  skeletonLine: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  skeletonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
});
