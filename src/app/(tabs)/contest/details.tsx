import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { contestService, Contest } from '@/services/contest';

export default function ContestDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; registered?: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse if registered
  const isRegisteredParam = params.registered === 'true';
  const [isRegistered, setIsRegistered] = useState(isRegisteredParam);

  // Live countdown state for registered view
  const [timeLeft, setTimeLeft] = useState({
    days: '06',
    hours: '09',
    minutes: '30',
    seconds: '15',
  });

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const data = await contestService.getContestById(params.id || 1);
        setContest(data);
        if (params.registered !== undefined) {
          setIsRegistered(params.registered === 'true');
        } else {
          setIsRegistered(Boolean(data.has_joined));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
  }, [params.id, params.registered]);

  // Real-time tick effect for countdown
  useEffect(() => {
    let totalSecs = 6 * 86400 + 9 * 3600 + 30 * 60 + 15;
    if (contest?.start_time) {
      const startTimeMs = new Date(contest.start_time).getTime();
      const diffMs = startTimeMs - Date.now();
      if (!isNaN(diffMs) && diffMs > 0) {
        totalSecs = Math.floor(diffMs / 1000);
      }
    }
    const interval = setInterval(() => {
      totalSecs = Math.max(0, totalSecs - 1);
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [contest?.start_time]);

  if (loading || !contest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/contest' as any))}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Contest Zone</AppText>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color="#111827" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Card */}
          <LinearGradient
            colors={['#43188F', '#581C87', '#6B21A8']}
            style={styles.bannerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerContent}>
              <AppText style={styles.bannerTitle}>{contest.title}</AppText>
              <View style={styles.bannerMetaRow}>
                <View style={styles.bannerMetaItem}>
                  <Feather name="users" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <AppText style={styles.bannerMetaText}>
                    {contest.participants_count ? `${Number(contest.participants_count).toLocaleString()}+ Students` : '0 Students'}
                  </AppText>
                </View>
                <View style={styles.bannerMetaItem}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <AppText style={styles.bannerMetaText}>{contest.target_audience || 'All Students'}</AppText>
                </View>
              </View>
              <AppText style={styles.bannerFeeText}>
                Entry Fee - {contest.entry_fee_formatted || (contest.entry_fee_tokens ? `#${contest.entry_fee_tokens.toLocaleString()}` : 'Free')}
              </AppText>
            </View>

            <View style={styles.bannerTrophyContainer}>
              <Image
                source={require('../../../../assets/images/contest-hero-trophy.png')}
                style={styles.bannerTrophyImage}
                contentFit="contain"
              />
            </View>
          </LinearGradient>

          {isRegistered ? (
            /* REGISTERED VIEW (After Payment / Joined) */
            <View style={styles.registeredSection}>
              {/* Countdown Timer Header */}
              <View style={styles.countdownHeaderRow}>
                <Feather name="clock" size={16} color="#6D28D9" style={{ marginRight: 6 }} />
                <AppText style={styles.countdownHeaderTitle}>Starts In</AppText>
              </View>

              {/* 4 Large Digit Blocks */}
              <View style={styles.timerRow}>
                <View style={styles.timerBlock}>
                  <AppText style={styles.timerDigits}>{timeLeft.days}</AppText>
                  <AppText style={styles.timerLabel}>Days</AppText>
                </View>
                <AppText style={styles.timerColon}>:</AppText>
                <View style={styles.timerBlock}>
                  <AppText style={styles.timerDigits}>{timeLeft.hours}</AppText>
                  <AppText style={styles.timerLabel}>Hours</AppText>
                </View>
                <AppText style={styles.timerColon}>:</AppText>
                <View style={styles.timerBlock}>
                  <AppText style={styles.timerDigits}>{timeLeft.minutes}</AppText>
                  <AppText style={styles.timerLabel}>Minutes</AppText>
                </View>
                <AppText style={styles.timerColon}>:</AppText>
                <View style={styles.timerBlock}>
                  <AppText style={styles.timerDigits}>{timeLeft.seconds}</AppText>
                  <AppText style={styles.timerLabel}>Seconds</AppText>
                </View>
              </View>

              <View style={styles.dividerLine} />

              {/* Contest Metadata Table */}
              <View style={styles.specsTable}>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Contest Date</AppText>
                  <AppText style={styles.tableValueBold}>{contest.date_formatted || 'Sat, 10th May 2025 - 10:00 AM'}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Duration</AppText>
                  <AppText style={styles.tableValueBold}>
                    {contest.duration_minutes ? `${contest.duration_minutes} minutes` : '90 minutes'}
                  </AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Questions</AppText>
                  <AppText style={styles.tableValueBold}>{contest.questions_count || 100}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Total Marks</AppText>
                  <AppText style={styles.tableValueBold}>{contest.total_marks || 100}</AppText>
                </View>
              </View>

              {/* Be Ready Card */}
              <View style={styles.beReadyCard}>
                <AppText style={styles.beReadyTitle}>Be Ready!</AppText>
                <AppText style={styles.beReadyText}>
                  The contest will start automatically at the scheduled time.
                </AppText>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/contest/rules',
                    params: { id: contest.id, registered: 'true' },
                  });
                }}
              >
                <AppText style={styles.primaryButtonText}>View Rules</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            /* UNREGISTERED VIEW (Join Flow) */
            <View style={styles.unregisteredSection}>
              {/* Info Table */}
              <View style={styles.specsTable}>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Contest Type</AppText>
                  <AppText style={styles.tableValueBold}>Paid</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Sponsored by</AppText>
                  <AppText style={styles.tableValueBold}>{contest.sponsored_by || 'Classore'}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Entry Fee</AppText>
                  <AppText style={styles.tableValueBold}>{contest.entry_fee_formatted || '#12,000'}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Prize Pool</AppText>
                  <AppText style={styles.tableValueBold}>{contest.prize_pool || '#1,000,000'}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Prize Fund</AppText>
                  <AppText style={styles.tableValueBold}>{contest.prize_fund || '#300,000'}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Starts In</AppText>
                  <AppText style={styles.tableValueBold}>{contest.starts_in || '06d 10h 30m'}</AppText>
                </View>
                <View style={styles.tableRow}>
                  <AppText style={styles.tableLabel}>Date</AppText>
                  <AppText style={styles.tableValueBold}>{contest.date_formatted || 'Sat, 10th Sept 2026 - 10:00 AM'}</AppText>
                </View>
              </View>

              {/* About This Contest */}
              <View style={styles.aboutSection}>
                <AppText style={styles.aboutTitle}>About this contest</AppText>
                <AppText style={styles.aboutText}>
                  {contest.description ||
                    'Challenge your knowledge and compete with the best minds across the country. Top performers win amazing prizes!'}
                </AppText>
              </View>

              {/* Rules Shortcut */}
              <View style={styles.rulesRow}>
                <AppText style={styles.rulesTitle}>Rules</AppText>
                <TouchableOpacity
                  style={styles.viewRulesLink}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/contest/rules',
                      params: { id: contest.id },
                    });
                  }}
                >
                  <AppText style={styles.viewRulesLinkText}>View Full Rules</AppText>
                  <Feather name="arrow-right" size={14} color="#6D28D9" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {/* Register Now Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/contest/rules',
                    params: { id: contest.id },
                  });
                }}
              >
                <AppText style={styles.primaryButtonText}>Register Now</AppText>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 110 }} />
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
  },
  iconButton: {
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
    fontWeight: '700',
    color: '#111827',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bannerCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    minHeight: 140,
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
    paddingRight: 70,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  bannerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerMetaText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bannerFeeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bannerTrophyContainer: {
    position: 'absolute',
    right: 6,
    bottom: -4,
    width: 105,
    height: 115,
    zIndex: 1,
  },
  bannerTrophyImage: {
    width: '100%',
    height: '100%',
  },
  registeredSection: {
    marginTop: 6,
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4C1D95',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timerBlock: {
    alignItems: 'center',
    minWidth: 50,
  },
  timerDigits: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  timerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  timerColon: {
    fontSize: 26,
    fontWeight: '700',
    color: '#9CA3AF',
    marginHorizontal: 8,
    marginTop: -16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  unregisteredSection: {
    marginTop: 0,
  },
  specsTable: {
    marginBottom: 18,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tableValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  beReadyCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
  },
  beReadyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  beReadyText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  aboutSection: {
    marginVertical: 14,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  aboutText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  rulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  viewRulesLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewRulesLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D28D9',
  },
  primaryButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
