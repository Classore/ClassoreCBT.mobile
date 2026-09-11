import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';

import { getUserGuides, UserGuideItem } from '@/services/support';

interface GuideItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  iconType: 'feather' | 'ionicons' | 'material';
  bgColor: string;
  iconColor: string;
  route?: string;
  modalContent?: {
    title: string;
    points: string[];
  };
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Learn the basics',
    iconName: 'book-open',
    iconType: 'feather',
    bgColor: '#EFF6FF',
    iconColor: '#3B82F6',
    modalContent: {
      title: 'Getting Started with Classore',
      points: [
        'Select your primary target exam (JAMB, IELTS, TOEFL, WAEC) in your profile.',
        'Explore syllabus topics and sample question formats in the Explore tab.',
        'Use your daily free practice attempts to start testing your baseline knowledge.',
        'Earn XP points, maintain your streak, and climb the leaderboard as you practice daily.',
      ],
    },
  },
  {
    id: 'taking-practice-test',
    title: 'Taking a Practice Test',
    subtitle: 'Step-by-step walkthrough',
    iconName: 'file-text',
    iconType: 'feather',
    bgColor: '#F3E8FF',
    iconColor: '#7C3AED',
    route: '/(tabs)/guide-practice-test',
  },
  {
    id: 'understanding-results',
    title: 'Understanding Results',
    subtitle: 'Know your performance',
    iconName: 'bar-chart-2',
    iconType: 'feather',
    bgColor: '#ECFDF5',
    iconColor: '#10B981',
    modalContent: {
      title: 'Understanding Your Results',
      points: [
        'Scores are calculated automatically according to exam standards.',
        'Check accuracy percentage per subject to spot weak chapters and sub-topics.',
        'Tap on any question in Review Answers to see in-depth AI explanations and key concepts.',
        'Generate AI Remedial Practice sets to target only the questions you missed.',
      ],
    },
  },
  {
    id: 'ai-assessments',
    title: 'AI Assessments',
    subtitle: 'How it works',
    iconName: 'sunny-outline',
    iconType: 'ionicons',
    bgColor: '#FEF3C7',
    iconColor: '#F59E0B',
    modalContent: {
      title: 'How AI Assessments Work',
      points: [
        'For essays and written questions, AI analyzes coherence, lexical resource, and grammatical accuracy.',
        'For speaking exams (such as IELTS), AI transcribes speech with microsecond timestamps and grades fluency, pronunciation, and band score.',
        'AI explanations provide clear step-by-step mathematical calculations and reasoning.',
        'Use AI Tutor explanations whenever you are confused by an answer option.',
      ],
    },
  },
  {
    id: 'account-settings',
    title: 'Account & Settings',
    subtitle: 'Manage your account',
    iconName: 'shield',
    iconType: 'feather',
    bgColor: '#FFE4E6',
    iconColor: '#E11D48',
    route: '/settings',
  },
];

export default function UserGuideScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const [guideItems, setGuideItems] = useState<GuideItem[]>(GUIDE_ITEMS);
  const [activeModal, setActiveModal] = useState<GuideItem | null>(null);

  React.useEffect(() => {
    getUserGuides()
      .then((fetched) => {
        if (fetched && fetched.length > 0) {
          const mapped: GuideItem[] = fetched.map((f, i) => ({
            id: String(f.id),
            title: f.title,
            subtitle: `${f.category} • ${f.read_time}`,
            iconName: i % 2 === 0 ? 'book-open' : 'file-text',
            iconType: 'feather',
            bgColor: i % 3 === 0 ? '#EFF6FF' : i % 3 === 1 ? '#F3E8FF' : '#ECFDF5',
            iconColor: i % 3 === 0 ? '#3B82F6' : i % 3 === 1 ? '#7C3AED' : '#10B981',
            modalContent: {
              title: f.title,
              points: [f.content || 'Read this article to master your exam preparation on Classore.'],
            },
          }));
          setGuideItems(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleItemPress = (item: GuideItem) => {
    if (item.route) {
      navigateWithFrom(item.route, '/(tabs)/user-guide');
    } else if (item.modalContent) {
      setActiveModal(item);
    }
  };

  const renderIcon = (item: GuideItem) => {
    if (item.iconType === 'ionicons') {
      return <Ionicons name={item.iconName as any} size={20} color={item.iconColor} />;
    }
    if (item.iconType === 'material') {
      return <MaterialCommunityIcons name={item.iconName as any} size={20} color={item.iconColor} />;
    }
    return <Feather name={item.iconName as any} size={20} color={item.iconColor} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/help-support')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Guide</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconCircle}>
              <Feather name="book-open" size={18} color="#2563EB" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Step-by-step guides</Text>
              <Text style={styles.bannerSubtitle}>
                Learn how to make the most of the app.
              </Text>
            </View>
          </View>

          {/* Guide Menu List */}
          <View style={styles.menuCardGroup}>
            {guideItems.map((item, index) => {
              const isLast = index === guideItems.length - 1;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                  activeOpacity={0.7}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={[styles.menuIconBg, { backgroundColor: item.bgColor }]}>
                    {renderIcon(item)}
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Card: Need more help? */}
          <View style={styles.needHelpCard}>
            <Text style={styles.needHelpTitle}>Need more help?</Text>
            <Text style={styles.needHelpSubtitle}>
              Check out our FAQs or contact support.
            </Text>

            <TouchableOpacity
              style={styles.viewFaqsBtn}
              activeOpacity={0.8}
              onPress={() => navigateWithFrom('/(tabs)/faqs', '/(tabs)/user-guide')}
            >
              <Feather
                name="help-circle"
                size={18}
                color="#6D28D9"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.viewFaqsBtnText}>View FAQs</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Guide Detail Popup Modal */}
      <Modal
        visible={!!activeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                {activeModal?.modalContent?.title || activeModal?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {activeModal?.modalContent?.points.map((pt, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{pt}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.8}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 12,
  },
  bannerCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
  },
  menuCardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Bottom Card
  needHelpCard: {
    marginTop: 20,
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    padding: 20,
  },
  needHelpTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  needHelpSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  viewFaqsBtn: {
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
  viewFaqsBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  modalCloseBtn: {
    backgroundColor: '#6D28D9',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
