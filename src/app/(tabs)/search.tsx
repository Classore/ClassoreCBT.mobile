import { AppSafeArea } from '@/components/AppSafeArea';
import { AppText } from '@/components/AppText';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { ExamType } from '@/services/exam';
import { SearchHistoryItem, SearchResults, searchService } from '@/services/search';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const DEFAULT_RECENT_SEARCHES: SearchHistoryItem[] = [
  { id: 1, query: 'JAMB Mathematics', created_at: '' },
  { id: 2, query: 'IELTS Reading', created_at: '' },
  { id: 3, query: 'WAEC Biology', created_at: '' },
  { id: 4, query: 'NECO Physics', created_at: '' },
];

const POPULAR_EXAMS = [
  {
    id: 'jamb',
    name: 'JAMB',
    subtitle: 'UTME\nPractice',
    logo: require('../../../assets/images/jamb-logo.png'),
    bgColor: '#ECFDF5',
    textColor: '#059669',
    route: () => ({ pathname: '/(tabs)/practice', params: { exam: 'jamb' } }),
  },
  {
    id: 'waec',
    name: 'WAEC',
    subtitle: 'WASSCE',
    logo: require('../../../assets/images/waec-logo.png'),
    bgColor: '#EEF2FF',
    textColor: '#3730A3',
    route: () => ({ pathname: '/(tabs)/practice', params: { exam: 'waec' } }),
  },
  {
    id: 'ielts',
    name: 'IELTS',
    subtitle: 'English Test',
    logo: require('../../../assets/images/ielts-logo.png'),
    bgColor: '#FFF1F2',
    textColor: '#DC2626',
    route: () => ({ pathname: '/(tabs)/pactice', params: { exam: 'ielts' } }),
  },
  {
    id: 'neco',
    name: 'NECO',
    subtitle: 'SSCE\nPractice',
    logo: require('../../../assets/images/neco-logo.png'),
    bgColor: '#ECFDF5',
    textColor: '#047857',
    route: () => ({ pathname: '/(tabs)/practice', params: { exam: 'neco' } }),
  },
];

const SUGGESTED_SUBJECTS = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: (color: string) => <Ionicons name="pulse-outline" size={17} color={color} />,
  },
  {
    id: 'english',
    name: 'English Language',
    icon: (color: string) => <Ionicons name="chatbubble-outline" size={16} color={color} />,
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: (color: string) => <MaterialCommunityIcons name="atom" size={17} color={color} />,
  },
  {
    id: 'chem',
    name: 'Chemistry',
    icon: (color: string) => <Ionicons name="flask-outline" size={16} color={color} />,
  },
  {
    id: 'bio',
    name: 'Biology',
    icon: (color: string) => <MaterialCommunityIcons name="dna" size={17} color={color} />,
  },
  {
    id: 'econ',
    name: 'Economics',
    icon: (color: string) => <Feather name="bar-chart-2" size={16} color={color} />,
  },
];

const FALLBACK_EXAMS: ExamType[] = [
  { id: 41, name: 'JAMB UTME Practice', description: 'Unified Tertiary Matriculation Examination prep', is_premium_only: false, is_published: true, generation_rules: { selection_strategy: 'random', total_sections: 4, required_sections: [], standard_question_counts: {} } },
  { id: 42, name: 'IELTS Academic & General', description: 'International English Language Testing System', is_premium_only: false, is_published: true, generation_rules: { selection_strategy: 'random', total_sections: 4, required_sections: [], standard_question_counts: {} } },
  { id: 43, name: 'WAEC WASSCE Practice', description: 'West African Senior School Certificate Examination', is_premium_only: false, is_published: true, generation_rules: { selection_strategy: 'random', total_sections: 4, required_sections: [], standard_question_counts: {} } },
  { id: 44, name: 'NECO SSCE Practice', description: 'National Examinations Council SSCE prep', is_premium_only: false, is_published: true, generation_rules: { selection_strategy: 'random', total_sections: 4, required_sections: [], standard_question_counts: {} } },
];

