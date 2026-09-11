import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { examService } from '@/services/exam';
import { formatQuestionText } from '@/utils/questionFormatter';

interface SavedQuestionItem {
  id: string;
  exam: string;
  subject: string;
  tag: 'Bookmarked' | 'Difficult';
  question: string;
  date: string;
  qCode: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hasDiagram?: boolean;
  iconName: string;
  iconBg: string;
  iconColor: string;
  originalId: number;
}

export default function SavedQuestionsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState<SavedQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapQuestions = (data: any[]): SavedQuestionItem[] => {
    return data.map((item: any, index: number) => ({
      id: String(index),
      originalId: item.question?.id || item.id,
      exam: item.question?.exam_type_name || 'General',
      subject: item.question?.section_name || 'General',
      tag: item.notes?.toLowerCase().includes('difficult') ? 'Difficult' : 'Bookmarked',
      question: item.question?.text || 'No question text',
      date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
      qCode: `Q#${item.question?.id || item.id}`,
      difficulty: item.question?.difficulty || 'Medium',
      hasDiagram: !!item.question?.image,
      iconName: item.notes?.toLowerCase().includes('difficult') ? 'clock' : 'file-text',
      iconBg: item.notes?.toLowerCase().includes('difficult') ? '#FFEDD5' : '#EDE9FE',
      iconColor: item.notes?.toLowerCase().includes('difficult') ? '#EA580C' : '#7C3AED',
    }));
  };

  const fetchQuestions = async () => {
    try {
      // 1. Instantly render cached saved questions for 0 latency / offline availability
      const cached = await examService.getCachedSavedQuestions();
      if (cached && cached.length > 0) {
        setQuestions(mapQuestions(cached));
        setIsLoading(false);
      }

      // 2. Fetch fresh questions in background
      const freshData = await examService.getSavedQuestions();
      setQuestions(mapQuestions(freshData));
    } catch (error) {
      console.error('Failed to fetch saved questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#10B981';
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Text style={styles.headerTitle}>Saved Questions</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar with Filter Icon */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search saved questions..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity activeOpacity={0.7}>
              <Feather name="filter" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
              <Text style={styles.filterPillText}>All Exams</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
              <Text style={styles.filterPillText}>All Subjects</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
              <Text style={styles.filterPillText}>Recent</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Questions Cards List */}
          <View style={styles.cardsList}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4C1D95" style={{ marginVertical: 40 }} />
            ) : filteredQuestions.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>No saved questions found.</Text>
            ) : (
              filteredQuestions.map((item) => {
                const isDifficult = item.tag === 'Difficult';
                return (
                  <TouchableOpacity key={item.id} style={styles.questionCard} activeOpacity={0.8}>
                    {/* Top Row: Exam & Tag Badge */}
                    <View style={styles.cardTopRow}>
                      <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                        <Feather name={item.iconName as any} size={16} color={item.iconColor} />
                      </View>
                      <View style={styles.examInfo}>
                        <Text style={styles.examName}>{item.exam}</Text>
                        <Text style={styles.subjectName}>{item.subject}</Text>
                      </View>
                      <View style={[styles.tagBadge, isDifficult ? styles.difficultBadge : styles.bookmarkedBadge]}>
                        <Text style={[styles.tagBadgeText, isDifficult ? styles.difficultBadgeText : styles.bookmarkedBadgeText]}>
                          {item.tag}
                        </Text>
                      </View>
                    </View>

                    {/* Question Body */}
                    <View style={styles.questionBodyRow}>
                      <Text style={styles.questionText}>
                        {formatQuestionText(item.question)}
                      </Text>
                      {item.hasDiagram && (
                        <View style={styles.diagramBox}>
                          <MaterialCommunityIcons name="angle-acute" size={32} color="#9CA3AF" />
                          <Text style={styles.diagramText}>img</Text>
                        </View>
                      )}
                    </View>

                    {/* Card Bottom Row: Date & Difficulty */}
                    <View style={styles.cardBottomRow}>
                      <Text style={styles.metaText}>{item.date} • {item.qCode}</Text>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                        {item.difficulty}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Bottom Stats Triad Card */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Saved</Text>
              <Text style={[styles.statValue, { color: '#6D28D9' }]}>{questions.length}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Bookmarked</Text>
              <Text style={[styles.statValue, { color: '#6D28D9' }]}>{questions.filter(q => q.tag === 'Bookmarked').length}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Difficult</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{questions.filter(q => q.tag === 'Difficult').length}</Text>
            </View>
          </View>

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '500',
  },

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Question Cards List
  cardsList: {
    gap: 12,
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  subjectName: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookmarkedBadge: {
    backgroundColor: '#F3E8FF',
  },
  bookmarkedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  difficultBadge: {
    backgroundColor: '#FEE2E2',
  },
  difficultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Question Body
  questionBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    paddingRight: 8,
  },
  diagramBox: {
    width: 58,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  diagramText: {
    position: 'absolute',
    right: 12,
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
  },

  // Bottom Row
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  metaText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  difficultyText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Bottom Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F3F4F6',
  },
});
