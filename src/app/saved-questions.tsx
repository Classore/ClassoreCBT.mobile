import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { examService } from '@/services/exam';
import { formatQuestionText } from '@/utils/questionFormatter';
import { AppText } from '@/components/AppText';

interface SavedQuestionItem {
  id: string;
  exam: string;
  subject: string;
  tag: 'Bookmarked' | 'Difficult';
  question: string;
  date: string;
  rawDate: number;
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

  // Filters
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<'Recent' | 'Oldest'>('Recent');

  // Filter Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const mapQuestions = (data: any[]): SavedQuestionItem[] => {
    return data.map((item: any, index: number) => {
      // Backend SavedQuestionSerializer returns:
      // { id, question: number, question_details: QuestionSerializer, notes, created_at }
      // Or in local / fallback payloads, item.question might already be the Question object.
      const qObj = (typeof item.question === 'object' && item.question !== null)
        ? item.question
        : (item.question_details || {});

      const originalId = qObj.id || (typeof item.question === 'number' ? item.question : item.id) || index;

      const examName = 
        qObj.exam_type_name || 
        qObj.exam_name || 
        qObj.group?.section?.exam_type?.name || 
        item.exam_name || 
        'General';

      const subjectName = 
        qObj.section_name || 
        qObj.subject_name || 
        qObj.group?.section?.name || 
        item.section_name || 
        'General';

      const questionText = 
        qObj.text || 
        qObj.question || 
        qObj.prompt || 
        item.question_text || 
        item.text || 
        'No question text';

      const notes = (item.notes || qObj.notes || '').toLowerCase();
      const tag: 'Bookmarked' | 'Difficult' = notes.includes('difficult') ? 'Difficult' : 'Bookmarked';

      const difficulty = qObj.difficulty || item.difficulty || 'Medium';
      const hasDiagram = !!(qObj.image || qObj.diagram || item.image);

      const parsedDate = item.created_at ? new Date(item.created_at) : new Date();
      const dateStr = item.created_at ? parsedDate.toLocaleDateString() : 'Recent';
      const rawDate = parsedDate.getTime() || 0;

      return {
        id: String(item.id || index),
        originalId,
        exam: examName,
        subject: subjectName,
        tag,
        question: questionText,
        date: dateStr,
        rawDate,
        qCode: `Q#${originalId}`,
        difficulty,
        hasDiagram,
        iconName: tag === 'Difficult' ? 'clock' : 'file-text',
        iconBg: tag === 'Difficult' ? '#FFEDD5' : '#EDE9FE',
        iconColor: tag === 'Difficult' ? '#EA580C' : '#7C3AED',
      };
    });
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

