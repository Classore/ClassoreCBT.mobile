import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService, ExamSection, ExamTierConfig, isSectionBasedExam } from '@/services/exam';
import { 
  SubscriptionRequiredModal, 
  isSubscriptionError, 
  getSubscriptionErrorMessage 
} from '@/components/SubscriptionRequiredModal';

interface TopicItem {
  id: string;
  name: string;
  isLocked: boolean;
}

const DEFAULT_FALLBACK_TOPICS: Record<string, string[]> = {
  mathematics: ['Number Systems', 'Algebra', 'Geometry', 'Trigonometry', 'Mensuration', 'Statistics', 'Calculus', 'Matrices'],
  maths: ['Number Systems', 'Algebra', 'Geometry', 'Trigonometry', 'Mensuration', 'Statistics', 'Calculus', 'Matrices'],
  english: ['Comprehension', 'Lexis and Structure', 'Oral Forms', 'Sentence Completion', 'Idioms & Figures of Speech', 'Antonyms & Synonyms'],
  'use of english': ['Comprehension', 'Lexis and Structure', 'Oral Forms', 'Sentence Completion', 'Idioms & Figures of Speech', 'Antonyms & Synonyms'],
  physics: ['Mechanics', 'Waves & Optics', 'Electricity & Magnetism', 'Thermal Physics', 'Modern Physics', 'Radioactivity'],
  chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Chemical Reactions & Stoichiometry', 'Electrochemistry'],
  biology: ['Cell Biology', 'Genetics & Evolution', 'Ecology', 'Plant Physiology', 'Animal Physiology', 'Reproduction'],
  economics: ['Microeconomics', 'Macroeconomics', 'Market Structures', 'National Income', 'Public Finance', 'Monetary Policy'],
  government: ['Political Concepts', 'Forms of Government', 'Nigerian Politics', 'International Organizations', 'Constitutions'],
  commerce: ['Trade & Commerce', 'Business Organizations', 'Banking & Finance', 'Insurance', 'Marketing'],
  accounting: ['Bookkeeping & Principles', 'Financial Statements', 'Partnership Accounts', 'Company Accounts', 'Departmental Accounts'],
  geography: ['Physical Geography', 'Human Geography', 'Map Reading', 'Regional Geography of Nigeria', 'Environmental Issues'],
  literature: ['Drama & Theatre', 'Poetry Analysis', 'Prose & Fiction', 'Literary Devices & Figures of Speech', 'African & Non-African Literature'],
};

