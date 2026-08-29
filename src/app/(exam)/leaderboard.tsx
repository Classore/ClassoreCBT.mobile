import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatarText?: string;
  avatarBg?: string;
  avatarUrl?: string;
  verified?: boolean;
  score: number;
  isCurrentUser?: boolean;
}

const FALLBACK_DATA: LeaderboardUser[] = [
  { rank: 1, name: 'Blessing A.', avatarText: 'B', avatarBg: '#D97706', verified: true, score: 362 },
  { rank: 2, name: 'Daniel O.', avatarText: 'D', avatarBg: '#2563EB', verified: true, score: 345 },
  { rank: 3, name: 'Victory M.', avatarText: 'V', avatarBg: '#059669', verified: true, score: 338 },
  { rank: 4, name: 'Faith N.', avatarText: 'F', avatarBg: '#7C3AED', score: 325 },
  { rank: 5, name: 'Michael T.', avatarText: 'M', avatarBg: '#4B5563', score: 314 },
  { rank: 6, name: 'Precious K.', avatarText: 'P', avatarBg: '#DB2777', score: 298 },
  { rank: 7, name: 'Emmanuel B.', avatarText: 'E', avatarBg: '#0284C7', score: 285 },
  { rank: 8, name: 'Sarah L.', avatarText: 'S', avatarBg: '#9333EA', score: 274 },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exam_type_id?: string }>();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Overall' | 'This Week' | 'This Month' | 'All Time'>('Overall');
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(FALLBACK_DATA);
  const [currentUserStats, setCurrentUserStats] = useState({
    rank: 42,
    percentile: 'Top 0.02%',
    score: 205,
  });

  const tabs: ('Overall' | 'This Week' | 'This Month' | 'All Time')[] = [
    'Overall',
    'This Week',
    'This Month',
    'All Time'
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await examService.getLeaderboard({
          exam_type_id: params.exam_type_id ? Number(params.exam_type_id) : undefined,
          period: activeTab,
        });

        if (data && data.leaderboard && data.leaderboard.length > 0) {
          const mapped: LeaderboardUser[] = data.leaderboard.map((item: any) => ({
            rank: item.rank,
            name: item.name,
            avatarText: item.avatar_text,
            avatarBg: item.avatar_bg,
            avatarUrl: item.avatar_url,
            verified: item.rank <= 3,
            score: item.score,
            isCurrentUser: item.is_current_user,
          }));
          setLeaderboardUsers(mapped);

          if (data.current_user_stats) {
            setCurrentUserStats({
              rank: data.current_user_stats.rank || 1,
              percentile: data.current_user_stats.percentile || 'Top 5%',
              score: data.current_user_stats.score || 0,
            });
          }
        }
      } catch (err) {
        console.warn('Leaderboard API failed, using mock data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, params.exam_type_id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.replace('/(tabs)/practice')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>JAMB Leaderboard</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <Feather name="bell" size={20} color="#111827" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Banner Card */}
          <LinearGradient
            colors={['#F5F3FF', '#EDE9FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroLeft}>
              <View style={styles.testTypeBadge}>
                <Feather name="file-text" size={13} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={styles.testTypeBadgeText}>Standard JAMB Test</Text>
              </View>
              <Text style={styles.heroTitle}>See how you rank</Text>
              <Text style={styles.heroSubtitle}>
                Compare your performance with other learners who have taken this test.
              </Text>
            </View>
            <View style={styles.heroRight}>
              <Image 
                source={require('../../../assets/images/contest-trophy.png')} 
                style={styles.trophyImage} 
                contentFit="contain" 
              />
            </View>
          </LinearGradient>

          {/* User Stat Triad Card */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Your Rank</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValueMain}>{currentUserStats.rank}</Text>
                <Text style={styles.statValueSub}> / {leaderboardUsers.length}</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Your Score</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValueMain}>{currentUserStats.score}</Text>
                <Text style={styles.statValueSub}> / 400</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Percentile</Text>
              <Text style={styles.percentileValue}>{currentUserStats.percentile}</Text>
            </View>
          </View>

          {/* Timeframe Switcher Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Leaderboard Table */}
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderRank}>Rank</Text>
              <Text style={styles.tableHeaderUser}>User</Text>
              <Text style={styles.tableHeaderScore}>Score (/400)</Text>
            </View>

            {/* Top 3 & Regular Rows */}
            {leaderboardUsers.map((item) => {
              if (item.rank === 1) {
                return (
                  <View key={item.rank} style={styles.topCard1}>
                    <View style={styles.rank1Badge}>
                      <Text style={styles.rankBadgeText}>1</Text>
                    </View>
                    <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                      <Text style={styles.avatarText}>{item.avatarText}</Text>
                    </View>
                    <View style={styles.userNameContainer}>
                      <Text style={styles.userNameText}>{item.name}</Text>
                      {item.verified && (
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#7C3AED" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={styles.scoreText}>{item.score}</Text>
                  </View>
                );
              }

              if (item.rank === 2) {
                return (
                  <View key={item.rank} style={styles.topCard2}>
                    <View style={styles.rank2Badge}>
                      <Text style={styles.rankBadgeText}>2</Text>
                    </View>
                    <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                      <Text style={styles.avatarText}>{item.avatarText}</Text>
                    </View>
                    <View style={styles.userNameContainer}>
                      <Text style={styles.userNameText}>{item.name}</Text>
                      {item.verified && (
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#7C3AED" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={styles.scoreText}>{item.score}</Text>
                  </View>
                );
              }

              if (item.rank === 3) {
                return (
                  <View key={item.rank} style={styles.topCard3}>
                    <View style={styles.rank3Badge}>
                      <Text style={styles.rankBadgeText}>3</Text>
                    </View>
                    <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                      <Text style={styles.avatarText}>{item.avatarText}</Text>
                    </View>
                    <View style={styles.userNameContainer}>
                      <Text style={styles.userNameText}>{item.name}</Text>
                      {item.verified && (
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#7C3AED" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={styles.scoreText}>{item.score}</Text>
                  </View>
                );
              }

              return (
                <View key={item.rank} style={styles.regularRow}>
                  <Text style={styles.regularRankText}>{item.rank}</Text>
                  <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                    <Text style={styles.avatarText}>{item.avatarText}</Text>
                  </View>
                  <View style={styles.userNameContainer}>
                    <Text style={styles.regularUserNameText}>{item.name}</Text>
                  </View>
                  <Text style={styles.regularScoreText}>{item.score}</Text>
                </View>
              );
            })}

            {/* Ellipsis */}
            <View style={styles.ellipsisContainer}>
              <Text style={styles.ellipsisText}>•••</Text>
            </View>

            {/* Current User Card */}
            <View style={styles.currentUserCard}>
              <Text style={styles.currentUserRank}>142</Text>
              <View style={[styles.avatarCircle, { backgroundColor: '#4C1D95' }]}>
                <Text style={styles.avatarText}>Y</Text>
              </View>
              <View style={styles.userNameContainer}>
                <Text style={styles.currentUserNameText}>You</Text>
              </View>
              <Text style={styles.currentUserScore}>278</Text>
            </View>
          </View>

          {/* Bottom Motivation Card */}
          <View style={styles.motivationCard}>
            <View style={styles.motivationIconWrapper}>
              <Ionicons name="trophy" size={26} color="#7C3AED" />
            </View>
            <View style={styles.motivationTextContainer}>
              <Text style={styles.motivationTitle}>Keep improving!</Text>
              <Text style={styles.motivationSub}>
                You're in the top 5% of all learners. Consistency is the key to the top! 🚀
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewResultButton}
              onPress={() => router.replace('/(tabs)/reports')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewResultText}>View Test Result</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
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
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Hero Card
  heroCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  testTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  testTypeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  heroRight: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyImage: {
    width: 95,
    height: 95,
  },

  // Stats Triad Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValueMain: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  statValueSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  percentileValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7C3AED',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3F4F6',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },

  // Leaderboard Table
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 10,
  },
  tableHeaderRank: {
    width: 44,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tableHeaderUser: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tableHeaderScore: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'right',
  },

  // Rank Rows
  topCard1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rank1Badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAB308',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topCard2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rank2Badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topCard3: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rank3Badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Regular Rows
  regularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  regularRankText: {
    width: 24,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginRight: 10,
  },
  regularUserNameText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  regularScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  // Ellipsis
  ellipsisContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ellipsisText: {
    fontSize: 16,
    color: '#9CA3AF',
    letterSpacing: 2,
  },

  // Current User Card
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  currentUserRank: {
    width: 28,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#7C3AED',
    marginRight: 6,
  },
  currentUserNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  currentUserScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Motivation Card
  motivationCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  motivationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  motivationTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  motivationTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  motivationSub: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  viewResultButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
  },
  viewResultText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
