import { AppText } from '@/components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { examService, ExamType } from '@/services/exam';
import { searchService, SearchHistoryItem, SearchResults } from '@/services/search';

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [exams, setExams] = useState<ExamType[]>(() => examService.getCachedExamsSync() || []);
  const [loading, setLoading] = useState(() => !examService.getCachedExamsSync() || (examService.getCachedExamsSync()?.length === 0));

  // Search Results State
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [fetchedExams, history] = await Promise.all([
        examService.getExams(),
        searchService.getHistory()
      ]);
      setExams(fetchedExams);
      setRecentSearches(history);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    if (text.trim().length === 0) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    typingTimer.current = setTimeout(async () => {
      try {
        const results = await searchService.search(text);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce
  };

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      await searchService.addHistory(query);
      const history = await searchService.getHistory();
      setRecentSearches(history);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecentPress = (query: string) => {
    setSearchQuery(query);
    handleSearchChange(query);
  };

  const removeRecent = async (id: number) => {
    try {
      await searchService.deleteHistoryItem(id);
      setRecentSearches(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    try {
      await searchService.clearHistory();
      setRecentSearches([]);
    } catch (e) {
      console.error(e);
    }
  };

  const getExamIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('jamb')) return require('../../../assets/images/search-jamb-cap.png');
    if (lowerName.includes('waec')) return require('../../../assets/images/search-waec-cross.png');
    if (lowerName.includes('ielts')) return require('../../../assets/images/search-ielts-headphones.png');
    if (lowerName.includes('neco')) return require('../../../assets/images/search-neco-clock.png');
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image 
            source={require('../../../assets/images/tag-maths-wave.png')} 
            style={{ width: 16, height: 16 }} 
            contentFit="contain" 
          />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search exams, subjects..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => executeSearch(searchQuery)}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearchChange('')} activeOpacity={0.7}>
              <Image 
                source={require('../../../assets/images/search-input-close.png')} 
                style={{ width: 12, height: 12, opacity: 0.6 }} 
                contentFit="contain" 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} activeOpacity={0.7}>
              <Image 
                source={require('../../../assets/images/search-input-close.png')} 
                style={{ width: 14, height: 14 }} 
                contentFit="contain" 
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* SEARCH RESULTS VIEW */}
          {searchQuery.trim().length > 0 ? (
            <View>
              {isSearching ? (
                <ActivityIndicator size="large" color="#4C1D95" style={{ marginTop: 40 }} />
              ) : searchResults ? (
                <>
                  <AppText style={styles.sectionTitle}>Search Results</AppText>
                  
                  {searchResults.exams.length === 0 && searchResults.subjects.length === 0 ? (
                    <AppText style={{ color: '#6B7280', marginTop: 10 }}>No results found for "{searchQuery}"</AppText>
                  ) : null}

                  {searchResults.exams.length > 0 && (
                    <View style={styles.section}>
                      <AppText style={styles.resultsSubtitle}>Exams</AppText>
                      {searchResults.exams.map(exam => (
                        <TouchableOpacity 
                          key={exam.id} 
                          style={styles.resultItem}
                          onPress={() => { executeSearch(exam.name); router.push({ pathname: '/(tabs)/practice', params: { exam: exam.name } }); }}
                        >
                          <View style={[styles.examIconContainer, { backgroundColor: '#9CA3AF', marginBottom: 0, marginRight: 12 }]}>
                            {getExamIcon(exam.name) ? (
                              <Image source={getExamIcon(exam.name)} style={{ width: 18, height: 18 }} contentFit="contain" />
                            ) : (
                              <AppText style={{ color: '#FFF', fontWeight: 'bold' }}>{exam.name.charAt(0)}</AppText>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText style={styles.resultItemTitle}>{exam.name}</AppText>
                            <AppText style={styles.resultItemDesc}>{exam.description || 'Practice Exam'}</AppText>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {searchResults.subjects.length > 0 && (
                    <View style={styles.section}>
                      <AppText style={styles.resultsSubtitle}>Subjects / Topics</AppText>
                      {searchResults.subjects.map((sub, idx) => (
                        <TouchableOpacity key={idx} style={styles.resultItem} onPress={() => executeSearch(sub)}>
                          <View style={[styles.examIconContainer, { backgroundColor: '#4F46E5', marginBottom: 0, marginRight: 12 }]}>
                            <AppText style={{ color: '#FFF', fontWeight: 'bold' }}>#</AppText>
                          </View>
                          <AppText style={styles.resultItemTitle}>{sub}</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          ) : (
            /* DEFAULT EXPLORE VIEW */
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>Recent Searches</AppText>
                    <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                      <AppText style={styles.linkText}>Clear All</AppText>
                    </TouchableOpacity>
                  </View>
                  
                  {recentSearches.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.recentItem} onPress={() => handleRecentPress(item.query)}>
                      <Image 
                        source={require('../../../assets/images/search-recent-clock.png')} 
                        style={styles.recentClockIcon} 
                        contentFit="contain" 
                      />
                      <AppText style={styles.recentText}>{item.query}</AppText>
                      <TouchableOpacity onPress={() => removeRecent(item.id)} activeOpacity={0.7} style={{ padding: 4 }}>
                        <Image 
                          source={require('../../../assets/images/search-input-close.png')} 
                          style={{ width: 10, height: 10, opacity: 0.4 }} 
                          contentFit="contain" 
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular Exams */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AppText style={styles.sectionTitle}>Popular Exams</AppText>
                  <TouchableOpacity activeOpacity={0.7}>
                    <AppText style={styles.linkText}>View all</AppText>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.examsGrid}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#4C1D95" />
                  ) : (
                    exams.slice(0, 4).map((exam) => (
                      <TouchableOpacity 
                        key={exam.id} 
                        style={[styles.examCard, { backgroundColor: '#F3F4F6' }]}
                        activeOpacity={0.8}
                        onPress={() => { executeSearch(exam.name); router.push({ pathname: '/(tabs)/practice', params: { exam: exam.name } }); }}
                      >
                        <View style={[styles.examIconContainer, { backgroundColor: '#9CA3AF' }]}>
                          {getExamIcon(exam.name) ? (
                            <Image source={getExamIcon(exam.name)} style={{ width: 18, height: 18 }} contentFit="contain" />
                          ) : (
                            <AppText style={{ color: '#FFF', fontWeight: 'bold' }}>{exam.name.charAt(0)}</AppText>
                          )}
                        </View>
                        <AppText style={[styles.examTitle, { color: '#111827' }]}>{exam.name}</AppText>
                        <AppText style={styles.examDesc}>{exam.description || 'Practice'}</AppText>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              {/* Suggested Subjects */}
              <View style={styles.section}>
                <AppText style={styles.sectionTitle}>Suggested Subjects</AppText>
                
                <View style={styles.subjectsCloud}>
                  {[
                    { name: 'Mathematics', image: require('../../../assets/images/tag-english-bubble.png') },
                    { name: 'English Language', image: require('../../../assets/images/search-input-mag.png') },
                    { name: 'Physics', image: require('../../../assets/images/tag-physics-atom.png') },
                    { name: 'Chemistry', image: require('../../../assets/images/tag-chemistry-flask.png') },
                    { name: 'Biology', image: require('../../../assets/images/tag-biology-cross.png') },
                    { name: 'Economics', image: require('../../../assets/images/tag-economics-bar.png') },
                  ].map((subject, i) => (
                    <TouchableOpacity key={i} style={styles.subjectPill} activeOpacity={0.8} onPress={() => handleRecentPress(subject.name)}>
                      <Image source={subject.image} style={{ width: 15, height: 15 }} contentFit="contain" />
                      <AppText style={styles.subjectText}>{subject.name}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 12,
    marginTop: Platform.OS === 'android' ? 12 : 4 
  },
  scrollContent: { paddingTop: 4 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    paddingHorizontal: 14, 
    paddingVertical: 11, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },
  section: { marginBottom: 26 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  linkText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  recentItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 13, 
    paddingHorizontal: 14, 
    backgroundColor: '#FFF', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    marginBottom: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.02, 
    shadowRadius: 3, 
    elevation: 1 
  },
  recentClockIcon: { width: 15, height: 15 },
  recentText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#374151', fontWeight: '500' },
  examsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  examCard: { 
    flex: 1, 
    borderRadius: 16, 
    paddingVertical: 14, 
    paddingHorizontal: 6, 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: 120,
  },
  examIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  examTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  examDesc: { fontSize: 9.5, color: '#6B7280', textAlign: 'center', lineHeight: 13, fontWeight: '500' },
  subjectsCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  subjectPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  subjectText: { marginLeft: 6, fontSize: 12.5, color: '#1E293B', fontWeight: '600' },

  // Search Results
  resultsSubtitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resultItemTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  resultItemDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 }
});


