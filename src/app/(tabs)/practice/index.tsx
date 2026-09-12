import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.36;

import { examService, ExamType, isSectionBasedExam } from '@/services/exam';

export default function ExamSetupScreen() {
  const { user } = useAuth();
  const { hasUnread } = useNotifications();
  const router = useRouter();
  const params = useLocalSearchParams<{ exam?: string }>();
  
  // Instant synchronous memory cache
  const initialCached = examService.getCachedExamsSync();
  const [exams, setExams] = useState<ExamType[]>(initialCached || []);
  const [loading, setLoading] = useState<boolean>(!initialCached || initialCached.length === 0);
  
  // Helper to determine active exam ID based on list and params
  const resolveExamId = (examList: ExamType[], currentId: number | null): number | null => {
    if (!examList || examList.length === 0) return null;
    if (params.exam) {
      const examParam = Array.isArray(params.exam) ? params.exam[0] : params.exam;
      const match = examList.find(e => 
        String(e.id) === String(examParam) || 
        e.name.toLowerCase().includes(String(examParam).toLowerCase())
      );
      if (match) return match.id;
    }
    if (currentId !== null && examList.some(e => e.id === currentId)) {
      return currentId;
    }
    return examList[0].id;
  };

  const [selectedExam, setSelectedExam] = useState<number | null>(() => {
    return initialCached && initialCached.length > 0 ? resolveExamId(initialCached, null) : null;
  });
  const [selectedMode, setSelectedMode] = useState<'practice' | 'standard'>('practice');

  useEffect(() => {
    let isMounted = true;

    const loadExams = async () => {
      // 1. If we don't have exams from memory cache yet, try persistent storage
      if (!initialCached || initialCached.length === 0) {
        const storedExams = await examService.getCachedExams();
        if (isMounted && storedExams && storedExams.length > 0) {
          setExams(storedExams);
          setLoading(false);
          setSelectedExam(prev => resolveExamId(storedExams, prev));
        }
      }

      // 2. Fetch fresh updated exams from backend in background
      try {
        const freshExams = await examService.getExams();
        if (isMounted && freshExams && freshExams.length > 0) {
          setExams(freshExams);
          setSelectedExam(prev => resolveExamId(freshExams, prev));
        }
      } catch (error) {
        console.error('Failed to fetch exams from backend:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExams();

    return () => {
      isMounted = false;
    };
  }, [params.exam]);

  const handleContinue = () => {
    if (!selectedExam) return;
    const examObj = exams.find(e => e.id === selectedExam);
    
    if (selectedMode === 'practice') {
      router.push({
        pathname: '/(tabs)/practice/practice-setup',
        params: { 
          exam: selectedExam,
          exam_name: examObj?.name,
        }
      });
    } else {
      if (isSectionBasedExam(examObj?.name)) {
        router.push({
          pathname: '/(exam)/ielts-setup',
          params: { 
            exam: selectedExam,
            exam_name: examObj?.name,
            exam_desc: examObj?.description,
          }
        });
      } else {
        router.push({
          pathname: '/(tabs)/practice/standard-setup',
          params: { 
            exam: selectedExam,
            exam_name: examObj?.name,
          }
        });
      }
    }
  };

  const getExamIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('jamb')) return require('../../../../assets/images/jamb-logo.png');
    if (lowerName.includes('ielts')) return require('../../../../assets/images/ielts-logo.png');
    if (lowerName.includes('toefl')) return require('../../../../assets/images/toefl-logo.png');
    if (lowerName.includes('waec')) return require('../../../../assets/images/waec-logo.png');
    if (lowerName.includes('neco')) return require('../../../../assets/images/neco-logo.png');
    return null;
  };  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <View style={styles.fireBadge}>
            <AppText style={styles.fireEmoji}>🔥</AppText>
            <AppText style={styles.fireText}>{user?.streak || 0}</AppText>
          </View>
          <TouchableOpacity 
            style={styles.notifButton}
            activeOpacity={0.7}
            onPress={() => router.push('/notifications' as any)}
          >
            <Feather name="bell" size={20} color="#000" />
            {hasUnread && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Header */}
        <View style={styles.mainHeader}>
          <View style={styles.headerTextContainer}>
            <AppText style={styles.headerTitle}>Let's get you</AppText>
            <AppText style={styles.headerTitle}>
              exam-<AppText style={styles.purpleText}>ready 🚀</AppText>
            </AppText>
            <AppText style={styles.headerSubtitle}>
              Choose the exam and the mode that fits your goal today.
            </AppText>
          </View>
          <Image 
            source={require('../../../../assets/images/exam-ready-3d.png')} 
            style={styles.headerImage} 
            contentFit="contain" 
          />
        </View>

        {/* Section 1: Select Exam */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.circleNumber}>
              <AppText style={styles.circleNumberText}>1</AppText>
            </View>
            <AppText style={styles.sectionTitle}>Select Exam</AppText>
          </View>
          <TouchableOpacity style={styles.viewAllBtn}>
            <AppText style={styles.viewAllText}>View All Exams</AppText>
            <Image source={require('../../../../assets/images/view-all-icon.png')} style={styles.viewAllIcon} />
          </TouchableOpacity>
        </View>

        {/* Exams Scrollable List */}
        {loading ? (
          <View style={{ height: 186, justifyContent: 'center', alignItems: 'center' }}>
             <AppText style={{ color: '#6B7280' }}>Loading exams...</AppText>
          </View>
        ) : (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.examsScrollContent}
            >
              {exams.map((exam) => {
                const isSelected = selectedExam === exam.id;
                const icon = getExamIcon(exam.name);
                
                return (
                  <TouchableOpacity
                    key={exam.id}
                    style={[
                      styles.examCard,
                      isSelected && styles.examCardSelected
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedExam(exam.id)}
                  >
                    {/* Purple corner decoration for selected card */}
                    {isSelected && <View style={styles.selectedCorner} />}
                    
                    <View style={[styles.examIconContainer, isSelected ? styles.examIconSelected : styles.examIconUnselected]}>
                      {icon ? (
                        <Image source={icon} style={styles.examIconImage} contentFit="contain" />
                      ) : (
                        <AppText style={styles.examIconText}>{exam.name.charAt(0).toUpperCase()}</AppText>
                      )}
                    </View>
                    
                    <AppText style={styles.examName}>{exam.name}</AppText>
                    <AppText style={styles.examFullName} numberOfLines={3}>{exam.description || exam.name}</AppText>
                    
                    <View style={styles.examFooter}>
                      <View style={styles.userCountContainer}>
                        <Image source={require('../../../../assets/images/user-icon-green.png')} style={styles.userIcon} contentFit="contain" />
                        <AppText style={styles.userCountText}>---</AppText>
                      </View>
                      {exam.is_premium_only && (
                        <View style={styles.popularBadge}>
                          <AppText style={styles.popularText}>Premium</AppText>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.paginationDots}>
              {exams.map((exam) => (
                <View 
                  key={exam.id} 
                  style={[styles.dot, selectedExam === exam.id && styles.dotActive]} 
                />
              ))}
            </View>
          </>
        )}

        {/* Section 2: Choose Test Mode */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.circleNumber}>
              <AppText style={styles.circleNumberText}>2</AppText>
            </View>
            <View>
              <AppText style={styles.sectionTitle}>Choose Test Mode</AppText>
              <AppText style={styles.sectionSubtitle}>Pick the mode that matches your goal.</AppText>
            </View>
          </View>
        </View>

        {/* Practice Mode Card */}
        <TouchableOpacity 
          style={[styles.modeCard, selectedMode === 'practice' && styles.modeCardActive]}
          activeOpacity={0.9}
          onPress={() => setSelectedMode('practice')}
        >
          <View style={styles.modeHeaderRow}>
            <View style={styles.modeIconTitle}>
              <View style={[styles.modeIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Feather name="target" size={18} color="#7E57C2" />
              </View>
              <View style={styles.modeTitleContainer}>
                <AppText style={styles.modeTitle}>Practice Mode</AppText>
                <View style={styles.practiceBadge}>
                  <AppText style={styles.practiceBadgeText}>Best for learning</AppText>
                </View>
              </View>
            </View>
            <View style={[styles.radioOuter, selectedMode === 'practice' && styles.radioOuterActive]}>
              {selectedMode === 'practice' && <View style={styles.radioInner} />}
            </View>
          </View>
          
          <AppText style={styles.practiceHighlights}>Learn  •  Improve  •  Master</AppText>
          <AppText style={styles.modeDesc}>
            Customize your test. Choose subjects, topics, difficulty and get instant explanations.
          </AppText>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#7E57C2" />
              <AppText style={styles.featureText}>Instant answers & explanations</AppText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#7E57C2" />
              <AppText style={styles.featureText}>Timed or untimed</AppText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#7E57C2" />
              <AppText style={styles.featureText}>Track your progress</AppText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#7E57C2" />
              <AppText style={styles.featureText}>AI-powered explanations</AppText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Standard Mode Card */}
        <TouchableOpacity 
          style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
          activeOpacity={0.9}
          onPress={() => setSelectedMode('standard')}
        >
          <View style={styles.modeHeaderRow}>
            <View style={styles.modeIconTitle}>
              <View style={[styles.modeIconBg, { backgroundColor: '#DBEAFE' }]}>
                <Feather name="shield" size={18} color="#3B82F6" />
              </View>
              <View style={styles.modeTitleContainer}>
                <AppText style={styles.modeTitle}>Standard Mode</AppText>
                <View style={styles.standardBadge}>
                  <AppText style={styles.standardBadgeText}>Best for exam readiness</AppText>
                </View>
              </View>
            </View>
            <View style={[styles.radioOuter, selectedMode === 'standard' && styles.radioOuterActive]}>
              {selectedMode === 'standard' && <View style={styles.radioInner} />}
            </View>
          </View>
          
          <AppText style={styles.standardHighlights}>Simulate  •  Experience  •  Excel</AppText>
          <AppText style={styles.modeDesc}>
            Take a real exam simulation with official rules and timing.
          </AppText>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#3B82F6" />
              <AppText style={styles.featureText}>Official exam structure</AppText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#3B82F6" />
              <AppText style={styles.featureText}>Real exam timing</AppText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#3B82F6" />
              <AppText style={styles.featureText}>No instant answers</AppText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={16} color="#3B82F6" />
              <AppText style={styles.featureText}>Final score at the end</AppText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Before You Continue */}
        <View style={styles.infoBox}>
          <AppText style={styles.infoBoxTitle}>Before you continue</AppText>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconWrapper, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="wifi" size={16} color="#3B82F6" />
              </View>
              <AppText style={styles.infoText}>Ensure stable{"\n"}internet connection</AppText>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconWrapper, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="battery" size={16} color="#10B981" />
              </View>
              <AppText style={styles.infoText}>Make sure your{"\n"}device is charged</AppText>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconWrapper, { backgroundColor: '#FFFBEB' }]}>
                <Feather name="bell-off" size={16} color="#F59E0B" />
              </View>
              <AppText style={styles.infoText}>Find a quiet place{"\n"}with no distractions</AppText>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconWrapper, { backgroundColor: '#F5F3FF' }]}>
                <Feather name="maximize" size={16} color="#8B5CF6" />
              </View>
              <AppText style={styles.infoText}>You may be required{"\n"}to go fullscreen in{"\n"}Standard Mode</AppText>
            </View>
          </View>
        </View>
        
        {/* Extra padding for absolute footer + tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 170 : 150 }} />
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={!selectedExam}
          activeOpacity={0.85}
        >
          <AppText style={styles.continueText}>Continue</AppText>
          <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  fireEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  fireText: {
    color: '#4C1D95',
    fontWeight: '700',
    fontSize: 14,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  purpleText: {
    color: '#7E57C2',
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
    lineHeight: 22,
    paddingRight: 20,
  },
  headerImage: {
    width: 140,
    height: 140,
    marginRight: -12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  circleNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7E57C2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  circleNumberText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 38,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7E57C2',
    fontWeight: '800',
    fontSize: 14,
    marginRight: 6,
  },
  viewAllIcon: {
    width: 16,
    height: 16,
  },
  examsScrollContent: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 8,
  },
  examCard: {
    width: cardWidth,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    height: 186,
  },
  examCardSelected: {
    borderColor: '#7E57C2',
  },
  selectedCorner: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 24,
    height: 24,
    backgroundColor: '#7E57C2',
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  examIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  examIconUnselected: {
    backgroundColor: '#D1FAE5',
  },
  examIconSelected: {
    backgroundColor: '#EDE9FE',
  },
  examIconImage: {
    width: 22,
    height: 22,
  },
  examIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7E57C2',
  },
  examName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  examFullName: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 14,
    flex: 1,
  },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  userCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  popularBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7E57C2',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 5,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#7E57C2',
  },
  modeCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  modeCardActive: {
    borderColor: '#7E57C2',
  },
  modeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modeIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  modeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#7E57C2',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7E57C2',
  },
  practiceBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  practiceBadgeText: {
    color: '#7E57C2',
    fontSize: 10,
    fontWeight: '700',
  },
  standardBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  standardBadgeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },
  practiceHighlights: {
    color: '#7E57C2',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 4,
  },
  standardHighlights: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 4,
  },
  modeDesc: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 8,
    lineHeight: 16,
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#FFFBF2',
    borderWidth: 1,
    borderColor: '#FDE6B5',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 84 : 64,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    backgroundColor: '#4C1D95',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  }
});

