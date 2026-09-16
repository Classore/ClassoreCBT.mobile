import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

export default function StreakScreen() {
  const router = useRouter();
  const { user, useStreakProtection } = useAuth();
  
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreakHistory = async () => {
      try {
        const response = await api.get('/api/user/streak/history/');
        setHistoryData(response.data);
      } catch (error) {
        console.warn('Failed to fetch streak history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStreakHistory();
  }, []);

  const [localProtectionCards, setLocalProtectionCards] = useState<number | null>(null);
  const currentStreak = historyData?.streak ?? user?.streak ?? 0;
  const bestStreak = historyData?.best_streak ?? user?.best_streak ?? 0;
  const protectionCards = localProtectionCards ?? historyData?.protection_cards_count ?? user?.protection_cards_count ?? 0;

  const handleUseProtectionCard = async () => {
    const success = await useStreakProtection();
    if (success) {
      setLocalProtectionCards(Math.max(0, protectionCards - 1));
      Alert.alert("Success", "Streak protection activated successfully!");
    } else {
      Alert.alert("Notice", "Could not activate streak protection. Do you have any cards left?");
    }
  };

  // Build calendar logic
  const renderCalendar = () => {
    if (!historyData) return null;
    const { year, month, completed_dates } = historyData;
    
    // JS Date month is 0-indexed
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sun, 1 = Mon...
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Shift so Mon is first day of grid (if desired)
    // 0(Sun) -> 6, 1(Mon) -> 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const todayStr = new Date().toISOString().split('T')[0];

    const grid = [];
    for (let i = 0; i < startOffset; i++) {
      grid.push({ d: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let status = 'missed';
      if (completed_dates.includes(dateStr)) {
        status = 'completed';
      }
      if (dateStr === todayStr && status !== 'completed') {
        status = 'today';
      } else if (dateStr > todayStr) {
        status = 'inactive';
      }
      grid.push({ d, status });
    }

    return grid;
  };

  const calendarDays = renderCalendar();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Streak</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#6D28D9" />
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Gradient Card */}
            <LinearGradient
              colors={['#4C1D95', '#6D28D9', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroTextCol}>
                  <Text style={styles.heroTitle}>You're on fire! 🔥</Text>
                  <Text style={styles.heroSubText}>Practice today to keep it going.</Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <View style={styles.statNumberRow}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={styles.statNumber}>{currentStreak}</Text>
                      </View>
                      <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={styles.statNumberRow}>
                        <Text style={styles.statEmoji}>👑</Text>
                        <Text style={styles.statNumber}>{bestStreak}</Text>
                      </View>
                      <Text style={styles.statLabel}>Best Streak</Text>
                    </View>
                  </View>
                </View>

                {/* 3D Flame Illustration */}
                <View style={styles.candleContainer}>
                  <Image 
                    source={require('../../assets/images/streak-candle-fire.png')} 
                    style={styles.heroFlameImage} 
                    contentFit="contain" 
                  />
                </View>
              </View>
            </LinearGradient>

            {/* This Week Activity */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>This Week</Text>
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>
                    {historyData?.weekly?.filter((w: any) => w.completed).length || 0}/7 Days
                  </Text>
                </View>
              </View>
              <Text style={styles.greenSubText}>Keep up the momentum!</Text>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.daysTimeline}
              >
                {historyData?.weekly?.map((w: any, idx: number) => (
                  <View key={idx} style={styles.dayCol}>
                    <Text style={[styles.dayName, w.is_today && styles.dayNameToday]}>
                      {w.day}
                    </Text>
                    {w.completed ? (
                      <View style={styles.checkCircleGreen}>
                        <Feather name="check" size={16} color="#FFFFFF" />
                      </View>
                    ) : w.is_today ? (
                      <View style={styles.todayFlameCircle}>
                        <Ionicons name="flame" size={14} color="#F97316" />
                      </View>
                    ) : (
                      <View style={[styles.checkCircleGreen, { backgroundColor: '#F1F5F9' }]}>
                        <Feather name="minus" size={16} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.calloutBox}>
                <View style={styles.calloutTextContainer}>
                  <Text style={styles.calloutTitle}>Don't break the chain!</Text>
                  <Text style={styles.calloutSub}>Complete a quiz today to extend your streak.</Text>
                </View>
                <TouchableOpacity 
                  style={styles.practiceNowButton}
                  onPress={() => router.push('/(tabs)')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.practiceNowText}>Practice</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Milestones Horizontal List */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Milestones</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestonesRow}>
                {historyData?.milestones?.map((m: any, idx: number) => {
                  const bg = m.achieved ? '#FEF3C7' : '#F3F4F6';
                  const iconColor = m.achieved ? '#F59E0B' : '#9CA3AF';
                  return (
                    <View key={idx} style={styles.milestoneItem}>
                      <View style={[styles.milestoneCircle, { backgroundColor: bg }]}>
                        <MaterialCommunityIcons name="star-shooting" size={24} color={iconColor} />
                      </View>
                      <Text style={styles.milestoneLabel}>{m.days} Days</Text>
                      <Text style={styles.milestoneStatus}>{m.achieved ? 'Achieved' : 'Locked'}</Text>
                      
                      {m.achieved && (
                        <View style={styles.miniCheckCircle}>
                          <Feather name="check" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  )
                })}
              </ScrollView>
            </View>

            {/* Split Row: Streak Calendar & Streak Protection */}
            <View style={styles.splitRow}>
              
              {/* Left: Streak Calendar */}
              <View style={[styles.card, styles.splitCard]}>
                <Text style={styles.splitCardTitle}>Streak Calendar</Text>
                <Text style={styles.splitCardSub}>{historyData?.current_month || 'Loading'}</Text>

                <View style={styles.calHeaderRow}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <Text key={d} style={styles.calDayHeader}>{d}</Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calGrid}>
                  {calendarDays?.map((c, idx) => {
                    if (!c.d) {
                      return <View key={idx} style={styles.calCellEmpty} />;
                    }

                    let cellStyle = styles.calCellMissed;
                    let textStyle = styles.calTextMissed;

                    if (c.status === 'completed') {
                      cellStyle = styles.calCellCompleted;
                      textStyle = styles.calTextCompleted;
                    } else if (c.status === 'today') {
                      cellStyle = styles.calCellToday;
                      textStyle = styles.calTextToday;
                    } else if (c.status === 'inactive') {
                      cellStyle = styles.calCellInactive;
                      textStyle = styles.calTextInactive;
                    }

                    return (
                      <View key={idx} style={[styles.calCell, cellStyle]}>
                        <Text style={[styles.calDayText, textStyle]}>{c.d}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Calendar Legend */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.legendText}>Completed</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                      <Text style={styles.legendText}>Today</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right: Streak Protection */}
              <View style={[styles.card, styles.splitCard]}>
                <Text style={styles.splitCardTitle}>Streak Protection</Text>
                
                <View style={styles.shieldContainer}>
                  <Image 
                    source={require('../../assets/images/streak-shield-protection.png')} 
                    style={styles.shieldImage} 
                    contentFit="contain" 
                  />
                </View>

                <View style={styles.protectionStatsRow}>
                  <Text style={styles.protectionCardsLabel}>Cards Left:</Text>
                  <Text style={styles.protectionCardsValue}>{protectionCards}</Text>
                </View>

                <Text style={styles.protectionDesc}>
                  Use a card to freeze your streak if you miss a day.
                </Text>

                <TouchableOpacity 
                  style={styles.useCardButton}
                  onPress={handleUseProtectionCard}
                  activeOpacity={0.8}
                >
                  <Text style={styles.useCardButtonText}>Use Card</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Motivation Banner */}
            <View style={styles.rocketCard}>
              <View style={styles.rocketIconWrapper}>
                <Image 
                  source={require('../../assets/images/streak-rocket-jet.png')} 
                  style={styles.rocketImage} 
                  contentFit="contain" 
                />
              </View>
              <View style={styles.rocketTextContainer}>
                <Text style={styles.rocketTitle}>Build a habit!</Text>
                <Text style={styles.rocketSub}>Learners with a 7+ day streak are 3x more likely to pass their exams.</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubText: {
    fontSize: 11.5,
    color: '#DDD6FE',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#DDD6FE',
    fontWeight: '500',
    marginTop: 2,
  },
  candleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  heroFlameImage: {
    width: 85,
    height: 85,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  pillBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  greenSubText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 14,
  },

  daysTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minWidth: '100%',
    gap: 8,
    paddingBottom: 14,
  },
  dayCol: {
    alignItems: 'center',
    width: 44,
  },
  dayName: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 6,
  },
  dayNameToday: {
    color: '#F97316',
    fontWeight: '700',
  },
  checkCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  todayFlameCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  calloutBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  calloutTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  calloutSub: {
    fontSize: 10.5,
    color: '#6B7280',
  },
  practiceNowButton: {
    backgroundColor: '#4C1D95',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  practiceNowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  milestonesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  milestoneItem: {
    alignItems: 'center',
    width: 62,
    position: 'relative',
  },
  milestoneCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  milestoneStatus: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  miniCheckCircle: {
    position: 'absolute',
    bottom: 24,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitCard: {
    flex: 1,
  },
  splitCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  splitCardSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 10,
  },

  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calDayHeader: {
    fontSize: 8.5,
    color: '#9CA3AF',
    fontWeight: '600',
    width: 18,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 3,
  },
  calCell: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1.5,
  },
  calCellEmpty: {
    width: 18,
    height: 18,
    marginVertical: 1.5,
  },
  calCellCompleted: {
    backgroundColor: '#10B981',
  },
  calCellToday: {
    backgroundColor: '#F97316',
  },
  calCellMissed: {
    backgroundColor: '#E2E8F0',
  },
  calCellInactive: {
    backgroundColor: 'transparent',
  },
  calDayText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  calTextCompleted: {
    color: '#FFFFFF',
  },
  calTextToday: {
    color: '#FFFFFF',
  },
  calTextMissed: {
    color: '#475569',
  },
  calTextInactive: {
    color: '#CBD5E1',
  },
  legendContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 8.5,
    color: '#6B7280',
  },

  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  shieldImage: {
    width: 60,
    height: 60,
  },
  protectionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  protectionCardsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  protectionCardsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },
  protectionDesc: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 14,
    marginBottom: 10,
  },
  useCardButton: {
    borderWidth: 1.5,
    borderColor: '#4C1D95',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  useCardButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4C1D95',
  },

  rocketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rocketIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rocketImage: {
    width: 30,
    height: 30,
  },
  rocketTextContainer: {
    flex: 1,
  },
  rocketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  rocketSub: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },
});
