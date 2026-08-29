import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService, UserAttempt, AttemptSection, QuestionGroupItem, UserResponseItem } from '@/services/exam';

export default function IELTSSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string; exam?: string; exam_type_id?: string; section_order?: string }>();
  
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const initIelts = async () => {
      try {
        let currentAttempt: UserAttempt;
        if (params.attempt_id) {
          const res = await examService.resumeExam(Number(params.attempt_id));
          currentAttempt = res;
          setTimeLeft(res.timer_info.remaining_seconds);
        } else {
          const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
          const order = params.section_order ? params.section_order.split(',').map(Number) : undefined;
          const newAttempt = await examService.startExam({
            exam_type_id: examId,
            mode: 'Standard',
            selected_section_ids: order,
          });
          const res = await examService.resumeExam(newAttempt.id);
          currentAttempt = res;
          setTimeLeft(res.timer_info.remaining_seconds);
        }

        // Sort sections according to section_order if available
        if (params.section_order && currentAttempt.sections) {
          const orderMap = new Map(params.section_order.split(',').map((id, index) => [Number(id), index]));
          currentAttempt.sections.sort((a, b) => {
            const indexA = orderMap.has(a.section_id) ? orderMap.get(a.section_id)! : 999;
            const indexB = orderMap.has(b.section_id) ? orderMap.get(b.section_id)! : 999;
            return indexA - indexB;
          });
        }
        
        setAttempt(currentAttempt);
      } catch (e) {
        console.warn('Could not initialize live IELTS attempt:', e);
      } finally {
        setLoading(false);
      }
    };
    initIelts();
  }, [params.attempt_id, params.exam, params.exam_type_id, params.section_order]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!loading && attempt) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, attempt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeSection = attempt?.sections[activeSectionIndex];
  const activeGroup = activeSection?.question_groups[activeGroupIndex];
  const currentResponse = activeGroup?.responses[currentResponseIndex];

  // Map of all responses in the current section for the palette
  const allSectionResponses = useMemo(() => {
    if (!activeSection) return [];
    return activeSection.question_groups.flatMap(g => g.responses);
  }, [activeSection]);

  const handleSelectOption = async (choiceId: number) => {
    if (!attempt || !currentResponse) return;
    
    // Optimistic update
    const updatedAttempt = { ...attempt };
    const sec = updatedAttempt.sections[activeSectionIndex];
    const grp = sec.question_groups[activeGroupIndex];
    const resp = grp.responses[currentResponseIndex];
    resp.selected_choice = choiceId;
    setAttempt(updatedAttempt);

    try {
      await examService.autoSave(attempt.id, {
        responses: [{ 
          question_id: currentResponse.question.id, 
          choice_id: choiceId,
          time_spent_seconds: 15 // Approx
        }]
      });
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  };

  const handleNext = () => {
    if (!activeGroup || !activeSection) return;
    if (currentResponseIndex < activeGroup.responses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
    } else if (activeGroupIndex < activeSection.question_groups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setCurrentResponseIndex(0);
    }
  };

  const handlePrevious = () => {
    if (!activeGroup || !activeSection) return;
    if (currentResponseIndex > 0) {
      setCurrentResponseIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      setActiveGroupIndex(prev => prev - 1);
      setCurrentResponseIndex(activeSection.question_groups[activeGroupIndex - 1].responses.length - 1);
    }
  };

  const handleFinishSection = () => {
    if (!attempt) return;
    Alert.alert(
      `Complete ${activeSection?.section_name} Section`,
      `Are you sure you want to finish the ${activeSection?.section_name} section and proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            if (activeSectionIndex < attempt.sections.length - 1) {
              const nextSection = attempt.sections[activeSectionIndex + 1];
              if (nextSection.section_name.toLowerCase().includes('speaking')) {
                 router.replace({
                   pathname: '/(exam)/ielts-speaking-instructions',
                   params: { attempt_id: attempt.id }
                 });
              } else {
                 setActiveSectionIndex(prev => prev + 1);
                 setActiveGroupIndex(0);
                 setCurrentResponseIndex(0);
              }
            } else {
              // Submit exam
              examService.submitExam(attempt.id, { responses: [] }).then(() => {
                Alert.alert("Exam Submitted", "You have completed the test!");
                router.replace('/');
              }).catch(e => console.error(e));
            }
          },
        },
      ]
    );
  };

  if (loading || !attempt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading Exam Session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeSection || !activeGroup || !currentResponse) {
     return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#6B7280' }}>No content available for this section.</Text>
          <TouchableOpacity onPress={handleFinishSection} style={[styles.nextButton, { marginTop: 20 }]}>
            <Text style={styles.nextButtonText}>Next Section</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
     );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setIsPaletteVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="menu" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeSection.section_name}</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Passage Selection Tabs */}
        <View style={styles.passageTabsContainer}>
          {activeSection.question_groups.map((group, idx) => (
             <TouchableOpacity 
              key={group.group_id}
              style={[styles.passageTab, activeGroupIndex === idx && styles.passageTabActive]}
              onPress={() => { setActiveGroupIndex(idx); setCurrentResponseIndex(0); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.passageTabTitle, activeGroupIndex === idx && styles.passageTabTitleActive]}>
                Part {idx + 1}
              </Text>
              <Text style={[styles.passageTabSub, activeGroupIndex === idx && styles.passageTabSubActive]}>
                {group.responses.length} Qs
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Passage Reading Card */}
          {(activeGroup.context_text || activeGroup.context_media) && (
            <View style={styles.passageCard}>
              <View style={styles.passageHeaderRow}>
                <Text style={styles.passageNumberText}>Context</Text>
                <TouchableOpacity 
                  style={styles.bookmarkButton}
                  onPress={() => setIsBookmarked(!isBookmarked)}
                  activeOpacity={0.7}
                >
                  <Feather 
                    name="bookmark" 
                    size={18} 
                    color={isBookmarked ? '#7C3AED' : '#4B5563'} 
                  />
                </TouchableOpacity>
              </View>

              {activeGroup.group_title && (
                <Text style={styles.passageTitle}>{activeGroup.group_title}</Text>
              )}

              {activeGroup.context_text && (
                <Text style={styles.passageBodyText}>{activeGroup.context_text}</Text>
              )}
            </View>
          )}

          {/* Question Subheading */}
          <Text style={styles.questionSectionTitle}>Question {currentResponseIndex + 1} of {activeGroup.responses.length}</Text>

          {/* Current Question */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeaderRow}>
              <View style={styles.questionNumberBadge}>
                <Text style={styles.questionNumberText}>{currentResponseIndex + 1}</Text>
              </View>
              <Text style={styles.questionText}>{currentResponse.question.text}</Text>
            </View>

            {/* Options List */}
            {currentResponse.question.choices && currentResponse.question.choices.length > 0 && (
              <View style={styles.optionsList}>
                {currentResponse.question.choices.map((opt, i) => {
                  const isSelected = currentResponse.selected_choice === opt.id;
                  const label = String.fromCharCode(65 + i);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      onPress={() => handleSelectOption(opt.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        <Text style={styles.optionLabel}>{label}. </Text>
                        {opt.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Previous & Next Buttons */}
          <View style={styles.navigationButtonsRow}>
            <TouchableOpacity 
              style={[styles.prevButton, (activeGroupIndex === 0 && currentResponseIndex === 0) && { opacity: 0.5 }]}
              onPress={handlePrevious}
              disabled={activeGroupIndex === 0 && currentResponseIndex === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Utility Bar */}
        <View style={styles.bottomBar}>
          {/* Question Palette */}
          <TouchableOpacity 
            style={styles.bottomBarAction}
            onPress={() => setIsPaletteVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="grid" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Question Palette</Text>
          </TouchableOpacity>

          {/* Submit Test */}
          <TouchableOpacity 
            style={styles.bottomBarAction}
            onPress={handleFinishSection}
            activeOpacity={0.7}
          >
            <Feather name="flag" size={18} color="#EF4444" />
            <Text style={[styles.bottomBarActionText, { color: '#EF4444' }]}>Finish Section</Text>
          </TouchableOpacity>

          {/* Contact Support */}
          <TouchableOpacity style={styles.bottomBarAction} activeOpacity={0.7}>
            <Feather name="headphones" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Question Palette Modal */}
        <Modal
          visible={isPaletteVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPaletteVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Question Palette</Text>
                <TouchableOpacity 
                  onPress={() => setIsPaletteVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Status Indicator Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                  <Text style={styles.legendText}>Answered</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Current</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendRing, { borderColor: '#CBD5E1' }]} />
                  <Text style={styles.legendText}>Unanswered</Text>
                </View>
              </View>

              {/* Question Number Grid */}
              <ScrollView style={{ maxHeight: 300 }}>
                <View style={styles.questionGrid}>
                  {allSectionResponses.map((r, idx) => {
                    // Find actual group index and response index for this question
                    let targetGroupIdx = 0;
                    let targetRespIdx = 0;
                    let count = 0;
                    for (let g = 0; g < activeSection.question_groups.length; g++) {
                      const len = activeSection.question_groups[g].responses.length;
                      if (idx < count + len) {
                        targetGroupIdx = g;
                        targetRespIdx = idx - count;
                        break;
                      }
                      count += len;
                    }

                    const isCurrent = activeGroupIndex === targetGroupIdx && currentResponseIndex === targetRespIdx;
                    const isAnswered = r.selected_choice !== null || r.written_response !== null;

                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.gridCircle,
                          isAnswered && styles.gridCircleAnswered,
                          isCurrent && !isAnswered && styles.gridCircleCurrent,
                        ]}
                        onPress={() => {
                          setActiveGroupIndex(targetGroupIdx);
                          setCurrentResponseIndex(targetRespIdx);
                          setIsPaletteVisible(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.gridCircleText,
                            isAnswered && styles.gridCircleTextAnswered,
                            isCurrent && !isAnswered && styles.gridCircleTextCurrent,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  timerBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // Passage Tabs
  passageTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  passageTab: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  passageTabActive: {
    backgroundColor: '#4C1D95',
  },
  passageTabTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  passageTabTitleActive: {
    color: '#FFFFFF',
  },
  passageTabSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  passageTabSubActive: {
    color: '#DDD6FE',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Passage Card
  passageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  passageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  passageNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    lineHeight: 22,
  },
  passageBodyText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 21,
  },

  // Questions Subtitle
  questionSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  // Question Card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionItemSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
    backgroundColor: '#FAF5FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#7C3AED',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  optionText: {
    flex: 1,
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 19,
  },
  optionTextSelected: {
    color: '#111827',
    fontWeight: '700',
  },
  optionLabel: {
    fontWeight: '800',
  },

  // Navigation Buttons
  navigationButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  prevButton: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C3AED',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Bottom Utility Bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  bottomBarAction: {
    alignItems: 'center',
  },
  bottomBarActionText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 4,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  gridCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCircleAnswered: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  gridCircleCurrent: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  gridCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  gridCircleTextAnswered: {
    color: '#FFFFFF',
  },
  gridCircleTextCurrent: {
    color: '#F59E0B',
  }
});
