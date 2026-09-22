import {
  useAuth } from '@/context/AuthContext';
import { examService } from '@/services/exam';
import { AppSafeArea } from '@/components/AppSafeArea';
import { Feather,
  Ionicons,
  MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TopicItem {
  name: string;
  score: number;
  total: number;
  percentage: number;
  color: string;
}

export default function TopicPerformanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    subject?: string; 
    attempt_id?: string;
    exam_name?: string;
    is_ielts?: string;
  }>();

  const detectedIsIelts = Boolean(
    params.is_ielts === 'true' ||
    (params.exam_name && (params.exam_name.toLowerCase().includes('ielts') || params.exam_name.toLowerCase().includes('toefl')))
  );

  const [examTitle, setExamTitle] = useState<string>(
    params.exam_name || (detectedIsIelts ? 'IELTS Academic Test' : 'Topic Performance')
  );
  const [examTypeId, setExamTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(params.attempt_id));
  const [selectedSubject, setSelectedSubject] = useState<string>(params.subject || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [sectionsData, setSectionsData] = useState<any[]>([]);
  const [aiFocusRecommendation, setAiFocusRecommendation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!params.attempt_id) {
        setError('No exam session ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await examService.getTopicAnalysis(Number(params.attempt_id));
        if (data) {
          if (data.exam_type_id) {
            setExamTypeId(data.exam_type_id);
          }
          const isIeltsAttempt = 
            detectedIsIelts ||
            Boolean(data.exam_name && (data.exam_name.toLowerCase().includes('ielts') || data.exam_name.toLowerCase().includes('toefl'))) ||
            Boolean(data.sections && data.sections.some((s: any) => ['reading', 'listening', 'writing', 'speaking'].includes((s.section_name || '').toLowerCase())));

          if (data.exam_name) {
            setExamTitle(data.exam_name);
          } else if (params.exam_name) {
            setExamTitle(params.exam_name);
          } else if (isIeltsAttempt) {
            setExamTitle('IELTS Academic Test');
          } else {
            // Check attempt review if still default
            try {
              const attempt = await examService.getAttemptReview(Number(params.attempt_id));
              if (attempt?.exam_name) {
                setExamTitle(attempt.exam_name);
              }
              const extractedExamId = (attempt as any)?.exam_type_id ?? (typeof attempt?.exam_type === 'number' ? attempt.exam_type : (attempt?.exam_type as any)?.id);
              if (typeof extractedExamId === 'number') {
                setExamTypeId(extractedExamId);
              }
            } catch {}
          }

          if (data.ai_focus_recommendation) {
            setAiFocusRecommendation(data.ai_focus_recommendation);
          }
          if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
            setSectionsData(data.sections);
            const subNames = data.sections.map((s: any) => s.section_name);
            setSubjectOptions(subNames);
            if (selectedSubject && subNames.includes(selectedSubject)) {
              // keep current
            } else {
              setSelectedSubject(subNames[0]);
            }
          }
        } else {
          setError('Could not retrieve topic analysis.');
        }
      } catch (err: any) {
        console.warn('Could not fetch topic analysis:', err);
        setError('Failed to load topic performance.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [params.attempt_id]);

  const currentSection = sectionsData.find(s => s.section_name === selectedSubject) || sectionsData[0];
  const topics: TopicItem[] = currentSection && currentSection.topics && currentSection.topics.length > 0
    ? currentSection.topics.map((t: any) => {
        const pct = Math.round(t.accuracy_percentage ?? (t.total_questions ? (t.correct_answers / t.total_questions) * 100 : 0));
        let color = '#10B981';
        if (pct < 50) color = '#EF4444';
        else if (pct < 75) color = '#F97316';
        return {
          name: t.topic_name,
          score: t.correct_answers ?? 0,
          total: t.total_questions ?? 0,
          percentage: pct,
          color: color,
        };
      })
    : [];

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
            <Text style={styles.loadingText}>Loading topic performance...</Text>
          </View>
        ) : error || sectionsData.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="chart-bubble" size={48} color="#94A3B8" />
            <Text style={styles.errorTitle}>No Topic Data</Text>
            <Text style={styles.errorSubtitle}>{error || 'No topic breakdown available for this attempt.'}</Text>
            {/* <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Go to Home</Text>
            </TouchableOpacity> */}
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Subject Dropdown Selector Card */}
            {subjectOptions.length > 1 && (
              <TouchableOpacity 
                style={styles.dropdownCard}
                onPress={() => setIsDropdownOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.subjectIconBg}>
                  <MaterialCommunityIcons name="function-variant" size={18} color="#16A34A" />
                </View>
                <Text style={styles.selectedSubjectText}>{selectedSubject}</Text>
                <Feather name="chevron-down" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}

            {/* Headline */}
            <Text style={styles.mainTitle}>Performance by Topic</Text>
            <Text style={styles.subtitle}>See how you did in each topic</Text>

            {/* Topic Progress Rows */}
            {topics.length > 0 ? (
              <View style={styles.topicsContainer}>
                {topics.map((t, idx) => (
                  <View key={idx} style={styles.topicRowItem}>
                    <View style={styles.topicHeaderRow}>
                      <Text style={styles.topicName}>{t.name}</Text>
                      <Text style={styles.topicFraction}>{t.score} / {t.total}</Text>
                      <Text style={styles.topicPercentage}>{t.percentage}%</Text>
                    </View>
                    {/* Horizontal Bar */}
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${t.percentage}%`, backgroundColor: t.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTopicsCard}>
                <Text style={styles.emptyTopicsText}>No topic breakdown recorded for {selectedSubject}.</Text>
              </View>
            )}

            {/* AI Focus Card */}
            {aiFocusRecommendation ? (
              <View style={styles.focusCard}>
                <View style={styles.focusIconBg}>
                  <Ionicons name="radio-button-on" size={22} color="#7C3AED" />
                </View>
                <View style={styles.focusInfo}>
                  <Text style={styles.focusLabel}> Study Recommendation</Text>
                  <Text style={styles.focusTopic}>{selectedSubject}</Text>
                  <Text style={styles.focusSub}>
                    {aiFocusRecommendation}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Practice Weak Topics Button */}
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: '#7C3AED', marginBottom: 12 }]}
              onPress={() => {
                let targetExamId = examTypeId;
                if (!targetExamId) {
                  const cachedExams = examService.getCachedExamsSync() || [];
                  const matched = cachedExams.find(e => 
                    e.name.toLowerCase() === examTitle.toLowerCase() || 
                    examTitle.toLowerCase().includes(e.name.toLowerCase()) ||
                    e.name.toLowerCase().includes(examTitle.toLowerCase())
                  );
                  if (matched) {
                    targetExamId = matched.id;
                  }
                }

                const weakTopicsBySubject: Record<string, string[]> = {};
                const subjectNamesList: string[] = [];

                sectionsData.forEach((sec: any) => {
                  const secName = sec.section_name || 'General';
                  const secTopics = sec.topics || [];
                  const weak = secTopics.filter((t: any) => {
                    const pct = t.accuracy_percentage ?? (t.total_questions ? (t.correct_answers / t.total_questions) * 100 : 0);
                    return pct < 75 || t.proficiency_level === 'Needs Work' || t.proficiency_level === 'Developing';
                  });
                  const candidates = weak.length > 0
                    ? weak
                    : [...secTopics].sort((a: any, b: any) => (a.accuracy_percentage ?? 0) - (b.accuracy_percentage ?? 0)).slice(0, 2);

                  if (candidates.length > 0) {
                    weakTopicsBySubject[secName] = candidates.map((c: any) => c.topic_name).filter(Boolean);
                    if (!subjectNamesList.includes(secName)) {
                      subjectNamesList.push(secName);
                    }
                  }
                });

                if (subjectNamesList.length === 0 && selectedSubject) {
                  subjectNamesList.push(selectedSubject);
                }

                router.push({
                  pathname: '/(tabs)/practice/practice-setup',
                  params: {
                    exam: String(targetExamId || (detectedIsIelts ? 42 : 1)),
                    exam_name: examTitle,
                    subjects: JSON.stringify(subjectNamesList),
                    weak_topics: JSON.stringify(weakTopicsBySubject),
                  }
                });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>🎯 Practice Weak Topics</Text>
            </TouchableOpacity>

            {/* Done Button */}
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }]}
              onPress={() => router.push({
                pathname: '/(exam)/review-answers',
                params: { attempt_id: params.attempt_id }
              })}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneButtonText, { color: '#374151' }]}>Proceed to Review</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Dropdown Modal */}
        <Modal
          visible={isDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalHeading}>Select Subject</Text>
              {subjectOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    selectedSubject === opt && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedSubject(opt);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedSubject === opt && styles.modalOptionTextActive,
                  ]}>
                    {opt}
                  </Text>
                  {selectedSubject === opt && (
                    <Feather name="check" size={16} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

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

  // Dropdown Card
  dropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  subjectIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedSubjectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Headline
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },

  // Topics Container
  topicsContainer: {
    gap: 18,
    marginBottom: 24,
  },
  topicRowItem: {
    gap: 6,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    width: 110,
  },
  topicFraction: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
  },
  topicPercentage: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  barBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },

  // Focus Card
  focusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  focusIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  focusInfo: {
    flex: 1,
  },
  focusLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  focusTopic: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
    marginBottom: 4,
  },
  focusSub: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Done Button
  doneButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalOptionActive: {
    backgroundColor: '#F5F3FF',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalOptionTextActive: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  emptyTopicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTopicsText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
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
