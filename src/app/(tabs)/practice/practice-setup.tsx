import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

const SUBJECTS = [
  { id: 'eng', name: 'Use of English', icon: 'book', color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'math', name: 'Mathematics', icon: 'function', color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'phy', name: 'Physics', icon: 'atom', color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'chem', name: 'Chemistry', icon: 'flask', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'bio', name: 'Biology', icon: 'leaf', color: '#10B981', bg: '#D1FAE5' },
  { id: 'com', name: 'Commerce', icon: 'chart.bar', color: '#9CA3AF', bg: '#F3F4F6' },
  { id: 'gov', name: 'Government', icon: 'building.columns', color: '#9CA3AF', bg: '#F3F4F6' },
  { id: 'lit', name: 'Literature in English', icon: 'book.closed', color: '#9CA3AF', bg: '#F3F4F6' },
];

export default function PracticeSetupModal() {
  const router = useRouter();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['eng', 'math', 'phy', 'bio']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== id));
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects([...selectedSubjects, id]);
      }
    }
  };

  const filteredSubjects = SUBJECTS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      {/* Handle Bar */}
      <View style={styles.handleBarContainer}>
        <View style={styles.handleBar} />
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Select Subjects</Text>
          <Text style={styles.subtitle}>Choose the subjects you want to practice</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <SymbolView name="xmark" size={24} tintColor="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SymbolView name="magnifyingglass" size={20} tintColor="#9CA3AF" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search subjects"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {filteredSubjects.map(subject => {
          const isSelected = selectedSubjects.includes(subject.id);
          return (
            <TouchableOpacity 
              key={subject.id} 
              style={styles.subjectRow}
              onPress={() => toggleSubject(subject.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: subject.bg }]}>
                <SymbolView name={subject.icon as any} size={20} tintColor={subject.color} />
              </View>
              <Text style={styles.subjectName}>{subject.name}</Text>
              
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <SymbolView name="checkmark" size={12} tintColor="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{height: 40}} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.selectionInfo}>
          <View style={styles.checkBadge}>
            <SymbolView name="checkmark" size={14} tintColor="#6D28D9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedCountText}>{selectedSubjects.length} subjects selected</Text>
            <Text style={styles.selectedMaxText}>Maximum of four subject</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedSubjects([])}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.continueButton, selectedSubjects.length === 0 && styles.continueButtonDisabled]}
          disabled={selectedSubjects.length === 0}
          onPress={() => {
            // Proceed to test
            console.log('Proceed with', selectedSubjects);
            router.back(); // close modal for now
          }}
        >
          <Text style={styles.continueButtonText}>Continue ({selectedSubjects.length})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  selectedMaxText: {
    fontSize: 12,
    color: '#6B7280',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D28D9',
  },
  continueButton: {
    backgroundColor: '#4C1D95',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
