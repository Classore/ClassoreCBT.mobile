import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

export default function TestResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();

  const [loading, setLoading] = React.useState(false);
  const [score, setScore] = React.useState(205);
  const [totalScore, setTotalScore] = React.useState(400);
  const [correctAnswers, setCorrectAnswers] = React.useState(205);
  const [wrongAnswers, setWrongAnswers] = React.useState(195);
  const [skippedQuestions, setSkippedQuestions] = React.useState(3);
  const [timeUsedFormatted, setTimeUsedFormatted] = React.useState('2h 28m');
  const [performanceTag, setPerformanceTag] = React.useState('Good Performance');

  React.useEffect(() => {
    const fetchResults = async () => {
      if (!params.attempt_id) return;
      try {
        setLoading(true);
        const data = await examService.getDetailedAnalytics(Number(params.attempt_id));
        if (data) {
          if (data.total_score !== undefined) setScore(Math.round(data.total_score));
          if (data.max_total_score) setTotalScore(Math.round(data.max_total_score));
          if (data.correct_answers !== undefined) setCorrectAnswers(data.correct_answers);
          if (data.wrong_answers !== undefined) setWrongAnswers(data.wrong_answers);
          if (data.skipped_questions !== undefined) setSkippedQuestions(data.skipped_questions);
          
          if (data.total_time_taken) {
            const h = Math.floor(data.total_time_taken / 3600);
            const m = Math.floor((data.total_time_taken % 3600) / 60);
            setTimeUsedFormatted(`${h > 0 ? `${h}h ` : ''}${m}m`);
          }

          const pct = data.max_total_score ? (data.total_score / data.max_total_score) * 100 : 50;
          if (pct >= 70) setPerformanceTag('Excellent Performance');
          else if (pct >= 50) setPerformanceTag('Good Performance');
          else setPerformanceTag('Needs Improvement');
        }
      } catch (err) {
        console.warn('Failed to load detailed analytics, using defaults:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.attempt_id]);

  const percentage = Math.round((score / (totalScore || 1)) * 100);
  const correctPct = Math.round((correctAnswers / (totalScore || 1)) * 100);
  const wrongPct = Math.round((wrongAnswers / (totalScore || 1)) * 100);
  const skippedPct = Math.round((skippedQuestions / (totalScore || 1)) * 100);

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
            <Text style={styles.streakText}>120</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.mainTitle}>Great Job! 🎉</Text>
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
              <Text style={[styles.metricSub, { color: '#94A3B8' }]}>of 3h 0m</Text>
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
              <Text style={styles.rankValue}>Top 0.02%</Text>
              <Text style={styles.rankSub}>Among all test takers</Text>
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
});
