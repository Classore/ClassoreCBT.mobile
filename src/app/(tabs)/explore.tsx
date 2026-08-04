import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SymbolView name="magnifyingglass" size={20} tintColor="#9CA3AF" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search exams, subjects..."
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
          <TouchableOpacity onPress={() => router.back()}>
            <SymbolView name="xmark" size={20} tintColor="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Recent Searches */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity><Text style={styles.linkText}>Clear All</Text></TouchableOpacity>
            </View>
            
            {['JAMB Mathematics', 'IELTS Reading', 'WAEC Biology', 'NECO Physics'].map((item, index) => (
              <View key={index} style={styles.recentItem}>
                <SymbolView name="clock" size={16} tintColor="#3B82F6" />
                <Text style={styles.recentText}>{item}</Text>
                <TouchableOpacity>
                  <SymbolView name="xmark" size={14} tintColor="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Popular Exams */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Exams</Text>
              <TouchableOpacity><Text style={styles.linkText}>View all</Text></TouchableOpacity>
            </View>
            
            <View style={styles.examsGrid}>
              {[
                { name: 'JAMB', desc: 'UTME Practice', icon: 'graduationcap', color: '#10B981', bg: '#D1FAE5' },
                { name: 'WAEC', desc: 'WASSCE', icon: 'globe', color: '#4F46E5', bg: '#E0E7FF' },
                { name: 'IELTS', desc: 'English Test', icon: 'headphones', color: '#E11D48', bg: '#FFE4E6' },
                { name: 'NECO', desc: 'SSCE Practice', icon: 'clock', color: '#D97706', bg: '#FEF3C7' },
              ].map((exam, i) => (
                <TouchableOpacity key={i} style={[styles.examCard, { backgroundColor: exam.bg }]}>
                  <View style={[styles.examIconContainer, { backgroundColor: exam.color }]}>
                    <SymbolView name={exam.icon as any} size={24} tintColor="#FFF" />
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
                { name: 'Mathematics', icon: 'function' },
                { name: 'English Language', icon: 'text.bubble' },
                { name: 'Physics', icon: 'atom' },
                { name: 'Chemistry', icon: 'flask' },
                { name: 'Biology', icon: 'leaf' },
                { name: 'Economics', icon: 'chart.bar' },
              ].map((subject, i) => (
                <TouchableOpacity key={i} style={styles.subjectPill}>
                  <SymbolView name={subject.icon as any} size={16} tintColor="#4F46E5" />
                  <Text style={styles.subjectText}>{subject.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{height: 100}} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#111827' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  linkText: { fontSize: 14, color: '#4F46E5', fontWeight: '500' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  recentText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#374151' },
  examsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  examCard: { width: '23%', borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center', aspectRatio: 0.7 },
  examIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  examTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  examDesc: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  subjectsCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  subjectPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  subjectText: { marginLeft: 8, fontSize: 14, color: '#111827', fontWeight: '500' }
});
