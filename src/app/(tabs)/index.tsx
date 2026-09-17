import { AppText } from '@/components/AppText';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/context/NotificationContext';
import { examService, isSectionBasedExam } from '@/services/exam';
import { contestService, Contest } from '@/services/contest';
import { storage } from '@/services/storage';

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { hasUnread } = useNotifications();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const userName = user?.first_name || user?.username || "Guest";
  const currentStreak = user?.streak || 0;

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Contest Zone State
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [contestLeaderboard, setContestLeaderboard] = useState<any[]>([]);
  const [contestLoading, setContestLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Active In-Progress Exam State
  const [activeAttempt, setActiveAttempt] = useState<{
    id: number;
    title: string;
    remaining_seconds: number;
    is_section_based: boolean;
    total_questions?: number;
    answered_count?: number;
  } | null>(null);

  const checkActiveExam = useCallback(async () => {
    try {
      let attemptId: number | null = null;
      const cached = await storage.get<any>('@classore_active_attempt');
      if (cached?.id) {
        attemptId = Number(cached.id);
      } else {
        const inProgressList = await examService.getExamHistory({ status: 'in_progress' });
        if (Array.isArray(inProgressList) && inProgressList.length > 0) {
          attemptId = inProgressList[0].id;
        }
      }

      if (!attemptId) {
        setActiveAttempt(null);
        return;
      }

      const res = await examService.resumeExam(attemptId);
      if (
        res &&
        res.status === 'in_progress' &&
        !res.timer_info?.is_expired &&
        (res.timer_info?.remaining_seconds ?? 0) > 0
      ) {
        const allExams = await examService.getCachedExams().catch(() => null) || [];
        const examObj = allExams.find(e => e.id === res.exam_type);
        const examTitle = cached?.title || examObj?.name || 'In-Progress Exam';
        const isSectionBased = cached?.is_section_based ?? isSectionBasedExam(examObj?.name, res.sections);

        let totalQuestions = 0;
        let answeredQuestions = 0;
        res.sections?.forEach(sec => {
          sec.question_groups?.forEach(grp => {
            totalQuestions += grp.responses?.length || 0;
            grp.responses?.forEach(resp => {
              if (resp.selected_choice || resp.written_response) {
                answeredQuestions++;
              }
            });
          });
        });

        setActiveAttempt({
          id: res.id,
          title: examTitle,
          remaining_seconds: res.timer_info.remaining_seconds,
          is_section_based: isSectionBased,
          total_questions: totalQuestions,
          answered_count: answeredQuestions,
        });

        await storage.set('@classore_active_attempt', {
          id: res.id,
          exam_type: res.exam_type,
          title: examTitle,
          is_section_based: isSectionBased,
        });
      } else {
        await storage.remove('@classore_active_attempt');
        setActiveAttempt(null);
      }
    } catch (e) {
      console.warn('Failed to check active exam attempt:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkActiveExam();
    }, [checkActiveExam])
  );

  useEffect(() => {
    if (!activeAttempt || activeAttempt.remaining_seconds <= 0) return;
    const interval = setInterval(() => {
      setActiveAttempt(prev => {
        if (!prev) return null;
        if (prev.remaining_seconds <= 1) {
          storage.remove('@classore_active_attempt');
          return null;
        }
        return { ...prev, remaining_seconds: prev.remaining_seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAttempt?.id]);

  const formatRemainingTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleResumeExam = (attemptInfo: { id: number; is_section_based: boolean }) => {
    if (attemptInfo.is_section_based) {
      router.push({
        pathname: '/(exam)/ielts-session',
        params: { attempt_id: String(attemptInfo.id) }
      });
    } else {
      router.push({
        pathname: '/(exam)/session',
        params: {
          attempt_id: String(attemptInfo.id)
        }
      });
    }
  };

  const handleDismissActiveExam = async () => {
    await storage.remove('@classore_active_attempt');
    setActiveAttempt(null);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // 1. Load cached report first for instant rendering
        const cached = await examService.getCachedAggregateReport();
        if (cached) {
          setReportData(cached);
          setLoading(false);
        }

        // 2. Revalidate fresh data in background
        const freshData = await examService.getAggregateReport('Overview', 'This Week');
        if (freshData) {
          setReportData(freshData);
        }
      } catch (err) {
        console.error('Failed to fetch home report', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchContests = async () => {
      try {
        let liveContests = await contestService.getContests('live');
        if (liveContests.length === 0) {
          liveContests = await contestService.getContests('upcoming');
        }

        if (liveContests.length > 0) {
          setActiveContest(liveContests[0]);
          const lb = await contestService.getLeaderboard(liveContests[0].id);
          setContestLeaderboard(lb);
        }
      } catch (err) {
        console.error('Failed to fetch home contests', err);
      } finally {
        setContestLoading(false);
      }
    };

    fetchReport();
    fetchContests();
  }, []);

  const overall = reportData?.overall || { correct_pct: 0, correct_count: 0, incorrect_count: 0, unattempted_count: 0 };
  const trend = reportData?.trend || [
    { day: 'Mon', active: false },
    { day: 'Tue', active: false },
    { day: 'Wed', active: false },
    { day: 'Thu', active: false },
    { day: 'Fri', active: false },
    { day: 'Sat', active: false },
    { day: 'Sun', active: false }
  ];

  const getTimeLeft = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - now;
    if (diff <= 0) return 'Ended';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    return `${d}d : ${h}h : ${m}m`;
  };

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
              <Ionicons name="notifications-outline" size={20} color="#1E293B" />
              {hasUnread && <View style={styles.notificationDot} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.8}
              onPress={() => router.push('/achievements')}
            >
              <Ionicons name="trophy-outline" size={19} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.darkModeToggle, isDarkMode ? styles.darkModeToggleActive : styles.darkModeToggleInactive]} 
              onPress={() => setIsDarkMode(!isDarkMode)}
              activeOpacity={0.85}
            >
              <View style={[styles.toggleThumb, isDarkMode ? styles.toggleThumbRight : styles.toggleThumbLeft]}>
                <Ionicons 
                  name="moon" 
                  size={13} 
                  color={isDarkMode ? '#FFFFFF' : '#4B5563'} 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guest Mode Banner */}
        {!token && (
          <View style={styles.guestCardContainer}>
            <View style={styles.guestCardHeader}>
              <View style={styles.guestPill}>
                <Ionicons name="sparkles" size={13} color="#7C3AED" />
                <AppText style={styles.guestPillText}>Guest Mode</AppText>
              </View>
              <TouchableOpacity
                style={styles.guestSignUpBtn}
                onPress={() => router.push('/(auth)/signup')}
                activeOpacity={0.8}
              >
                <AppText style={styles.guestSignUpBtnText}>Sign Up / Log In</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* In-Progress Exam Banner */}
        {activeAttempt && (
          <View style={styles.resumeCard}>
            <View style={styles.resumeHeaderRow}>
              <View style={styles.resumeBadge}>
                <View style={styles.resumePulseDot} />
                <AppText style={styles.resumeBadgeText}>UNFINISHED TEST IN PROGRESS</AppText>
              </View>
              <TouchableOpacity onPress={handleDismissActiveExam} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.resumeBody}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppText style={styles.resumeTitle} numberOfLines={1}>{activeAttempt.title}</AppText>
                <View style={styles.resumeStatsRow}>
                  <View style={styles.resumeStatItem}>
                    <Ionicons name="time-outline" size={14} color="#D97706" />
                    <AppText style={styles.resumeStatText}>
                      {formatRemainingTime(activeAttempt.remaining_seconds)} remaining
                    </AppText>
                  </View>
                  {activeAttempt.total_questions ? (
                    <View style={styles.resumeStatItem}>
                      <Ionicons name="checkbox-outline" size={14} color="#64748B" />
                      <AppText style={styles.resumeStatText}>
                        {activeAttempt.answered_count || 0}/{activeAttempt.total_questions} answered
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={styles.resumeButton}
                activeOpacity={0.85}
                onPress={() => handleResumeExam(activeAttempt)}
              >
                <AppText style={styles.resumeButtonText}>Resume</AppText>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              <Feather name="trending-up" size={13} color="#10B981" />
              <AppText style={styles.improveBadgeText}>Improve</AppText>
            </View>
            
            <View style={[styles.badge, styles.achieveBadge]}>
              <Feather name="award" size={13} color="#7C3AED" />
              <AppText style={styles.achieveBadgeText}>Achieve</AppText>
            </View>
            
            <View style={[styles.badge, styles.learnBadge]}>
              <Feather name="book-open" size={13} color="#F59E0B" />
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
            <Image source={require('../../../assets/images/jamb-bg.png')} style={[StyleSheet.absoluteFill, { borderRadius: 20, opacity: 0.9 }]} contentFit="cover" />
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
            <Image source={require('../../../assets/images/ielts-bg.png')} style={[StyleSheet.absoluteFill, { borderRadius: 20, opacity: 0.9 }]} contentFit="cover" />
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
            { id: 4, name: 'Achievements', image: require('../../../assets/images/qa-achievements.png'), bg: '#FFE4E6', route: '/(tabs)/achievements' },
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
        {!contestLoading && activeContest && (
          <View style={styles.contestCard}>
            <View style={styles.contestHeader}>
              <Image source={require('../../../assets/images/contest-trophy.png')} style={styles.contestTrophy} contentFit="contain" />
              
              <View style={styles.contestMainInfo}>
                <View style={styles.contestTag}>
                  <Image source={require('../../../assets/images/contest-star-icon.png')} style={{ width: 11, height: 11 }} contentFit="contain" />
                  <AppText style={styles.contestTagText}>Contest Zone</AppText>
                </View>
                <AppText style={styles.contestTitle}>{activeContest.title}</AppText>
                <AppText style={styles.contestSubtitle}>{activeContest.description}</AppText>
                <TouchableOpacity style={styles.contestButton} activeOpacity={0.85} onPress={() => router.push('/(tabs)/contest' as any)}>
                  <AppText style={styles.contestButtonText}>View Contests</AppText>
                  <Image source={require('../../../assets/images/arrow-right-sm-icon.png')} style={{ width: 10, height: 10, tintColor: '#FFF' }} contentFit="contain" />
                </TouchableOpacity>
              </View>

              <View style={styles.contestLeaderboard}>
                <AppText style={styles.leaderboardTitle}>Top 3 Leaderboard</AppText>
                {contestLeaderboard.length === 0 ? (
                  <AppText style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4 }}>No participants yet.</AppText>
                ) : (
                  contestLeaderboard.slice(0, 3).map((item: any, index: number) => {
                    const colors = ['#F59E0B', '#9CA3AF', '#D97706'];
                    return (
                      <View key={item.id || index} style={styles.leaderboardRow}>
                        <View style={[styles.rankBadge, { backgroundColor: colors[index] || '#6B7280' }]}>
                          <AppText style={styles.rankText}>{index + 1}</AppText>
                        </View>
                        <AppText style={styles.leaderboardName} numberOfLines={1}>{item.user_name || 'Participant'}</AppText>
                        <AppText style={styles.leaderboardScore}>{item.score}</AppText>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            <View style={styles.contestFooter}>
              {activeContest.status === 'live' ? (
                <View style={styles.contestStat}>
                  <View style={styles.contestStatHeader}>
                    <Image source={require('../../../assets/images/contest-time-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                    <AppText style={styles.statLabel}>Time Left</AppText>
                  </View>
                  <AppText style={styles.statValue}>{getTimeLeft(activeContest.end_time)}</AppText>
                </View>
              ) : (
                <View style={styles.contestStat}>
                  <View style={styles.contestStatHeader}>
                    <Image source={require('../../../assets/images/contest-time-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                    <AppText style={styles.statLabel}>Status</AppText>
                  </View>
                  <AppText style={styles.statValue}>
                    {activeContest.status === 'upcoming' ? 'Upcoming' : 'Ended'}
                  </AppText>
                </View>
              )}
              
              <View style={styles.contestStat}>
                <View style={styles.contestStatHeader}>
                  <Image source={require('../../../assets/images/contest-participants-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                  <AppText style={styles.statLabel}>Participants</AppText>
                </View>
                <AppText style={styles.statValue}>{activeContest.participants_count}</AppText>
              </View>

              <View style={styles.contestStat}>
                <View style={styles.contestStatHeader}>
                  <Image source={require('../../../assets/images/contest-prize-icon.png')} style={{ width: 12, height: 12 }} contentFit="contain" />
                  <AppText style={styles.statLabel}>Prize Pool</AppText>
                </View>
                <AppText style={styles.statValue}>₦{Number(activeContest.prize_pool).toLocaleString()}</AppText>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Row: Your Progress & Daily Streak */}
        <View style={styles.bottomRow}>
          {/* Your Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.cardHeaderRow}>
              <AppText style={styles.cardTitle}>Your Progress</AppText>
              <AppText style={styles.cardSubtitle}>This Week</AppText>
            </View>
            
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#4C1D95" />
              </View>
            ) : (
              <>
                <View style={styles.progressChartArea}>
                  <View style={styles.donutContainer}>
                    <View style={[styles.donutCircle, { borderTopColor: '#2563EB', borderRightColor: overall.correct_pct > 25 ? '#2563EB' : '#E5E7EB', borderBottomColor: overall.correct_pct > 50 ? '#2563EB' : '#E5E7EB', borderLeftColor: overall.correct_pct > 75 ? '#2563EB' : '#E5E7EB' }]}>
                      <AppText style={styles.progressPercent}>{overall.correct_pct}%</AppText>
                    </View>
                  </View>
                  <View style={styles.progressLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                      <AppText style={styles.legendText}>Correct {overall.correct_count}</AppText>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                      <AppText style={styles.legendText}>Incorrect {overall.incorrect_count}</AppText>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.dot, { backgroundColor: '#9CA3AF' }]} />
                      <AppText style={styles.legendText}>Unattempted {overall.unattempted_count}</AppText>
                    </View>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/reports')}>
                  <AppText style={styles.linkText}>See Detailed Report ›</AppText>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Daily Streak Card */}
          <TouchableOpacity style={styles.streakCard} activeOpacity={0.8} onPress={() => router.push('/streak')}>
            <AppText style={styles.cardTitle}>Daily Streak 🔥</AppText>
            <AppText style={styles.streakNumber}>{currentStreak} <AppText style={styles.streakLabel}>Days in a row!</AppText></AppText>
            
            <View style={styles.daysRow}>
              {loading ? (
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color="#4C1D95" />
                </View>
              ) : (
                trend.map((dayObj: any, i: number) => (
                  <View key={dayObj.day} style={styles.dayItem}>
                    <View style={[styles.dayCircle, dayObj.active ? styles.dayActive : styles.dayInactive]}>
                      {dayObj.active && <Image source={require('../../../assets/images/streak-check-icon.png')} style={{ width: 9, height: 9 }} contentFit="contain" />}
                    </View>
                    <AppText style={styles.dayText}>{dayObj.day}</AppText>
                  </View>
                ))
              )}
            </View>
            <AppText style={styles.streakSubText}>
              {currentStreak > 0 ? "Keep it up! You're on fire!" : "Start practicing to build your streak!"}
            </AppText>
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
    paddingHorizontal: 9, 
    paddingVertical: 5, 
    borderRadius: 14, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 4, 
    elevation: 3, 
    gap: 5 
  },
  improveBadge: { top: 6, left: -20 },
  improveBadgeText: { fontSize: 11, fontWeight: '800', color: '#10B981' },
  achieveBadge: { top: 54, right: -12 },
  achieveBadgeText: { fontSize: 11, fontWeight: '800', color: '#7C3AED' },
  learnBadge: { bottom: 6, left: 10 },
  learnBadgeText: { fontSize: 11, fontWeight: '800', color: '#F59E0B' },


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
  streakSubText: { color: '#6D28D9', fontSize: 11, fontWeight: '800' },

  // Resume In-Progress Exam Card
  resumeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resumeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  resumePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  resumeBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  resumeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumeTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  resumeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  resumeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resumeStatText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
  },
  resumeButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  // Guest Mode Card
  guestCardContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  guestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  guestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  guestPillText: {
    fontSize: 11.5,
    fontFamily: 'Inter_700Bold',
    color: '#6D28D9',
  },
  guestSignUpBtn: {
    backgroundColor: '#6D28D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  guestSignUpBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  guestCardTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  guestCardDesc: {
    fontSize: 12.5,
    color: '#4C1D95',
    lineHeight: 18,
    marginBottom: 14,
  },
  guestQuickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  guestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 6,
  },
  guestChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#6D28D9',
  },
});


