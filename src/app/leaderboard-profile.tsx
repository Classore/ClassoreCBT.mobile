import React, { useState, useEffect, useCallback } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { examService } from '@/services/exam';
import { handleHelpBack } from '@/utils/helpNavigation';

interface SubjectRankingItem {
  id: string;
  name: string;
  avatarLetter: string;
  avatarBg: string;
  avatarTextColor: string;
  rank: string;
  score: string;
  latest_attempt_id?: number | null;
}

export default function LeaderboardProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ user_id?: string; from?: string }>();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isCurrentUser = profileData?.is_current_user ?? (params.user_id ? String(params.user_id) === String(user?.id) : true);

  const fetchProfileData = useCallback(async () => {
    try {
      const data = await examService.getLeadershipProfile(params.user_id);
      if (data) {
        setProfileData(data);
      }
    } catch (err) {
      console.warn('Could not fetch leaderboard profile data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.user_id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, [fetchProfileData]);

  // Derived user details from live API or context fallback
  const fullName = profileData?.full_name || 
    (isCurrentUser 
      ? ((user?.first_name || user?.last_name) ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (user?.username || 'Student'))
      : 'Learner');

  const email = profileData?.email || (isCurrentUser ? (user?.email || '') : '');
  const phone = profileData?.phone_number || (isCurrentUser ? (user?.phone_number || '') : '');
  const avatarUrl = profileData?.avatar_url || (isCurrentUser ? ((user as any)?.avatar_url || (user as any)?.avatar) : null);
  const isVerified = profileData?.is_verified ?? (isCurrentUser ? ((user as any)?.is_verified ?? true) : false);
  const percentileBadge = profileData?.percentile_badge || (profileData?.overview?.tests_taken > 0 ? 'Top 15%' : 'Learner');

  // Dynamic Header Metrics
  const globalRank = profileData?.global_rank ? `#${Number(profileData.global_rank).toLocaleString()}` : '#--';
  const totalStudents = profileData?.total_students ? `of ${Number(profileData.total_students).toLocaleString()} students` : 'of 0 students';
  const avgScore = profileData?.average_score !== undefined && profileData?.average_score !== null ? String(profileData.average_score) : '0';
  const scorePercentile = profileData?.score_percentile || '--';
  const tokens = profileData?.tokens !== undefined 
    ? Number(profileData.tokens).toLocaleString() 
    : (isCurrentUser ? Number((user as any)?.token_balance || 0).toLocaleString() : '0');
  const tokenPercentile = profileData?.token_percentile || 'Scholar Tier';

  // Overview metrics
  const overviewMetrics = [
    {
      id: 'tests',
      label: 'Tests Taken',
      value: profileData?.overview?.tests_taken !== undefined 
        ? String(profileData.overview.tests_taken) 
        : (isCurrentUser && (user as any)?.tests_taken !== undefined ? String((user as any).tests_taken) : '0'),
      icon: <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#3B82F6" />,
      iconBg: '#EFF6FF',
    },
    {
      id: 'avg_score',
      label: 'Average Score',
      value: profileData?.overview?.average_score_pct !== undefined 
        ? `${profileData.overview.average_score_pct}%` 
        : (isCurrentUser && (user as any)?.average_score !== undefined ? `${(user as any).average_score}%` : '0%'),
      icon: <Feather name="activity" size={20} color="#0284C7" />,
      iconBg: '#E0F2FE',
    },
    {
      id: 'accuracy',
      label: 'Accuracy',
      value: profileData?.overview?.accuracy_pct !== undefined 
        ? `${profileData.overview.accuracy_pct}%` 
        : (isCurrentUser && (user as any)?.accuracy !== undefined ? `${(user as any).accuracy}%` : '0%'),
      icon: <Ionicons name="checkmark-circle-outline" size={22} color="#059669" />,
      iconBg: '#D1FAE5',
    },
    {
      id: 'study_time',
      label: 'Study Time',
      value: profileData?.overview?.study_time_formatted || 
        (isCurrentUser && (user as any)?.study_time_hours !== undefined 
          ? `${(user as any).study_time_hours || 0}h ${(user as any).study_time_minutes || 0}m` 
          : '0m'),
      icon: <Feather name="clock" size={20} color="#E11D48" />,
      iconBg: '#FFE4E6',
    },
  ];

  // Subject Rankings mapping
  const subjectRankings: SubjectRankingItem[] = (profileData?.subject_rankings || []).map((item: any) => ({
    id: String(item.id || item.name),
    name: item.name,
    avatarLetter: item.avatar_letter || (item.name ? item.name[0].toUpperCase() : 'S'),
    avatarBg: item.avatar_bg || '#F3E8FF',
    avatarTextColor: item.avatar_text_color || '#7C3AED',
    rank: item.rank_formatted || (item.rank ? `#${item.rank}` : '#-'),
    score: item.score_formatted || (item.score !== undefined ? `Score: ${item.score}%` : 'Not started'),
    latest_attempt_id: item.latest_attempt_id,
  }));

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIconButton} 
            onPress={() => handleHelpBack(params.from, '/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>

          <AppText style={styles.headerTitle}>Leaderboard Profile</AppText>

          {isCurrentUser ? (
            <TouchableOpacity 
              style={styles.headerIconButton} 
              onPress={() => router.push('/settings' as any)}
              activeOpacity={0.7}
            >
              <Feather name="settings" size={20} color="#111827" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6D28D9" />
            <AppText style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading Profile...</AppText>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6D28D9']} />
            }
          >
            {/* Hero Profile Gradient Card */}
            <LinearGradient
              colors={['#4C1D95', '#581C87', '#6B21A8']}
              style={styles.heroCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Top Row: Avatar & Profile Info + Percentile Badge */}
              <View style={styles.heroProfileRow}>
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Feather name="user" size={32} color="#9CA3AF" />
                    </View>
                  )}
                  {isCurrentUser && (
                    <TouchableOpacity 
                      style={styles.cameraBadge}
                      onPress={() => router.push('/edit-profile' as any)}
                      activeOpacity={0.8}
                    >
                      <Feather name="camera" size={11} color="#6D28D9" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.heroUserInfo}>
                  <View style={styles.nameRow}>
                    <AppText style={styles.userName} numberOfLines={1}>
                      {fullName}
                    </AppText>
                    {isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Feather name="check" size={11} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <AppText style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </AppText>
                  <AppText style={styles.userPhone} numberOfLines={1}>
                    {phone}
                  </AppText>
                </View>

                <View style={styles.percentileBadge}>
                  <AppText style={styles.percentileBadgeText}>{percentileBadge}</AppText>
                </View>
              </View>

              {/* Bottom Row: 3 Key Metrics (Global Rank, Average Score, Token) */}
              <View style={styles.heroMetricsRow}>
                {/* Metric 1 */}
                <View style={styles.heroMetricCol}>
                  <AppText style={styles.heroMetricLabel}>Global Rank</AppText>
                  <AppText style={styles.heroMetricValue}>{globalRank}</AppText>
                  <AppText style={styles.heroMetricSub}>{totalStudents}</AppText>
                </View>

                {/* Metric 2 */}
                <View style={styles.heroMetricCol}>
                  <AppText style={styles.heroMetricLabel}>Average Score</AppText>
                  <AppText style={styles.heroMetricValue}>{avgScore}</AppText>
                  <AppText style={styles.heroMetricSub}>{scorePercentile}</AppText>
                </View>

                {/* Metric 3 */}
                <View style={styles.heroMetricCol}>
                  <AppText style={styles.heroMetricLabel}>Token</AppText>
                  <AppText style={styles.heroMetricValue}>{tokens}</AppText>
                  <AppText style={styles.heroMetricSub}>{tokenPercentile}</AppText>
                </View>
              </View>
            </LinearGradient>

            {/* Overview Section */}
            <View style={styles.sectionHeaderRow}>
              <AppText style={styles.sectionTitle}>Overview</AppText>
            </View>

            <View style={styles.overviewGrid}>
              {overviewMetrics.map((item) => (
                <View key={item.id} style={styles.overviewCard}>
                  <View style={[styles.overviewIconBg, { backgroundColor: item.iconBg }]}>
                    {item.icon}
                  </View>
                  <AppText style={styles.overviewValue}>{item.value}</AppText>
                  <AppText style={styles.overviewLabel}>{item.label}</AppText>
                </View>
              ))}
            </View>

            {/* Subject Rankings Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
              <AppText style={styles.sectionTitle}>Subject Rankings</AppText>
            </View>

            <View style={styles.rankingsCard}>
              {subjectRankings.length === 0 ? (
                <View style={styles.emptyRankingsBox}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={40} color="#9CA3AF" style={{ marginBottom: 8 }} />
                  <AppText style={styles.emptyRankingsTitle}>No Subject Rankings Yet</AppText>
                  <AppText style={styles.emptyRankingsText}>
                    {isCurrentUser
                      ? 'Complete a practice or standard test to start building your subject rankings!'
                      : 'This learner has not taken any subject exams yet.'}
                  </AppText>
                  {isCurrentUser && (
                    <TouchableOpacity
                      style={styles.startExamBtn}
                      activeOpacity={0.8}
                      onPress={() => router.push('/(tabs)' as any)}
                    >
                      <AppText style={styles.startExamBtnText}>Explore Exams</AppText>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                subjectRankings.map((item, index) => {
                  const attemptId = item.latest_attempt_id || profileData?.latest_attempt_id;
                  const targetUrl = attemptId
                    ? `/(exam)/subject-performance?attempt_id=${attemptId}&subject=${encodeURIComponent(item.name)}`
                    : `/(exam)/subject-performance?subject=${encodeURIComponent(item.name)}`;

                  return (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        style={styles.subjectRow}
                        activeOpacity={0.7}
                        onPress={() => router.push(targetUrl as any)}
                      >
                        <View style={styles.subjectLeft}>
                          <View style={[styles.subjectAvatar, { backgroundColor: item.avatarBg }]}>
                            <AppText style={[styles.subjectAvatarText, { color: item.avatarTextColor }]}>
                              {item.avatarLetter}
                            </AppText>
                          </View>
                          <AppText style={styles.subjectName}>{item.name}</AppText>
                        </View>

                        <View style={styles.subjectRight}>
                          <AppText style={styles.subjectRankText}>{item.rank}</AppText>
                          <AppText style={styles.subjectScoreText}>{item.score}</AppText>
                        </View>
                      </TouchableOpacity>
                      {index < subjectRankings.length - 1 && <View style={styles.subjectDivider} />}
                    </React.Fragment>
                  );
                })
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heroUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 12,
    color: '#DDD6FE',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#DDD6FE',
  },
  percentileBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  percentileBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Hero Metrics Row
  heroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroMetricCol: {
    flex: 1,
  },
  heroMetricLabel: {
    fontSize: 11.5,
    color: '#DDD6FE',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroMetricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroMetricSub: {
    fontSize: 10.5,
    color: '#DDD6FE',
    fontWeight: '400',
  },

  // Overview Section
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  overviewValue: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Subject Rankings
  rankingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subjectAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subjectRight: {
    alignItems: 'flex-end',
  },
  subjectRankText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  subjectScoreText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  subjectDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  emptyRankingsBox: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRankingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyRankingsText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  startExamBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 4,
  },
  startExamBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
