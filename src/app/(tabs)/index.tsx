import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  
  // Dummy data
  const userName = "Daniel";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName} 👋</Text>
            <Text style={styles.subGreeting}>Let's achieve greatness today.</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <SymbolView name="trophy.fill" size={20} tintColor="#F59E0B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <SymbolView name="bell" size={20} tintColor="#4B5563" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Banner */}
        <LinearGradient 
          colors={['#ffffff', '#f3f4f6']} 
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Ace Every Exam. Unlock <Text style={styles.heroHighlight}>Your Future.</Text></Text>
            <Text style={styles.heroSubtitle}>Smart practice, expert feedback, and real exam experience — all in one place.</Text>
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => router.push('/(tabs)/practice')}
            >
              <Text style={styles.heroButtonText}>Start Test</Text>
              <SymbolView name="arrow.right" size={16} tintColor="#FFF" />
            </TouchableOpacity>
          </View>
          {/* Illustration placeholder */}
          <View style={styles.heroImagePlaceholder}>
            <SymbolView name="book.closed.fill" size={60} tintColor="#8B5CF6" />
          </View>
        </LinearGradient>

        {/* Search Bar (Navigates to Explore) */}
        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <SymbolView name="magnifyingglass" size={20} tintColor="#9CA3AF" />
          <Text style={styles.searchText}>What do you want to practice today?</Text>
          <SymbolView name="line.3.horizontal.decrease" size={20} tintColor="#9CA3AF" style={styles.filterIcon} />
        </TouchableOpacity>

        {/* Exam Cards (Horizontal Scroll) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examScroll}>
          <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.examCard}>
            <View style={styles.examIconContainer}>
              <SymbolView name="graduationcap.fill" size={24} tintColor="#FFF" />
            </View>
            <Text style={styles.examTitle}>JAMB</Text>
            <Text style={styles.examSubtitle}>UTME Practice</Text>
            <Text style={styles.examDesc}>All subjects | Past questions{'\n'}Mock tests | Performance</Text>
            <TouchableOpacity style={styles.examButton}>
              <Text style={styles.examButtonText}>Explore JAMB</Text>
              <SymbolView name="arrow.right" size={12} tintColor="#1D4ED8" />
            </TouchableOpacity>
          </LinearGradient>
          
          <LinearGradient colors={['#8B5CF6', '#5B21B6']} style={styles.examCard}>
            <View style={styles.examIconContainer}>
              <SymbolView name="headphones" size={24} tintColor="#FFF" />
            </View>
            <Text style={styles.examTitle}>IELTS</Text>
            <Text style={styles.examSubtitle}>English Test</Text>
            <Text style={styles.examDesc}>Listening • Reading{'\n'}Writing • Speaking</Text>
            <TouchableOpacity style={styles.examButton}>
              <Text style={styles.examButtonText}>Explore IELTS</Text>
              <SymbolView name="arrow.right" size={12} tintColor="#5B21B6" />
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>

        {/* Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
          {[
            { id: 1, name: 'Mock Tests', icon: 'doc.text.fill', color: '#10B981', bg: '#D1FAE5' },
            { id: 2, name: 'Study Room', icon: 'square.stack.3d.up.fill', color: '#F97316', bg: '#FFEDD5' },
            { id: 3, name: 'Weak Areas', icon: 'target', color: '#3B82F6', bg: '#DBEAFE' },
            { id: 4, name: 'Achievements', icon: 'rosette', color: '#E11D48', bg: '#FFE4E6' },
            { id: 5, name: 'Wallet', icon: 'creditcard.fill', color: '#8B5CF6', bg: '#EDE9FE' },
            { id: 6, name: 'Refer & Earn', icon: 'gift.fill', color: '#F59E0B', bg: '#FEF3C7' },
          ].map(action => (
            <TouchableOpacity key={action.id} style={styles.actionItem}>
              <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                <SymbolView name={action.icon as any} size={24} tintColor={action.color} />
              </View>
              <Text style={styles.actionText}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contest Zone */}
        <View style={styles.contestCard}>
          <View style={styles.contestHeader}>
            <View>
              <View style={styles.contestTag}>
                <SymbolView name="star.fill" size={10} tintColor="#8B5CF6" />
                <Text style={styles.contestTagText}>Contest Zone</Text>
              </View>
              <Text style={styles.contestTitle}>Compete. Rank. Win!</Text>
              <Text style={styles.contestSubtitle}>Join weekly contests and climb{'\n'}the leaderboard.</Text>
              <TouchableOpacity style={styles.contestButton}>
                <Text style={styles.contestButtonText}>View Contests</Text>
                <SymbolView name="arrow.right" size={12} tintColor="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.contestLeaderboard}>
              <Text style={styles.leaderboardTitle}>This Week's Top 3</Text>
              {['Blessing A.', 'Daniel O.', 'Victory M.'].map((name, i) => (
                <View key={i} style={styles.leaderboardRow}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : '#D97706' }]}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.leaderboardName}>{name}</Text>
                  <Text style={styles.leaderboardScore}>{(12450 - i * 2000).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.contestFooter}>
            <View style={styles.contestStat}>
              <SymbolView name="clock" size={14} tintColor="#9CA3AF" />
              <Text style={styles.statLabel}>Time Left</Text>
              <Text style={styles.statValue}>3d : 12h : 45m</Text>
            </View>
            <View style={styles.contestStat}>
              <SymbolView name="person.2" size={14} tintColor="#9CA3AF" />
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>2,568</Text>
            </View>
            <View style={styles.contestStat}>
              <SymbolView name="gift" size={14} tintColor="#9CA3AF" />
              <Text style={styles.statLabel}>Prize Pool</Text>
              <Text style={styles.statValue}>150,000</Text>
            </View>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.bottomRow}>
          <View style={styles.progressCard}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <Text style={styles.cardSubtitle}>This Week</Text>
            <View style={styles.progressChartArea}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercent}>72%</Text>
              </View>
              <View style={styles.progressLegend}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>Correct 85</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Incorrect 23</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#D1D5DB' }]} /><Text style={styles.legendText}>Unattempted 12</Text></View>
              </View>
            </View>
            <TouchableOpacity><Text style={styles.linkText}>See Detailed Report ></Text></TouchableOpacity>
          </View>

          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Text style={styles.cardTitle}>Daily Streak 🔥</Text>
            </View>
            <Text style={styles.streakNumber}>7 <Text style={styles.streakLabel}>Days in a row!</Text></Text>
            <View style={styles.daysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <View key={day} style={styles.dayItem}>
                  <View style={[styles.dayCircle, i < 6 ? styles.dayActive : styles.dayInactive]}>
                    {i < 6 && <SymbolView name="checkmark" size={12} tintColor="#FFF" />}
                  </View>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.linkText}>Keep it up! You're on fire!</Text>
          </View>
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: Platform.OS === 'android' ? 20 : 0 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFF' },
  heroBanner: { borderRadius: 20, padding: 20, flexDirection: 'row', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  heroContent: { flex: 1, paddingRight: 10 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#111827', lineHeight: 34, marginBottom: 8 },
  heroHighlight: { color: '#6D28D9' },
  heroSubtitle: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 16 },
  heroButton: { backgroundColor: '#4C1D95', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  heroImagePlaceholder: { width: 100, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  searchText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#9CA3AF' },
  filterIcon: { marginLeft: 12 },
  examScroll: { paddingBottom: 10, gap: 16, paddingRight: 20 },
  examCard: { width: 280, borderRadius: 24, padding: 24, marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  examIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  examTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  examSubtitle: { color: '#E0E7FF', fontSize: 14, marginBottom: 16 },
  examDesc: { color: '#E0E7FF', fontSize: 12, lineHeight: 18, marginBottom: 20, opacity: 0.9 },
  examButton: { backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  examButtonText: { fontSize: 12, fontWeight: 'bold' },
  quickActionsScroll: { marginTop: 8, marginBottom: 24, paddingBottom: 10 },
  actionItem: { alignItems: 'center', marginRight: 20, width: 70 },
  actionIconContainer: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 11, color: '#4B5563', textAlign: 'center', fontWeight: '500' },
  contestCard: { backgroundColor: '#1E1B4B', borderRadius: 24, padding: 20, marginBottom: 24 },
  contestHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 20, marginBottom: 20 },
  contestTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  contestTagText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  contestTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  contestSubtitle: { color: '#9CA3AF', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  contestButton: { backgroundColor: '#8B5CF6', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 },
  contestButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  contestLeaderboard: { flex: 1, marginLeft: 16 },
  leaderboardTitle: { color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rankBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  rankText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  leaderboardName: { color: '#D1D5DB', fontSize: 12, flex: 1 },
  leaderboardScore: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  contestFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  contestStat: { alignItems: 'flex-start' },
  statLabel: { color: '#9CA3AF', fontSize: 10, marginTop: 4, marginBottom: 2 },
  statValue: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  bottomRow: { flexDirection: 'row', gap: 16 },
  progressCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  streakCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  progressChartArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 8, borderColor: '#4C1D95', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderRightColor: '#E5E7EB' },
  progressPercent: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  progressLegend: { flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 10, color: '#4B5563' },
  linkText: { color: '#6D28D9', fontSize: 12, fontWeight: '600', marginTop: 'auto' },
  streakHeader: { marginBottom: 12 },
  streakNumber: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  streakLabel: { fontSize: 12, color: '#6B7280', fontWeight: 'normal' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayItem: { alignItems: 'center' },
  dayCircle: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dayActive: { backgroundColor: '#10B981' },
  dayInactive: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  dayText: { fontSize: 8, color: '#6B7280' }
});
