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
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();

  const [loading, setLoading] = React.useState(false);
  const [overallAccuracy, setOverallAccuracy] = React.useState(54);
  const [subjectList, setSubjectList] = React.useState<SubjectItem[]>([
    {
      id: 'english',
      name: 'Use of English',
      score: 60,
      total: 100,
      percentage: 60,
      rating: 'Excellent',
      icon: 'book-open-outline',
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
    },
    {
      id: 'math',
      name: 'Mathematics',
      score: 70,
      total: 100,
      percentage: 70,
      rating: 'Excellent',
      icon: 'function-variant',
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
    {
      id: 'physics',
      name: 'Physics',
      score: 34,
      total: 100,
      percentage: 34,
      rating: 'Poor',
      icon: 'atom',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      score: 35,
      total: 70,
      percentage: 35,
      rating: 'Poor',
      icon: 'flask-outline',
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
    },
  ]);

  React.useEffect(() => {
    const loadPerformance = async () => {
      if (!params.attempt_id) return;
      try {
        setLoading(true);
        const data = await examService.getDetailedAnalytics(Number(params.attempt_id));
        if (data) {
          if (data.overall_accuracy !== undefined) setOverallAccuracy(data.overall_accuracy);
          if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
            const icons = [
              { icon: 'book-open-outline', iconBg: '#EDE9FE', iconColor: '#7C3AED' },
              { icon: 'function-variant', iconBg: '#DCFCE7', iconColor: '#16A34A' },
              { icon: 'atom', iconBg: '#FEF3C7', iconColor: '#D97706' },
              { icon: 'flask-outline', iconBg: '#FEE2E2', iconColor: '#DC2626' },
            ];
            const mapped: SubjectItem[] = data.subjects.map((s: any, idx: number) => {
              const pct = s.accuracy_percentage ?? 50;
              let rating: 'Excellent' | 'Good' | 'Poor' = 'Good';
              if (pct >= 70) rating = 'Excellent';
              else if (pct < 45) rating = 'Poor';

              const iconStyle = icons[idx % icons.length];
              return {
                id: String(s.section_name),
                name: s.section_name,
                score: s.score,
                total: s.total_questions || 100,
                percentage: pct,
                rating: rating,
                ...iconStyle
              };
            });
            setSubjectList(mapped);
          }
        }
      } catch (e) {
        console.warn('Could not fetch subject performance analytics:', e);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [params.attempt_id]);

  const subjects = subjectList;

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
          {/* Headline Row */}
          <View style={styles.headlineRow}>
            <Text style={styles.mainTitle}>Subject Performance</Text>
            <View style={styles.questionsPill}>
              <Text style={styles.questionsPillText}>400 Questions</Text>
            </View>
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
                    params: { subject: sub.name }
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

          {/* View Topic Breakdown Button */}
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F5F3FF', borderWidth: 1.5, borderColor: '#7C3AED', marginBottom: 12 }]}
            onPress={() => router.push({
              pathname: '/(exam)/topic-performance',
              params: { attempt_id: params.attempt_id }
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
});
