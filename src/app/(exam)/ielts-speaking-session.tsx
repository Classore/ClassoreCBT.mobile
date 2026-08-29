import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Animated,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService, UserAttempt, AttemptSection, QuestionGroupItem, UserResponseItem } from '@/services/exam';
import { Audio } from 'expo-av';

export default function IELTSSpeakingSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ attempt_id?: string }>();
  
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exam structure pointers
  const [speakingSection, setSpeakingSection] = useState<AttemptSection | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0); // 0 = Part 1, 1 = Part 2, 2 = Part 3
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  // States
  const [subState, setSubState] = useState<'get-ready' | 'recording' | 'prepare'>('get-ready');
  const [totalTimeLeft, setTotalTimeLeft] = useState(3540);
  
  const [countdown, setCountdown] = useState(5);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(60);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);

  // Audio Recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean>(false);

  // Waveform animations
  const waveAnim1 = useRef(new Animated.Value(15)).current;
  const waveAnim2 = useRef(new Animated.Value(30)).current;
  const waveAnim3 = useRef(new Animated.Value(45)).current;
  const waveAnim4 = useRef(new Animated.Value(60)).current;
  const waveAnim5 = useRef(new Animated.Value(35)).current;

  useEffect(() => {
    (async () => {
      const perm = await Audio.requestPermissionsAsync();
      setAudioPermission(perm.status === 'granted');
    })();
  }, []);

  useEffect(() => {
    const initIelts = async () => {
      try {
        if (params.attempt_id) {
          const res = await examService.resumeExam(Number(params.attempt_id));
          setAttempt(res);
          setTotalTimeLeft(res.timer_info.remaining_seconds);
          
          const speakSec = res.sections.find(s => s.section_name.toLowerCase().includes('speaking'));
          if (speakSec) {
            setSpeakingSection(speakSec);
          }
        }
      } catch (e) {
        console.warn('Could not initialize IELTS speaking:', e);
      } finally {
        setLoading(false);
      }
    };
    initIelts();
  }, [params.attempt_id]);

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

      a1.start(); a2.start(); a3.start(); a4.start(); a5.start();

      return () => {
        a1.stop(); a2.stop(); a3.stop(); a4.stop(); a5.stop();
      };
    }
  }, [subState]);

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTotalTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    let subTimer: NodeJS.Timeout;
    if (subState === 'get-ready') {
      subTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleStartNow();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (subState === 'recording') {
      subTimer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (subState === 'prepare') {
      subTimer = setInterval(() => {
        setPrepSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => { if (subTimer) clearInterval(subTimer); };
  }, [subState]);

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (!audioPermission) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      return null;
    }
  };

  const handleStartNow = async () => {
    setSubState('recording');
    setRecordingSeconds(0);
    await startRecording();
  };

  const handleEndAnswer = async () => {
    const uri = await stopRecording();
    const activeGroup = speakingSection?.question_groups[activeGroupIndex];
    if (uri && attempt && activeGroup) {
      const q = activeGroup.responses[currentResponseIndex];
      examService.uploadAudio(attempt.id, q.question.id, uri).catch(console.error);
    }

    if (activeGroup && currentResponseIndex < activeGroup.responses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
      setSubState('get-ready');
      setCountdown(3);
    } else if (speakingSection && activeGroupIndex < speakingSection.question_groups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setCurrentResponseIndex(0);
      setSubState('prepare');
      setPrepSeconds(60);
    } else {
      handleSubmit();
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
            if (recording) {
              await stopRecording();
            }
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

  const activeGroup = speakingSection?.question_groups[activeGroupIndex];
  const currentQ = activeGroup?.responses[currentResponseIndex]?.question;

  if (loading || !speakingSection) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading Speaking Session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const partTabs = speakingSection.question_groups.map(g => g.group_title || 'Part');

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
          {partTabs.map((tab, idx) => (
            <View
              key={idx}
              style={[styles.partTab, activeGroupIndex === idx && styles.partTabActive]}
            >
              <Text style={[styles.partTabText, activeGroupIndex === idx && styles.partTabTextActive]}>
                {tab}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Label & Bookmark Row */}
          <View style={styles.partHeaderRow}>
            <Text style={styles.partLabelText}>{partTabs[activeGroupIndex]}</Text>
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

          {/* GET READY STATE */}
          {subState === 'get-ready' && (
            <View style={styles.contentCard}>
              <Text style={styles.cardHeading}>Get Ready for {partTabs[activeGroupIndex]}</Text>
              <Text style={styles.cardSubText}>
                The examiner will ask you questions. Prepare to speak clearly into the microphone.
              </Text>

              {/* Examiner Avatar */}
              <View style={styles.examinerAvatarCircle}>
                <View style={styles.examinerFace}>
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={32} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.getReadyTitle}>Get ready...</Text>
              <Text style={styles.getReadySubtitle}>Question {currentResponseIndex + 1} will start in</Text>

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

          {/* PREPARE STATE (Part 2 usually) */}
          {subState === 'prepare' && (
            <View style={styles.contentCard}>
              <Text style={styles.cardHeading}>{currentQ?.text || 'Long Turn'}</Text>
              
              {currentQ?.instructions && (
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>{currentQ.instructions}</Text>
                </View>
              )}

              {/* Dual Prepare and Talk Time Box */}
              <View style={styles.dualTimerBox}>
                <Text style={styles.timerBoxSubHeader}>You have</Text>
                <Text style={styles.timerBigNumber}>
                  00 : {prepSeconds.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.timerBoxLabel}>Prepare Time Remaining</Text>
              </View>

              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={handleStartNow}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionButtonText}>Start Speaking</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RECORDING STATE */}
          {subState === 'recording' && (
            <View style={styles.contentCard}>
              <Text style={styles.questionLabel}>Question {currentResponseIndex + 1}</Text>
              <Text style={styles.questionTitleText}>{currentQ?.text}</Text>

              {/* Audio Waveform Equalizer */}
              <View style={styles.waveformContainer}>
                {waveformHeights.map((animH, i) => (
                  <Animated.View 
                    key={i} 
                    style={[
                      styles.waveBar, 
                      { height: animH, backgroundColor: recording ? '#EF4444' : '#7C3AED' }
                    ]} 
                  />
                ))}
              </View>

              <Text style={styles.listeningText}>{recording ? 'Recording your answer...' : 'Waiting...'}</Text>

              <View style={styles.digitsRow}>
                <View style={styles.digitCol}>
                  <Text style={styles.digitNumber}>
                    {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.digitLabel}>Minutes</Text>
                </View>
                <Text style={styles.colonSeparator}>:</Text>
                <View style={styles.digitCol}>
                  <Text style={styles.digitNumber}>
                    {(recordingSeconds % 60).toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.digitLabel}>Seconds</Text>
                </View>
              </View>
              <Text style={styles.timeLeftSubText}>Recording Time</Text>

              {/* End Answer Button */}
              <TouchableOpacity 
                style={styles.outlineActionButton}
                onPress={handleEndAnswer}
                activeOpacity={0.85}
              >
                <Text style={styles.outlineActionButtonText}>End Answer & Next</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Utility Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.bottomBarAction}
            onPress={() => setIsPaletteVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="grid" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Question Palette</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.bottomBarAction}
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <Feather name="flag" size={18} color="#EF4444" />
            <Text style={[styles.bottomBarActionText, { color: '#EF4444' }]}>Submit Test</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBarAction} activeOpacity={0.7}>
            <Feather name="headphones" size={18} color="#4B5563" />
            <Text style={styles.bottomBarActionText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Modal simplified */}
        <Modal
          visible={isPaletteVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPaletteVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Speaking Overview</Text>
                <TouchableOpacity onPress={() => setIsPaletteVisible(false)} style={styles.modalCloseButton}>
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={{color: '#6B7280', marginBottom: 20}}>You are on Part {activeGroupIndex + 1}, Question {currentResponseIndex + 1}. Follow the on-screen flow to complete the speaking assessment.</Text>
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
  bulletList: {
    gap: 4,
    marginBottom: 20,
    marginTop: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  outlineActionButton: {
    borderWidth: 2,
    borderColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineActionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4C1D95',
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
  }
});
