import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Modal 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

interface TopicItem {
  name: string;
  score: number;
  total: number;
  percentage: number;
  color: string;
}

export default function TopicPerformanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subject?: string; attempt_id?: string }>();

  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(params.subject || 'Mathematics');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState<string[]>(['Mathematics', 'Use of English', 'Physics', 'Chemistry']);
  const [sectionsData, setSectionsData] = useState<any[]>([]);
  const [aiFocusRecommendation, setAiFocusRecommendation] = useState('Based on your analysis, dedicate more review time to algebra word problems and geometry theorems.');

  const fallbackTopics: TopicItem[] = [
    { name: 'Algebra', score: 18, total: 20, percentage: 90, color: '#10B981' },
    { name: 'Geometry', score: 16, total: 20, percentage: 80, color: '#10B981' },
    { name: 'Trigonometry', score: 12, total: 15, percentage: 80, color: '#10B981' },
    { name: 'Calculus', score: 10, total: 15, percentage: 67, color: '#F97316' },
    { name: 'Statistics', score: 8, total: 10, percentage: 80, color: '#10B981' },
    { name: 'Probability', score: 6, total: 10, percentage: 60, color: '#10B981' },
  ];

  useEffect(() => {
    const fetchTopics = async () => {
      if (!params.attempt_id) return;
      try {
        setLoading(true);
        const data = await examService.getTopicAnalysis(Number(params.attempt_id));
        if (data) {
          if (data.ai_focus_recommendation) {
            setAiFocusRecommendation(data.ai_focus_recommendation);
          }
          if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
            setSectionsData(data.sections);
            const subNames = data.sections.map((s: any) => s.section_name);
            setSubjectOptions(subNames);
            if (!subNames.includes(selectedSubject)) {
              setSelectedSubject(subNames[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch topic analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [params.attempt_id]);

  const currentSection = sectionsData.find(s => s.section_name === selectedSubject);
  const topics: TopicItem[] = currentSection && currentSection.topics && currentSection.topics.length > 0
    ? currentSection.topics.map((t: any) => {
        const pct = t.accuracy_percentage ?? 50;
        let color = '#10B981';
        if (pct < 50) color = '#EF4444';
        else if (pct < 75) color = '#F97316';
        return {
          name: t.topic_name,
          score: t.correct_answers,
          total: t.total_questions,
          percentage: pct,
          color: color,
        };
      })
    : fallbackTopics;

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
          {/* Subject Dropdown Selector Card */}
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

          {/* Headline */}
          <Text style={styles.mainTitle}>Performance by Topic</Text>
          <Text style={styles.subtitle}>See how you did in each topic</Text>

          {/* Topic Progress Rows */}
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

          {/* AI Focus Card */}
          <View style={styles.focusCard}>
            <View style={styles.focusIconBg}>
              <Ionicons name="radio-button-on" size={22} color="#7C3AED" />
            </View>
            <View style={styles.focusInfo}>
              <Text style={styles.focusLabel}>AI Study Recommendation</Text>
              <Text style={styles.focusTopic}>{selectedSubject}</Text>
              <Text style={styles.focusSub}>
                {aiFocusRecommendation}
              </Text>
            </View>
          </View>

          {/* Practice Weak Topics Button */}
          <TouchableOpacity 
            style={[styles.doneButton, { backgroundColor: '#7C3AED', marginBottom: 12 }]}
            onPress={async () => {
              if (!params.attempt_id) {
                router.push('/(tabs)/practice');
                return;
              }
              try {
                const remedial = await examService.createRemedialPractice(Number(params.attempt_id));
                router.push({
                  pathname: '/(exam)/session',
                  params: { attempt_id: remedial.attempt.id, mode: 'Practice' }
                });
              } catch (e: any) {
                router.push('/(tabs)/practice');
              }
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
});
