import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'JAMB Mathematics',
    'IELTS Reading',
    'WAEC Biology',
    'NECO Physics',
  ]);

  const removeRecent = (index: number) => {
    setRecentSearches(recentSearches.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setRecentSearches([]);
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
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Image 
                source={require('../../../assets/images/search-input-close.png')} 
                style={{ width: 12, height: 12, opacity: 0.6 }} 
                contentFit="contain" 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Image 
                source={require('../../../assets/images/search-input-close.png')} 
                style={{ width: 14, height: 14 }} 
                contentFit="contain" 
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                  <Text style={styles.linkText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              {recentSearches.map((item, index) => (
                <View key={index} style={styles.recentItem}>
                  <Image 
                    source={require('../../../assets/images/search-recent-clock.png')} 
                    style={styles.recentClockIcon} 
                    contentFit="contain" 
                  />
                  <Text style={styles.recentText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeRecent(index)} activeOpacity={0.7}>
                    <Image 
                      source={require('../../../assets/images/search-input-close.png')} 
                      style={{ width: 10, height: 10, opacity: 0.4 }} 
                      contentFit="contain" 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Popular Exams */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Exams</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.linkText}>View all</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.examsGrid}>
              {[
                { 
                  id: 'jamb',
                  name: 'JAMB', 
                  desc: 'UTME\nPractice', 
                  image: require('../../../assets/images/search-jamb-cap.png'), 
                  color: '#059669', 
                  badgeBg: '#10B981',
                  bg: '#ECFDF5' 
                },
                { 
                  id: 'waec',
                  name: 'WAEC', 
                  desc: 'WASSCE', 
                  image: require('../../../assets/images/search-waec-cross.png'), 
                  color: '#3B82F6', 
                  badgeBg: '#3B82F6',
                  bg: '#EFF6FF' 
                },
                { 
                  id: 'ielts',
                  name: 'IELTS', 
                  desc: 'English Test', 
                  image: require('../../../assets/images/search-ielts-headphones.png'), 
                  color: '#E11D48', 
                  badgeBg: '#E11D48',
                  bg: '#FFF1F2' 
                },
                { 
                  id: 'neco',
                  name: 'NECO', 
                  desc: 'SSCE\nPractice', 
                  image: require('../../../assets/images/search-neco-clock.png'), 
                  color: '#D97706', 
                  badgeBg: '#D97706',
                  bg: '#FFFBEB' 
                },
              ].map((exam) => (
                <TouchableOpacity 
                  key={exam.id} 
                  style={[styles.examCard, { backgroundColor: exam.bg }]}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/(tabs)/practice', params: { exam: exam.id } })}
                >
                  <View style={[styles.examIconContainer, { backgroundColor: exam.badgeBg }]}>
                    {exam.image ? (
                      <Image source={exam.image} style={{ width: 18, height: 18 }} contentFit="contain" />
                    ) : (
                      <SymbolView name={exam.symbol as any} size={18} tintColor="#FFF" />
                    )}
                  </View>
                  <Text style={[styles.examTitle, { color: exam.color }]}>{exam.name}</Text>
                  <Text style={styles.examDesc}>{exam.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Suggested Subjects */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Subjects</Text>
            
            <View style={styles.subjectsCloud}>
              {[
                { 
                  name: 'Mathematics', 
                  image: require('../../../assets/images/tag-english-bubble.png') 
                },
                { 
                  name: 'English Language', 
                  image: require('../../../assets/images/search-input-mag.png') 
                },
                { 
                  name: 'Physics', 
                  image: require('../../../assets/images/tag-physics-atom.png') 
                },
                { 
                  name: 'Chemistry', 
                  image: require('../../../assets/images/tag-chemistry-flask.png') 
                },
                { 
                  name: 'Biology', 
                  image: require('../../../assets/images/tag-biology-cross.png') 
                },
                { 
                  name: 'Economics', 
                  image: require('../../../assets/images/tag-economics-bar.png') 
                },
              ].map((subject, i) => (
                <TouchableOpacity key={i} style={styles.subjectPill} activeOpacity={0.8}>
                  <Image source={subject.image} style={{ width: 15, height: 15 }} contentFit="contain" />
                  <Text style={styles.subjectText}>{subject.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
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
  subjectText: { marginLeft: 6, fontSize: 12.5, color: '#1E293B', fontWeight: '600' }
});

