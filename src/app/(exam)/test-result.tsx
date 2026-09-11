import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

export default function TestResultScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();

  const [loading, setLoading] = React.useState<boolean>(Boolean(params.attempt_id));
  const [score, setScore] = React.useState<number | null>(null);
  const [totalScore, setTotalScore] = React.useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = React.useState<number | null>(null);
  const [wrongAnswers, setWrongAnswers] = React.useState<number | null>(null);
  const [skippedQuestions, setSkippedQuestions] = React.useState<number | null>(null);
  const [timeUsedFormatted, setTimeUsedFormatted] = React.useState<string>('-');
  const [performanceTag, setPerformanceTag] = React.useState<string>('Good Performance');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchResults = async () => {
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
          const s = data.total_score !== undefined ? Math.round(data.total_score) : 0;
          const maxS = data.max_total_score ? Math.round(data.max_total_score) : (data.total_questions_attempted || 400);
          setScore(s);
          setTotalScore(maxS);
          setCorrectAnswers(data.correct_answers ?? 0);
          setWrongAnswers(data.wrong_answers ?? 0);
          setSkippedQuestions(data.skipped_questions ?? 0);
          
          if (data.total_time_taken !== undefined) {
            const totalSec = Math.round(data.total_time_taken);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const sec = totalSec % 60;
            if (h > 0) {
              setTimeUsedFormatted(`${h}h ${m}m`);
            } else if (m > 0) {
              setTimeUsedFormatted(`${m}m ${sec}s`);
            } else {
              setTimeUsedFormatted(`${sec}s`);
            }
          }

          const pct = maxS > 0 ? (s / maxS) * 100 : 0;
          if (pct >= 70) setPerformanceTag('Excellent Performance');
          else if (pct >= 50) setPerformanceTag('Good Performance');
          else setPerformanceTag('Needs Improvement');
        } else {
          setError('Could not retrieve result data.');
        }
      } catch (err: any) {
        console.warn('Failed to load detailed analytics:', err);
        setError('Failed to load test results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.attempt_id]);

  const percentage = totalScore && totalScore > 0 ? Math.round(((score ?? 0) / totalScore) * 100) : 0;
  const correctPct = totalScore && totalScore > 0 ? Math.round(((correctAnswers ?? 0) / totalScore) * 100) : 0;
  const wrongPct = totalScore && totalScore > 0 ? Math.round(((wrongAnswers ?? 0) / totalScore) * 100) : 0;
  const skippedPct = totalScore && totalScore > 0 ? Math.round(((skippedQuestions ?? 0) / totalScore) * 100) : 0;

  // SVG Circular progress
  const size = 190;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Jamb Practice Test</Text>
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
            <Text style={styles.loadingText}>Analyzing test results...</Text>
          </View>
        ) : error || score === null ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#94A3B8" />
            <Text style={styles.errorTitle}>Result Unavailable</Text>
            <Text style={styles.errorSubtitle}>{error || 'Could not load results for this session.'}</Text>
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
            {/* Headline */}
            <View style={styles.headlineContainer}>
              <Text style={styles.mainTitle}>
                {percentage >= 70 ? 'Great Job! 🎉' : percentage >= 50 ? 'Good Effort! 👏' : 'Keep Practicing! 💪'}
              </Text>
              <Text style={styles.mainSubtitle}>
                You've completed the JAMB practice test
              </Text>
            </View>

            {/* Score Donut */}
            <View style={styles.donutContainer}>
              <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Background Track */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress Stroke */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#7C3AED"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>

              {/* Inner Content */}
              <View style={styles.donutInner}>
                <Text style={styles.donutLabel}>Your Score</Text>
                <Text style={styles.donutScore}>{score}</Text>
                <Text style={styles.donutTotal}>{score} / {totalScore}</Text>
                <View style={styles.performanceBadge}>
                  <Text style={styles.performanceBadgeText}>{performanceTag}</Text>
                </View>
              </View>
            </View>

            {/* 4-Metric Grid */}
            <View style={styles.metricsGrid}>
              {/* Correct Answers */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#DCFCE7' }]}>
                    <Feather name="check" size={14} color="#16A34A" />
                  </View>
                  <Text style={styles.metricLabel}>Correct Answers</Text>
                </View>
                <Text style={styles.metricValue}>{correctAnswers}</Text>
                <Text style={[styles.metricSub, { color: '#16A34A' }]}>{correctPct}%</Text>
              </View>

              {/* Incorrect Answers */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="x" size={14} color="#DC2626" />
                  </View>
                  <Text style={styles.metricLabel}>Incorrect Answers</Text>
                </View>
                <Text style={styles.metricValue}>{wrongAnswers}</Text>
                <Text style={[styles.metricSub, { color: '#DC2626' }]}>{wrongPct}%</Text>
              </View>

              {/* Unattempted */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#FFEDD5' }]}>
                    <Feather name="minus" size={14} color="#EA580C" />
                  </View>
                  <Text style={styles.metricLabel}>Unattempted</Text>
                </View>
                <Text style={styles.metricValue}>{skippedQuestions}</Text>
                <Text style={[styles.metricSub, { color: '#EA580C' }]}>{skippedPct}%</Text>
              </View>

              {/* Time Used */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <View style={[styles.metricIconBg, { backgroundColor: '#F1F5F9' }]}>
                    <Feather name="clock" size={14} color="#64748B" />
                  </View>
                  <Text style={styles.metricLabel}>Time Used</Text>
                </View>
                <Text style={styles.metricValue}>{timeUsedFormatted}</Text>
                <Text style={[styles.metricSub, { color: '#94A3B8' }]}>total duration</Text>
              </View>
            </View>

            {/* Rank Banner */}
            <TouchableOpacity 
              style={styles.rankCard}
              onPress={() => router.push('/(exam)/leaderboard')}
              activeOpacity={0.8}
            >
              <View style={styles.rankIconBg}>
                <Ionicons name="bar-chart" size={18} color="#7C3AED" />
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankLabel}>Your Rank</Text>
                <Text style={styles.rankValue}>Top {Math.max(1, 100 - percentage)}%</Text>
                <Text style={styles.rankSub}>Based on your score</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* View Subject Performance Button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/(exam)/subject-performance',
                params: { attempt_id: params.attempt_id }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>View Subject Performance</Text>
            </TouchableOpacity>

            {/* View Certificate of Achievement */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#6D28D9', marginTop: 12 }]}
              onPress={() => router.push({
                pathname: '/(tabs)/certificate-detail',
                params: {
                  score: String(score || 0),
                  totalScore: String(totalScore || 400),
                  percentage: String(percentage || 0),
                }
              })}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionButtonText, { color: '#6D28D9' }]}>View Certificate of Achievement</Text>
            </TouchableOpacity>

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
    paddingTop: 10,
  },

  // Headline
  headlineContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Donut
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    position: 'relative',
  },
  donutInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  donutScore: {
    fontSize: 38,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 44,
  },
  donutTotal: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  performanceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Rank Banner
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  rankIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankInfo: {
    flex: 1,
  },
  rankLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  rankValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },
  rankSub: {
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
