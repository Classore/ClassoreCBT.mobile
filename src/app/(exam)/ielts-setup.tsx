import {
  useLocalSearchParams } from 'expo-router';
import { examService,
  resolveNumericExamId } from '@/services/exam';
import { useAuth } from '@/context/AuthContext';
import { AppSafeArea } from '@/components/AppSafeArea';
import React,
  { useState,
  useEffect } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  SubscriptionRequiredModal,
  isSubscriptionError,
  getSubscriptionErrorMessage,
} from '@/components/SubscriptionRequiredModal';


interface SectionItem {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  iconFamily: 'feather' | 'material' | 'ionicons';
}

const DEFAULT_SECTIONS: Record<string, SectionItem> = {
  Reading: { id: 'Reading', name: 'Reading', subtitle: '40 Questions · 60 min', iconName: 'book-outline', iconFamily: 'ionicons' },
  Listening: { id: 'Listening', name: 'Listening', subtitle: '40 Questions · ~30 min', iconName: 'headphones', iconFamily: 'feather' },
  Writing: { id: 'Writing', name: 'Writing', subtitle: '2 Tasks · 60 min', iconName: 'edit-2', iconFamily: 'feather' },
  Speaking: { id: 'Speaking', name: 'Speaking', subtitle: '3 Parts · 11–14 min', iconName: 'mic', iconFamily: 'feather' },
};

