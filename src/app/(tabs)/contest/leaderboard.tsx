import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { contestService, Contest } from '@/services/contest';
import { useAuth } from '@/context/AuthContext';

export default function ContestLeaderboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contestId?: string; showCelebration?: string }>();
  const { user } = useAuth();

  const [period, setPeriod] = useState<'Overall' | 'This Week' | 'This Month' | 'All Time'>('Overall');
  const [modalVisible, setModalVisible] = useState(params.showCelebration === 'true');
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);

  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.75,
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
    }
  }, [loading, shimmerAnim]);

  useEffect(() => {
    let isMounted = true;
    const fetchContestData = async () => {
      try {
        setLoading(true);
        const contestId = Number(params.contestId || 1);
        const [contestRes, lbRes] = await Promise.all([
          contestService.getContestById(contestId),
          contestService.getLeaderboard(contestId),
        ]);

        if (!isMounted) return;

        if (contestRes) setContest(contestRes);
        if (lbRes && Array.isArray(lbRes)) {
          const mapped = lbRes.map((item: any) => ({
            ...item,
            initial: (item.name ? item.name[0] : 'U').toUpperCase(),
            rowBg: item.rank === 1 ? '#FEF9C3' : item.rank === 2 ? '#F8FAFC' : item.rank === 3 ? '#FFEDD5' : undefined,
            rankBg: item.rank === 1 ? '#F59E0B' : item.rank === 2 ? '#9CA3AF' : item.rank === 3 ? '#EA580C' : undefined,
            avatarBg: item.rank === 1 ? '#D97706' : item.rank === 2 ? '#4B5563' : item.rank === 3 ? '#9A3412' : '#6B7280',
          }));
          setLeaderboardUsers(mapped);
        } else {
          setLeaderboardUsers([]);
        }
      } catch (err) {
        console.warn('Failed to load contest leaderboard:', err);
        if (isMounted) setLeaderboardUsers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContestData();
    return () => {
      isMounted = false;
    };
  }, [params.contestId, period]);

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'Y').toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/contest' as any))}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Contest Leaderboard</AppText>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color="#111827" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Rank Banner */}
          <View style={styles.bannerBox}>
            <View style={styles.bannerLeft}>
              <View style={styles.contestTag}>
                <Feather name="file-text" size={11} color="#6D28D9" style={{ marginRight: 4 }} />
                <AppText style={styles.contestTagText}>{contest?.title || 'Contest Leaderboard'}</AppText>
              </View>
              <AppText style={styles.bannerTitle}>See how you rank</AppText>
              <AppText style={styles.bannerSubtitle}>
                Compare your performance with other learners who have taken this test.
              </AppText>
            </View>

            <View style={styles.bannerTrophyWrapper}>
              <Image
                source={require('../../../../assets/images/contest-hero-trophy.png')}
                style={styles.bannerTrophy}
                contentFit="contain"
              />
            </View>
          </View>

          {/* 3-Column Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <AppText style={styles.statLabel}>Your Rank</AppText>
              {loading ? (
                <Animated.View style={[styles.skeletonStatBar, { opacity: shimmerAnim }]} />
              ) : (
                <AppText style={styles.statValue}>
                  {contest?.user_rank ? (
                    <>
                      {contest.user_rank}{' '}
                      <AppText style={styles.statSubText}>
                        / {(contest.participants_count || leaderboardUsers.length || 1).toLocaleString()}
                      </AppText>
                    </>
                  ) : (
                    '--'
                  )}
                </AppText>
              )}
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <AppText style={styles.statLabel}>Your Score</AppText>
              {loading ? (
                <Animated.View style={[styles.skeletonStatBar, { opacity: shimmerAnim }]} />
              ) : (
                <AppText style={styles.statValue}>
                  {contest?.user_score !== null && contest?.user_score !== undefined ? (
                    <>
                      {contest.user_score}{' '}
                      <AppText style={styles.statSubText}>
                        / {contest.total_marks || 100}
                      </AppText>
                    </>
                  ) : (
                    '--'
                  )}
                </AppText>
              )}
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <AppText style={styles.statLabel}>Percentile</AppText>
              {loading ? (
                <Animated.View style={[styles.skeletonStatBar, { opacity: shimmerAnim }]} />
              ) : (
                <AppText style={[styles.statValue, { color: '#6D28D9' }]}>
                  {contest?.user_rank && contest?.participants_count
                    ? `Top ${Math.max(1, Math.round((contest.user_rank / contest.participants_count) * 100))}%`
                    : '--'}
                </AppText>
              )}
            </View>
          </View>

          {/* Period Filter Tabs */}
          <View style={styles.tabsRow}>
            {(['Overall', 'This Week', 'This Month', 'All Time'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.periodTab, period === tab && styles.periodTabActive]}
                onPress={() => setPeriod(tab)}
              >
                <AppText style={[styles.periodTabText, period === tab && styles.periodTabTextActive]}>
                  {tab}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <AppText style={[styles.tableColTitle, { width: 44 }]}>Rank</AppText>
            <AppText style={[styles.tableColTitle, { flex: 1 }]}>User</AppText>
            <AppText style={[styles.tableColTitle, { textAlign: 'right' }]}>Score (/100)</AppText>
          </View>

          {/* Ranking List */}
          <View style={styles.rankingList}>
            {loading ? (
              <Animated.View style={{ opacity: shimmerAnim }}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <View key={idx} style={styles.skeletonRow}>
                    <View style={styles.skeletonRankCircle} />
                    <View style={styles.skeletonAvatarCircle} />
                    <View style={styles.skeletonUserBar} />
                    <View style={styles.skeletonScoreBar} />
                  </View>
                ))}
              </Animated.View>
            ) : leaderboardUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
                <AppText style={styles.emptyTitle}>No Entries Yet</AppText>
                <AppText style={styles.emptySubtitle}>
                  Be among the first participants to take this contest!
                </AppText>
              </View>
            ) : (
              <>
                {leaderboardUsers.map((item) => (
                  <View
                    key={item.rank}
                    style={[
                      styles.userRow,
                      item.rowBg ? { backgroundColor: item.rowBg, borderRadius: 14 } : null,
                    ]}
                  >
                    <View style={styles.rankCol}>
                      {item.rankBg ? (
                        <View style={[styles.rankCircle, { backgroundColor: item.rankBg }]}>
                          <AppText style={styles.rankCircleText}>{item.rank}</AppText>
                        </View>
                      ) : (
                        <AppText style={styles.rankText}>{item.rank}</AppText>
                      )}
                    </View>

                    <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                      <AppText style={styles.avatarText}>{item.initial}</AppText>
                    </View>

                    <View style={styles.userNameContainer}>
                      <AppText style={styles.userName}>{item.name}</AppText>
                      {item.verified && (
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={14}
                          color="#7C3AED"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>

                    <AppText style={styles.scoreText}>{item.score}</AppText>
                  </View>
                ))}

                {/* "You" row */}
                {contest?.user_rank ? (
                  <>
                    <AppText style={styles.dotsText}>•••</AppText>

                    <View style={styles.youRow}>
                      <View style={styles.rankCol}>
                        <AppText style={[styles.rankText, { color: '#6D28D9' }]}>
                          {contest.user_rank}
                        </AppText>
                      </View>
                      <View style={[styles.avatarCircle, { backgroundColor: '#4C1D95' }]}>
                        <AppText style={styles.avatarText}>{userInitial}</AppText>
                      </View>
                      <View style={styles.userNameContainer}>
                        <AppText style={styles.youName}>
                          {user?.first_name ? `${user.first_name} (You)` : 'You'}
                        </AppText>
                      </View>
                      <AppText style={styles.youScore}>{contest.user_score ?? '--'}</AppText>
                    </View>
                  </>
                ) : null}
              </>
            )}
          </View>

          {/* Encouragement Card */}
          <View style={styles.encouragementCard}>
            <View style={styles.encIconCircle}>
              <Ionicons name="trophy-outline" size={20} color="#6D28D9" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.encTitle}>Keep improving!</AppText>
              <AppText style={styles.encSub}>
                You're in the top 5% of all learners.{'\n'}Consistency is the key to the top! 🚀
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.viewResultBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <AppText style={styles.viewResultText}>View Test Result</AppText>
            </TouchableOpacity>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Congratulations Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* 3D Trophy */}
              <View style={styles.modalTrophyContainer}>
                <Image
                  source={require('../../../../assets/images/contest-hero-trophy.png')}
                  style={styles.modalTrophy}
                  contentFit="contain"
                />
              </View>

              <AppText style={styles.modalTitle}>Congratulations</AppText>
              <AppText style={styles.modalSubtitle}>
                You finished in <AppText style={{ fontWeight: '800', color: '#111827' }}>3rd position!</AppText>
              </AppText>

              {/* 3rd Place Badge Card */}
              <View style={styles.placeCard}>
                <View style={styles.placeBadge}>
                  <AppText style={styles.placeBadgeText}>3</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.placeCardTitle}>3rd Place</AppText>
                  <AppText style={styles.placeCardSub}>Science Genius contest</AppText>
                </View>
              </View>

              {/* Prize Credited Card */}
              <View style={styles.prizeCard}>
                <View style={styles.prizeIconBox}>
                  <Ionicons name="wallet-outline" size={22} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.prizeLabel}>Prize Credited to Wallet</AppText>
                  <AppText style={styles.prizeAmount}>₦300,000</AppText>
                  <AppText style={styles.prizeSub}>Your wallet has been updated successfully.</AppText>
                </View>
              </View>

              {/* 3 Metric Stats */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Ionicons name="trophy-outline" size={18} color="#6D28D9" style={{ marginBottom: 4 }} />
                  <AppText style={styles.metricValue}>85%</AppText>
                  <AppText style={styles.metricLabel}>Your Score</AppText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="clock" size={18} color="#6D28D9" style={{ marginBottom: 4 }} />
                  <AppText style={styles.metricValue}>45 mins</AppText>
                  <AppText style={styles.metricLabel}>Time Taken</AppText>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#6D28D9" style={{ marginBottom: 4 }} />
                  <AppText style={styles.metricValue}>120</AppText>
                  <AppText style={styles.metricLabel}>Total Questions</AppText>
                </View>
              </View>

              <AppText style={styles.congratsBottomNote}>
                Well done! Keep up the great work and aim for the top next time!
              </AppText>

              <TouchableOpacity
                style={styles.modalLeaderboardBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.85}
              >
                <AppText style={styles.modalLeaderboardText}>View Leaderboard</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'android' ? 40 : 12,
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
  bannerBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1,
    zIndex: 2,
    paddingRight: 8,
  },
  contestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  contestTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D28D9',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  bannerTrophyWrapper: {
    width: 80,
    height: 90,
    zIndex: 1,
  },
  bannerTrophy: {
    width: '100%',
    height: '100%',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  periodTab: {
    marginRight: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodTabActive: {
    borderBottomColor: '#6D28D9',
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  periodTabTextActive: {
    color: '#6D28D9',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tableColTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  rankingList: {
    gap: 6,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
  },
  rankCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankCircleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dotsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginVertical: 4,
  },
  youRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  youName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  youScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
  },
  encIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  encTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  encSub: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  viewResultBtn: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  viewResultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    position: 'relative',
    maxWidth: 380,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalTrophyContainer: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  modalTrophy: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  placeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  placeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  placeCardSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  prizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  prizeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prizeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  prizeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginVertical: 1,
  },
  prizeSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  congratsBottomNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  modalLeaderboardBtn: {
    width: '100%',
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLeaderboardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Skeleton Styles
  skeletonStatBar: {
    width: 48,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skeletonRankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  skeletonAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  skeletonUserBar: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginRight: 20,
  },
  skeletonScoreBar: {
    width: 38,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },

  // Empty State Styles
  emptyContainer: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