const FALLBACK_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Commerce',
  'Literature in English',
  'Geography',
  'Agricultural Science',
  'Financial Accounting',
];

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { totalHeight: tabBarHeight } = useTabBarHeight();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>(DEFAULT_RECENT_SEARCHES);
  const [results, setResults] = useState<SearchResults>({ exams: [], subjects: [] });
  const [hasSearched, setHasSearched] = useState(false);

  // Load Search History on mount
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await searchService.getHistory();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setHistory(data);
        }
      } catch (err) {
        console.warn('Could not fetch search history:', err);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Perform search with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ exams: [], subjects: [] });
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    const handler = setTimeout(async () => {
      try {
        const res = await searchService.search(trimmed);
        let exams = res?.exams || [];
        let subjects = res?.subjects || [];

        // Fallback local match if API returned empty
        if (exams.length === 0) {
          exams = FALLBACK_EXAMS.filter(e =>
            e.name.toLowerCase().includes(trimmed.toLowerCase())
          );
        }
        if (subjects.length === 0) {
          subjects = FALLBACK_SUBJECTS.filter(s =>
            s.toLowerCase().includes(trimmed.toLowerCase())
          );
        }

        setResults({ exams, subjects });
        searchService.addHistory(trimmed).catch(() => {});
      } catch (err) {
        console.warn('Search request error, using local fallback:', err);
        const lower = trimmed.toLowerCase();
        const exams = FALLBACK_EXAMS.filter(e => e.name.toLowerCase().includes(lower));
        const subjects = FALLBACK_SUBJECTS.filter(s => s.toLowerCase().includes(lower));
        setResults({ exams, subjects });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  const handleClearQuery = () => {
    setQuery('');
    setResults({ exams: [], subjects: [] });
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleCloseSearch = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleSelectHistory = (itemQuery: string) => {
    setQuery(itemQuery);
  };

  const handleDeleteHistory = async (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    try {
      await searchService.deleteHistoryItem(id);
    } catch (err) {
      console.warn('Could not delete history item:', err);
    }
  };

  const handleClearAllHistory = async () => {
    setHistory([]);
    try {
      await searchService.clearHistory();
    } catch (err) {
      console.warn('Could not clear history:', err);
    }
  };

  const handleSelectExam = (exam: ExamType) => {
    Keyboard.dismiss();
    const nameLower = (exam.name || '').toLowerCase();
    if (nameLower.includes('ielts')) {
      router.push({
        pathname: '/(exam)/ielts-setup',
        params: { exam: String(exam.id || 42), exam_name: exam.name },
      });
    } else {
      router.push({
        pathname: '/(tabs)/practice',
        params: { exam: 'jamb', exam_id: String(exam.id || 41) },
      });
    }
  };

  const handleSelectSubject = (subjectName: string) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/(tabs)/practice/practice-setup',
      params: { subject: subjectName, exam: '1' },
    });
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={19} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search exams, subjects..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearQuery} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x-circle" size={17} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Close/Back Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseSearch}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <AppText style={styles.loadingText}>Searching...</AppText>
            </View>
          )}

          {/* Active Search Results View */}
          {hasSearched && !loading && (
            <View style={styles.resultsContainer}>
              {results.exams.length === 0 && results.subjects.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="search-outline" size={28} color="#9CA3AF" />
                  </View>
                  <AppText style={styles.emptyTitle}>No matches found</AppText>
                  <AppText style={styles.emptySubtitle}>
                    We couldn't find any exams or subjects matching "{query}". Try checking your spelling or choose from the suggested items below.
                  </AppText>
                </View>
              ) : (
                <>
                  {/* Exams Results */}
                  {results.exams.length > 0 && (
                    <View style={styles.resultsSection}>
                      <AppText style={styles.sectionTitle}>Exams ({results.exams.length})</AppText>
                      {results.exams.map((exam) => (
                        <TouchableOpacity
                          key={exam.id}
                          style={styles.resultCard}
                          onPress={() => handleSelectExam(exam)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.resultIconBg, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="school-outline" size={20} color="#4F46E5" />
                          </View>
                          <View style={styles.resultTextCol}>
                            <AppText style={styles.resultTitle}>{exam.name}</AppText>
                            <AppText style={styles.resultDesc} numberOfLines={1}>
                              {exam.description || 'Full CBT Practice & Assessment'}
                            </AppText>
                          </View>
                          <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Subjects Results */}
                  {results.subjects.length > 0 && (
                    <View style={styles.resultsSection}>
                      <AppText style={styles.sectionTitle}>Subjects ({results.subjects.length})</AppText>
                      {results.subjects.map((sub, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.resultCard}
                          onPress={() => handleSelectSubject(sub)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.resultIconBg, { backgroundColor: '#F0FDF4' }]}>
                            <Feather name="book-open" size={18} color="#059669" />
                          </View>
                          <View style={styles.resultTextCol}>
                            <AppText style={styles.resultTitle}>{sub}</AppText>
                            <AppText style={styles.resultDesc}>Practice questions & topic breakdown</AppText>
                          </View>
                          <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Default Discovery View (When search query is empty) */}
          {!hasSearched && (
            <View>
              {/* 1. Recent Searches */}
              {history.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <AppText style={styles.sectionTitle}>Recent Searches</AppText>
                    <TouchableOpacity onPress={handleClearAllHistory} activeOpacity={0.7}>
                      <AppText style={styles.clearAllText}>Clear All</AppText>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.historyList}>
                    {history.map((item) => (
                      <View key={item.id} style={styles.historyCard}>
                        <TouchableOpacity
                          style={styles.historyTouchContent}
                          onPress={() => handleSelectHistory(item.query)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="time-outline" size={18} color="#4F46E5" style={styles.historyIcon} />
                          <AppText style={styles.historyQueryText}>{item.query}</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteHistory(item.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.6}
                        >
                          <Feather name="x" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 2. Popular Exams */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <AppText style={styles.sectionTitle}>Popular Exams</AppText>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/practice' as any)}
                    activeOpacity={0.7}
                  >
                    <AppText style={styles.viewAllText}>View all</AppText>
                  </TouchableOpacity>
                </View>

                <View style={styles.examsRow}>
                  {POPULAR_EXAMS.map((exam) => (
                    <TouchableOpacity
                      key={exam.id}
                      style={[styles.examCard, { backgroundColor: exam.bgColor }]}
                      onPress={() => router.push(exam.route() as any)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={exam.logo}
                        style={styles.examLogo}
                        contentFit="contain"
                      />
                      <AppText style={[styles.examCardTitle, { color: exam.textColor }]}>
                        {exam.name}
                      </AppText>
                      <AppText style={styles.examCardSubtitle}>
                        {exam.subtitle}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Suggested Subjects */}
              <View style={styles.section}>
                <AppText style={[styles.sectionTitle, { marginBottom: 14 }]}>
                  Suggested Subjects
                </AppText>
                <View style={styles.subjectsGrid}>
                  {SUGGESTED_SUBJECTS.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={styles.subjectPill}
                      onPress={() => handleSelectSubject(subject.name)}
                      activeOpacity={0.75}
                    >
                      {subject.icon('#4F46E5')}
                      <AppText style={styles.subjectPillText}>{subject.name}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Inter_500Medium',
    padding: 0,
  },
  closeButton: {
    marginLeft: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
  },
  clearAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontFamily: 'Inter_600SemiBold',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontFamily: 'Inter_600SemiBold',
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  historyTouchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    marginRight: 12,
  },
  historyQueryText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#1E293B',
  },
  examsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  examCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 116,
  },
  examLogo: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  examCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  examCardSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subjectPillText: {
    fontSize: 14.5,
    fontFamily: 'Inter_500Medium',
    color: '#1E293B',
  },
  resultsContainer: {
    gap: 16,
    marginTop: 8,
  },
  resultsSection: {
    gap: 10,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  resultIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
  },
  resultDesc: {
    fontSize: 12.5,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
  },
});
