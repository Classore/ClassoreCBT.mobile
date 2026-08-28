import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Dimensions,
  Alert 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

export default function StreakScreen() {
  const router = useRouter();
  const { user, useStreakProtection } = useAuth();
  const currentStreak = user?.streak ?? 120;
  const bestStreak = user?.best_streak ?? 145;
  const protectionCards = user?.protection_cards_count ?? 2;

  const daysRow = [
    { day: 'Mon', date: '13 May', completed: true },
    { day: 'Tue', date: '14 May', completed: true },
    { day: 'Wed', date: '15 May', completed: true },
    { day: 'Thu', date: '16 May', completed: true },
    { day: 'Fri', date: '17 May', completed: true },
    { day: 'Sat', date: '18 May', completed: true },
    { day: 'Sun', date: '19 May', completed: true },
    { day: 'Today', date: '20 May', isToday: true },
  ];

  const milestones = [
    { days: 3, achieved: true, bg: '#FEF3C7', iconColor: '#F59E0B' },
    { days: 7, achieved: true, bg: '#FEE2E2', iconColor: '#EF4444' },
    { days: 14, achieved: false, bg: '#F3F4F6', iconColor: '#9CA3AF' },
    { days: 30, achieved: false, bg: '#F3F4F6', iconColor: '#9CA3AF' },
    { days: 60, achieved: false, bg: '#F3F4F6', iconColor: '#9CA3AF' },
    { days: 100, achieved: false, bg: '#F3F4F6', iconColor: '#9CA3AF' },
  ];

  // Calendar dates for July 2026
  const calendarDays = [
    // Week 1 (Starts Wed)
    { d: null }, { d: null }, { d: 1, status: 'completed' }, { d: 2, status: 'completed' }, { d: 3, status: 'completed' }, { d: 4, status: 'completed' }, { d: 5, status: 'completed' },
    // Week 2
    { d: 6, status: 'completed' }, { d: 7, status: 'completed' }, { d: 8, status: 'completed' }, { d: 9, status: 'completed' }, { d: 10, status: 'missed' }, { d: 11, status: 'missed' }, { d: 12, status: 'completed' },
    // Week 3
    { d: 13, status: 'completed' }, { d: 14, status: 'completed' }, { d: 15, status: 'completed' }, { d: 16, status: 'completed' }, { d: 17, status: 'completed' }, { d: 18, status: 'completed' }, { d: 19, status: 'completed' },
    // Week 4
    { d: 20, status: 'today' }, { d: 21, status: 'inactive' }, { d: 22, status: 'inactive' }, { d: 23, status: 'inactive' }, { d: 24, status: 'inactive' }, { d: 25, status: 'inactive' }, { d: 26, status: 'inactive' },
    // Week 5
    { d: 27, status: 'inactive' }, { d: 28, status: 'inactive' }, { d: 29, status: 'inactive' }, { d: 30, status: 'inactive' }, { d: 31, status: 'inactive' },
  ];

  const handleUseProtection = () => {
    if (protectionCards <= 0) {
      Alert.alert('No Cards', 'You do not have any protection cards remaining.');
      return;
    }
    Alert.alert(
      'Streak Protection',
      `You have ${protectionCards} protection card${protectionCards > 1 ? 's' : ''} available. Use one to freeze today's streak?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Card', 
          onPress: async () => {
            try {
              await useStreakProtection();
              Alert.alert('Protected!', 'Your streak is protected for the day.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to activate protection card.');
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Streak 🔥</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Banner Card */}
          <LinearGradient
            colors={['#4C1D95', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroHeading}>Keep the fire alive!</Text>
              <Text style={styles.heroSubText}>Consistency today, success tomorrow.</Text>

              {/* 3 Stats Row */}
              <View style={styles.statsRow}>
                {/* Current Streak */}
                <View style={styles.statItem}>
                  <View style={styles.statNumberRow}>
                    <Text style={styles.statEmoji}>🔥</Text>
                    <Text style={styles.statNumber}>7</Text>
                  </View>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>

                {/* Best Streak */}
                <View style={styles.statItem}>
                  <View style={styles.statNumberRow}>
                    <Text style={styles.statEmoji}>🏆</Text>
                    <Text style={styles.statNumber}>21</Text>
                  </View>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>

                {/* Days Active */}
                <View style={styles.statItem}>
                  <View style={styles.statNumberRow}>
                    <Text style={styles.statEmoji}>📅</Text>
                    <Text style={styles.statNumber}>28</Text>
                  </View>
                  <Text style={styles.statLabel}>Days Active</Text>
                </View>
              </View>
            </View>

            {/* Right Candle Stand / Flame Illustration */}
            <View style={styles.candleContainer}>
              <View style={styles.candleFlame}>
                <Text style={{ fontSize: 44 }}>🔥</Text>
              </View>
              <View style={styles.candleStand} />
            </View>
          </LinearGradient>

          {/* Card 2: Your Daily Streak */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Your Daily Streak</Text>
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>7 Days in a Row</Text>
              </View>
            </View>

            <Text style={styles.greenSubText}>You're on fire! 🔥</Text>

            {/* 8 Days Timeline */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.daysTimeline}
            >
              {daysRow.map((item, idx) => (
                <View key={idx} style={styles.dayCol}>
                  <Text style={[styles.dayName, item.isToday && styles.dayNameToday]}>
                    {item.day}
                  </Text>
                  
                  {item.completed ? (
                    <View style={styles.checkCircleGreen}>
                      <Feather name="check" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.todayFlameCircle}>
                      <Text style={{ fontSize: 18 }}>🔥</Text>
                    </View>
                  )}

                  <Text style={[styles.dayDate, item.isToday && styles.dayDateToday]}>
                    {item.date}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Motivation Callout Box */}
            <View style={styles.calloutBox}>
              <View style={styles.calloutTextContainer}>
                <Text style={styles.calloutTitle}>⭐ Amazing! You've built a strong habit.</Text>
                <Text style={styles.calloutSub}>Complete today's practice to keep your streak going.</Text>
              </View>
              <TouchableOpacity 
                style={styles.practiceNowButton}
                onPress={() => router.push('/(tabs)/practice')}
                activeOpacity={0.85}
              >
                <Text style={styles.practiceNowText}>Start Practicing</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3: Streak Milestones */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Streak Milestones</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See All ›</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.milestonesRow}
            >
              {milestones.map((m, idx) => (
                <View key={idx} style={styles.milestoneItem}>
                  <View style={[styles.milestoneCircle, { backgroundColor: m.bg }]}>
                    <MaterialCommunityIcons 
                      name="fire" 
                      size={24} 
                      color={m.iconColor} 
                    />
                  </View>
                  <Text style={styles.milestoneLabel}>{m.days} Days</Text>
                  <Text style={styles.milestoneStatus}>
                    {m.achieved ? 'Achieved' : 'Locked'}
                  </Text>
                  {m.achieved && (
                    <View style={styles.miniCheckCircle}>
                      <Feather name="check" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Split Row: Streak Calendar & Streak Protection */}
          <View style={styles.splitRow}>
            
            {/* Left: Streak Calendar */}
            <View style={[styles.card, styles.splitCard]}>
              <Text style={styles.splitCardTitle}>Streak Calendar</Text>
              <Text style={styles.splitCardSub}>July 2026</Text>

              {/* Day Headers */}
              <View style={styles.calHeaderRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <Text key={d} style={styles.calDayHeader}>{d}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calGrid}>
                {calendarDays.map((c, idx) => {
                  if (!c.d) {
                    return <View key={idx} style={styles.calCellEmpty} />;
                  }

                  let cellStyle = styles.calCellDefault;
                  let textStyle = styles.calTextDefault;

                  if (c.status === 'completed') {
                    cellStyle = styles.calCellCompleted;
                    textStyle = styles.calTextCompleted;
                  } else if (c.status === 'today') {
                    cellStyle = styles.calCellToday;
                    textStyle = styles.calTextToday;
                  } else if (c.status === 'missed') {
                    cellStyle = styles.calCellMissed;
                    textStyle = styles.calTextMissed;
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
                <View style={[styles.legendRow, { marginTop: 4 }]}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
                    <Text style={styles.legendText}>Not completed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F8FAFC' }]} />
                    <Text style={styles.legendText}>Inactive</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right: Streak Protection */}
            <View style={[styles.card, styles.splitCard]}>
              <Text style={styles.splitCardTitle}>Streak Protection</Text>
              <Text style={styles.splitCardSub}>Don't lose your streak!</Text>

              {/* 3D Shield Icon Graphic */}
              <View style={styles.shieldContainer}>
                <View style={styles.shieldBg}>
                  <Feather name="shield" size={48} color="#7C3AED" />
                  <View style={styles.shieldCheck}>
                    <Feather name="check" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </View>

              <View style={styles.protectionStatsRow}>
                <Text style={styles.protectionCardsLabel}>Protection Cards</Text>
                <Text style={styles.protectionCardsValue}>{protectionCards}</Text>
              </View>

              <Text style={styles.protectionDesc}>
                Use a protection card to save your streak if you miss a day.
              </Text>

              <TouchableOpacity 
                style={styles.useCardButton}
                onPress={handleUseProtection}
                activeOpacity={0.85}
              >
                <Text style={styles.useCardButtonText}>Use a Card</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Motivation Card */}
          <View style={styles.rocketCard}>
            <View style={styles.rocketIconWrapper}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={26} color="#7C3AED" />
            </View>
            <View style={styles.rocketTextContainer}>
              <Text style={styles.rocketTitle}>You're doing great! 🚀</Text>
              <Text style={styles.rocketSub}>
                You are more consistent than 78% of Classore learners.
              </Text>
            </View>
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
  },
  heroHeading: {
    fontSize: 18,
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
  candleFlame: {
    marginBottom: -8,
    zIndex: 2,
  },
  candleStand: {
    width: 60,
    height: 38,
    backgroundColor: '#5B21B6',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },

  // General Card
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

  // Days Timeline
  daysTimeline: {
    flexDirection: 'row',
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
  dayDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dayDateToday: {
    color: '#F97316',
    fontWeight: '800',
  },

  // Motivation Callout
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

  // Milestones
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

  // Split Row
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

  // Calendar
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

  // Protection Card
  shieldContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  shieldBg: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldCheck: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
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

  // Rocket Motivation Card
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
