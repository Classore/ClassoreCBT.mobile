import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { guestService, DemoTest } from '@/services/guest';
import { examService, ExamType, resolveNumericExamId } from '@/services/exam';
import { GuestAuthModal } from '@/components/GuestAuthModal';

interface AvailableTestItem {
  id: string | number;
  title: string;
  subtitle: string;
  examCode: string;
  examTypeId?: number;
  icon: any;
  iconBg: string;
  demoId?: number;
}

export default function MockTestsScreen() {
  const router = useRouter();
  const [demoTests, setDemoTests] = useState<DemoTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestLimitModalVisible, setGuestLimitModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const demos = await guestService.getDemoTests();
        if (Array.isArray(demos) && demos.length > 0) {
          setDemoTests(demos);
        }
      } catch (err) {
        console.warn('Could not load demo tests:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const defaultAvailableTests: AvailableTestItem[] = [
    {
      id: 'jamb-mock',
      title: 'JAMB Mock Test',
      subtitle: '4 Subjects • 400 questions',
      examCode: 'jamb',
      examTypeId: 1,
      icon: require('../../assets/images/jamb-logo.png'),
      iconBg: '#DFF6EA',
    },
    {
      id: 'utme-practice',
      title: 'UTME Practice',
      subtitle: 'Past questions • Timed',
      examCode: 'jamb',
      examTypeId: 1,
      icon: require('../../assets/images/jamb-logo.png'),
      iconBg: '#DFF6EA',
    },
    {
      id: 'waec-practice',
      title: 'WAEC Practice',
      subtitle: 'Past questions • Timed',
      examCode: 'waec',
      examTypeId: 2,
      icon: require('../../assets/images/waec-logo.png'),
      iconBg: '#EEF2FF',
    },
  ];

  // Map backend demo tests to list items if available
  const availableTests: AvailableTestItem[] = demoTests.length > 0
    ? demoTests.map((dt) => {
        const typeName = ((dt as any).exam_type_name || '').toLowerCase();
        const lowerTitle = ((dt.title || '') + ' ' + typeName).toLowerCase();
        let icon = require('../../assets/images/jamb-logo.png');
        let iconBg = '#DFF6EA';
        let examCode = 'jamb';

        if (lowerTitle.includes('waec') || lowerTitle.includes('ssce') || lowerTitle.includes('wassce')) {
          icon = require('../../assets/images/waec-logo.png');
          iconBg = '#EEF2FF';
          examCode = 'waec';
        } else if (lowerTitle.includes('neco')) {
          icon = require('../../assets/images/waec-logo.png');
          iconBg = '#FEF3C7';
          examCode = 'neco';
        } else if (lowerTitle.includes('ielts')) {
          icon = require('../../assets/images/ielts-logo.png');
          iconBg = '#FEE2E2';
          examCode = 'ielts';
        }

        const resolvedExamId = (dt as any).exam_type || resolveNumericExamId(examCode, 1);

        return {
          id: `demo-${dt.id}`,
          demoId: dt.id,
          title: dt.title,
          subtitle: `${dt.time_limit_minutes} mins • Practice Demo`,
          examCode,
          examTypeId: resolvedExamId,
          icon,
          iconBg,
        };
      })
    : defaultAvailableTests;

  const handleStartTest = async (item?: AvailableTestItem) => {
    const isExceeded = await guestService.hasExceededGuestAttempts();
    if (isExceeded) {
      setGuestLimitModalVisible(true);
      return;
    }

    const examCode = item?.examCode || 'jamb';
    const numericExamId = item?.examTypeId || resolveNumericExamId(examCode, 1);
    const params: Record<string, string> = {
      exam: String(numericExamId),
      exam_name: item?.title || (examCode.toUpperCase() + ' Practice'),
      is_guest: 'true',
    };
    let demoIdToPass = item?.demoId;
    if (!demoIdToPass && demoTests.length > 0) {
      const matchingDemo = demoTests.find(d => (d as any).exam_type === numericExamId);
      demoIdToPass = matchingDemo ? matchingDemo.id : demoTests[0].id;
    }
    if (demoIdToPass) {
      params.demoId = String(demoIdToPass);
    }
    router.push({
      pathname: '/(tabs)/practice/practice-setup',
      params,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mock Tests</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mock Tests Available for Guests Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>
              Mock Tests{'\n'}Available for Guests
            </Text>
            <Text style={styles.heroSubtitle}>
              Try our practice tests and build your confidence.
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => handleStartTest(availableTests[0])}
              activeOpacity={0.85}
            >
              <Text style={styles.heroBtnText}>Start Test</Text>
              <Feather name="arrow-right" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroRight}>
            <Image
              source={require('../../assets/images/guest-mock-tests-hero.png')}
              style={styles.heroImage}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Available Tests Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Tests</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/practice')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Tests List */}
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#512898" />
          </View>
        ) : (
          <View style={styles.testsList}>
            {availableTests.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.testCard}
                onPress={() => handleStartTest(item)}
                activeOpacity={0.75}
              >
                <View style={styles.testCardLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                    <Image
                      source={item.icon}
                      style={styles.examIcon}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.testTextContainer}>
                    <Text style={styles.testTitle}>{item.title}</Text>
                    <Text style={styles.testSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Guest Limit Exhausted Modal */}
      <GuestAuthModal
        visible={guestLimitModalVisible}
        onClose={() => setGuestLimitModalVisible(false)}
        title="🎉 You’ve completed your 3 free guest tests."
        subtitle="Create your free Classore account to continue taking tests, save your results, build your streak and track your progress."
        showContinueAsGuest={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#EFEAFB',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
    minHeight: 165,
  },
  heroLeft: {
    flex: 1.15,
    paddingRight: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 23,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
    marginBottom: 14,
  },
  heroBtn: {
    backgroundColor: '#512898',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroRight: {
    flex: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 120,
    height: 125,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#512898',
  },
  testsList: {
    gap: 12,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEECF5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  testCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  examIcon: {
    width: 26,
    height: 26,
  },
  testTextContainer: {
    flex: 1,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  testSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
  },
});
