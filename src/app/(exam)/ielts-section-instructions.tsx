import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

export default function IELTSSectionInstructionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    exam?: string; 
    exam_type_id?: string; 
    section_name?: string;
    sections?: string;
    section_order?: string;
    mode?: string;
    time_limit?: string;
    question_count?: string;
    difficulty?: string;
  }>();
  const [examName, setExamName] = useState('Test');
  const [isStarting, setIsStarting] = useState(false);

  const handleBeginTest = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
      const order = params.section_order ? params.section_order.split(',').map(Number) : (params.sections ? (typeof params.sections === 'string' ? JSON.parse(params.sections) : params.sections) : undefined);
      const mode = (params.mode as any) || 'Standard';
      const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;
      const targetQuestionCount = params.question_count ? Number(params.question_count) : undefined;
      const targetDifficulty = params.difficulty ? String(params.difficulty) : undefined;

      let practiceConfig: Record<string, any> | undefined;
      if (mode === 'Practice') {
        practiceConfig = {
          question_count: targetQuestionCount || 40,
          difficulty: targetDifficulty || 'Medium',
        };
        if (order && order.length > 0) {
          order.forEach((id: number) => {
            practiceConfig![String(id)] = {
              question_count: targetQuestionCount || 40,
              difficulty: targetDifficulty || 'Medium',
            };
          });
        }
      }

      const newAttempt = await examService.startExam({
        exam_type_id: examId,
        mode: mode,
        selected_section_ids: order,
        time_limit_override: mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
        question_count: targetQuestionCount,
        difficulty: targetDifficulty,
        practice_config: practiceConfig,
      });

      router.push({
        pathname: '/(exam)/ielts-session',
        params: {
          ...params,
          attempt_id: String(newAttempt.id),
        }
      });
    } catch (error: any) {
      console.error('Failed to start section exam:', error);
      const errorMsg = error?.response?.data?.error 
        || error?.response?.data?.detail 
        || error?.message 
        || 'Failed to start exam. Please check your connection and try again.';
      Alert.alert('Unable to Start Exam', errorMsg);
    } finally {
      setIsStarting(false);
    }
  };

  React.useEffect(() => {
    const fetchExam = async () => {
      try {
        const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : null);
        if (examId) {
          const allExams = await examService.getExams();
          const current = allExams.find(e => e.id === examId);
          if (current) setExamName(current.name);
        }
      } catch (e) {
        console.warn('Failed to load exam details for section instructions:', e);
      }
    };
    fetchExam();
  }, [params.exam, params.exam_type_id]);

  const currentSection = params.section_name || 'Reading';

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
          <Text style={styles.headerTitle}>{currentSection} Instructions</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>120</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Open Book Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.bookMockWrapper}>
              <View style={styles.bookMockLeft}>
                <View style={styles.bookImageThumb} />
                <View style={styles.bookLine} />
                <View style={styles.bookLine} />
              </View>
              <View style={styles.bookMockRight}>
                <View style={styles.bookLine} />
                <View style={styles.bookLine} />
                <View style={styles.bookLine} />
              </View>
              <View style={styles.bellBadge}>
                <Feather name="bell" size={26} color="#F59E0B" />
              </View>
            </View>
          </View>

          {/* Section Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.mainTitle}>{examName} {currentSection}</Text>
            <Text style={styles.mainSubtitle}>
              Complete all questions carefully based on the provided passages and instructions.
            </Text>
          </View>

          {/* 3 Summary Cards */}
          <View style={styles.summaryCardsList}>
            {/* Time */}
            <View style={styles.summaryCard}>
              <View style={[styles.iconBg, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="clock" size={18} color="#7C3AED" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>60 minutes</Text>
              </View>
            </View>

            {/* Passages */}
            <View style={styles.summaryCard}>
              <View style={[styles.iconBg, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="book-outline" size={18} color="#E11D48" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Passages</Text>
                <Text style={styles.summaryValue}>3–4 passages</Text>
              </View>
            </View>

            {/* Questions */}
            <View style={styles.summaryCard}>
              <View style={[styles.iconBg, { backgroundColor: '#D1FAE5' }]}>
                <Feather name="info" size={18} color="#059669" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Questions</Text>
                <Text style={styles.summaryValue}>40 questions</Text>
              </View>
            </View>
          </View>

          {/* How it works Section */}
          <View style={styles.howItWorksSection}>
            <Text style={styles.howItWorksTitle}>How it works</Text>
            
            <View style={styles.rulesList}>
              {[
                'Read the passages carefully.',
                'Answer all questions based on the passages.',
                'Move forward to the next question once you have answered.',
                'You cannot go back to previous questions.',
              ].map((rule, idx) => (
                <View key={idx} style={styles.ruleRow}>
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Begin Test Button */}
          <TouchableOpacity 
            style={[styles.beginTestButton, isStarting && { opacity: 0.7 }]}
            onPress={handleBeginTest}
            disabled={isStarting}
            activeOpacity={0.85}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.beginTestButtonText}>Begin Test</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
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

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  bookMockWrapper: {
    flexDirection: 'row',
    width: 170,
    height: 120,
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#7C3AED',
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bookMockLeft: {
    flex: 1,
    borderRightWidth: 1.5,
    borderRightColor: '#C4B5FD',
    paddingRight: 6,
    justifyContent: 'center',
  },
  bookImageThumb: {
    width: 26,
    height: 20,
    backgroundColor: '#C4B5FD',
    borderRadius: 4,
    marginBottom: 6,
  },
  bookMockRight: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  bookLine: {
    height: 4,
    backgroundColor: '#C4B5FD',
    borderRadius: 2,
    marginBottom: 6,
  },
  bellBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Headline
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Summary Cards
  summaryCardsList: {
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  summaryValue: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },

  // How it works
  howItWorksSection: {
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 2,
  },
  rulesList: {
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Begin Test Button
  beginTestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
  },
  beginTestButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