export default function IELTSSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ 
    exam?: string;
    exam_name?: string;
    exam_desc?: string;
  }>();

  const examId = resolveNumericExamId(params.exam, 42);

  const mapSections = (fetchedSections: any[]) => {
    const mapped: SectionItem[] = fetchedSections.map(s => {
      const matchedKey = Object.keys(DEFAULT_SECTIONS).find(
        key => (s.name || '').toLowerCase().includes(key.toLowerCase())
      );
      const defaultSec = (matchedKey ? DEFAULT_SECTIONS[matchedKey] : null) || {
        name: s.name,
        subtitle: `${s.default_time_minutes} min`,
        iconName: 'book-outline',
        iconFamily: 'ionicons'
      };
      return {
        id: String(s.id),
        name: defaultSec.name,
        subtitle: defaultSec.subtitle,
        iconName: defaultSec.iconName,
        iconFamily: defaultSec.iconFamily
      };
    });

    // Ensure all 4 IELTS core components (Reading, Listening, Writing, Speaking) are always available
    const standardKeys = ['Reading', 'Listening', 'Writing', 'Speaking'];
    standardKeys.forEach(key => {
      const exists = mapped.some(m => m.name.toLowerCase().includes(key.toLowerCase()));
      if (!exists && DEFAULT_SECTIONS[key]) {
        mapped.push(DEFAULT_SECTIONS[key]);
      }
    });

    return mapped;
  };

  const initialSections = examService.getCachedSectionsSync(examId);
  const initialMapped = initialSections && initialSections.length > 0 
    ? mapSections(initialSections) 
    : Object.values(DEFAULT_SECTIONS);

  const resolveInitialExamInfo = () => {
    if (params.exam_name && typeof params.exam_name === 'string' && params.exam_name.trim()) {
      return {
        name: params.exam_name.trim(),
        desc: params.exam_desc || 'International English Language Testing System',
      };
    }
    const cached = examService.getCachedExamsSync();
    if (cached) {
      const found = cached.find(e => e.id === examId);
      if (found?.name) {
        return {
          name: found.name,
          desc: found.description || 'International English Language Testing System',
        };
      }
    }
    return {
      name: 'IELTS Academic',
      desc: 'International English Language Testing System',
    };
  };

  const initialExamInfo = resolveInitialExamInfo();
  const [sections, setSections] = useState<SectionItem[]>(initialMapped);
  const [examName, setExamName] = useState(initialExamInfo.name);
  const [examDesc, setExamDesc] = useState(initialExamInfo.desc);
  const [loading, setLoading] = useState(!initialSections || initialSections.length === 0);
  const [isStarting, setIsStarting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();


  useEffect(() => {
    let isMounted = true;
    const currentExamId = resolveNumericExamId(params.exam, 42);

    const loadData = async () => {
      // 1. Check stored cache if memory was empty
      if (!initialSections || initialSections.length === 0) {
        const storedSections = await examService.getCachedSections(currentExamId);
        if (isMounted && storedSections && storedSections.length > 0) {
          const mapped = mapSections(storedSections);
          setSections(mapped.length ? mapped : Object.values(DEFAULT_SECTIONS));
          setLoading(false);
        }
      }

      // 2. Fetch fresh updated data
      try {
        const [fetchedSections, allExams] = await Promise.all([
          examService.getSections(currentExamId),
          examService.getExams()
        ]);

        if (isMounted) {
          const currentExam = allExams.find(e => e.id === currentExamId);
          if (currentExam) {
            setExamName(currentExam.name);
            if (currentExam.description) setExamDesc(currentExam.description);
          }

          const mappedSections = mapSections(fetchedSections);
          setSections(mappedSections.length ? mappedSections : Object.values(DEFAULT_SECTIONS));
        }
      } catch (error) {
        console.error('Failed to fetch sections:', error);
        if (isMounted && sections.length === 0) {
          setSections(Object.values(DEFAULT_SECTIONS)); // Fallback
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [params.exam]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index - 1];
    newSections[index - 1] = newSections[index];
    newSections[index] = temp;
    setSections(newSections);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    setSections(newSections);
  };

  const renderSectionIcon = (item: SectionItem) => {
    if (item.iconFamily === 'ionicons') {
      return <Ionicons name={item.iconName as any} size={20} color="#7C3AED" />;
    }
    return <Feather name={item.iconName as any} size={19} color="#7C3AED" />;
  };

  return (
    <AppSafeArea style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Standard Mode</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak ?? 0}</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero IELTS Banner Card */}
          <LinearGradient
            colors={['#4C1D95', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <View style={styles.heroTitleRow}>
                  <View style={styles.capIconBg}>
                    <Ionicons name="school-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.heroTitleContainer}>
                    <Text style={styles.heroTitle}>{examName}</Text>
                    <Text style={styles.heroSubtitle}>
                      {examDesc}
                    </Text>
                  </View>
                </View>

                {/* Badges */}
                <View style={styles.badgesRow}>
                  <View style={styles.tagBadge}>
                    <Feather name="check-square" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.tagBadgeText}>{sections.length || 4} Sections</Text>
                  </View>
                </View>

                <View style={styles.badgesRow}>
                  <View style={styles.tagBadge}>
                    <Feather name="clock" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.tagBadgeText}>Timed Test</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                    <Text style={styles.tagBadgeText}>4.8 (12.4k)</Text>
                  </View>
                </View>
              </View>

              {/* Right Exam Logo */}
              <View style={styles.logoCircle}>
                <Image 
                  source={
                    examName.toLowerCase().includes('toefl')
                      ? require('../../../assets/images/toefl-logo.png')
                      : require('../../../assets/images/ielts-logo.png')
                  } 
                  style={styles.ieltsLogo} 
                  contentFit="contain" 
                />
              </View>
            </View>
          </LinearGradient>

          {/* Section: Organize Your Test */}
          <View style={styles.sectionHeader}>
            <Text style={styles.organizeTitle}>Organize Your {examName} Test</Text>
            <Text style={styles.organizeSubtitle}>
              Drag and arrange the {sections.length || 4} sections in the order you want to take them.
            </Text>
          </View>

          {/* Section Items List */}
          <View style={styles.sectionsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#6D28D9" style={{ marginVertical: 32 }} />
            ) : (
              sections.map((item, index) => {
                const orderNum = `0${index + 1}`;
                return (
                  <View key={item.id} style={styles.sectionCard}>
                    <Text style={styles.orderNumberText}>{orderNum}</Text>
                    
                    <View style={styles.sectionIconBg}>
                      {renderSectionIcon(item)}
                    </View>
  
                    <View style={styles.sectionInfo}>
                      <Text style={styles.sectionName}>{item.name}</Text>
                      <Text style={styles.sectionSubtitle}>{item.subtitle}</Text>
                    </View>
  
                    {/* Reorder Buttons / Drag Handle */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity 
                      onPress={() => moveUp(index)} 
                      disabled={index === 0}
                      style={{ opacity: index === 0 ? 0.3 : 1, padding: 2 }}
                    >
                      <Feather name="chevron-up" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="drag-vertical" size={20} color="#9CA3AF" />
                    <TouchableOpacity 
                      onPress={() => moveDown(index)} 
                      disabled={index === sections.length - 1}
                      style={{ opacity: index === sections.length - 1 ? 0.3 : 1, padding: 2 }}
                    >
                      <Feather name="chevron-down" size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
              })
            )}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Feather name="info" size={20} color="#7C3AED" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              You won't be able to return to a section or question once you leave it. Make sure your order is correct before starting.
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueButton, isStarting && { opacity: 0.7 }]}
            disabled={isStarting}
            onPress={async () => {
              if (isStarting) return;
              setIsStarting(true);

              const examId = resolveNumericExamId(params.exam, 42);
              const sectionOrder = sections.map(s => s.id).join(',');
              const sectionNames = sections.map(s => s.name).join(',');
              const orderIds = sections.map(s => Number(s.id)).filter(n => !isNaN(n));
              const firstSectionName = sections[0]?.name || 'Reading';

              try {
                // Pre-fetch attempt & questions BEFORE showing instructions
                const newAttempt = await examService.startExam({
                  exam_type_id: examId,
                  mode: 'Standard',
                  selected_section_ids: orderIds.length > 0 ? orderIds : undefined,
                });

                router.push({
                  pathname: '/(exam)/ielts-instructions',
                  params: { 
                    ...params,
                    attempt_id: String(newAttempt.id),
                    exam: String(examId), 
                    section_order: sectionOrder,
                    section_names: sectionNames,
                    exam_name: examName,
                    exam_desc: examDesc,
                    section_name: firstSectionName,
                  }
                });
              } catch (error: any) {
                console.error('Failed to pre-start IELTS attempt:', error);
                const errorMsg = getSubscriptionErrorMessage(
                  error,
                  'Failed to start exam. Please check your connection and try again.'
                );
                if (isSubscriptionError(error)) {
                  setSubscriptionMessage(errorMsg);
                  setShowSubscriptionModal(true);
                } else {
                  Alert.alert('Unable to Start Exam', errorMsg);
                }
              } finally {
                setIsStarting(false);
              }
            }}
            activeOpacity={0.85}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        customMessage={subscriptionMessage}
        pendingRedirect={{
          pathname: '/(exam)/ielts-setup',
          params: {
            ...params,
            auto_start: 'true',
          },
        }}
      />
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  capIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#DDD6FE',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  ieltsLogo: {
    width: 54,
    height: 32,
  },

  // Organize Section
  sectionHeader: {
    marginBottom: 14,
  },
  organizeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  organizeSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Section List
  sectionsList: {
    gap: 10,
    marginBottom: 16,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  orderNumberText: {
    width: 28,
    fontSize: 15,
    fontWeight: '800',
    color: '#4C1D95',
  },
  sectionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Continue Button
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
