import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  
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
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Image source={require('../../../assets/images/bell-icon.png')} style={styles.headerIcon} contentFit="contain" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
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
            <Text style={styles.heroTitle}>
              Ace Every Exam.{'\n'}Unlock <Text style={styles.heroHighlight}>Your{'\n'}Future.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Smart practice, expert feedback, and real exam experience — all in one place.
            </Text>
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => router.push('/(tabs)/practice')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroButtonText}>Start Test</Text>
              <Image source={require('../../../assets/images/arrow-right-icon.png')} style={{ width: 14, height: 14 }} contentFit="contain" />
            </TouchableOpacity>
          </View>

          {/* Hero Illustration */}
          <View style={styles.heroImageContainer}>
            <Image source={require('../../../assets/images/hero-student.png')} style={styles.heroImage} contentFit="contain" />
            
            <View style={[styles.badge, styles.improveBadge]}>
              <Image source={require('../../../assets/images/improve-badge.png')} style={styles.badgeIcon} contentFit="contain" />
              <Text style={styles.improveBadgeText}>Improve</Text>
            </View>
            
            <View style={[styles.badge, styles.achieveBadge]}>
              <Image source={require('../../../assets/images/achieve-badge.png')} style={styles.badgeIcon} contentFit="contain" />
              <Text style={styles.achieveBadgeText}>Achieve</Text>
            </View>
            
            <View style={[styles.badge, styles.learnBadge]}>
              <Image source={require('../../../assets/images/learn-badge.png')} style={styles.badgeIcon} contentFit="contain" />
              <Text style={styles.learnBadgeText}>Learn</Text>
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
          <Text style={styles.searchText}>What do you want to practice today?</Text>
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
              <Text style={styles.examTitle}>JAMB</Text>
              <Text style={styles.examSubtitle}>UTME Practice</Text>
              <Text style={styles.examDesc}>All subjects | Past questions{'\n'}Mock tests | Performance</Text>
              <TouchableOpacity 
                style={styles.examButton} 
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(tabs)/practice', params: { exam: 'jamb' } })}
              >
                <Text style={[styles.examButtonText, { color: '#1D4ED8' }]}>Explore JAMB</Text>
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
              <Text style={styles.examTitle}>IELTS</Text>
              <Text style={styles.examSubtitle}>English Test</Text>
              <Text style={styles.examDesc}>Listening • Reading{'\n'}Writing • Speaking</Text>
              <TouchableOpacity 
                style={styles.examButton} 
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(tabs)/practice', params: { exam: 'ielts' } })}
              >
                <Text style={[styles.examButtonText, { color: '#6D28D9' }]}>Explore IELTS</Text>
                <Image source={require('../../../assets/images/arrow-right-blue-icon.png')} style={{ width: 10, height: 10, tintColor: '#6D28D9' }} contentFit="contain" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions - Full width distribution */}
        <View style={styles.quickActionsContainer}>
          {[
            { id: 1, name: 'Mock Tests', image: require('../../../assets/images/qa-mock-tests.png'), bg: '#D1FAE5' },
            { id: 2, name: 'Study Room', image: require('../../../assets/images/qa-study-room.png'), bg: '#FFEDD5' },
            { id: 3, name: 'Weak Areas', image: require('../../../assets/images/qa-target.png'), bg: '#DBEAFE' },
            { id: 4, name: 'Achievements', image: require('../../../assets/images/qa-achievements.png'), bg: '#FFE4E6' },
            { id: 5, name: 'Wallet', image: require('../../../assets/images/qa-wallet.png'), bg: '#EDE9FE' },
            { id: 6, name: 'Refer & Earn', image: require('../../../assets/images/qa-gift-icon.png'), bg: '#FEF3C7' },
          ].map(action => (
            <TouchableOpacity key={action.id} style={styles.actionItem} activeOpacity={0.75}>
              <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                <Image source={action.image} style={{ width: 22, height: 22 }} contentFit="contain" />
              </View>
              <Text style={styles.actionText} numberOfLines={1}>{action.name}</Text>
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
                <Text style={styles.contestTagText}>Contest Zone</Text>
              </View>
              <Text style={styles.contestTitle}>Compete. Rank. Win!</Text>
              <Text style={styles.contestSubtitle}>Join weekly contests and climb{'\n'}the leaderboard.</Text>
              <TouchableOpacity style={styles.contestButton} activeOpacity={0.85}>
                <Text style={styles.contestButtonText}>View Contests</Text>
                <Image source={require('../../../assets/images/arrow-right-sm-icon.png')} style={{ width: 10, height: 10, tintColor: '#FFF' }} contentFit="contain" />
              </TouchableOpacity>
            </View>

            <View style={styles.contestLeaderboard}>
              <Text style={styles.leaderboardTitle}>This Week's Top 3</Text>
              {[
                { rank: 1, name: 'Blessing A.', score: '12,450', color: '#F59E0B' },
                { rank: 2, name: 'Daniel O.', score: '9,870', color: '#9CA3AF' },
                { rank: 3, name: 'Victory M.', score: '8,610', color: '#D97706' },
              ].map(item => (
                <View key={item.rank} style={styles.leaderboardRow}>
                  <View style={[styles.rankBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.rankText}>{item.rank}</Text>
                  </View>
                  <Text style={styles.leaderboardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.leaderboardScore}>{item.score}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.contestFooter}>
            <View style={styles.contestStat}>
              <View style={styles.contestStatHeader}>
                <Image source={require('../../../assets/images/contest-time-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                <Text style={styles.statLabel}>Time Left</Text>
              </View>
              <Text style={styles.statValue}>3d : 12h : 45m</Text>
            </View>
            
            <View style={styles.contestStat}>
              <View style={styles.contestStatHeader}>
                <Image source={require('../../../assets/images/contest-participants-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                <Text style={styles.statLabel}>Participants</Text>
              </View>
              <Text style={styles.statValue}>2,568</Text>
            </View>

            <View style={styles.contestStat}>
              <View style={styles.contestStatHeader}>
                <Image source={require('../../../assets/images/contest-prize-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                <Text style={styles.statLabel}>Prize Pool</Text>
              </View>
              <Text style={styles.statValue}>150,000</Text>
            </View>
          </View>
        </View>

        {/* Bottom Row: Your Progress & Daily Streak */}
        <View style={styles.bottomRow}>
          {/* Your Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Your Progress</Text>
              <Text style={styles.cardSubtitle}>This Week</Text>
            </View>
            
            <View style={styles.progressChartArea}>
              <View style={styles.donutContainer}>
                <View style={styles.donutCircle}>
                  <Text style={styles.progressPercent}>72%</Text>
                </View>
              </View>
              <View style={styles.progressLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Correct 85</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Incorrect 23</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#9CA3AF' }]} />
                  <Text style={styles.legendText}>Unattempted 12</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.linkText}>See Detailed Report ›</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Streak Card */}
          <View style={styles.streakCard}>
            <Text style={styles.cardTitle}>Daily Streak 🔥</Text>
            <Text style={styles.streakNumber}>7 <Text style={styles.streakLabel}>Days in a row!</Text></Text>
            
            <View style={styles.daysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <View key={day} style={styles.dayItem}>
                  <View style={[styles.dayCircle, i < 6 ? styles.dayActive : styles.dayInactive]}>
                    {i < 6 && <Image source={require('../../../assets/images/streak-check-icon.png')} style={{ width: 9, height: 9 }} contentFit="contain" />}
                  </View>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.streakSubText}>Keep it up! You're on fire!</Text>
          </View>
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
    marginBottom: 16, 
    marginTop: Platform.OS === 'android' ? 12 : 4 
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subGreeting: { fontSize: 13, color: '#6B7280', marginTop: 2 },
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
    padding: 16, 
    flexDirection: 'row', 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
    position: 'relative',
    overflow: 'visible'
  },
  heroContent: { flex: 1, paddingRight: 6, zIndex: 2 },
  heroTitle: { fontSize: 21, fontWeight: '900', color: '#111827', lineHeight: 26, marginBottom: 8 },
  heroHighlight: { color: '#6D28D9' },
  heroSubtitle: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 14 },
  heroButton: { 
    backgroundColor: '#4C1D95', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  heroButtonText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  heroImageContainer: { width: 125, height: 140, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute', bottom: -10, right: -4 },
  badge: { 
    position: 'absolute', 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 6, 
    paddingVertical: 3, 
    borderRadius: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3, 
    gap: 3 
  },
  badgeIcon: { width: 10, height: 10 },
  improveBadge: { top: 6, left: -14 },
  improveBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#10B981' },
  achieveBadge: { top: 48, right: -12 },
  achieveBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#4C1D95' },
  learnBadge: { bottom: 6, left: 10 },
  learnBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#F59E0B' },

  // Search Bar
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 4, 
    elevation: 1 
  },
  searchText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#9CA3AF' },

  // Exam Cards
  examCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  examCard: { 
    flex: 1, 
    borderRadius: 18, 
    padding: 14, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 3,
    minHeight: 185,
    justifyContent: 'space-between'
  },
  examCardContent: { zIndex: 2, flex: 1, justifyContent: 'space-between' },
  examIconContainer: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  examTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  examSubtitle: { color: '#E0E7FF', fontSize: 11, fontWeight: '600', marginBottom: 8 },
  examDesc: { color: '#E0E7FF', fontSize: 9.5, lineHeight: 14, marginBottom: 12, opacity: 0.9 },
  examButton: { 
    backgroundColor: '#FFF', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  examButtonText: { fontSize: 10.5, fontWeight: '700' },

  // Quick Actions
  quickActionsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  actionText: { fontSize: 9.5, color: '#374151', textAlign: 'center', fontWeight: '600' },

  // Contest Zone Card
  contestCard: { 
    backgroundColor: '#151336', 
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 16 
  },
  contestHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)', 
    paddingBottom: 14, 
    marginBottom: 12 
  },
  contestTrophy: { width: 62, height: 75, marginRight: 6 },
  contestMainInfo: { flex: 1.1, paddingRight: 6 },
  contestTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  contestTagText: { color: '#A78BFA', fontSize: 10.5, fontWeight: '700' },
  contestTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  contestSubtitle: { color: '#9CA3AF', fontSize: 9.5, lineHeight: 13, marginBottom: 10 },
  contestButton: { 
    backgroundColor: '#6D28D9', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  contestButtonText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  contestLeaderboard: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 8 },
  leaderboardTitle: { color: '#FFF', fontSize: 10.5, fontWeight: '700', marginBottom: 8 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rankBadge: { width: 15, height: 15, borderRadius: 7.5, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  rankText: { color: '#FFF', fontSize: 8.5, fontWeight: 'bold' },
  leaderboardName: { color: '#D1D5DB', fontSize: 10, flex: 1 },
  leaderboardScore: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  
  // Contest Footer
  contestFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  contestStat: { alignItems: 'flex-start' },
  contestStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  statLabel: { color: '#9CA3AF', fontSize: 9.5, fontWeight: '500' },
  statValue: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // Bottom Row
  bottomRow: { flexDirection: 'row', gap: 12 },
  progressCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 18, 
    padding: 12, 
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
    borderRadius: 18, 
    padding: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 6, 
    elevation: 2,
    justifyContent: 'space-between'
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  cardSubtitle: { fontSize: 10, color: '#9CA3AF' },
  
  // Progress Donut
  progressChartArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  donutContainer: { marginRight: 8 },
  donutCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 5.5, 
    borderColor: '#2563EB', 
    borderRightColor: '#E5E7EB', 
    borderBottomColor: '#2563EB',
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  progressPercent: { fontSize: 11, fontWeight: '800', color: '#111827' },
  progressLegend: { flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
  legendText: { fontSize: 9, color: '#4B5563', fontWeight: '500' },
  linkText: { color: '#6D28D9', fontSize: 10, fontWeight: '700' },

  // Streak
  streakNumber: { fontSize: 24, fontWeight: '900', color: '#111827', marginVertical: 4 },
  streakLabel: { fontSize: 10, color: '#6B7280', fontWeight: 'normal' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  dayItem: { alignItems: 'center' },
  dayCircle: { width: 15, height: 15, borderRadius: 7.5, justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  dayActive: { backgroundColor: '#10B981' },
  dayInactive: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' },
  dayText: { fontSize: 7.5, color: '#6B7280', fontWeight: '500' },
  streakSubText: { color: '#6D28D9', fontSize: 10, fontWeight: '700' }
});

