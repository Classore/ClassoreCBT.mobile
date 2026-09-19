import { AppText } from '@/components/AppText';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { examService, isSectionBasedExam } from '@/services/exam';
import { storage } from '@/services/storage';
import { paymentService, ServiceBundle } from '@/services/payment';

interface PracticeItem {
  id: string | number;
  title: string;
  totalQuestions: number;
  answeredQuestions: number;
  lastPracticed: string;
  status: 'in_progress' | 'completed' | string;
  attemptId?: number;
  examTypeId?: number;
  isSectionBased?: boolean;
}

const formatRelativeTime = (dateStr?: string | number | null): string => {
  if (!dateStr) return 'Last practiced recently';
  const timeMs = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diffMs = Date.now() - timeMs;
  if (isNaN(diffMs) || diffMs < 0) return 'Last practiced recently';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Last practiced just now';
  if (diffMinutes < 60) return `Last practiced ${diffMinutes}m ago`;
  if (diffHours < 24) return `Last practiced ${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Last practiced yesterday';
  if (diffDays < 30) return `Last practiced ${diffDays} days ago`;
  return 'Last practiced recently';
};

const isIeltsAttempt = (item: any, examsList?: any[]): boolean => {
  const examId = Number(item.exam_type || item.exam_type_id || item.examTypeId);
  if (examId === 42) return true;

  const examObj = examsList?.find((e: any) => e.id === examId);
  const nameStr = [
    item.title,
    item.exam_name,
    item.exam_type_name,
    item.name,
    examObj?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    nameStr.includes('ielts') ||
    nameStr.includes('english') ||
    nameStr.includes('toefl') ||
    nameStr.includes('speaking') ||
    nameStr.includes('listening') ||
    nameStr.includes('writing') ||
    nameStr.includes('reading')
  ) {
    return true;
  }

  if (Array.isArray(item.sections)) {
    return item.sections.some((s: any) => {
      const sName = (s.name || s.section_name || '').toLowerCase();
      return ['listening', 'reading', 'writing', 'speaking'].includes(sName);
    });
  }

  return false;
};

export default function PracticeHubScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const userStreak = user?.streak ?? 120;

  // Default fallback items with both JAMB and IELTS representation
  const defaultItems: PracticeItem[] = [
    {
      id: 'default-ongoing',
      title: 'JAMB Practice Test',
      totalQuestions: 60,
      answeredQuestions: 0,
      lastPracticed: 'Start practicing',
      status: 'in_progress',
      examTypeId: 41,
      isSectionBased: false,
    },
    {
      id: 'default-completed',
      title: 'IELTS Academic Test',
      totalQuestions: 40,
      answeredQuestions: 0,
      lastPracticed: 'Start practicing',
      status: 'in_progress',
      examTypeId: 42,
      isSectionBased: true,
    },
  ];

  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>(defaultItems);

  const loadPracticeHistory = useCallback(async () => {
    try {
      // 1. Fetch from multiple sources in parallel: local recent cache, active attempt, backend history, and last attempt details
      const [
        localRecent,
        activeLocal,
        allExams,
        backendHistory,
        ieltsLastAttempt,
        jambLastAttempt,
      ] = await Promise.all([
        examService.getRecentAttempts().catch(() => []),
        storage.get<any>('@classore_active_attempt').catch(() => null),
        examService.getExams().catch(() => examService.getCachedExamsSync() || []),
        examService.getExamHistory().catch(() => []),
        examService.getLastAttemptDetails(42).catch(() => null),
        examService.getLastAttemptDetails(41).catch(() => null),
      ]);

      const gatheredAttempts: any[] = [];
      const seenIds = new Set<number>();

      const addAttemptIfNew = (raw: any, defaultStatus?: string) => {
        if (!raw) return;
        const id = Number(raw.id || raw.attempt_id);
        if (id && seenIds.has(id)) return;
        if (id) seenIds.add(id);

        const isIelts = isIeltsAttempt(raw, allExams);
        const examId = Number(raw.exam_type || raw.exam_type_id || (isIelts ? 42 : 41));
        const examObj = allExams?.find((e: any) => e.id === examId);

        let title = raw.title || raw.exam_name || raw.exam_type_name || examObj?.name;
        if (!title || title === 'Standard Exam' || title === 'In-Progress Exam') {
          title = isIelts ? 'IELTS Academic Test' : 'JAMB Practice Test';
        }

        let total = raw.total_questions !== undefined && raw.total_questions !== null
          ? Number(raw.total_questions)
          : (raw.totalQuestions !== undefined && raw.totalQuestions !== null ? Number(raw.totalQuestions) : 0);

        let answered = raw.answered_questions !== undefined && raw.answered_questions !== null
          ? Number(raw.answered_questions)
          : (raw.answeredQuestions !== undefined && raw.answeredQuestions !== null
              ? Number(raw.answeredQuestions)
              : (raw.answered_count !== undefined && raw.answered_count !== null ? Number(raw.answered_count) : null));

        if ((!total || total <= 0) && Array.isArray(raw.sections)) {
          let secTotal = 0;
          let secAns = 0;
          raw.sections.forEach((sec: any) => {
            sec.question_groups?.forEach((grp: any) => {
              secTotal += grp.responses?.length || 0;
              grp.responses?.forEach((r: any) => {
                if (r.selected_choice || r.written_response || (r.metadata && Object.keys(r.metadata).length > 0) || r.audio_response) {
                  secAns++;
                }
              });
            });
          });
          if (secTotal > 0) {
            total = secTotal;
            if (answered === null) {
              answered = secAns;
            }
          }
        }

        if (!total || total <= 0) {
          total = isIelts ? 40 : 60;
        }

        const rawStatus = String(raw.status || defaultStatus || '').toLowerCase();
        let status = (rawStatus.includes('progress') || rawStatus === 'started' || rawStatus === 'active') ? 'in_progress' : 'completed';

        // Check time expiration: if elapsed time >= duration, treat as completed
        const startTimeStr = raw.start_time || raw.timestamp;
        if (status === 'in_progress' && startTimeStr) {
          const startTimeMs = new Date(startTimeStr).getTime();
          if (!isNaN(startTimeMs) && startTimeMs > 0) {
            const durationMinutes = Number(raw.time_limit_override || raw.duration_minutes || (isIelts ? 60 : 120));
            const durationMs = durationMinutes * 60 * 1000;
            if (Date.now() - startTimeMs >= durationMs) {
              status = 'completed';
            }
          }
        }

        // Clean up active local attempt storage if this attempt is now completed
        if (status === 'completed' && activeLocal?.id && Number(activeLocal.id) === id) {
          storage.remove('@classore_active_attempt').catch(() => {});
        }

        if (answered === null || answered === undefined || isNaN(answered)) {
          answered = 0;
        }

        answered = Math.max(0, Math.min(total, answered));

        gatheredAttempts.push({
          id: id || `item-${Date.now()}-${Math.random()}`,
          title,
          totalQuestions: total,
          answeredQuestions: Math.min(total, answered),
          lastPracticed: formatRelativeTime(raw.timestamp || raw.end_time || raw.start_time),
          status,
          attemptId: id,
          examTypeId: examId,
          isSectionBased: isIelts || isSectionBasedExam(title, raw.sections),
          rawTime: new Date(raw.timestamp || raw.end_time || raw.start_time || 0).getTime(),
        });
      };

      // 1. Authoritative backend history list first
      if (Array.isArray(backendHistory)) {
        backendHistory.forEach(item => addAttemptIfNew(item));
      }

      // 2. Backend IELTS last attempt
      if (ieltsLastAttempt?.attempt) {
        addAttemptIfNew({ ...ieltsLastAttempt.attempt, exam_type: 42, title: 'IELTS Academic Test' });
      } else if (ieltsLastAttempt?.id) {
        addAttemptIfNew({ ...ieltsLastAttempt, exam_type: 42, title: 'IELTS Academic Test' });
      }

      // 3. Backend JAMB last attempt
      if (jambLastAttempt?.attempt) {
        addAttemptIfNew({ ...jambLastAttempt.attempt, exam_type: 41 });
      } else if (jambLastAttempt?.id) {
        addAttemptIfNew({ ...jambLastAttempt, exam_type: 41 });
      }

      // 4. Local recent records
      if (Array.isArray(localRecent)) {
        localRecent.forEach(rec => addAttemptIfNew(rec));
      }

      // 5. In-progress local active attempt (only if not already finalized or seen)
      if (activeLocal?.id) {
        addAttemptIfNew(activeLocal, 'in_progress');
      }

      if (gatheredAttempts.length > 0) {
        // Sort: in_progress first, then newest completed
        gatheredAttempts.sort((a, b) => {
          if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
          if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
          return (b.rawTime || 0) - (a.rawTime || 0);
        });

        setPracticeItems(gatheredAttempts.slice(0, 6));
        return;
      }

      setPracticeItems(defaultItems);
    } catch (e) {
      console.warn('Failed to load practice history:', e);
      setPracticeItems(defaultItems);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPracticeHistory();
    }, [loadPracticeHistory])
  );

  const handleContinue = (item: PracticeItem) => {
    // If the attempt is completed, redirect directly to review
    if (item.status !== 'in_progress') {
      handleReview(item);
      return;
    }
    if (item.attemptId) {
      if (item.isSectionBased) {
        router.push({
          pathname: '/(exam)/ielts-session',
          params: { attempt_id: String(item.attemptId) }
        });
      } else {
        router.push({
          pathname: '/(exam)/session',
          params: {
            attempt_id: String(item.attemptId),
            exam_name: item.title,
          }
        });
      }
    } else {
      router.push({
        pathname: '/(tabs)/practice/practice-setup',
        params: {
          exam: item.examTypeId ? String(item.examTypeId) : '41',
          exam_name: item.title,
        }
      });
    }
  };

  const handleReview = (item: PracticeItem) => {
    router.push({
      pathname: '/(exam)/test-result',
      params: {
        attempt_id: item.attemptId ? String(item.attemptId) : '1',
      }
    });
  };

  const handleCardPress = (item: PracticeItem) => {
    if (item.status === 'in_progress') {
      handleContinue(item);
    } else {
      handleReview(item);
    }
  };

  const handleViewBundle = async (bundleName: string, tokens: number) => {
    try {
      const bundles = await paymentService.getServiceBundles();
      const lower = bundleName.toLowerCase();
      const matched = bundles.find(b => {
        const bName = b.name.toLowerCase();
        if (lower.includes('jamb') && bName.includes('jamb')) return true;
        if ((lower.includes('ielts') || lower.includes('english')) && (bName.includes('ielts') || bName.includes('english'))) return true;
        return bName === lower;
      });

      if (matched) {
        router.push({
          pathname: '/(tabs)/bundles/details',
          params: {
            bundle_id: String(matched.id),
            bundle_name: matched.name,
            token_cost: String(matched.token_cost),
            billing_type: matched.billing_type || 'monthly',
            bundle_data: JSON.stringify(matched),
          }
        });
        return;
      }
    } catch (e) {
      console.warn('Failed to resolve bundle for details screen:', e);
    }

    // Fallback if bundles call fails or no match is found
    const fallbackId = bundleName.toLowerCase().includes('jamb') ? '18' : '2';
    router.push({
      pathname: '/(tabs)/bundles/details',
      params: {
        bundle_id: fallbackId,
        bundle_name: bundleName,
        token_cost: String(tokens),
        billing_type: 'monthly',
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={20} color="#0F172A" />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>Practice</AppText>

        <View style={styles.streakBadge}>
          <AppText style={styles.streakEmoji}>🔥</AppText>
          <AppText style={styles.streakText}>{userStreak}</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Continue Practicing */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Continue Practicing</AppText>
        </View>

        {practiceItems.map((item) => {
          const isOngoing = item.status === 'in_progress';
          const totalQ = item.totalQuestions > 0 ? item.totalQuestions : 1;
          const progressPct = item.totalQuestions > 0
            ? Math.min(100, Math.max(0, Math.round((item.answeredQuestions / totalQ) * 100)))
            : 0;

          const isIelts = Boolean(item.isSectionBased || isIeltsAttempt(item));
          const iconSource = isIelts
            ? require('../../../assets/images/exam-ielts-icon.png')
            : require('../../../assets/images/exam-jamb-icon.png');

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.practiceCard}
              activeOpacity={0.9}
              onPress={() => handleCardPress(item)}
            >
              {/* Card Top Row */}
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.iconContainer,
                    isIelts && styles.ieltsIconContainer,
                  ]}
                >
                  <Image
                    source={iconSource}
                    style={styles.examIcon}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.cardHeaderInfo}>
                  <AppText style={styles.cardTitle}>{item.title}</AppText>
                  <AppText style={styles.cardSubtitle}>
                    {item.totalQuestions} Questions
                  </AppText>
                </View>
                <Feather name="chevron-right" size={18} color="#CBD5E1" />
              </View>

              {/* Progress Bar Row */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progressPct}%` }]}
                  />
                </View>
                <AppText style={styles.progressNumber}>
                  {item.answeredQuestions} / {item.totalQuestions}
                </AppText>
              </View>

              {/* Card Footer Row */}
              <View style={styles.cardFooterRow}>
                <View style={styles.timeRow}>
                  <Feather name="clock" size={14} color="#94A3B8" />
                  <AppText style={styles.lastPracticedText}>
                    {item.lastPracticed}
                  </AppText>
                </View>

                {/* Continue / Review Button */}
                <TouchableOpacity
                  style={isOngoing ? styles.continueButton : styles.reviewButton}
                  activeOpacity={0.8}
                  onPress={() => (isOngoing ? handleContinue(item) : handleReview(item))}
                >
                  <AppText
                    style={isOngoing ? styles.continueButtonText : styles.reviewButtonText}
                  >
                    {isOngoing ? 'Continue' : 'Review'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Section 2: Popular Bundles */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <AppText style={styles.sectionTitle}>Popular Bundles</AppText>
        </View>

        {/* Bundle 1: Full JAMB Package */}
        <View style={styles.jambBundleCard}>
          <View style={styles.bundleTopRow}>
            <View style={styles.jambIconBox}>
              <Image
                source={require('../../../assets/images/exam-jamb-icon.png')}
                style={styles.bundleIcon}
                contentFit="contain"
              />
            </View>
            <View style={styles.bundleInfo}>
              <AppText style={styles.bundleTitle}>Full JAMB Package</AppText>
              <AppText style={styles.bundleDescLine}>
                Best for 2026 candidates
              </AppText>
              <AppText style={styles.bundleDescLine}>
                English, Mathematics, Biology, Chemistry
              </AppText>
              <AppText style={styles.bundleDescLine}>
                Unlimited practice
              </AppText>
            </View>
          </View>

          <View style={styles.bundleBottomRow}>
            <AppText style={styles.bundlePriceText}>6 tokens / month</AppText>
            <TouchableOpacity
              style={styles.bundleButton}
              activeOpacity={0.8}
              onPress={() => handleViewBundle('Full JAMB Package', 6)}
            >
              <AppText style={styles.bundleButtonText}>View</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bundle 2: English Bundle */}
        <View style={styles.englishBundleCard}>
          {/* Popular Tag */}
          <View style={styles.popularBadge}>
            <AppText style={styles.popularBadgeText}>Popular</AppText>
          </View>

          <View style={styles.bundleTopRow}>
            <View style={styles.ieltsIconBox}>
              <Image
                source={require('../../../assets/images/exam-ielts-icon.png')}
                style={styles.bundleIcon}
                contentFit="contain"
              />
            </View>
            <View style={styles.bundleInfo}>
              <AppText style={styles.bundleTitle}>English Bundle</AppText>
              <AppText style={styles.bundleDescLine}>
                Listening, Reading, Speaking & Writing
              </AppText>
              <AppText style={styles.bundleDescLine}>
                Listening & Reading Unlimited
              </AppText>
              <AppText style={styles.bundleDescLine}>
                Speaking: 3 assessments
              </AppText>
              <AppText style={styles.bundleDescLine}>
                Writing: 3 assessments
              </AppText>
            </View>
          </View>

          <View style={styles.bundleBottomRow}>
            <AppText style={styles.bundlePriceText}>100 tokens / month</AppText>
            <TouchableOpacity
              style={styles.bundleButton}
              activeOpacity={0.8}
              onPress={() => handleViewBundle('English Bundle', 100)}
            >
              <AppText style={styles.bundleButtonText}>View</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom space for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#6D28D9',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },

  // Practice Card
  practiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ieltsIconContainer: {
    backgroundColor: '#FFE4E6',
  },
  examIcon: {
    width: 28,
    height: 28,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F3E8FF',
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6D28D9',
  },
  progressNumber: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastPracticedText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },
  continueButton: {
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
  },
  continueButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#6D28D9',
  },
  reviewButton: {
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  reviewButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#6D28D9',
  },

  // Popular Bundles
  jambBundleCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 18,
    marginBottom: 16,
  },
  englishBundleCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: 18,
    marginBottom: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#BE123C',
  },
  bundleTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jambIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ieltsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bundleIcon: {
    width: 28,
    height: 28,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  bundleDescLine: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  bundleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 10,
  },
  bundlePriceText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  bundleButton: {
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
  },
  bundleButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#6D28D9',
  },
});