  // Distinct options for filter modals
  const examOptions = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.exam && q.exam !== 'General') set.add(q.exam);
    });
    return ['All', ...Array.from(set)];
  }, [questions]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (selectedExam === 'All' || q.exam === selectedExam) {
        if (q.subject && q.subject !== 'General') set.add(q.subject);
      }
    });
    return ['All', ...Array.from(set)];
  }, [questions, selectedExam]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter(q => {
        const matchesSearch = 
          !searchQuery ||
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.exam.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesExam = selectedExam === 'All' || q.exam === selectedExam;
        const matchesSubject = selectedSubject === 'All' || q.subject === selectedSubject;

        return matchesSearch && matchesExam && matchesSubject;
      })
      .sort((a, b) => {
        if (selectedSort === 'Recent') {
          return b.rawDate - a.rawDate;
        } else {
          return a.rawDate - b.rawDate;
        }
      });
  }, [questions, searchQuery, selectedExam, selectedSubject, selectedSort]);

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
          <AppText style={styles.headerTitle}>Saved Questions</AppText>
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
            {searchQuery.length > 0 ? (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            ) : (
              <Feather name="filter" size={18} color="#9CA3AF" />
            )}
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterPill, selectedExam !== 'All' && styles.filterPillActive]} 
              activeOpacity={0.7}
              onPress={() => setShowExamModal(true)}
            >
              <AppText style={[styles.filterPillText, selectedExam !== 'All' && styles.filterPillTextActive]}>
                {selectedExam === 'All' ? 'All Exams' : selectedExam}
              </AppText>
              <Feather 
                name="chevron-down" 
                size={12} 
                color={selectedExam !== 'All' ? '#7C3AED' : '#6B7280'} 
                style={{ marginLeft: 4 }} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterPill, selectedSubject !== 'All' && styles.filterPillActive]} 
              activeOpacity={0.7}
              onPress={() => setShowSubjectModal(true)}
            >
              <AppText style={[styles.filterPillText, selectedSubject !== 'All' && styles.filterPillTextActive]}>
                {selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
              </AppText>
              <Feather 
                name="chevron-down" 
                size={12} 
                color={selectedSubject !== 'All' ? '#7C3AED' : '#6B7280'} 
                style={{ marginLeft: 4 }} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterPill, selectedSort !== 'Recent' && styles.filterPillActive]} 
              activeOpacity={0.7}
              onPress={() => setShowSortModal(true)}
            >
              <AppText style={[styles.filterPillText, selectedSort !== 'Recent' && styles.filterPillTextActive]}>
                {selectedSort}
              </AppText>
              <Feather 
                name="chevron-down" 
                size={12} 
                color={selectedSort !== 'Recent' ? '#7C3AED' : '#6B7280'} 
                style={{ marginLeft: 4 }} 
              />
            </TouchableOpacity>
          </View>

          {/* Questions Cards List */}
          <View style={styles.cardsList}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4C1D95" style={{ marginVertical: 40 }} />
            ) : filteredQuestions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="bookmark" size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <AppText style={styles.emptyTitle}>No saved questions found</AppText>
                <AppText style={styles.emptySubtitle}>
                  {questions.length === 0
                    ? 'Questions you bookmark or mark difficult during tests will appear here.'
                    : 'No questions matched your current filter or search criteria.'}
                </AppText>
              </View>
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
                        <AppText style={styles.examName} numberOfLines={1}>{item.exam}</AppText>
                        <AppText style={styles.subjectName} numberOfLines={1}>{item.subject}</AppText>
                      </View>
                      <View style={[styles.tagBadge, isDifficult ? styles.difficultBadge : styles.bookmarkedBadge]}>
                        <AppText style={[styles.tagBadgeText, isDifficult ? styles.difficultBadgeText : styles.bookmarkedBadgeText]}>
                          {item.tag}
                        </AppText>
                      </View>
                    </View>

                    {/* Question Body */}
                    <View style={styles.questionBodyRow}>
                      <AppText style={styles.questionText}>
                        {formatQuestionText(item.question)}
                      </AppText>
                      {item.hasDiagram && (
                        <View style={styles.diagramBox}>
                          <MaterialCommunityIcons name="angle-acute" size={32} color="#9CA3AF" />
                          <AppText style={styles.diagramText}>img</AppText>
                        </View>
                      )}
                    </View>

                    {/* Card Bottom Row: Date & Difficulty */}
                    <View style={styles.cardBottomRow}>
                      <AppText style={styles.metaText}>{item.date} • {item.qCode}</AppText>
                      <AppText style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                        {item.difficulty}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Bottom Stats Triad Card */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <AppText style={styles.statLabel}>Total Saved</AppText>
              <AppText style={[styles.statValue, { color: '#6D28D9' }]}>{questions.length}</AppText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <AppText style={styles.statLabel}>Bookmarked</AppText>
              <AppText style={[styles.statValue, { color: '#6D28D9' }]}>{questions.filter(q => q.tag === 'Bookmarked').length}</AppText>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <AppText style={styles.statLabel}>Difficult</AppText>
              <AppText style={[styles.statValue, { color: '#EF4444' }]}>{questions.filter(q => q.tag === 'Difficult').length}</AppText>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal: Select Exam */}
        <Modal
          visible={showExamModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExamModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowExamModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <AppText style={styles.modalTitle}>Filter by Exam</AppText>
                <TouchableOpacity onPress={() => setShowExamModal(false)}>
                  <Feather name="x" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {examOptions.map((exam) => (
                <TouchableOpacity
                  key={exam}
                  style={[styles.modalOption, selectedExam === exam && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedExam(exam);
                    setSelectedSubject('All'); // Reset subject filter when exam changes
                    setShowExamModal(false);
                  }}
                >
                  <AppText style={[styles.modalOptionText, selectedExam === exam && styles.modalOptionTextSelected]}>
                    {exam === 'All' ? 'All Exams' : exam}
                  </AppText>
                  {selectedExam === exam && <Feather name="check" size={18} color="#7C3AED" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal: Select Subject */}
        <Modal
          visible={showSubjectModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSubjectModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowSubjectModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <AppText style={styles.modalTitle}>Filter by Subject</AppText>
                <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                  <Feather name="x" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {subjectOptions.map((subj) => (
                <TouchableOpacity
                  key={subj}
                  style={[styles.modalOption, selectedSubject === subj && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedSubject(subj);
                    setShowSubjectModal(false);
                  }}
                >
                  <AppText style={[styles.modalOptionText, selectedSubject === subj && styles.modalOptionTextSelected]}>
                    {subj === 'All' ? 'All Subjects' : subj}
                  </AppText>
                  {selectedSubject === subj && <Feather name="check" size={18} color="#7C3AED" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal: Select Sort */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowSortModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <AppText style={styles.modalTitle}>Sort By</AppText>
                <TouchableOpacity onPress={() => setShowSortModal(false)}>
                  <Feather name="x" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {(['Recent', 'Oldest'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[styles.modalOption, selectedSort === sort && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedSort(sort);
                    setShowSortModal(false);
                  }}
                >
                  <AppText style={[styles.modalOptionText, selectedSort === sort && styles.modalOptionTextSelected]}>
                    {sort}
                  </AppText>
                  {selectedSort === sort && <Feather name="check" size={18} color="#7C3AED" />}
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
  filterPillActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  filterPillTextActive: {
    color: '#7C3AED',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
});