export default function PracticeSetupScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ exam?: string; subject?: string; topic_id?: string; topic_name?: string; topic?: string; exam_name?: string }>();
  
  const examIdStr = Array.isArray(params.exam) ? params.exam[0] : params.exam;
  const examId = examIdStr ? parseInt(examIdStr, 10) : 1; // Default to 1 if missing

  // Instant synchronous memory cache
  const initialSections = examService.getCachedSectionsSync(examId);
  const initialTierConfigs = examService.getCachedTierConfigsSync();
  const initialTierConfig = initialTierConfigs?.find(t => t.exam_type === examId) || null;
  const initialExams = examService.getCachedExamsSync();
  const initialExamObj = initialExams?.find(e => e.id === examId);

  const resolveExamName = () => {
    if (params.exam_name && typeof params.exam_name === 'string' && params.exam_name.trim()) {
      return params.exam_name.trim();
    }
    if (initialExamObj?.name) {
      return initialExamObj.name;
    }
    return '';
  };

  const [examName, setExamName] = useState<string>(resolveExamName);

  // Data State
  const [subjects, setSubjects] = useState<ExamSection[]>(initialSections || []);
  const [tierConfig, setTierConfig] = useState<ExamTierConfig | null>(initialTierConfig);
  const [loading, setLoading] = useState<boolean>(!initialSections || initialSections.length === 0);

  const isSectionExam = isSectionBasedExam(examName, subjects);

  // Form State
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [questionCount, setQuestionCount] = useState<number | null>(40);
  const [isCustomQuestions, setIsCustomQuestions] = useState<boolean>(false);
  const [customQuestionInput, setCustomQuestionInput] = useState<string>('');
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);
  const [showTimeDropdown, setShowTimeDropdown] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isCustomInputFocused, setIsCustomInputFocused] = useState<boolean>(false);
  
  // Topic State
  const [selectedTopicsBySubject, setSelectedTopicsBySubject] = useState<Record<number, string[]>>({});
  const [subjectTopicsMap, setSubjectTopicsMap] = useState<Record<number, TopicItem[]>>({});
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [showTopics, setShowTopics] = useState<boolean>(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState<string>('');
  const [activeTopicSubjectId, setActiveTopicSubjectId] = useState<number | null>(null);

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [modalTopicName, setModalTopicName] = useState<string>('');
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | undefined>();

  const isSubscribed = Boolean(
    (user as any)?.is_premium ||
    (user as any)?.has_active_subscription ||
    (user?.scholar_tier && user.scholar_tier.toLowerCase() !== 'free')
  );

  // Modals
  const [showSubjects, setShowSubjects] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    let isMounted = true;
    const currentExamIdStr = Array.isArray(params.exam) ? params.exam[0] : params.exam;
    const currentExamId = currentExamIdStr ? parseInt(currentExamIdStr, 10) : 1;

    const loadData = async () => {
      // 1. If we don't have cached subjects from memory, try persistent storage
      const memSections = examService.getCachedSectionsSync(currentExamId);
      if (memSections && memSections.length > 0) {
        if (isMounted) {
          setSubjects(memSections);
          setLoading(false);
        }
      } else {
        const storedSections = await examService.getCachedSections(currentExamId);
        if (isMounted && storedSections && storedSections.length > 0) {
          setSubjects(storedSections);
          setLoading(false);
        }
      }

      const memTiers = examService.getCachedTierConfigsSync();
      if (memTiers && memTiers.length > 0) {
        const cfg = memTiers.find(t => t.exam_type === currentExamId);
        if (isMounted && cfg) setTierConfig(cfg);
      } else {
        const storedTiers = await examService.getCachedTierConfigs();
        const cfg = storedTiers?.find(t => t.exam_type === currentExamId);
        if (isMounted && cfg) setTierConfig(cfg);
      }

      // 2. Fetch fresh sections and tier configs from backend in background
      try {
        const [fetchedSections, fetchedTiers] = await Promise.all([
          examService.getSections(currentExamId),
          examService.getExamTierConfigs()
        ]);
        if (isMounted && Array.isArray(fetchedSections) && fetchedSections.length > 0) {
          setSubjects(fetchedSections);
          setSelectedSubjects(prev => {
            if (prev.length > 0) return prev;
            if (params.subject) {
              const match = fetchedSections.find(s => s.name.toLowerCase().includes(String(params.subject).toLowerCase()));
              if (match) return [match.id];
            }
            return [fetchedSections[0].id];
          });
        }
        const config = fetchedTiers.find(t => t.exam_type === currentExamId);
        if (isMounted && config) setTierConfig(config);
      } catch (error) {
        console.error('Error fetching practice setup data:', error);
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
  }, [params.exam, params.subject]);

  // Keep active topic subject tab valid
  useEffect(() => {
    if (selectedSubjects.length > 0) {
      if (!activeTopicSubjectId || !selectedSubjects.includes(activeTopicSubjectId)) {
        setActiveTopicSubjectId(selectedSubjects[0]);
      }
    } else {
      setActiveTopicSubjectId(null);
    }
  }, [selectedSubjects, activeTopicSubjectId]);

  // Pre-fetch and prepare topics whenever selectedSubjects change
  useEffect(() => {
    let isMounted = true;
    const loadTopicsForSelected = async () => {
      const missingSubjectIds = selectedSubjects.filter(id => !subjectTopicsMap[id]);
      if (missingSubjectIds.length === 0) return;

      setLoadingTopics(true);
      try {
        const newMap: Record<number, TopicItem[]> = {};
        const newSelected: Record<number, string[]> = {};

        await Promise.all(
          missingSubjectIds.map(async (subId) => {
            const subjectObj = subjects.find(s => s.id === subId);
            const subName = subjectObj?.name || '';
            let fetchedNames: string[] = [];
            try {
              fetchedNames = await examService.getSectionTopics(subId);
            } catch (e) {
              console.warn(`Could not fetch topics for subject ${subId}:`, e);
            }

            if (!fetchedNames || fetchedNames.length === 0) {
              const key = subName.toLowerCase().trim();
              const matchedFallbackKey = Object.keys(DEFAULT_FALLBACK_TOPICS).find(k => key.includes(k));
              if (matchedFallbackKey) {
                fetchedNames = DEFAULT_FALLBACK_TOPICS[matchedFallbackKey];
              } else {
                fetchedNames = ['General Concepts', 'Core Principles', 'Problem Solving', 'Exam Practice'];
              }
            }

            const items: TopicItem[] = fetchedNames.map((name, index) => ({
              id: `topic-${subId}-${index + 1}`,
              name,
              isLocked: !isSubscribed && index >= 3,
            }));

            newMap[subId] = items;

            // Pre-select topic if specific topic requested
            const targetTopicQuery = (params.topic_name || params.topic || params.topic_id || '').toString().toLowerCase().trim();
            let matchedTopic: TopicItem | undefined;
            if (targetTopicQuery) {
              matchedTopic = items.find(t => 
                t.name.toLowerCase().includes(targetTopicQuery) || 
                targetTopicQuery.includes(t.name.toLowerCase())
              );
            }

            if (matchedTopic) {
              matchedTopic.isLocked = false;
              newSelected[subId] = [matchedTopic.name];
            } else {
              // Default select unlocked topics (up to 3)
              const unlocked = items.filter(t => !t.isLocked).slice(0, 3).map(t => t.name);
              newSelected[subId] = unlocked.length > 0 ? unlocked : (items[0] ? [items[0].name] : []);
            }
          })
        );

        if (isMounted) {
          setSubjectTopicsMap(prev => ({ ...prev, ...newMap }));
          setSelectedTopicsBySubject(prev => {
            const updated = { ...prev };
            const targetTopicQuery = (params.topic_name || params.topic || params.topic_id || '').toString().trim();
            Object.keys(newSelected).forEach(k => {
              const keyNum = parseInt(k, 10);
              if (targetTopicQuery || !updated[keyNum] || updated[keyNum].length === 0) {
                updated[keyNum] = newSelected[keyNum];
              }
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Error fetching section topics:', err);
      } finally {
        if (isMounted) {
          setLoadingTopics(false);
        }
      }
    };

    if (selectedSubjects.length > 0 && subjects.length > 0) {
      loadTopicsForSelected();
    }
  }, [selectedSubjects, subjects, isSubscribed, params.topic_id, params.topic_name, params.topic]);

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleSubject = (id: number) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== id));
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects([...selectedSubjects, id]);
      }
    }
  };

  const isComplete = selectedSubjects.length > 0 && !!difficulty && !!questionCount;

  // Active topic subject & list
  const currentActiveSubject = subjects.find(s => s.id === (activeTopicSubjectId || selectedSubjects[0]));
  const currentActiveTopics = (activeTopicSubjectId ? subjectTopicsMap[activeTopicSubjectId] : []) || [];
  const currentActiveSelected = (activeTopicSubjectId ? selectedTopicsBySubject[activeTopicSubjectId] : []) || [];

  const filteredActiveTopics = currentActiveTopics.filter(t => 
    t.name.toLowerCase().includes(topicSearchQuery.toLowerCase())
  );

  const handleToggleTopic = (topic: TopicItem) => {
    if (topic.isLocked) {
      setModalTopicName(topic.name);
      setShowSubscriptionModal(true);
      return;
    }
    if (!activeTopicSubjectId) return;

    setSelectedTopicsBySubject(prev => {
      const currentList = prev[activeTopicSubjectId] || [];
      if (currentList.includes(topic.name)) {
        return {
          ...prev,
          [activeTopicSubjectId]: currentList.filter(t => t !== topic.name),
        };
      } else {
        return {
          ...prev,
          [activeTopicSubjectId]: [...currentList, topic.name],
        };
      }
    });
  };

  const handleSelectAllTopics = () => {
    if (!activeTopicSubjectId) return;
    const unlocked = currentActiveTopics.filter(t => !t.isLocked).map(t => t.name);
    setSelectedTopicsBySubject(prev => ({
      ...prev,
      [activeTopicSubjectId]: unlocked,
    }));
  };

  const handleClearTopics = () => {
    if (!activeTopicSubjectId) return;
    setSelectedTopicsBySubject(prev => ({
      ...prev,
      [activeTopicSubjectId]: [],
    }));
  };

  const getTopicsSummarySubtitle = () => {
    if (selectedSubjects.length === 0) {
      return isSectionExam ? 'Choose sections first' : 'Choose subjects first';
    }
    if (loadingTopics && Object.keys(subjectTopicsMap).length === 0) {
      return 'Loading topics...';
    }

    const totalChosenCount = selectedSubjects.reduce((acc, subId) => {
      return acc + (selectedTopicsBySubject[subId]?.length || 0);
    }, 0);

    if (totalChosenCount === 0) {
      return 'Tap to select topics';
    }

    if (selectedSubjects.length === 1) {
      const subId = selectedSubjects[0];
      const chosen = selectedTopicsBySubject[subId] || [];
      const all = subjectTopicsMap[subId] || [];
      if (all.length > 0 && chosen.length === all.length) {
        return `All topics selected (${chosen.length})`;
      }
      if (chosen.length === 1) {
        return chosen[0];
      }
      if (chosen.length === 2) {
        return `${chosen[0]}, ${chosen[1]}`;
      }
      return `${chosen.length} topics selected`;
    }

    return `${totalChosenCount} topics selected across ${selectedSubjects.length} ${isSectionExam ? 'sections' : 'subjects'}`;
  };

  const handleStartOrContinue = async () => {
    if (selectedSubjects.length === 0) {
      setShowSubjects(true);
      return;
    }

    const totalSelectedTopicsCount = selectedSubjects.reduce((acc, subId) => {
      return acc + (selectedTopicsBySubject[subId]?.length || 0);
    }, 0);

    if (totalSelectedTopicsCount === 0) {
      setShowTopics(true);
      return;
    }

    if (!difficulty) {
      setShowDifficulty(true);
      return;
    }
    if (!questionCount) {
      setShowTime(true);
      return;
    }

    if (isStarting) return;
    setIsStarting(true);

    try {
      const examIdStr = Array.isArray(params.exam) ? params.exam[0] : params.exam;
      const examId = examIdStr ? parseInt(examIdStr, 10) : 1;

      // Check if exam is section-based (e.g. IELTS, TOEFL)
      const cachedExams = examService.getCachedExamsSync() || [];
      let currentExam = cachedExams.find(e => e.id === examId);
      if (!currentExam) {
        try {
          const allExams = await examService.getExams();
          currentExam = allExams.find(e => e.id === examId);
        } catch {}
      }

      const isSectionExam = isSectionBasedExam(currentExam?.name);

      const practiceConfig: Record<string, any> = {
        question_count: questionCount,
        difficulty: difficulty,
      };

      const allChosenTopics: string[] = [];
      selectedSubjects.forEach(subId => {
        const subTopics = selectedTopicsBySubject[subId] || [];
        allChosenTopics.push(...subTopics);
        practiceConfig[String(subId)] = {
          question_count: questionCount,
          difficulty: difficulty,
          topics: subTopics,
        };
      });

      const newAttempt = await examService.startExam({
        exam_type_id: examId,
        mode: 'Practice',
        selected_section_ids: selectedSubjects,
        time_limit_override: isTimed ? timeMinutes : undefined,
        question_count: questionCount,
        difficulty: difficulty,
        topics: allChosenTopics,
        practice_config: practiceConfig,
      });

      if (isSectionExam) {
        const selectedSubjectNamesList = selectedSubjects
          .map(id => subjects.find(s => String(s.id) === String(id))?.name)
          .filter((name): name is string => Boolean(name));
        
        const attemptSecNames = newAttempt.sections?.map(s => s.section_name) || [];
        const finalSecNames = selectedSubjectNamesList.length > 0 ? selectedSubjectNamesList : attemptSecNames;
        const sectionNamesParam = finalSecNames.join(',');

        const firstSecName = (finalSecNames[0] || '').toLowerCase();
        let targetPath: '/(exam)/ielts-listening-session' | '/(exam)/ielts-speaking-session' | '/(exam)/ielts-session' = '/(exam)/ielts-session';
        if (firstSecName.includes('listening')) {
          targetPath = '/(exam)/ielts-listening-session';
        } else if (firstSecName.includes('speaking')) {
          targetPath = '/(exam)/ielts-speaking-session';
        }

        router.push({
          pathname: targetPath,
          params: {
            attempt_id: String(newAttempt.id),
            exam: String(examId),
            exam_type_id: String(examId),
            mode: 'Practice',
            sections: JSON.stringify(selectedSubjects),
            section_order: selectedSubjects.join(','),
            section_names: sectionNamesParam,
            section_index: '0',
            section_name: finalSecNames[0] || undefined,
            difficulty: difficulty,
            question_count: String(questionCount),
            time_limit: isTimed ? String(timeMinutes) : '0',
            is_timed: isTimed ? 'true' : 'false',
          },
        });
      } else {
        router.push({
          pathname: '/(exam)/session',
          params: {
            attempt_id: String(newAttempt.id),
            exam_type_id: String(examId),
            exam_name: currentExam?.name || (params.exam_name ? String(params.exam_name) : undefined),
            mode: 'Practice',
            sections: JSON.stringify(selectedSubjects),
            difficulty: difficulty,
            question_count: String(questionCount),
            time_limit: isTimed ? String(timeMinutes) : '0',
            is_timed: isTimed ? 'true' : 'false',
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to start practice session:', error);
      const errorMsg = getSubscriptionErrorMessage(
        error,
        'Failed to start practice session. Please check your connection and try again.'
      );

      if (isSubscriptionError(error)) {
        setModalTopicName('');
        setSubscriptionMessage(errorMsg);
        setShowSubscriptionModal(true);
      } else {
        Alert.alert('Unable to Start Practice', errorMsg);
      }
    } finally {
      setIsStarting(false);
    }
  };

  // Render subject names for the card subtitle
  const selectedSubjectNames = selectedSubjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Practice Mode</AppText>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => router.push('/streak')}
            activeOpacity={0.8}
          >
            <AppText style={styles.streakEmoji}>🔥</AppText>
            <AppText style={styles.streakText}>{user?.streak || 0}</AppText>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <AppText style={styles.pageTitle}>Customize your practice session</AppText>
        <AppText style={styles.pageSubtitle}>Choose your preferences to focus on what matters most to you.</AppText>

        <AppText style={styles.sectionTitle}>Practice setup</AppText>

        {/* Setup Cards */}
        <TouchableOpacity style={styles.setupCard} onPress={() => setShowSubjects(true)} activeOpacity={0.7}>
          <View style={[styles.setupCardIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Feather name="sliders" size={20} color="#7E57C2" />
          </View>
          <View style={styles.setupCardContent}>
            <AppText style={styles.setupCardTitle}>{isSectionExam ? 'Choose sections' : 'Choose subjects'}</AppText>
            <AppText style={styles.setupCardSubtitle} numberOfLines={1}>
              {selectedSubjects.length > 0 ? selectedSubjectNames : (isSectionExam ? 'Select the right section combination' : 'Select the right subject combination')}
            </AppText>
          </View>
          <Feather name="chevron-right" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        {/* Select Topics Card (Immediately after subject selection) */}
        <TouchableOpacity 
          style={[styles.setupCard, selectedSubjects.length === 0 && { opacity: 0.6 }]} 
          onPress={() => {
            if (selectedSubjects.length === 0) {
              setShowSubjects(true);
            } else {
              setShowTopics(true);
            }
          }} 
          activeOpacity={0.7}
        >
          <View style={[styles.setupCardIconBg, { backgroundColor: '#EEF2FF' }]}>
            <Feather name="book-open" size={20} color="#6366F1" />
          </View>
          <View style={styles.setupCardContent}>
            <AppText style={styles.setupCardTitle}>Select topics</AppText>
            <AppText style={styles.setupCardSubtitle} numberOfLines={1}>
              {getTopicsSummarySubtitle()}
            </AppText>
          </View>
          <Feather name="chevron-right" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.setupCard} onPress={() => setShowDifficulty(true)} activeOpacity={0.7}>
          <View style={[styles.setupCardIconBg, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="activity" size={20} color="#10B981" />
          </View>
          <View style={styles.setupCardContent}>
            <AppText style={styles.setupCardTitle}>Pick difficulty level</AppText>
            <AppText style={styles.setupCardSubtitle}>
              {difficulty || 'Easy, Medium or Hard'}
            </AppText>
          </View>
          <Feather name="chevron-right" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.setupCard} onPress={() => setShowTime(true)} activeOpacity={0.7}>
          <View style={[styles.setupCardIconBg, { backgroundColor: '#FFFBEB' }]}>
            <Feather name="clock" size={20} color="#F59E0B" />
          </View>
          <View style={styles.setupCardContent}>
            <AppText style={styles.setupCardTitle}>Set time & question count</AppText>
            <AppText style={styles.setupCardSubtitle}>
              {questionCount ? `${isTimed ? `${timeMinutes} mins` : 'Untimed'} & ${questionCount} questions` : 'Timed or Untimed'}
            </AppText>
          </View>
          <Feather name="chevron-right" size={20} color="#D1D5DB" />
        </TouchableOpacity>

        {/* Perfect For Section */}
        <View style={styles.perfectForCard}>
          <View style={styles.perfectForContent}>
            <AppText style={styles.perfectForTitle}>Perfect for</AppText>
            {['Learning new topics', 'Improving weak areas', 'Practicing at your own pace', 'Getting explanations and solutions'].map((item, index) => (
              <View key={index} style={styles.perfectForListItem}>
                <Feather name="check-circle" size={16} color="#7E57C2" />
                <AppText style={styles.perfectForListText}>{item}</AppText>
              </View>
            ))}
          </View>
          {/* We use a placeholder image for the trophy */}
          <Image source={require('../../../../assets/images/test-instructions-3d.png')} style={styles.perfectForImage} contentFit="contain" />
        </View>

        {/* XP Banner */}
        <View style={styles.xpBanner}>
          <AppText style={styles.xpBannerText}>✨ Earn XP, maintain streaks and unlock rewards as you practice.</AppText>
        </View>

        {/* Start / Continue Button */}
        <TouchableOpacity 
          style={[styles.mainContinueButton, isStarting && { opacity: 0.8 }]}
          disabled={isStarting}
          onPress={handleStartOrContinue}
          activeOpacity={0.85}
        >
          {isStarting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <AppText style={styles.mainContinueButtonText}>Start Practice</AppText>
              <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.progressSavedRow}>
          <Feather name="check-circle" size={12} color="#9CA3AF" />
          <AppText style={styles.progressSavedText}>Your progress is saved automatically</AppText>
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Subjects Modal */}
      <Modal visible={showSubjects} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handleBarContainer}><View style={styles.handleBar} /></View>
            <View style={styles.sheetHeader}>
              <View>
                <AppText style={styles.sheetTitle}>{isSectionExam ? 'Select Sections' : 'Select Subjects'}</AppText>
                <AppText style={styles.sheetSubtitle}>{isSectionExam ? 'Choose the sections you want to practice' : 'Choose the subjects you want to practice'}</AppText>
              </View>
              <TouchableOpacity onPress={() => setShowSubjects(false)}><Feather name="x" size={24} color="#9CA3AF" /></TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#9CA3AF" />
              <TextInput style={styles.searchInput} placeholder={isSectionExam ? 'Search sections' : 'Search subjects'} placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {loading ? (
                 <AppText style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>Loading {isSectionExam ? 'sections' : 'subjects'}...</AppText>
              ) : (
                filteredSubjects.map(subject => {
                  const isSelected = selectedSubjects.includes(subject.id);
                  const icon = 'book-open-outline';
                  const bg = '#EDE9FE';
                  const color = '#8B5CF6';
                  return (
                    <TouchableOpacity key={subject.id} style={styles.subjectRow} onPress={() => toggleSubject(subject.id)} activeOpacity={0.7}>
                      <View style={[styles.iconContainer, { backgroundColor: bg }]}><MaterialCommunityIcons name={icon as any} size={20} color={color} /></View>
                      <AppText style={styles.subjectName}>{subject.name}</AppText>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Feather name="check" size={14} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{height: 40}} />
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.selectionInfo}>
                <View style={styles.checkBadge}><Feather name="check" size={14} color="#6D28D9" /></View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.selectedCountText}>
                    {selectedSubjects.length} {isSectionExam ? (selectedSubjects.length === 1 ? 'section' : 'sections') : (selectedSubjects.length === 1 ? 'subject' : 'subjects')} selected
                  </AppText>
                  <AppText style={styles.selectedMaxText}>Maximum of four {isSectionExam ? 'sections' : 'subjects'}</AppText>
                </View>
                <TouchableOpacity onPress={() => setSelectedSubjects([])}><AppText style={styles.clearAllText}>Clear All</AppText></TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.continueButton, selectedSubjects.length === 0 && styles.continueButtonDisabled]}
                disabled={selectedSubjects.length === 0}
                onPress={() => {
                  setShowSubjects(false);
                  setShowTopics(true);
                }}
              >
                <AppText style={styles.continueButtonText}>Continue ({selectedSubjects.length})</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Topics Modal (Done immediately after subject selection) */}
      <Modal visible={showTopics} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { maxHeight: '90%' }]}>
            <View style={styles.handleBarContainer}><View style={styles.handleBar} /></View>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <AppText style={styles.sheetTitle}>Select Topics</AppText>
                <AppText style={styles.sheetSubtitle}>Choose the topics you want to practice</AppText>
              </View>
              <TouchableOpacity onPress={() => setShowTopics(false)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Feather name="x" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* If multiple subjects selected, render subject switcher tabs */}
            {selectedSubjects.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.subjectTabsScroll}
                contentContainerStyle={styles.subjectTabsContent}
              >
                {selectedSubjects.map(subId => {
                  const sub = subjects.find(s => s.id === subId);
                  const isActive = (activeTopicSubjectId || selectedSubjects[0]) === subId;
                  const count = selectedTopicsBySubject[subId]?.length || 0;
                  return (
                    <TouchableOpacity
                      key={subId}
                      style={[styles.subjectTabPill, isActive && styles.subjectTabPillActive]}
                      onPress={() => {
                        setActiveTopicSubjectId(subId);
                        setTopicSearchQuery('');
                      }}
                      activeOpacity={0.7}
                    >
                      <AppText style={[styles.subjectTabPillText, isActive && styles.subjectTabPillTextActive]}>
                        {sub?.name || (isSectionExam ? 'Section' : 'Subject')} ({count})
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Search container */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#9CA3AF" />
              <TextInput 
                style={styles.searchInput} 
                placeholder={`Search ${currentActiveSubject?.name || (isSectionExam ? 'section' : 'subject')} topics...`}
                placeholderTextColor="#9CA3AF" 
                value={topicSearchQuery} 
                onChangeText={setTopicSearchQuery} 
              />
              {topicSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTopicSearchQuery('')}>
                  <Feather name="x-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Actions (Select All / Clear) */}
            <View style={styles.topicActionRow}>
              <AppText style={styles.topicActiveSubjectTitle} numberOfLines={1}>
                {currentActiveSubject?.name || (isSectionExam ? 'Section Topics' : 'Subject Topics')}
              </AppText>
              <View style={styles.topicActionButtons}>
                <TouchableOpacity onPress={handleSelectAllTopics} style={styles.topicActionBtn}>
                  <AppText style={styles.topicActionText}>Select All</AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearTopics} style={styles.topicActionBtn}>
                  <AppText style={styles.topicActionTextDanger}>Clear</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Topic List */}
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {loadingTopics && (!currentActiveTopics || currentActiveTopics.length === 0) ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#6D28D9" />
                  <AppText style={{ marginTop: 12, color: '#6B7280' }}>Loading topics...</AppText>
                </View>
              ) : filteredActiveTopics.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Feather name="search" size={32} color="#D1D5DB" />
                  <AppText style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
                    {topicSearchQuery ? 'No topics match your search' : (isSectionExam ? 'No topics available for this section' : 'No topics available for this subject')}
                  </AppText>
                </View>
              ) : (
                filteredActiveTopics.map((topic, index) => {
                  const isSelected = currentActiveSelected.includes(topic.name);
                  const isLocked = topic.isLocked;

                  return (
                    <TouchableOpacity
                      key={topic.id || index}
                      style={[
                        styles.topicCard,
                        isSelected && !isLocked && styles.topicCardSelected,
                      ]}
                      onPress={() => handleToggleTopic(topic)}
                      activeOpacity={0.7}
                    >
                      {/* Topic Index Number */}
                      <View
                        style={[
                          styles.indexCircle,
                          isSelected && !isLocked && styles.indexCircleSelected,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.indexNumber,
                            isSelected && !isLocked && styles.indexNumberSelected,
                          ]}
                        >
                          {index + 1}
                        </AppText>
                      </View>

                      {/* Topic Info */}
                      <View style={styles.topicInfo}>
                        <AppText
                          style={[
                            styles.topicTitle,
                            isLocked && styles.topicTitleLocked,
                          ]}
                          numberOfLines={2}
                        >
                          {topic.name}
                        </AppText>
                        {isLocked && (
                          <AppText style={styles.subscriptionRequiredText}>
                            Subscription required
                          </AppText>
                        )}
                      </View>

                      {/* Checkbox or Lock */}
                      {isLocked ? (
                        <View style={styles.lockIconContainer}>
                          <MaterialCommunityIcons
                            name="lock"
                            size={20}
                            color="#9CA3AF"
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.checkCircle,
                            isSelected && styles.checkCircleSelected,
                          ]}
                        >
                          {isSelected && (
                            <Feather name="check" size={14} color="#FFFFFF" />
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.selectionInfo}>
                <View style={styles.checkBadge}>
                  <Feather name="check" size={14} color="#6D28D9" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.selectedCountText}>
                    {currentActiveSelected.length} {currentActiveSubject?.name || 'topics'} selected
                  </AppText>
                  <AppText style={styles.selectedMaxText}>
                    {selectedSubjects.length > 1
                      ? `${selectedSubjects.reduce((acc, subId) => acc + (selectedTopicsBySubject[subId]?.length || 0), 0)} total across ${selectedSubjects.length} subjects`
                      : 'Choose specific topics or practice all'}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  currentActiveSelected.length === 0 && styles.continueButtonDisabled,
                ]}
                disabled={currentActiveSelected.length === 0}
                onPress={() => setShowTopics(false)}
              >
                <AppText style={styles.continueButtonText}>
                  Done ({currentActiveSelected.length})
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Difficulty Modal */}
      <Modal visible={showDifficulty} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handleBarContainer}><View style={styles.handleBar} /></View>
            <View style={styles.sheetHeader}>
              <View>
                <AppText style={styles.sheetTitle}>Choose Difficulty</AppText>
                <AppText style={styles.sheetSubtitle}>Select the difficulty level that matches your goal.</AppText>
              </View>
              <TouchableOpacity onPress={() => setShowDifficulty(false)}><Feather name="x" size={24} color="#9CA3AF" /></TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              {[
                { id: 'Easy', desc: 'Build your basics', icon: 'feather', bg: '#ECFDF5', color: '#10B981' },
                { id: 'Medium', desc: 'Balanced difficulty', icon: 'code', bg: '#F3E8FF', color: '#7E57C2' },
                { id: 'Hard', desc: 'Challenge yourself', icon: 'flame', bg: '#FEE2E2', color: '#EF4444' }
              ].map(opt => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={[styles.optionCard, difficulty === opt.id && styles.optionCardSelected]} 
                  onPress={() => setDifficulty(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconBg, { backgroundColor: opt.bg }]}>
                    <Feather name={opt.icon as any} size={20} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.optionTitle}>{opt.id}</AppText>
                    <AppText style={styles.optionDesc}>{opt.desc}</AppText>
                  </View>
                  {opt.id === 'Medium' && (
                    <View style={styles.recommendedBadge}><AppText style={styles.recommendedText}>Recommended</AppText></View>
                  )}
                  <View style={[styles.radioOuter, difficulty === opt.id && styles.radioOuterSelected]}>
                    {difficulty === opt.id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={[styles.continueButton, { marginTop: 24 }]} onPress={() => setShowDifficulty(false)}>
                <AppText style={styles.continueButtonText}>Continue</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time & Questions Modal */}
      <Modal visible={showTime} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handleBarContainer}><View style={styles.handleBar} /></View>
            <View style={styles.sheetHeader}>
              <View>
                <AppText style={styles.sheetTitle}>Set Time & Questions</AppText>
                <AppText style={styles.sheetSubtitle}>Choose how many questions and whether you want a timer.</AppText>
              </View>
              <TouchableOpacity onPress={() => setShowTime(false)}><Feather name="x" size={24} color="#9CA3AF" /></TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <AppText style={styles.sectionLabel}>Number of Questions</AppText>
              <View style={styles.questionsRow}>
                {[100, 200, 400, 600].map(num => (
                  <TouchableOpacity 
                    key={num} 
                    style={[styles.questionPill, !isCustomQuestions && questionCount === num && styles.questionPillSelected]}
                    onPress={() => {
                      setIsCustomQuestions(false);
                      setQuestionCount(num);
                    }}
                    activeOpacity={0.7}
                  >
                    <AppText style={[styles.questionPillText, !isCustomQuestions && questionCount === num && styles.questionPillTextSelected]}>{num}</AppText>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity 
                  style={[styles.customPill, isCustomQuestions && styles.customPillSelected]}
                  onPress={() => {
                    setIsCustomQuestions(true);
                    if (customQuestionInput) {
                      const val = parseInt(customQuestionInput, 10);
                      if (!isNaN(val) && val > 0) {
                        setQuestionCount(val);
                      }
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.customPillText, isCustomQuestions && styles.customPillTextSelected]}>
                    {isCustomQuestions && questionCount ? `Custom (${questionCount}) ` : 'Custom '}
                  </AppText>
                  <Feather name="edit-2" size={12} color={isCustomQuestions ? '#FFF' : '#111827'} />
                </TouchableOpacity>
              </View>

              {isCustomQuestions && (
                <View style={styles.customInputContainer}>
                  <AppText style={styles.customInputLabel}>Enter custom question count (1 - 1000):</AppText>
                  <View style={[styles.customInputRow, isCustomInputFocused && styles.customInputRowFocused]}>
                    <TextInput
                      style={styles.customTextInput}
                      keyboardType="number-pad"
                      placeholder="e.g. 50"
                      placeholderTextColor="#9CA3AF"
                      value={customQuestionInput}
                      onFocus={() => setIsCustomInputFocused(true)}
                      onBlur={() => setIsCustomInputFocused(false)}
                      selectionColor="#7C3AED"
                      underlineColorAndroid="transparent"
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        setCustomQuestionInput(cleaned);
                        const val = parseInt(cleaned, 10);
                        if (!isNaN(val) && val > 0) {
                          setQuestionCount(val);
                        } else {
                          setQuestionCount(null);
                        }
                      }}
                      maxLength={4}
                      autoFocus
                    />
                    <AppText style={styles.customInputUnit}>questions</AppText>
                  </View>
                </View>
              )}

              <AppText style={[styles.sectionLabel, { marginTop: isCustomQuestions ? 8 : 20 }]}>Timer</AppText>
              <View style={styles.timerRow}>
                <TouchableOpacity style={[styles.timerCard, isTimed && styles.timerCardSelected]} onPress={() => setIsTimed(true)} activeOpacity={0.8}>
                  <View style={styles.timerCardHeader}>
                    <Feather name="clock" size={20} color={isTimed ? '#4C1D95' : '#9CA3AF'} />
                    <View style={[styles.radioOuter, isTimed && styles.radioOuterSelected]}>
                      {isTimed && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <AppText style={styles.timerTitle}>Timed</AppText>
                  <AppText style={styles.timerDesc}>Answer within the set time</AppText>
                  <TouchableOpacity 
                    style={styles.timeDropdown}
                    onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                    activeOpacity={0.8}
                  >
                    <AppText style={styles.timeDropdownText}>{timeMinutes} Minutes</AppText>
                    <Feather name={showTimeDropdown ? "chevron-up" : "chevron-down"} size={16} color="#4C1D95" />
                  </TouchableOpacity>
                  {showTimeDropdown && (
                    <View style={styles.timeOptionsContainer}>
                      {[10, 15, 20, 30, 45, 60, 90, 120].map((mins) => (
                        <TouchableOpacity
                          key={mins}
                          style={[styles.timeOptionPill, timeMinutes === mins && styles.timeOptionPillSelected]}
                          onPress={() => {
                            setTimeMinutes(mins);
                            setShowTimeDropdown(false);
                          }}
                        >
                          <AppText style={[styles.timeOptionText, timeMinutes === mins && styles.timeOptionTextSelected]}>
                            {mins}m
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timerCard, !isTimed && styles.timerCardSelected]} 
                  onPress={() => {
                    setIsTimed(false);
                    setShowTimeDropdown(false);
                  }} 
                  activeOpacity={0.8}
                >
                  <View style={styles.timerCardHeader}>
                    <Feather name="clock" size={20} color={!isTimed ? '#4C1D95' : '#10B981'} />
                    <View style={[styles.radioOuter, !isTimed && styles.radioOuterSelected]}>
                      {!isTimed && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <AppText style={styles.timerTitle}>Untimed</AppText>
                  <AppText style={styles.timerDesc}>Practice freely at your own pace</AppText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.continueButton, { marginTop: 24 }]} onPress={() => setShowTime(false)}>
                <AppText style={styles.continueButtonText}>Continue</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        visible={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setSubscriptionMessage(undefined);
        }}
        subjectName={currentActiveSubject?.name}
        topicName={modalTopicName}
        customMessage={subscriptionMessage || (modalTopicName ? 'This topic requires an active subscription or bundle. Upgrade now to practice all topics!' : undefined)}
        pendingRedirect={{
          pathname: '/(tabs)/practice/practice-setup',
          params: {
            ...params,
            auto_start: 'true',
          },
        }}
        onViewBundles={() => {
          setShowSubscriptionModal(false);
          setSubscriptionMessage(undefined);
          router.push('/(tabs)/bundles' as any);
        }}
      />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: 0 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  streakBadge: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { color: '#6D28D9', fontWeight: 'bold', fontSize: 14 },
  
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  setupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  setupCardIconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  setupCardContent: { flex: 1, marginRight: 16 },
  setupCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  setupCardSubtitle: { fontSize: 13, color: '#9CA3AF' },
  
  perfectForCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 12 },
  perfectForContent: { flex: 1, zIndex: 2 },
  perfectForTitle: { fontSize: 18, fontWeight: 'bold', color: '#6D28D9', marginBottom: 12 },
  perfectForListItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  perfectForListText: { fontSize: 13, color: '#111827', marginLeft: 8, fontWeight: '500' },
  perfectForImage: { width: 100, height: 100, position: 'absolute', right: 10, bottom: 20, zIndex: 1 },

  xpBanner: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#FDE6B5' },
  xpBannerText: { color: '#B45309', fontSize: 13, fontWeight: '600', lineHeight: 20 },

  mainContinueButton: { backgroundColor: '#4C1D95', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  mainContinueButtonDisabled: { backgroundColor: '#E5E7EB' },
  mainContinueButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  progressSavedRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  progressSavedText: { color: '#9CA3AF', fontSize: 12 },

  // Modal specific
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handleBarContainer: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  sheetSubtitle: { fontSize: 14, color: '#6B7280' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', marginHorizontal: 24, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16 },
  searchInput: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 16, 
    color: '#111827',
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  scrollArea: { paddingHorizontal: 24 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  subjectName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#6D28D9', borderColor: '#6D28D9' },
  
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFF' },
  selectionInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectedCountText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  selectedMaxText: { fontSize: 12, color: '#6B7280' },
  clearAllText: { fontSize: 14, fontWeight: '600', color: '#6D28D9' },
  
  continueButton: { backgroundColor: '#4C1D95', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#9CA3AF' },
  continueButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Difficulty & Time styles
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  optionCardSelected: { borderColor: '#7E57C2', backgroundColor: '#F5F3FF', borderWidth: 1.5 },
  optionIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  optionDesc: { fontSize: 13, color: '#6B7280' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: '#7E57C2' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7E57C2' },
  recommendedBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 12 },
  recommendedText: { fontSize: 10, color: '#4338CA', fontWeight: 'bold' },

  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  questionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  questionPill: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  questionPillSelected: { backgroundColor: '#6D28D9', borderColor: '#6D28D9' },
  questionPillText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  questionPillTextSelected: { color: '#FFF' },
  customPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  customPillSelected: { backgroundColor: '#6D28D9', borderColor: '#6D28D9' },
  customPillText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  customPillTextSelected: { color: '#FFF' },
  
  customInputContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  customInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  customInputRowFocused: {
    borderColor: '#7C3AED',
  },
  customTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  customInputUnit: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 8,
  },

  timerRow: { flexDirection: 'row', gap: 12 },
  timerCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  timerCardSelected: { borderColor: '#7E57C2', backgroundColor: '#F5F3FF', borderWidth: 1.5 },
  timerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  timerDesc: { fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
  timeDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  timeDropdownText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  
  timeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  timeOptionPill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeOptionPillSelected: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  timeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  timeOptionTextSelected: {
    color: '#FFF',
  },

  // Subject tabs in topics modal
  subjectTabsScroll: { marginBottom: 12, maxHeight: 44 },
  subjectTabsContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  subjectTabPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectTabPillActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7E57C2',
  },
  subjectTabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  subjectTabPillTextActive: {
    color: '#6D28D9',
    fontWeight: '700',
  },

  // Topic action row
  topicActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  topicActiveSubjectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  topicActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  topicActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  topicActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D28D9',
  },
  topicActionTextDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Topic card
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicCardSelected: {
    borderColor: '#7E57C2',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
  },
  indexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indexCircleSelected: {
    backgroundColor: '#EDE9FE',
  },
  indexNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  indexNumberSelected: {
    color: '#6D28D9',
  },
  topicInfo: {
    flex: 1,
    marginRight: 12,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  topicTitleLocked: {
    color: '#9CA3AF',
  },
  subscriptionRequiredText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  lockIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkCircleSelected: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
});
