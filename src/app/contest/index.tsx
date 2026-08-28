import { AppText } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { contestService, Contest, ContestStats } from '@/services/contest';

export default function ContestZoneScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('live');
  const [contests, setContests] = useState<Contest[]>([]);
  const [loadingContests, setLoadingContests] = useState(false);
  const [stats, setStats] = useState<ContestStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const myStats = await contestService.getMyStats();
        setStats(myStats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchContests = async () => {
      setLoadingContests(true);
      try {
        const data = await contestService.getContests(activeTab);
        setContests(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContests(false);
      }
    };
    fetchContests();
  }, [activeTab]);

  const handleJoinContest = async (contestId: number, fee: number) => {
    Alert.alert(
      "Join Contest",
      `Are you sure you want to join this contest? ${fee > 0 ? `It requires ${fee} tokens.` : 'It is free to join.'}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Join", 
          onPress: async () => {
            try {
              await contestService.joinContest(contestId);
              Alert.alert("Success", "You have joined the contest!");
              // Refresh contests
              const data = await contestService.getContests(activeTab);
              setContests(data);
              const myStats = await contestService.getMyStats();
              setStats(myStats);
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error || "Failed to join contest.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.iconButton}>
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Contest Zone</AppText>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={20} color="#111827" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <LinearGradient colors={['#5b21b6', '#7c3aed']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.heroContent}>
            <View style={styles.rankBadge}>
              <Feather name="bar-chart-2" size={14} color="#FFF" style={{ marginRight: 6 }} />
              <AppText style={styles.rankBadgeText}>Your Rank</AppText>
            </View>
            
            <View style={styles.heroStatsRow}>
              <View>
                {loadingStats ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <AppText style={styles.rankHugeText}>{stats?.current_rank || '--'}<AppText style={styles.rankSmallText}> / avg</AppText></AppText>
                )}
              </View>
              <View style={styles.divider} />
              <View>
                <View style={styles.heroStatHeader}>
                  <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                  <AppText style={styles.heroStatLabel}>Points</AppText>
                </View>
                <AppText style={styles.heroStatValue}>{loadingStats ? '--' : (stats?.total_score || 0)}</AppText>
              </View>
              <View style={styles.divider} />
              <View>
                <View style={styles.heroStatHeader}>
                  <Feather name="users" size={12} color="#E0E7FF" style={{ marginRight: 4 }} />
                  <AppText style={styles.heroStatLabel}>Joined</AppText>
                </View>
                <AppText style={styles.heroStatValue}>{loadingStats ? '--' : (stats?.contests_joined || 0)}</AppText>
              </View>
            </View>

            <AppText style={styles.heroFooterText}>Keep pushing! You can do it! 💪</AppText>
          </View>
          <View style={styles.heroImageContainer}>
            <Image source={require('../../../assets/images/contest-hero-trophy.png')} style={styles.heroImage} contentFit="contain" />
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'live' && styles.activeTab]} onPress={() => setActiveTab('live')}>
            <Feather name="target" size={16} color={activeTab === 'live' ? '#6D28D9' : '#9CA3AF'} style={{ marginRight: 6 }} />
            <AppText style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>Live Contests</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} onPress={() => setActiveTab('upcoming')}>
            <Feather name="calendar" size={16} color={activeTab === 'upcoming' ? '#6D28D9' : '#9CA3AF'} style={{ marginRight: 6 }} />
            <AppText style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'past' && styles.activeTab]} onPress={() => setActiveTab('past')}>
            <Feather name="clock" size={16} color={activeTab === 'past' ? '#6D28D9' : '#9CA3AF'} style={{ marginRight: 6 }} />
            <AppText style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past Contests</AppText>
          </TouchableOpacity>
        </View>

        {/* Live Filter Bar */}
        {activeTab === 'live' && (
          <View style={styles.filterBar}>
            <AppText style={styles.filterText}>Multiple contests are running. Join any and start climbing!</AppText>
            <TouchableOpacity style={styles.filterButton}>
              <Feather name="filter" size={14} color="#374151" style={{ marginRight: 4 }} />
              <AppText style={styles.filterButtonText}>Filter</AppText>
              <Feather name="chevron-down" size={14} color="#374151" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Contest Cards */}
        <View style={styles.contestList}>
          {loadingContests ? (
            <ActivityIndicator size="large" color="#6D28D9" style={{ marginVertical: 40 }} />
          ) : contests.length === 0 ? (
            <AppText style={{ textAlign: 'center', color: '#6B7280', marginVertical: 20 }}>No {activeTab} contests found.</AppText>
          ) : (
            contests.map((contest) => {
              // Parse out simple date displays
              const dateObj = activeTab === 'upcoming' ? new Date(contest.start_time) : new Date(contest.end_time);
              const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <View key={contest.id} style={styles.contestCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIconBg}>
                      <Image source={require('../../../assets/images/contest-list-trophy.png')} style={styles.cardIcon} contentFit="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AppText style={styles.cardTitle}>{contest.title}</AppText>
                        {contest.is_hot && (
                          <View style={styles.hotBadge}>
                            <Ionicons name="flame" size={10} color="#DC2626" />
                            <AppText style={styles.hotBadgeText}>HOT</AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.cardSubtitle}>{contest.description}</AppText>
                    </View>
                  </View>

                  <View style={styles.cardStats}>
                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Feather name={activeTab === 'upcoming' ? "calendar" : "clock"} size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                        <AppText style={styles.statLabel}>{activeTab === 'upcoming' ? 'Starts' : (activeTab === 'past' ? 'Ended' : 'Ends')}</AppText>
                      </View>
                      <AppText style={styles.statValue}>{dateStr}</AppText>
                    </View>
                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Feather name="users" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                        <AppText style={styles.statLabel}>Participants</AppText>
                      </View>
                      <AppText style={styles.statValue}>{contest.participants_count}</AppText>
                    </View>
                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Ionicons name="gift-outline" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                        <AppText style={styles.statLabel}>Prize Pool</AppText>
                      </View>
                      <AppText style={styles.statValue}>{contest.prize_pool || 'N/A'}</AppText>
                    </View>
                  </View>

                  <View style={activeTab === 'live' && !contest.has_joined ? styles.cardActions : {}}>
                    {activeTab === 'live' && !contest.has_joined && (
                      <TouchableOpacity 
                        style={[styles.cardButton, styles.primaryBtn]}
                        onPress={() => handleJoinContest(contest.id, contest.entry_fee_tokens)}
                      >
                        <AppText style={styles.primaryBtnText}>Join{contest.entry_fee_tokens ? ` (${contest.entry_fee_tokens}t)` : ''}</AppText>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={activeTab === 'live' && !contest.has_joined ? [styles.cardButton, styles.secondaryBtn] : styles.fullSecondaryBtn}
                    >
                      <AppText style={styles.secondaryBtnText}>View Leaderboard</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Bottom Split Section */}
        <View style={styles.bottomSplit}>
          {/* Top 3 Column */}
          <View style={styles.top3Card}>
            <View style={styles.top3Header}>
              <AppText style={styles.top3Title}>Top 3 This Week</AppText>
              <TouchableOpacity>
                <AppText style={styles.viewAllText}>View All ›</AppText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.top3List}>
              {[
                { rank: 1, name: 'Blessing A.', pts: '12,450 pts', color: '#F59E0B' },
                { rank: 2, name: 'Daniel O.', pts: '9,870 pts', color: '#9CA3AF' },
                { rank: 3, name: 'Victory M.', pts: '8,610 pts', color: '#D97706' }
              ].map((user) => (
                <View key={user.rank} style={styles.userRow}>
                  <View style={styles.rankIndicator}>
                    <Ionicons name="star" size={10} color={user.color} style={{position: 'absolute', top: -5}} />
                    <View style={[styles.rankCircle, { backgroundColor: user.color }]}>
                      <AppText style={styles.rankCircleText}>{user.rank}</AppText>
                    </View>
                  </View>
                  <View style={styles.avatarCircle}>
                    <Feather name="user" size={14} color="#6B7280" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <AppText style={styles.userName}>{user.name}</AppText>
                    <AppText style={styles.userPts}>{user.pts}</AppText>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.youRow}>
              <View style={[styles.rankCircle, { backgroundColor: '#7C3AED' }]}>
                <AppText style={styles.rankCircleText}>14</AppText>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#4C1D95', marginLeft: 8 }]}>
                <AppText style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>Y</AppText>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <AppText style={styles.youName}>You</AppText>
                <AppText style={styles.youPts}>3,260 pts</AppText>
              </View>
            </View>
          </View>

          {/* How It Works Column */}
          <View style={styles.howItWorksCard}>
            <View style={styles.hiwHeader}>
              <AppText style={styles.hiwTitle}>💡 How It Works</AppText>
            </View>
            
            <View style={styles.hiwList}>
              {['Join any live contest', 'Answer questions to earn points', 'Climb the leaderboard', 'Win amazing prizes!'].map((rule, idx) => (
                <View key={idx} style={styles.hiwRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <AppText style={styles.hiwText}>{rule}</AppText>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.rulesBtn}>
              <AppText style={styles.rulesBtnText}>📄 Contest Rules</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  
  heroCard: { borderRadius: 24, padding: 20, marginBottom: 24, overflow: 'hidden', flexDirection: 'row' },
  heroContent: { flex: 1, zIndex: 2 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 12 },
  rankBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rankHugeText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  rankSmallText: { fontSize: 14, fontWeight: '600', color: '#E0E7FF' },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  heroStatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  heroStatLabel: { color: '#E0E7FF', fontSize: 10, fontWeight: '500' },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  heroFooterText: { color: '#E0E7FF', fontSize: 13 },
  heroImageContainer: { position: 'absolute', right: -10, bottom: -10, width: 120, height: 120, zIndex: 1 },
  heroImage: { width: '100%', height: '100%' },

  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#6D28D9' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#6D28D9' },

  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  filterText: { flex: 1, fontSize: 12, color: '#6B7280', marginRight: 12 },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  filterButtonText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  contestList: { gap: 16, marginBottom: 24 },
  contestCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardIcon: { width: 32, height: 32 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginRight: 8 },
  hotBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  hotBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#DC2626', marginLeft: 2 },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  statValue: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  
  cardActions: { flexDirection: 'row', gap: 12 },
  cardButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { backgroundColor: '#4C1D95' },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#6D28D9' },
  secondaryBtnText: { color: '#6D28D9', fontSize: 14, fontWeight: 'bold' },
  fullSecondaryBtn: { width: '100%', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#6D28D9', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },

  bottomSplit: { flexDirection: 'row', gap: 16 },
  top3Card: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  top3Header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  top3Title: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  viewAllText: { fontSize: 11, color: '#6D28D9', fontWeight: '600' },
  top3List: { gap: 12, marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  rankIndicator: { width: 24, alignItems: 'center', position: 'relative' },
  rankCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankCircleText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 12, fontWeight: '600', color: '#111827' },
  userPts: { fontSize: 11, color: '#6B7280' },
  youRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', padding: 12, borderRadius: 12, marginHorizontal: -4 },
  youName: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  youPts: { fontSize: 11, color: '#6B7280' },

  howItWorksCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  hiwHeader: { marginBottom: 16 },
  hiwTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  hiwList: { gap: 12, marginBottom: 16 },
  hiwRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hiwText: { flex: 1, fontSize: 12, color: '#4B5563', lineHeight: 16 },
  rulesBtn: { width: '100%', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  rulesBtnText: { fontSize: 12, fontWeight: '600', color: '#6D28D9' }
});
