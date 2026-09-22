import {
  useAuth } from '@/context/AuthContext';
import React from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

interface SubjectItem {
  id: string;
  name: string;
  score: number;
  total: number;
  percentage: number;
  rating: 'Excellent' | 'Good' | 'Poor';
  icon: string;
  iconBg: string;
  iconColor: string;
}

export default function SubjectPerformanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    attempt_id?: string;
    subject?: string;
    exam_name?: string;
    is_ielts?: string;
  }>();

  const detectedIsIelts = Boolean(
    params.is_ielts === 'true' ||
    (params.exam_name && (params.exam_name.toLowerCase().includes('ielts') || params.exam_name.toLowerCase().includes('toefl')))
  );

  const [examTitle, setExamTitle] = React.useState<string>(
    params.exam_name || (detectedIsIelts ? 'IELTS Academic Test' : 'Subject Performance')
  );
  const [loading, setLoading] = React.useState<boolean>(Boolean(params.attempt_id));
  const [overallAccuracy, setOverallAccuracy] = React.useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = React.useState<number>(0);
  const [subjectList, setSubjectList] = React.useState<SubjectItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadPerformance = async () => {
      if (!params.attempt_id) {
        setError('No exam session ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await examService.getDetailedAnalytics(Number(params.attempt_id));
        if (data) {
          const isIeltsAttempt = 
            detectedIsIelts ||
            Boolean(data.exam_name && (data.exam_name.toLowerCase().includes('ielts') || data.exam_name.toLowerCase().includes('toefl'))) ||
            Boolean(data.subjects && data.subjects.some((s: any) => ['reading', 'listening', 'writing', 'speaking'].includes((s.section_name || '').toLowerCase())));

          if (data.exam_name) {
            setExamTitle(data.exam_name);
          } else if (params.exam_name) {
            setExamTitle(params.exam_name);
          } else if (isIeltsAttempt) {
            setExamTitle('IELTS Academic Test');
          }

          if (data.overall_accuracy !== undefined) {
            setOverallAccuracy(Math.round(data.overall_accuracy));
          }
          if (data.total_questions_attempted !== undefined) {
            setTotalQuestions(data.total_questions_attempted);
          }
          if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
            const icons = [
              { icon: 'book-open-outline', iconBg: '#EDE9FE', iconColor: '#7C3AED' },
              { icon: 'function-variant', iconBg: '#DCFCE7', iconColor: '#16A34A' },
              { icon: 'atom', iconBg: '#FEF3C7', iconColor: '#D97706' },
              { icon: 'flask-outline', iconBg: '#FEE2E2', iconColor: '#DC2626' },
            ];
            let calculatedTotalQ = 0;
            const mapped: SubjectItem[] = data.subjects.map((s: any, idx: number) => {
              const pct = Math.round(s.accuracy_percentage ?? (s.total_questions ? (s.score / s.total_questions) * 100 : 0));
              let rating: 'Excellent' | 'Good' | 'Poor' = 'Good';
              if (pct >= 70) rating = 'Excellent';
              else if (pct < 45) rating = 'Poor';

              const qCount = s.total_questions || 0;
              calculatedTotalQ += qCount;

              const iconStyle = icons[idx % icons.length];
              return {
                id: String(s.section_name || idx),
                name: s.section_name,
                score: s.score ?? 0,
                total: qCount,
                percentage: pct,
                rating: rating,
                ...iconStyle
              };
            });

            if (!data.total_questions_attempted && calculatedTotalQ > 0) {
              setTotalQuestions(calculatedTotalQ);
            }
            setSubjectList(mapped);

            if (data.overall_accuracy === undefined && mapped.length > 0) {
              const avg = Math.round(mapped.reduce((acc, curr) => acc + curr.percentage, 0) / mapped.length);
              setOverallAccuracy(avg);
            }
          }
        } else {
          setError('Could not retrieve subject performance data.');
        }
      } catch (e: any) {
        console.warn('Could not fetch subject performance analytics:', e);
        setError('Failed to load subject performance.');
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [params.attempt_id]);

  const subjects = subjectList;

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{examTitle}</Text>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => router.push('/streak')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak || 0}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading subject performance...</Text>
          </View>
        ) : error || subjects.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="file-chart-outline" size={48} color="#94A3B8" />
            <Text style={styles.errorTitle}>No Performance Data</Text>
            <Text style={styles.errorSubtitle}>{error || 'No subject breakdown available for this attempt.'}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Headline Row */}
            <View style={styles.headlineRow}>
              <Text style={styles.mainTitle}>Subject Performance</Text>
              {totalQuestions > 0 && (
                <View style={styles.questionsPill}>
                  <Text style={styles.questionsPillText}>{totalQuestions} Questions</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>See how you performed in each subject</Text>

            {/* Subject Cards List */}
            <View style={styles.subjectList}>
              {subjects.map((sub) => {
                const isExcellent = sub.rating === 'Excellent';
                return (
                  <TouchableOpacity 
                    key={sub.id} 
                    style={styles.subjectCard}
                    onPress={() => router.push({
                      pathname: '/(exam)/topic-performance',
                      params: { 
                        subject: sub.name, 
                        attempt_id: params.attempt_id,
                        exam_name: examTitle,
                        is_ielts: String(detectedIsIelts),
                      }
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.iconBg, { backgroundColor: sub.iconBg }]}>
                        <MaterialCommunityIcons name={sub.icon as any} size={20} color={sub.iconColor} />
                      </View>
                      <View style={styles.subjectInfo}>
                        <Text style={styles.subjectName}>{sub.name}</Text>
                        <Text style={styles.subjectScore}>{sub.score} / {sub.total}</Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.percentageText}>{sub.percentage}%</Text>
                        <View style={[
                          styles.ratingBadge, 
                          isExcellent ? styles.ratingBadgeGreen : styles.ratingBadgeRed
                        ]}>
                          <Text style={[
                            styles.ratingText, 
                            isExcellent ? styles.ratingTextGreen : styles.ratingTextRed
                          ]}>
                            {sub.rating}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Horizontal Progress Bar */}
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${sub.percentage}%` }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Overall Accuracy Card */}
            {overallAccuracy !== null && (
              <View style={styles.accuracyCard}>
                <View style={styles.accuracyIconBg}>
                  <Ionicons name="radio-button-on" size={22} color="#7C3AED" />
                </View>
                <View style={styles.accuracyInfo}>
                  <Text style={styles.accuracyLabel}>Overall Accuracy</Text>
                  <Text style={styles.accuracyValue}>{overallAccuracy}%</Text>
                  <Text style={styles.accuracySub}>Across all subject sections</Text>
                </View>
                <MaterialCommunityIcons name="chart-bar" size={26} color="#94A3B8" />
              </View>
            )}

            {/* View Topic Breakdown Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#F5F3FF', borderWidth: 1.5, borderColor: '#7C3AED', marginBottom: 12 }]}
              onPress={() => router.push({
                pathname: '/(exam)/topic-performance',
                params: { 
                  attempt_id: params.attempt_id,
                  exam_name: examTitle,
                  is_ielts: String(detectedIsIelts),
                }
              })}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>View Topic Breakdown</Text>
            </TouchableOpacity>

            {/* Review Question Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/(exam)/review-answers',
                params: { attempt_id: params.attempt_id }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>Review Questions</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </AppSafeArea>
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
    paddingTop: 12,
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

  // Headline
  headlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  questionsPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  questionsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },

  // Subject List
  subjectList: {
    gap: 12,
    marginBottom: 16,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subjectScore: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  ratingBadgeRed: {
    backgroundColor: '#FEE2E2',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ratingTextGreen: {
    color: '#16A34A',
  },
  ratingTextRed: {
    color: '#DC2626',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#6D28D9',
    borderRadius: 3,
  },

  // Accuracy Card
  accuracyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  accuracyIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  accuracyInfo: {
    flex: 1,
  },
  accuracyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },
  accuracySub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Action Button
  actionButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
