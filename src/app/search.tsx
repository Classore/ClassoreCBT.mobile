import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { searchService, SearchHistoryItem, SearchResults } from '@/services/search';
import { examService, ExamType } from '@/services/exam';

const POPULAR_SEARCHES = [
  { label: 'JAMB UTME', exam: 'jamb', type: 'exam' },
  { label: 'IELTS Academic', exam: 'ielts', type: 'exam' },
  { label: 'Mathematics', subject: 'mathematics', type: 'subject' },
  { label: 'English Language', subject: 'english', type: 'subject' },
  { label: 'Physics', subject: 'physics', type: 'subject' },
  { label: 'Chemistry', subject: 'chemistry', type: 'subject' },
  { label: 'Biology', subject: 'biology', type: 'subject' },
  { label: 'Economics', subject: 'economics', type: 'subject' },
];

const FALLBACK_EXAMS: ExamType[] = [
  { id: 41, name: 'JAMB UTME Practice', description: 'Unified Tertiary Matriculation Examination prep', is_premium_only: false, is_published: true, generation_rules: { selection_strategy: 'random', total_sections: 4, required_sections: [], standard_question_counts: {} } },
  { id: 42, name: 'IELTS Academic & General', description: 'International English Language Testing System', is_premium_only: false, is_published: true, generation_rules: { selection_strategy: 'random', total_sections: 4, required_sections: [], standard_question_counts: {} } },
];

const FALLBACK_SUBJECTS = [
  'Mathematics',
  'Use of English',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Commerce',
  'Financial Accounting',
  'Literature in English',
  'Geography',
];

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [results, setResults] = useState<SearchResults>({ exams: [], subjects: [] });
  const [hasSearched, setHasSearched] = useState(false);

  // Load Search History on mount
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await searchService.getHistory();
        if (isMounted && Array.isArray(data)) {
          setHistory(data);
        }
      } catch (err) {
        console.warn('Could not fetch search history:', err);
      } finally {
        if (isMounted) setLoadingHistory(false);
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

        // Add to history asynchronously
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

  const handleSelectPopular = (item: typeof POPULAR_SEARCHES[0]) => {
    if (item.type === 'exam') {
      if (item.exam === 'ielts') {
        router.push('/(exam)/ielts-setup');
      } else {
        router.push({ pathname: '/(tabs)/practice', params: { exam: 'jamb' } });
      }
    } else if (item.subject) {
      handleSelectSubject(item.label);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="What do you want to practice today?"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearQuery} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#6D28D9" />
              <AppText style={styles.loadingText}>Searching...</AppText>
            </View>
          )}

          {/* Results View */}
          {hasSearched && !loading && (
            <View style={styles.resultsContainer}>
              {results.exams.length === 0 && results.subjects.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="search-outline" size={28} color="#9CA3AF" />
                  </View>
                  <AppText style={styles.emptyTitle}>No matches found</AppText>
                  <AppText style={styles.emptySubtitle}>
                    We couldn't find any exams or subjects matching "{query}". Try checking your spelling or search for popular topics below.
                  </AppText>
                </View>
              ) : (
                <>
                  {/* Exams Results */}
                  {results.exams.length > 0 && (
                    <View style={styles.section}>
                      <AppText style={styles.sectionHeader}>Exams ({results.exams.length})</AppText>
                      {results.exams.map((exam) => (
                        <TouchableOpacity
                          key={exam.id}
                          style={styles.resultCard}
                          onPress={() => handleSelectExam(exam)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.resultIconBg, { backgroundColor: '#EDE9FE' }]}>
                            <Ionicons name="school-outline" size={20} color="#6D28D9" />
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
                    <View style={styles.section}>
                      <AppText style={styles.sectionHeader}>Subjects ({results.subjects.length})</AppText>
                      {results.subjects.map((sub, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.resultCard}
                          onPress={() => handleSelectSubject(sub)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.resultIconBg, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="book-open" size={18} color="#2563EB" />
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

          {/* History View (When search query is empty) */}
          {!hasSearched && (
            <View>
              {history.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.historyHeaderRow}>
                    <AppText style={styles.sectionHeader}>Recent Searches</AppText>
                    <TouchableOpacity onPress={handleClearAllHistory} activeOpacity={0.7}>
                      <AppText style={styles.clearAllText}>Clear All</AppText>
                    </TouchableOpacity>
                  </View>

                  {history.map((item) => (
                    <View key={item.id} style={styles.historyRow}>
                      <TouchableOpacity
                        style={styles.historyTextTouch}
                        onPress={() => handleSelectHistory(item.query)}
                        activeOpacity={0.7}
                      >
                        <Feather name="clock" size={16} color="#9CA3AF" style={{ marginRight: 12 }} />
                        <AppText style={styles.historyQuery}>{item.query}</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteHistory(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="x" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Popular Searches */}
              <View style={styles.section}>
                <AppText style={styles.sectionHeader}>Popular Searches</AppText>
                <View style={styles.chipsRow}>
                  {POPULAR_SEARCHES.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.popularChip}
                      onPress={() => handleSelectPopular(item)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={item.type === 'exam' ? 'school-outline' : 'book-outline'}
                        size={14}
                        color="#6D28D9"
                        style={{ marginRight: 6 }}
                      />
                      <AppText style={styles.popularChipText}>{item.label}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter_500Medium',
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 13,
    color: '#6D28D9',
    fontFamily: 'Inter_600SemiBold',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  historyTextTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyQuery: {
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'Inter_500Medium',
  },
  resultsContainer: {
    gap: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
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
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  popularChipText: {
    fontSize: 13,
    color: '#6D28D9',
    fontFamily: 'Inter_600SemiBold',
  },
});
