import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Modal,
  Alert 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Question {
  id: number;
  questionText: string;
  options: { label: string; text: string }[];
  selectedOption: string | null;
  isMarked?: boolean;
}

export default function IELTSSessionScreen() {
  const router = useRouter();

  // Timer State (59 minutes = 3540 seconds)
  const [timeLeft, setTimeLeft] = useState(3540);
  const [activePassage, setActivePassage] = useState<'p1' | 'p2' | 'p3'>('p1');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Sample Passage 1 Questions (1 to 14)
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      questionText: 'What is the main idea of the passage?',
      options: [
        { label: 'A', text: 'Fossil fuels are more efficient than renewable energy sources.' },
        { label: 'B', text: 'Renewable energy is a clean and sustainable alternative to fossil fuels.' },
        { label: 'C', text: 'Climate change is caused by natural events.' },
        { label: 'D', text: 'Renewable energy is more expensive than fossil fuels.' },
      ],
      selectedOption: 'B',
      isMarked: false,
    },
    {
      id: 2,
      questionText: 'According to paragraph 1, what is a primary drawback of burning fossil fuels?',
      options: [
        { label: 'A', text: 'They require specialized wind turbines to operate.' },
        { label: 'B', text: 'They release high amounts of greenhouse gases.' },
        { label: 'C', text: 'They are replenished constantly by nature.' },
        { label: 'D', text: 'They produce zero emissions in operation.' },
      ],
      selectedOption: null,
      isMarked: false,
    },
    {
      id: 3,
      questionText: 'Which of the following is cited as an advantage of renewable energy in paragraph 2?',
      options: [
        { label: 'A', text: 'It creates a dependence on finite coal reserves.' },
        { label: 'B', text: 'It improves long-term energy security.' },
        { label: 'C', text: 'It speeds up environmental degradation.' },
        { label: 'D', text: 'It completely replaces the need for electricity grids.' },
      ],
      selectedOption: null,
      isMarked: false,
    },
    ...Array.from({ length: 11 }, (_, i) => ({
      id: i + 4,
      questionText: `Sample question ${i + 4} regarding renewable energy technologies and economic impacts.`,
      options: [
        { label: 'A', text: 'First potential answer analysis' },
        { label: 'B', text: 'Second potential answer analysis' },
        { label: 'C', text: 'Third potential answer analysis' },
        { label: 'D', text: 'Fourth potential answer analysis' },
      ],
      selectedOption: null,
      isMarked: false,
    })),
  ]);

  // Timer Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionLabel: string) => {
    const updated = [...questions];
    updated[currentQuestionIndex].selectedOption = optionLabel;
    setQuestions(updated);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Complete Reading Section',
      'Are you sure you want to finish the Reading section and proceed to IELTS Speaking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Speaking',
          onPress: () => {
            router.push('/(exam)/ielts-speaking-instructions');
          },
        },
      ]
    );
  };

  const currentQ = questions[currentQuestionIndex];

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
          <Text style={styles.headerTitle}>IELTS Reading</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Passage Selection Tabs */}
        <View style={styles.passageTabsContainer}>
          <TouchableOpacity 
            style={[styles.passageTab, activePassage === 'p1' && styles.passageTabActive]}
            onPress={() => setActivePassage('p1')}
            activeOpacity={0.8}
          >
            <Text style={[styles.passageTabTitle, activePassage === 'p1' && styles.passageTabTitleActive]}>
              Passage 1
            </Text>
            <Text style={[styles.passageTabSub, activePassage === 'p1' && styles.passageTabSubActive]}>
              Questions 1–14
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.passageTab, activePassage === 'p2' && styles.passageTabActive]}
            onPress={() => setActivePassage('p2')}
            activeOpacity={0.8}
          >
            <Text style={[styles.passageTabTitle, activePassage === 'p2' && styles.passageTabTitleActive]}>
              Passage 2
            </Text>
            <Text style={[styles.passageTabSub, activePassage === 'p2' && styles.passageTabSubActive]}>
              Questions 15–27
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.passageTab, activePassage === 'p3' && styles.passageTabActive]}
            onPress={() => setActivePassage('p3')}
            activeOpacity={0.8}
          >
            <Text style={[styles.passageTabTitle, activePassage === 'p3' && styles.passageTabTitleActive]}>
              Passage 3
            </Text>
            <Text style={[styles.passageTabSub, activePassage === 'p3' && styles.passageTabSubActive]}>
              Questions 28–40
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Passage Reading Card */}
          <View style={styles.passageCard}>
            <View style={styles.passageHeaderRow}>
              <Text style={styles.passageNumberText}>Passage 1</Text>
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

            <Text style={styles.passageTitle}>
              The Impact of Renewable Energy on the Environment
            </Text>

            <Text style={styles.passageBodyText}>
              Renewable energy sources, such as solar, wind and hydropower, are increasingly seen as viable alternatives to fossil fuels. Unlike fossil fuels, which release large amounts of carbon dioxide and other greenhouse gases when burned, renewable energy produces little to no emissions during operation. This makes it an important part of the global effort to combat climate change and reduce environmental degradation.
              {'\n\n'}
              Furthermore, renewable energy is sustainable, as natural resources like sunlight and wind are constantly replenished. This ensures a long-term supply of clean energy, which can help reduce reliance on finite resources and improve energy security for countries around the world.
            </Text>
          </View>

          {/* Question Subheading */}
          <Text style={styles.questionSectionTitle}>Questions 1–14</Text>

          {/* Current Question */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeaderRow}>
              <View style={styles.questionNumberBadge}>
                <Text style={styles.questionNumberText}>{currentQ.id}</Text>
              </View>
              <Text style={styles.questionText}>{currentQ.questionText}</Text>
            </View>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQ.options.map((opt) => {
                const isSelected = currentQ.selectedOption === opt.label;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                    ]}
                    onPress={() => handleSelectOption(opt.label)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      <Text style={styles.optionLabel}>{opt.label}. </Text>
                      {opt.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Previous & Next Buttons */}
          <View style={styles.navigationButtonsRow}>
            <TouchableOpacity 
              style={[styles.prevButton, currentQuestionIndex === 0 && { opacity: 0.5 }]}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
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
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <Feather name="flag" size={18} color="#EF4444" />
            <Text style={[styles.bottomBarActionText, { color: '#EF4444' }]}>Submit Test</Text>
          </TouchableOpacity>

          {/* Contact Support */}
          <TouchableOpacity style={styles.bottomBarAction} activeOpacity={0.7}>
            <Feather name="headphones" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Contact Support</Text>
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
                  <Text style={styles.legendText}>Not Answered</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Marked</Text>
                </View>
              </View>

              {/* Passage Pills Filter */}
              <View style={styles.modalPassageTabs}>
                <TouchableOpacity style={[styles.modalPassagePill, styles.modalPassagePillActive]}>
                  <Text style={styles.modalPassageTextActive}>Passage 1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPassagePill}>
                  <Text style={styles.modalPassageText}>Passage 2</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPassagePill}>
                  <Text style={styles.modalPassageText}>Passage 3</Text>
                </TouchableOpacity>
              </View>

              {/* Question Number Grid (1 to 14) */}
              <View style={styles.questionGrid}>
                {questions.map((q, idx) => {
                  const isCurrent = currentQuestionIndex === idx;
                  const isAnswered = q.selectedOption !== null;

                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.gridCircle,
                        isAnswered && styles.gridCircleAnswered,
                        isCurrent && !isAnswered && styles.gridCircleCurrent,
                      ]}
                      onPress={() => {
                        setCurrentQuestionIndex(idx);
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
                        {q.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Pagination Arrows */}
              <View style={styles.modalPaginationRow}>
                <TouchableOpacity style={styles.arrowButton}>
                  <Feather name="chevron-left" size={20} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowButton}>
                  <Feather name="chevron-right" size={20} color="#111827" />
                </TouchableOpacity>
              </View>
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
  modalPassageTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modalPassagePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPassagePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalPassageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalPassageTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
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
  modalPaginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 8,
  },
  arrowButton: {
    padding: 6,
  },
});
