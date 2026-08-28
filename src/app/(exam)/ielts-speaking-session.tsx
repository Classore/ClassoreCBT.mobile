import React, { useState, useEffect, useRef } from 'react';
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
  Animated 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/services/exam';

export default function IELTSSpeakingSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Part: 'part1-get-ready' | 'part1-recording' | 'part2-prepare' | 'part2-recording' | 'part3'
  const [activeTab, setActiveTab] = useState<'Part 1' | 'Part 2' | 'Part 3'>('Part 1');
  const [subState, setSubState] = useState<'get-ready' | 'recording' | 'prepare'>('get-ready');
  
  // Total Exam Timer (59 minutes)
  const [totalTimeLeft, setTotalTimeLeft] = useState(3540);
  
  // Sub Countdown Timer (seconds)
  const [countdown, setCountdown] = useState(5);
  const [recordingSeconds, setRecordingSeconds] = useState(28);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [talkSeconds, setTalkSeconds] = useState(120);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);

  // Animated Waveform Heights
  const waveAnim1 = useRef(new Animated.Value(15)).current;
  const waveAnim2 = useRef(new Animated.Value(30)).current;
  const waveAnim3 = useRef(new Animated.Value(45)).current;
  const waveAnim4 = useRef(new Animated.Value(60)).current;
  const waveAnim5 = useRef(new Animated.Value(35)).current;

  // Waveform Looping Animation
  useEffect(() => {
    if (subState === 'recording') {
      const createWaveAnimation = (anim: Animated.Value, minH: number, maxH: number, dur: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: maxH, duration: dur, useNativeDriver: false }),
            Animated.timing(anim, { toValue: minH, duration: dur, useNativeDriver: false }),
          ])
        );
      };

      const a1 = createWaveAnimation(waveAnim1, 10, 45, 400);
      const a2 = createWaveAnimation(waveAnim2, 18, 65, 350);
      const a3 = createWaveAnimation(waveAnim3, 12, 55, 450);
      const a4 = createWaveAnimation(waveAnim4, 20, 70, 300);
      const a5 = createWaveAnimation(waveAnim5, 14, 50, 420);

      a1.start();
      a2.start();
      a3.start();
      a4.start();
      a5.start();

      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
        a4.stop();
        a5.stop();
      };
    }
  }, [subState]);

  // Overall Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Substate Timers Countdown
  useEffect(() => {
    let subTimer: NodeJS.Timeout;

    if (activeTab === 'Part 1' && subState === 'get-ready') {
      subTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setSubState('recording');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (activeTab === 'Part 1' && subState === 'recording') {
      subTimer = setInterval(() => {
        setRecordingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (activeTab === 'Part 2' && subState === 'prepare') {
      subTimer = setInterval(() => {
        setPrepSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (subTimer) clearInterval(subTimer);
    };
  }, [activeTab, subState]);

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartNow = () => {
    setSubState('recording');
  };

  const handleEndAnswer = () => {
    // Transition to Part 2
    setActiveTab('Part 2');
    setSubState('prepare');
  };

  const handleStartSpeakingPart2 = () => {
    setSubState('recording');
  };

  const handleTabPress = (tab: 'Part 1' | 'Part 2' | 'Part 3') => {
    setActiveTab(tab);
    if (tab === 'Part 1') {
      setSubState('recording');
    } else if (tab === 'Part 2') {
      setSubState('prepare');
    } else {
      setSubState('recording');
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Submit Test',
      'Are you sure you want to submit your IELTS Speaking test?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              if (params.attempt_id) {
                await examService.submitExam(Number(params.attempt_id), { responses: [] });
              }
              router.replace({
                pathname: '/(exam)/test-result',
                params: { attempt_id: params.attempt_id }
              });
            } catch (err: any) {
              console.error('Failed to submit IELTS Speaking:', err);
              Alert.alert('Submit Error', err.response?.data?.message || 'Could not submit test.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const waveformHeights = [
    waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5,
    waveAnim2, waveAnim4, waveAnim1, waveAnim3, waveAnim5,
    waveAnim4, waveAnim2, waveAnim1, waveAnim3, waveAnim4,
    waveAnim5, waveAnim2, waveAnim1, waveAnim3, waveAnim4,
    waveAnim2, waveAnim5, waveAnim1, waveAnim3,
  ];

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
          <Text style={styles.headerTitle}>IELTS Speaking</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formatTotalTime(totalTimeLeft)}</Text>
          </View>
        </View>

        {/* Part Tabs */}
        <View style={styles.partTabsContainer}>
          {(['Part 1', 'Part 2', 'Part 3'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.partTab, isActive && styles.partTabActive]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.partTabText, isActive && styles.partTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Label & Bookmark Row */}
          <View style={styles.partHeaderRow}>
            <Text style={styles.partLabelText}>{activeTab}</Text>
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

          {/* ============================================================ */}
          {/* SCREEN 3: Part 1 - Get Ready State */}
          {/* ============================================================ */}
          {activeTab === 'Part 1' && subState === 'get-ready' && (
            <View style={styles.contentCard}>
              <Text style={styles.cardHeading}>Introduction & Interview</Text>
              <Text style={styles.cardSubText}>
                The examiner will ask you general questions about yourself, your home, your work or studies and other familiar topics.
              </Text>

              {/* Examiner Avatar */}
              <View style={styles.examinerAvatarCircle}>
                <View style={styles.examinerFace}>
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={32} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.getReadyTitle}>Get ready...</Text>
              <Text style={styles.getReadySubtitle}>Part 1 will start in</Text>

              {/* Countdown Digits */}
              <View style={styles.digitsRow}>
                <View style={styles.digitCol}>
                  <Text style={styles.digitNumber}>00</Text>
                  <Text style={styles.digitLabel}>Minutes</Text>
                </View>
                <Text style={styles.colonSeparator}>:</Text>
                <View style={styles.digitCol}>
                  <Text style={styles.digitNumber}>{countdown.toString().padStart(2, '0')}</Text>
                  <Text style={styles.digitLabel}>Seconds</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={handleStartNow}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>Start Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================ */}
          {/* SCREEN 1: Part 1 - Question & Waveform Listening State */}
          {/* ============================================================ */}
          {activeTab === 'Part 1' && subState === 'recording' && (
            <View style={styles.contentCard}>
              <Text style={styles.questionLabel}>Question</Text>
              <Text style={styles.questionTitleText}>Do you enjoy your studies?</Text>

              {/* Audio Waveform Equalizer */}
              <View style={styles.waveformContainer}>
                {waveformHeights.map((animH, i) => (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.waveBar, 
                      { height: animH }
                    ]} 
                  />
                ))}
              </View>

              <Text style={styles.listeningText}>Listening...</Text>

              {/* Time Left Digits */}
              <View style={styles.digitsRow}>
                <View style={styles.digitCol}>
                  <Text style={styles.digitNumber}>00</Text>
                  <Text style={styles.digitLabel}>Minutes</Text>
                </View>
                <Text style={styles.colonSeparator}>:</Text>
                <View style={styles.digitCol}>
                  <Text style={styles.digitNumber}>
                    {recordingSeconds.toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.digitLabel}>Seconds</Text>
                </View>
              </View>
              <Text style={styles.timeLeftSubText}>Time Left</Text>

              {/* End Answer Button */}
              <TouchableOpacity 
                style={styles.outlineActionButton}
                onPress={handleEndAnswer}
                activeOpacity={0.85}
              >
                <Text style={styles.outlineActionButtonText}>End Answer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: Part 2 - Long Turn & Prepare Time */}
          {/* ============================================================ */}
          {activeTab === 'Part 2' && (
            <View style={styles.contentCard}>
              <Text style={styles.cardHeading}>Long Turn - Talk about a book you have read.</Text>
              
              <Text style={styles.promptHeader}>You should say:</Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• What the book is</Text>
                <Text style={styles.bulletItem}>• When you read it</Text>
                <Text style={styles.bulletItem}>• What it is about</Text>
                <Text style={styles.bulletItem}>• And explain why you liked it.</Text>
              </View>

              {/* Dual Prepare and Talk Time Box */}
              <View style={styles.dualTimerBox}>
                <Text style={styles.timerBoxSubHeader}>You have</Text>
                <Text style={styles.timerBigNumber}>
                  01 : 00
                </Text>
                <Text style={styles.timerBoxLabel}>Prepare Time</Text>

                <Text style={[styles.timerBoxSubHeader, { marginTop: 18 }]}>And</Text>
                <Text style={styles.timerBigNumber}>
                  02 : 00
                </Text>
                <Text style={styles.timerBoxLabel}>To Talk</Text>
              </View>

              {/* Start Speaking Button */}
              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={handleStartSpeakingPart2}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>Start Speaking</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================ */}
          {/* Part 3 - Discussion */}
          {/* ============================================================ */}
          {activeTab === 'Part 3' && (
            <View style={styles.contentCard}>
              <Text style={styles.cardHeading}>Two-way Discussion</Text>
              <Text style={styles.cardSubText}>
                The examiner will ask further questions connected to the topic in Part 2.
              </Text>

              <Text style={[styles.questionLabel, { marginTop: 14 }]}>Question 1</Text>
              <Text style={styles.questionTitleText}>
                How has technology changed reading habits among young people today?
              </Text>

              {/* Waveform Equalizer */}
              <View style={styles.waveformContainer}>
                {waveformHeights.map((animH, i) => (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.waveBar, 
                      { height: animH }
                    ]} 
                  />
                ))}
              </View>

              <Text style={styles.listeningText}>Listening...</Text>

              <TouchableOpacity 
                style={styles.outlineActionButton}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.outlineActionButtonText}>Finish Section</Text>
              </TouchableOpacity>
            </View>
          )}

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
              </View>

              {/* Part Tabs in Modal */}
              <View style={styles.modalPartTabs}>
                {(['Part 1', 'Part 2', 'Part 3'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.modalPartPill,
                      activeTab === tab && styles.modalPartPillActive,
                    ]}
                    onPress={() => {
                      handleTabPress(tab);
                      setIsPaletteVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalPartText,
                        activeTab === tab && styles.modalPartTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 16 }} />
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

  // Part Tabs
  partTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  partTab: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  partTabActive: {
    backgroundColor: '#4C1D95',
  },
  partTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  partTabTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  partHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partLabelText: {
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

  // Content Card
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardSubText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 20,
  },

  // Avatar in Get Ready
  examinerAvatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE9FE',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  examinerFace: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  getReadyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  getReadySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Countdown Digits
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  digitCol: {
    alignItems: 'center',
  },
  digitNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: '#6D28D9',
  },
  digitLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  colonSeparator: {
    fontSize: 32,
    fontWeight: '800',
    color: '#CBD5E1',
    marginHorizontal: 12,
    marginBottom: 16,
  },
  timeLeftSubText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 90,
    gap: 5,
    marginVertical: 20,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#7C3AED',
  },
  listeningText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },

  // Question Info
  questionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  questionTitleText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 10,
  },

  // Part 2 Prompt
  promptHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  bulletList: {
    gap: 4,
    marginBottom: 20,
  },
  bulletItem: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 20,
  },
  dualTimerBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    marginBottom: 20,
  },
  timerBoxSubHeader: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  timerBigNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1,
  },
  timerBoxLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },

  // Buttons
  primaryActionButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryActionButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  outlineActionButton: {
    borderWidth: 1.5,
    borderColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineActionButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4C1D95',
  },

  // Bottom Bar
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

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
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
    justifyContent: 'space-around',
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
  modalPartTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  modalPartPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPartPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalPartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalPartTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
