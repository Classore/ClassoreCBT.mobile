import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { navigateWithFrom } from '@/utils/helpNavigation';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Pulse animation for skeleton loading while user data is fetching
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!user) {
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
  }, [user, shimmerAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);
  
  const displayName = user 
    ? (user.full_name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.username || 'Student'))
    : '';
  const displayEmail = user?.email || '';
  const displayTier = user?.scholar_tier || 'Scholar';
  const tokenBalance = user?.token_balance ?? 0;
  
  const xp = user?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const xpToNextLevel = Math.max(nextLevelXp - xp, 0);
  const progressPercent = Math.min(Math.max(((xp % 1000) / 1000) * 100, 0), 100);
  
  const avatarSource = (user?.avatar_url || user?.avatar)
    ? { uri: user?.avatar_url || user?.avatar } 
    : require('@/assets/images/default-avatar.png');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#6D28D9" 
              colors={['#6D28D9']} 
            />
          }
        >
          {/* Hero User Banner Card */}
          <TouchableOpacity 
            activeOpacity={user ? 0.9 : 1} 
            onPress={() => user && router.push('/edit-profile')}
            disabled={!user}
          >
            <LinearGradient
              colors={['#4C1D95', '#6D28D9', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {!user ? (
                /* Skeleton Loader for Hero Card */
                <Animated.View style={[styles.skeletonContainer, { opacity: shimmerAnim }]}>
                  <View style={styles.heroTopRow}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.userInfo}>
                      <View style={styles.skeletonNameBar} />
                      <View style={styles.skeletonEmailBar} />
                      <View style={styles.skeletonPhoneBar} />
                    </View>
                  </View>

                  <View style={styles.skeletonLevelBadge} />
                  <View style={styles.skeletonXpBar} />
                  <View style={styles.skeletonProgressTrack} />
                </Animated.View>
              ) : (
                <>
                  <View style={styles.heroTopRow}>
                    {/* Avatar with Camera Badge */}
                    <View style={styles.avatarWrapper}>
                      <Image
                        source={avatarSource}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                      <View style={styles.cameraBadge}>
                        <Feather name="camera" size={11} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{displayName}</Text>
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </View>
                      {!!displayEmail && <Text style={styles.userEmail}>{displayEmail}</Text>}
                      {user?.phone_number ? (
                        <Text style={styles.userPhone}>{user.phone_number}</Text>
                      ) : (
                        <Text style={styles.userPhonePlaceholder}>Tap to add phone number</Text>
                      )}
                    </View>
                  </View>

                  {/* Level & XP */}
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>Level {level} • {displayTier}</Text>
                  </View>

                  <View style={styles.xpRow}>
                    <Text style={styles.xpText}>🔥 {xpToNextLevel.toLocaleString()} XP to Level {level + 1}</Text>
                  </View>

                  <View style={styles.xpProgressBarTrack}>
                    <View style={[styles.xpProgressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 2-Column Summary Cards */}
          <View style={styles.summaryRow}>
            {/* Token Balance */}
            <TouchableOpacity 
              style={styles.summaryCard} 
              onPress={() => router.push('/wallet')}
              activeOpacity={0.8}
            >
              <View style={[styles.summaryIconBg, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="dollar-sign" size={20} color="#7C3AED" />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Token Balance</Text>
                <View style={styles.summaryValueRow}>
                  {user?.token_balance !== undefined ? (
                    <>
                      <Text style={styles.summaryValueMain}>{user.token_balance.toLocaleString()}</Text>
                      <Text style={styles.summaryValueSub}> Tokens</Text>
                    </>
                  ) : (
                    <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 4 }} />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Streak */}
            <TouchableOpacity 
              style={styles.summaryCard} 
              onPress={() => router.push('/streak')}
              activeOpacity={0.8}
            >
              <View style={[styles.summaryIconBg, { backgroundColor: '#FFEDD5' }]}>
                <MaterialCommunityIcons name="fire" size={22} color="#F97316" />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>Streak</Text>
                {user?.streak !== undefined ? (
                  <Text style={styles.summaryValueMain}>{user.streak} Days</Text>
                ) : (
                  <ActivityIndicator size="small" color="#F97316" style={{ marginVertical: 4 }} />
                )}
                <Text style={styles.streakSubText}>Keep it up!</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Overview Section */}
          <Text style={styles.sectionTitle}>Overview</Text>
            {/* Performance Overview Cards */}
            <View style={styles.overviewGrid}>
              {/* Tests Taken */}
              <View style={styles.overviewCard}>
                <View style={[styles.overviewIconBg, { backgroundColor: '#F0F9FF' }]}>
                  <Feather name="file-text" size={18} color="#0EA5E9" />
                </View>
                <Text style={styles.overviewValue}>{user ? (user.tests_taken ?? 0) : '--'}</Text>
                <Text style={styles.overviewLabel}>Tests Taken</Text>
              </View>

              {/* Average Score */}
              <View style={styles.overviewCard}>
                <View style={[styles.overviewIconBg, { backgroundColor: '#FEF2F2' }]}>
                  <Feather name="target" size={18} color="#EF4444" />
                </View>
                <Text style={styles.overviewValue}>{user && user.average_score !== undefined ? `${user.average_score}%` : '--%'}</Text>
                <Text style={styles.overviewLabel}>Average Score</Text>
              </View>

              {/* Accuracy */}
              <View style={styles.overviewCard}>
                <View style={[styles.overviewIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Feather name="check-circle" size={18} color="#10B981" />
                </View>
                <Text style={styles.overviewValue}>{user?.accuracy !== undefined ? `${user.accuracy}%` : '--%'}</Text>
                <Text style={styles.overviewLabel}>Accuracy</Text>
              </View>

              {/* Study Time */}
              <View style={styles.overviewCard}>
                <View style={[styles.overviewIconBg, { backgroundColor: '#FFF1F2' }]}>
                  <Feather name="clock" size={18} color="#F43F5E" />
                </View>
                <Text style={styles.overviewValue}>
                  {user?.study_time_hours !== undefined 
                    ? `${user.study_time_hours}h ${user.study_time_minutes}m`
                    : '--h --m'}
                </Text>
                <Text style={styles.overviewLabel}>Study Time</Text>
              </View>
            </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            {/* My Certificates */}
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/certificates', '/(tabs)/profile')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="ribbon" size={20} color="#7C3AED" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>My Certificates</Text>
                <Text style={styles.menuSubtitle}>View and download your certificates</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Achievements & Badges */}
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/achievements', '/(tabs)/profile')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="star" size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Achievements & Badges</Text>
                <Text style={styles.menuSubtitle}>See your badges and milestones</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Leaderboard Profile */}
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => router.push('/(exam)/leaderboard')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="trophy-outline" size={20} color="#0284C7" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Leaderboard Profile</Text>
                <Text style={styles.menuSubtitle}>See how you rank</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* User Guide & FAQs */}
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/user-guide', '/(tabs)/profile')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="book-open" size={19} color="#2563EB" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>User Guide & FAQs</Text>
                <Text style={styles.menuSubtitle}>Walkthroughs, tips & answers</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F3F4F6' }]}>
                <Feather name="settings" size={19} color="#4B5563" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>Security, appearance, notifications & privacy</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => navigateWithFrom('/(tabs)/help-support', '/(tabs)/profile')}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="chatbubble-outline" size={19} color="#7C3AED" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Help & Support</Text>
                <Text style={styles.menuSubtitle}>Contact us, FAQs & tutorials</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Spacer for Tab Bar */}
          <View style={{ height: 100 }} />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 12.5,
    color: '#E9D5FF',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#DDD6FE',
    marginTop: 1,
  },
  userPhonePlaceholder: {
    fontSize: 12,
    color: '#DDD6FE',
    marginTop: 1,
    fontStyle: 'italic',
    opacity: 0.85,
  },

  // Hero Skeleton Styles
  skeletonContainer: {
    width: '100%',
  },
  skeletonAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginRight: 16,
  },
  skeletonNameBar: {
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  skeletonEmailBar: {
    width: 180,
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 6,
  },
  skeletonPhoneBar: {
    width: 110,
    height: 11,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skeletonLevelBadge: {
    width: 115,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 12,
  },
  skeletonXpBar: {
    width: 150,
    height: 13,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  skeletonProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },

  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  levelBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpRow: {
    marginBottom: 6,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  xpProgressBarFill: {
    width: '45%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },

  // 2-Column Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryValueMain: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  summaryValueSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  streakSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 1,
  },

  // Overview Grid
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  overviewIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 9.5,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Menu Options
  menuContainer: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11.5,
    color: '#9CA3AF',
  },
});
