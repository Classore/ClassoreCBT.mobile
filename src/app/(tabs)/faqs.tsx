import React, { useState, useMemo } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  actionText?: string;
  actionRoute?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I take a practice test?',
    answer:
      'To take a practice test, navigate to the Practice tab, select your exam type (e.g. JAMB UTME, IELTS), customize your subjects and question count, and tap Start Test.',
    actionText: 'View Step-by-Step Guide',
    actionRoute: '/(tabs)/guide-practice-test',
  },
  {
    id: '2',
    question: 'How are my test results calculated?',
    answer:
      'Scores are automatically graded upon completion based on the official examination scoring rules. Sectional breakdowns, accuracy rates, and AI diagnostic insights will be instantly available in your Reports.',
  },
  {
    id: '3',
    question: 'What are tokens used for?',
    answer:
      'Tokens are used to unlock full premium mock exams, purchase dedicated exam service bundles, and access specialized AI-driven essay, speaking, and remediation features.',
  },
  {
    id: '4',
    question: 'How do payments work?',
    answer:
      'You can securely buy tokens via Paystack (Debit/Credit Card, Bank Transfer, USSD) or Apple In-App Purchases. Once payment is confirmed, your token balance updates immediately.',
  },
  {
    id: '5',
    question: 'Can I retake a test?',
    answer:
      'Yes! You can retake any practice test anytime from the Practice tab or review past attempts with AI explanations in your test history.',
  },
  {
    id: '6',
    question: 'How do AI assessments work?',
    answer:
      'Our integrated AI models evaluate written and spoken responses against official scoring rubrics (such as IELTS bands), analyzing grammar, vocabulary, fluency, and accuracy.',
  },
  {
    id: '7',
    question: 'Where can I see my history?',
    answer:
      'Your past exam attempts, scores, question reviews, and progress charts are permanently saved under the Reports tab and on your Profile dashboard.',
  },
  {
    id: '8',
    question: 'How do I contact support?',
    answer:
      'You can reach our dedicated support team directly via the Contact Support screen or by submitting an issue report. We respond within 24 hours.',
    actionText: 'Contact Support Now',
    actionRoute: '/(tabs)/contact-support',
  },
];

export default function FAQsScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/help-support')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQs</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* FAQs List Card */}
          <View style={styles.faqCardGroup}>
            {filteredFaqs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="help-circle" size={36} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No matching FAQs</Text>
                <Text style={styles.emptySubtitle}>Try searching with different keywords.</Text>
              </View>
            ) : (
              filteredFaqs.map((item, index) => {
                const isExpanded = expandedId === item.id;
                const isLast = index === filteredFaqs.length - 1;

                return (
                  <View
                    key={item.id}
                    style={[styles.faqItemWrapper, !isLast && styles.faqItemBorder]}
                  >
                    <TouchableOpacity
                      style={styles.faqQuestionRow}
                      activeOpacity={0.7}
                      onPress={() => toggleExpand(item.id)}
                    >
                      <Text style={styles.faqQuestionText}>{item.question}</Text>
                      <Feather
                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                        size={18}
                        color={isExpanded ? '#6D28D9' : '#9CA3AF'}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                        {item.actionText && item.actionRoute && (
                          <TouchableOpacity
                            style={styles.faqActionBtn}
                            activeOpacity={0.7}
                            onPress={() => navigateWithFrom(item.actionRoute as any, '/(tabs)/faqs')}
                          >
                            <Text style={styles.faqActionBtnText}>{item.actionText}</Text>
                            <Feather name="arrow-right" size={14} color="#6D28D9" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Bottom Card: Still have questions? */}
          <View style={styles.contactSupportCard}>
            <Text style={styles.contactCardTitle}>Still have questions?</Text>
            <Text style={styles.contactCardSubtitle}>Contact our support team.</Text>

            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.8}
              onPress={() => navigateWithFrom('/(tabs)/contact-support', '/(tabs)/faqs')}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color="#6D28D9"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.contactBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacer for tab bar */}
          <View style={{ height: 100 }} />
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
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
    paddingTop: 12,
  },
  searchBar: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#111827',
    paddingVertical: 0,
  },
  faqCardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  faqItemWrapper: {
    backgroundColor: '#FFFFFF',
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  faqQuestionText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  faqAnswerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 0,
    backgroundColor: '#FAFAFA',
  },
  faqAnswerText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 21,
  },
  faqActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  faqActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Bottom Card
  contactSupportCard: {
    marginTop: 20,
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    padding: 20,
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  contactCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  contactBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contactBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
});
