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
  const params = useLocalSearchParams<{ 
    attempt_id?: string; 
    exam?: string; 
    exam_type_id?: string; 
    section_order?: string;
    sections?: string;
    mode?: string;
    time_limit?: string;
  }>();
  
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initIelts = async () => {
      try {
        let currentAttempt: UserAttempt;
        if (params.attempt_id) {
          const res = await examService.resumeExam(Number(params.attempt_id));
          currentAttempt = res;
          if (res.timer_info?.remaining_seconds !== undefined) {
            setTimeLeft(res.timer_info.remaining_seconds);
          }
        } else {
          const examId = params.exam ? Number(params.exam) : (params.exam_type_id ? Number(params.exam_type_id) : 42);
          let order: number[] | undefined;
          if (params.section_order) {
            order = params.section_order.split(',').map(Number);
          } else if (params.sections) {
            try {
              order = typeof params.sections === 'string' ? JSON.parse(params.sections) : params.sections;
            } catch {
              order = undefined;
            }
          }
          const mode = (params.mode as any) || 'Standard';
          const timeLimitOverride = params.time_limit ? Number(params.time_limit) : undefined;

          const newAttempt = await examService.startExam({
            exam_type_id: examId,
            mode: mode,
            selected_section_ids: order,
            time_limit_override: mode === 'Practice' && timeLimitOverride ? timeLimitOverride : undefined,
          });
          const res = await examService.resumeExam(newAttempt.id);
          currentAttempt = res;
          if (res.timer_info?.remaining_seconds !== undefined) {
            setTimeLeft(res.timer_info.remaining_seconds);
          }
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
        
        if (isMounted) {
          setAttempt(currentAttempt);
        }
      } catch (e: any) {
        console.error('Could not initialize live IELTS attempt:', e);
        const errorMsg = e?.response?.data?.error 
          || e?.response?.data?.detail 
          || e?.message 
          || 'Could not initialize exam session.';
        Alert.alert('Error', errorMsg, [
          { text: 'Go Back', onPress: () => router.canGoBack() ? router.back() : router.replace('/') }
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    initIelts();

    return () => {
      isMounted = false;
    };
  }, [params.attempt_id, params.exam, params.exam_type_id, params.section_order]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!loading && attempt) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            executeSubmit();
            return 0;
          }
          return prev - 1;
        });
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

  // Exam stats across all sections for submit confirmation modal
  const examStats = useMemo(() => {
    if (!attempt?.sections) return { total: 0, answered: 0, unanswered: 0, bookmarked: 0 };
    let total = 0;
    let answered = 0;
    let bookmarked = 0;
    attempt.sections.forEach(sec => {
      sec.question_groups?.forEach(grp => {
        grp.responses?.forEach(resp => {
          total += 1;
          if (resp.selected_choice !== null && resp.selected_choice !== undefined) {
            answered += 1;
          } else if (resp.written_response || resp.audio_response) {
            answered += 1;
          }
          if ((resp as any).is_bookmarked) {
            bookmarked += 1;
          }
        });
      });
    });
    return {
      total,
      answered,
      unanswered: Math.max(0, total - answered),
      bookmarked,
    };
  }, [attempt]);

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
    } else if (attempt && activeSectionIndex < attempt.sections.length - 1) {
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
      setShowSubmitModal(true);
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

  const executeSubmit = async () => {
    if (!attempt) return;
    try {
      setIsSubmitting(true);
      const responsesPayload: any[] = [];
      attempt.sections?.forEach(sec => {
        sec.question_groups?.forEach(grp => {
          grp.responses?.forEach(resp => {
            if (resp.selected_choice !== null && resp.selected_choice !== undefined) {
              responsesPayload.push({
                question_id: resp.question.id,
                choice_id: resp.selected_choice,
              });
            } else if (resp.written_response) {
              responsesPayload.push({
                question_id: resp.question.id,
                written_response: resp.written_response,
              });
            }
          });
        });
      });

      await examService.submitExam(attempt.id, { responses: responsesPayload });
      setShowSubmitModal(false);
      router.replace({
        pathname: '/(exam)/test-result',
        params: { attempt_id: String(attempt.id) }
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Could not submit test. Please try again.';
      Alert.alert('Submit Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrompt = () => {
    setShowSubmitModal(true);
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
          <TouchableOpacity onPress={handleNext} style={[styles.nextButton, { marginTop: 20 }]}>
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
            onPress={() => setShowSubmitModal(true)}
            activeOpacity={0.7}
          >
            <Feather name="check-circle" size={18} color="#EF4444" />
            <Text style={[styles.bottomBarActionText, { color: '#EF4444', fontWeight: '700' }]}>Submit Test</Text>
          </TouchableOpacity>

          {/* Contact Support */}
          <TouchableOpacity style={styles.bottomBarAction} activeOpacity={0.7}>
            <Feather name="headphones" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Test Confirmation Modal */}
        <Modal 
          visible={showSubmitModal} 
          transparent 
          animationType="fade"
          onRequestClose={() => !isSubmitting && setShowSubmitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.submitModalCard}>
              <View style={styles.submitModalHeader}>
                <View style={styles.submitIconBg}>
                  <Feather name="check-circle" size={26} color="#6D28D9" />
                </View>
                <TouchableOpacity 
                  onPress={() => !isSubmitting && setShowSubmitModal(false)} 
                  style={styles.closeExitBtn}
                  disabled={isSubmitting}
                >
                  <Feather name="x" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.submitModalTitle}>Submit IELTS Test?</Text>
              <Text style={styles.submitModalSubtitle}>
                Are you sure you want to finalize and submit your test?
              </Text>
              
              {/* Quick Stats Summary */}
              <View style={styles.submitStatsBox}>
                <View style={styles.submitStatItem}>
                  <Text style={styles.submitStatValue}>{examStats.answered}</Text>
                  <Text style={styles.submitStatLabel}>Answered</Text>
                </View>
                <View style={styles.submitStatDivider} />
                <View style={styles.submitStatItem}>
                  <Text style={styles.submitStatValue}>{examStats.unanswered}</Text>
                  <Text style={styles.submitStatLabel}>Unanswered</Text>
                </View>
                <View style={styles.submitStatDivider} />
                <View style={styles.submitStatItem}>
                  <Text style={styles.submitStatValue}>{examStats.total}</Text>
                  <Text style={styles.submitStatLabel}>Total Qs</Text>
                </View>
              </View>

              <Text style={styles.submitModalDesc}>
                Once submitted, your responses will be evaluated and graded immediately.
              </Text>
              
              <View style={styles.submitModalActions}>
                <TouchableOpacity 
                  style={styles.cancelSubmitBtn} 
                  onPress={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelSubmitBtnText}>Keep Practicing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmSubmitBtn, isSubmitting && { opacity: 0.7 }]} 
                  onPress={executeSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.confirmSubmitBtnText}>Yes, Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  },

  // Submit Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  submitModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  submitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  submitIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeExitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  submitModalSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 14,
    lineHeight: 18,
  },
  submitStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  submitStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  submitStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6D28D9',
  },
  submitStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  submitStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  submitModalDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 16,
  },
  submitModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
