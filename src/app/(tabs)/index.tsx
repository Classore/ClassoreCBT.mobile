import { AppText } from '@/components/AppText';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  
  const userName = user?.first_name || user?.username || "Student";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText style={[styles.greeting, { fontFamily: 'Inter_700Bold' }]}>Hello, {userName} 👋</AppText>
            <AppText style={[styles.subGreeting, { fontFamily: 'Inter_400Regular' }]}>Let's achieve greatness today.</AppText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.8}
              onPress={() => router.push('/notifications')}
            >
              <Image source={require('../../../assets/images/bell-icon.png')} style={styles.headerIcon} contentFit="contain" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.8}
              onPress={() => router.push('/(exam)/leaderboard')}
            >
              <Image source={require('../../../assets/images/trophy-icon.png')} style={styles.headerIcon} contentFit="contain" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.darkModeToggle, isDarkMode ? styles.darkModeToggleActive : styles.darkModeToggleInactive]} 
              onPress={() => setIsDarkMode(!isDarkMode)}
              activeOpacity={0.85}
            >
              <View style={[styles.toggleThumb, isDarkMode ? styles.toggleThumbRight : styles.toggleThumbLeft]}>
                <Image 
                  source={isDarkMode ? require('../../../assets/images/moon-white-icon.png') : require('../../../assets/images/moon-icon.png')} 
                  style={{ width: 14, height: 14 }} 
                  contentFit="contain" 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <AppText style={styles.heroTitle}>
              Ace Every Exam.{'\n'}Unlock <AppText style={styles.heroHighlight}>Your{'\n'}Future.</AppText>
            </AppText>
            <AppText style={styles.heroSubtitle}>
              Smart practice, expert feedback, and real exam experience — all in one place.
            </AppText>
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => router.push('/(tabs)/practice')}
              activeOpacity={0.85}
            >
              <AppText style={styles.heroButtonText}>Start Test</AppText>
              <Image source={require('../../../assets/images/arrow-right-icon.png')} style={{ width: 14, height: 14 }} contentFit="contain" />
            </TouchableOpacity>
          </View>

          {/* Hero Illustration */}
          <View style={styles.heroImageContainer}>
            <Image source={require('../../../assets/images/hero-student.png')} style={styles.heroImage} contentFit="contain" />
            
            <View style={[styles.badge, styles.improveBadge]}>
              <Image source={require('../../../assets/images/improve-badge.png')} style={styles.badgeIcon} contentFit="contain" />
              <AppText style={styles.improveBadgeText}>Improve</AppText>
            </View>
            
            <View style={[styles.badge, styles.achieveBadge]}>
              <Image source={require('../../../assets/images/achieve-badge.png')} style={styles.badgeIcon} contentFit="contain" />
              <AppText style={styles.achieveBadgeText}>Achieve</AppText>
            </View>
            
            <View style={[styles.badge, styles.learnBadge]}>
              <Image source={require('../../../assets/images/learn-badge.png')} style={styles.badgeIcon} contentFit="contain" />
              <AppText style={styles.learnBadgeText}>Learn</AppText>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Image source={require('../../../assets/images/search-icon.png')} style={{ width: 18, height: 18 }} contentFit="contain" />
          <AppText style={styles.searchText}>What do you want to practice today?</AppText>
          <Image source={require('../../../assets/images/filter-icon.png')} style={{ width: 18, height: 18, marginLeft: 8 }} contentFit="contain" />
        </TouchableOpacity>

        {/* Exam Cards - 2 Column Row */}
        <View style={styles.examCardsRow}>
          {/* JAMB Card */}
          <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.examCard}>
            <Image source={require('../../../assets/images/jamb-bg.png')} style={[StyleSheet.absoluteFillObject, { borderRadius: 20, opacity: 0.9 }]} contentFit="cover" />
            <View style={styles.examCardContent}>
              <View style={styles.examIconContainer}>
                <Image source={require('../../../assets/images/exam-jamb-icon.png')} style={{ width: 18, height: 18 }} contentFit="contain" />
              </View>
              <AppText style={styles.examTitle}>JAMB</AppText>
              <AppText style={styles.examSubtitle}>UTME Practice</AppText>
              <AppText style={styles.examDesc}>All subjects | Past questions{'\n'}Mock tests | Performance</AppText>
              <TouchableOpacity 
                style={styles.examButton} 
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(tabs)/practice', params: { exam: 'jamb' } })}
              >
                <AppText style={[styles.examButtonText, { color: '#1D4ED8' }]}>Explore JAMB</AppText>
                <Image source={require('../../../assets/images/arrow-right-blue-icon.png')} style={{ width: 10, height: 10 }} contentFit="contain" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* IELTS Card */}
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.examCard}>
            <Image source={require('../../../assets/images/ielts-bg.png')} style={[StyleSheet.absoluteFillObject, { borderRadius: 20, opacity: 0.9 }]} contentFit="cover" />
            <View style={styles.examCardContent}>
              <View style={styles.examIconContainer}>
                <Image source={require('../../../assets/images/exam-ielts-icon.png')} style={{ width: 18, height: 18 }} contentFit="contain" />
              </View>
              <AppText style={styles.examTitle}>IELTS</AppText>
              <AppText style={styles.examSubtitle}>English Test</AppText>
              <AppText style={styles.examDesc}>Listening • Reading{'\n'}Writing • Speaking</AppText>
              <TouchableOpacity 
                style={styles.examButton} 
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(tabs)/practice', params: { exam: 'ielts' } })}
              >
                <AppText style={[styles.examButtonText, { color: '#6D28D9' }]}>Explore IELTS</AppText>
                <Image source={require('../../../assets/images/arrow-right-blue-icon.png')} style={{ width: 10, height: 10, tintColor: '#6D28D9' }} contentFit="contain" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions - Full width distribution */}
        <View style={styles.quickActionsContainer}>
          {[
            { id: 1, name: 'Mock Tests', image: require('../../../assets/images/qa-mock-tests.png'), bg: '#D1FAE5', route: '/(tabs)/practice' },
            { id: 2, name: 'Study Room', image: require('../../../assets/images/qa-study-room.png'), bg: '#FFEDD5', route: '/saved-questions' },
            { id: 3, name: 'Weak Areas', image: require('../../../assets/images/qa-target.png'), bg: '#DBEAFE', route: '/weak-topics' },
            { id: 4, name: 'Achievements', image: require('../../../assets/images/qa-achievements.png'), bg: '#FFE4E6', route: '/(tabs)/profile' },
            { id: 5, name: 'Wallet', image: require('../../../assets/images/qa-wallet.png'), bg: '#EDE9FE', route: '/wallet' },
            { id: 6, name: 'Refer & Earn', image: require('../../../assets/images/qa-gift-icon.png'), bg: '#FEF3C7', route: '/(tabs)/profile' },
          ].map(action => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionItem} 
              activeOpacity={0.75}
              onPress={() => action.route && router.push(action.route as any)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                <Image source={action.image} style={{ width: 22, height: 22 }} contentFit="contain" />
              </View>
              <AppText style={styles.actionText} numberOfLines={1}>{action.name}</AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contest Zone */}
        <View style={styles.contestCard}>
          <View style={styles.contestHeader}>
            <Image source={require('../../../assets/images/contest-trophy.png')} style={styles.contestTrophy} contentFit="contain" />
            
            <View style={styles.contestMainInfo}>
              <View style={styles.contestTag}>
                <Image source={require('../../../assets/images/contest-star-icon.png')} style={{ width: 11, height: 11 }} contentFit="contain" />
                <AppText style={styles.contestTagText}>Contest Zone</AppText>
              </View>
              <AppText style={styles.contestTitle}>Compete. Rank. Win!</AppText>
              <AppText style={styles.contestSubtitle}>Join weekly contests and climb{'\n'}the leaderboard.</AppText>
              <TouchableOpacity style={styles.contestButton} activeOpacity={0.85} onPress={() => router.push('/contest')}>
                <AppText style={styles.contestButtonText}>View Contests</AppText>
                <Image source={require('../../../assets/images/arrow-right-sm-icon.png')} style={{ width: 10, height: 10, tintColor: '#FFF' }} contentFit="contain" />
              </TouchableOpacity>
            </View>

            <View style={styles.contestLeaderboard}>
              <AppText style={styles.leaderboardTitle}>This Week's Top 3</AppText>
              {[
                { rank: 1, name: 'Blessing A.', score: '12,450', color: '#F59E0B' },
                { rank: 2, name: 'Daniel O.', score: '9,870', color: '#9CA3AF' },
                { rank: 3, name: 'Victory M.', score: '8,610', color: '#D97706' },
              ].map(item => (
                <View key={item.rank} style={styles.leaderboardRow}>
                  <View style={[styles.rankBadge, { backgroundColor: item.color }]}>
                    <AppText style={styles.rankText}>{item.rank}</AppText>
                  </View>
                  <AppText style={styles.leaderboardName} numberOfLines={1}>{item.name}</AppText>
                  <AppText style={styles.leaderboardScore}>{item.score}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.contestFooter}>
            <View style={styles.contestStat}>
              <View style={styles.contestStatHeader}>
                <Image source={require('../../../assets/images/contest-time-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                <AppText style={styles.statLabel}>Time Left</AppText>
              </View>
              <AppText style={styles.statValue}>3d : 12h : 45m</AppText>
            </View>
            
            <View style={styles.contestStat}>
              <View style={styles.contestStatHeader}>
                <Image source={require('../../../assets/images/contest-participants-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                <AppText style={styles.statLabel}>Participants</AppText>
              </View>
              <AppText style={styles.statValue}>2,568</AppText>
            </View>

            <View style={styles.contestStat}>
              <View style={styles.contestStatHeader}>
                <Image source={require('../../../assets/images/contest-prize-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                <AppText style={styles.statLabel}>Prize Pool</AppText>
              </View>
              <AppText style={styles.statValue}>150,000</AppText>
            </View>
          </View>
        </View>

        {/* Bottom Row: Your Progress & Daily Streak */}
        <View style={styles.bottomRow}>
          {/* Your Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.cardHeaderRow}>
              <AppText style={styles.cardTitle}>Your Progress</AppText>
              <AppText style={styles.cardSubtitle}>This Week</AppText>
            </View>
            
            <View style={styles.progressChartArea}>
              <View style={styles.donutContainer}>
                <View style={styles.donutCircle}>
                  <AppText style={styles.progressPercent}>72%</AppText>
                </View>
              </View>
              <View style={styles.progressLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <AppText style={styles.legendText}>Correct 85</AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                  <AppText style={styles.legendText}>Incorrect 23</AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#9CA3AF' }]} />
                  <AppText style={styles.legendText}>Unattempted 12</AppText>
                </View>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/reports')}>
              <AppText style={styles.linkText}>See Detailed Report ›</AppText>
            </TouchableOpacity>
          </View>

          {/* Daily Streak Card */}
          <TouchableOpacity style={styles.streakCard} activeOpacity={0.8} onPress={() => router.push('/streak')}>
            <AppText style={styles.cardTitle}>Daily Streak 🔥</AppText>
            <AppText style={styles.streakNumber}>7 <AppText style={styles.streakLabel}>Days in a row!</AppText></AppText>
            
            <View style={styles.daysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <View key={day} style={styles.dayItem}>
                  <View style={[styles.dayCircle, i < 6 ? styles.dayActive : styles.dayInactive]}>
                    {i < 6 && <Image source={require('../../../assets/images/streak-check-icon.png')} style={{ width: 9, height: 9 }} contentFit="contain" />}
                  </View>
                  <AppText style={styles.dayText}>{day}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.streakSubText}>Keep it up! You're on fire!</AppText>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: Platform.OS === 'android' ? 12 : 4 
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subGreeting: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 4, 
    elevation: 2 
  },
  headerIcon: { width: 20, height: 20 },
  notificationDot: { 
    position: 'absolute', 
    top: 9, 
    right: 9, 
    width: 7, 
    height: 7, 
    borderRadius: 3.5, 
    backgroundColor: '#EF4444', 
    borderWidth: 1, 
    borderColor: '#FFF' 
  },
  darkModeToggle: {
    width: 48,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 3,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  darkModeToggleActive: {
    backgroundColor: '#4C1D95',
    alignItems: 'flex-end',
  },
  darkModeToggleInactive: {
    backgroundColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleThumbRight: {
    borderColor: 'rgba(255,255,255,0.9)',
  },
  toggleThumbLeft: {
    borderColor: '#9CA3AF',
    backgroundColor: '#FFF',
  },

  // Hero Banner
  heroBanner: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    elevation: 3,
    position: 'relative',
    overflow: 'visible'
  },
  heroContent: { flex: 1, paddingRight: 6, zIndex: 2 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 28, marginBottom: 10 },
  heroHighlight: { color: '#6D28D9', fontWeight: '900' },
  heroSubtitle: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 16 },
  heroButton: { 
    backgroundColor: '#4C1D95', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  heroButtonText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  heroImageContainer: { width: 135, height: 150, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute', bottom: -10, right: -4 },
  badge: { 
    position: 'absolute', 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3, 
    gap: 4 
  },
  badgeIcon: { width: 12, height: 12 },
  improveBadge: { top: 6, left: -20 },
  improveBadgeText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
  achieveBadge: { top: 54, right: -12 },
  achieveBadgeText: { fontSize: 10, fontWeight: '800', color: '#4C1D95' },
  learnBadge: { bottom: 6, left: 10 },
  learnBadgeText: { fontSize: 10, fontWeight: '800', color: '#F59E0B' },

  // Search Bar
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 4, 
    elevation: 1 
  },
  searchText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#9CA3AF' },

  // Exam Cards
  examCardsRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  examCard: { 
    flex: 1, 
    borderRadius: 20, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 3,
    minHeight: 200,
    justifyContent: 'space-between'
  },
  examCardContent: { zIndex: 2, flex: 1, justifyContent: 'space-between' },
  examIconContainer: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  examTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  examSubtitle: { color: '#E0E7FF', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  examDesc: { color: '#E0E7FF', fontSize: 10, lineHeight: 15, marginBottom: 14, opacity: 0.9 },
  examButton: { 
    backgroundColor: '#FFF', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  examButtonText: { fontSize: 11, fontWeight: '800' },

  // Quick Actions
  quickActionsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  actionText: { fontSize: 10, color: '#374151', textAlign: 'center', fontWeight: '700' },

  // Contest Zone Card
  contestCard: { 
    backgroundColor: '#151336', 
    borderRadius: 22, 
    padding: 16, 
    marginBottom: 20 
  },
  contestHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)', 
    paddingBottom: 16, 
    marginBottom: 14 
  },
  contestTrophy: { width: 68, height: 82, marginRight: 8 },
  contestMainInfo: { flex: 1.1, paddingRight: 8 },
  contestTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  contestTagText: { color: '#A78BFA', fontSize: 11, fontWeight: '800' },
  contestTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  contestSubtitle: { color: '#9CA3AF', fontSize: 10, lineHeight: 14, marginBottom: 12 },
  contestButton: { 
    backgroundColor: '#6D28D9', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  contestButtonText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  contestLeaderboard: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 10 },
  leaderboardTitle: { color: '#FFF', fontSize: 11, fontWeight: '800', marginBottom: 10 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rankBadge: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  rankText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  leaderboardName: { color: '#D1D5DB', fontSize: 11, flex: 1, fontWeight: '600' },
  leaderboardScore: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  
  // Contest Footer
  contestFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  contestStat: { alignItems: 'flex-start' },
  contestStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '600' },
  statValue: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  // Bottom Row
  bottomRow: { flexDirection: 'row', gap: 14 },
  progressCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 14, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 6, 
    elevation: 2,
    justifyContent: 'space-between'
  },
  streakCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 14, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 6, 
    elevation: 2,
    justifyContent: 'space-between'
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#111827' },
  cardSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  
  // Progress Donut
  progressChartArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  donutContainer: { marginRight: 10 },
  donutCircle: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    borderWidth: 6, 
    borderColor: '#2563EB', 
    borderRightColor: '#E5E7EB', 
    borderBottomColor: '#2563EB',
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  progressPercent: { fontSize: 12, fontWeight: '900', color: '#111827' },
  progressLegend: { flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 10, color: '#4B5563', fontWeight: '600' },
  linkText: { color: '#6D28D9', fontSize: 11, fontWeight: '800' },

  // Streak
  streakNumber: { fontSize: 32, fontWeight: '900', color: '#111827', marginVertical: 6 },
  streakLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  dayItem: { alignItems: 'center' },
  dayCircle: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dayActive: { backgroundColor: '#10B981' },
  dayInactive: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#D1D5DB' },
  dayText: { fontSize: 8, color: '#6B7280', fontWeight: '600' },
  streakSubText: { color: '#6D28D9', fontSize: 11, fontWeight: '800' }
});


