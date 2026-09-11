import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { handleHelpBack } from '@/utils/helpNavigation';

interface Step {
  number: number;
  title: string;
  description: string;
  iconName: string;
  iconType: 'feather' | 'material';
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Log in to your account',
    description: 'Use your credentials to log in to the app.',
    iconName: 'log-in',
    iconType: 'feather',
  },
  {
    number: 2,
    title: 'Go to Practice',
    description: 'Tap on the Practice tab in the bottom navigation.',
    iconName: 'clipboard-check-outline',
    iconType: 'material',
  },
  {
    number: 3,
    title: 'Select a practice test',
    description: 'Choose the test type and mode you want to take.',
    iconName: 'file-text',
    iconType: 'feather',
  },
  {
    number: 4,
    title: 'Review test settings',
    description: 'Check the time, sections, and instructions before starting.',
    iconName: 'sliders',
    iconType: 'feather',
  },
  {
    number: 5,
    title: 'Start the test',
    description: 'Tap Start Test and begin your practice session.',
    iconName: 'play-circle',
    iconType: 'feather',
  },
  {
    number: 6,
    title: 'View your results',
    description: 'See your score, performance breakdown, and suggestions.',
    iconName: 'bar-chart-2',
    iconType: 'feather',
  },
];

export default function GuidePracticeTestScreen() {
  const params = useLocalSearchParams<{ from?: string }>();
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const handleFeedback = (val: 'yes' | 'no') => {
    setFeedback(val);
    Alert.alert('Feedback Received', 'Thank you! Your feedback helps us improve our guides.');
  };

  const renderIcon = (step: Step) => {
    if (step.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={step.iconName as any}
          size={20}
          color="#7C3AED"
        />
      );
    }
    return <Feather name={step.iconName as any} size={20} color="#7C3AED" />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/user-guide')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>How to take a practice test</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Introduction Paragraph */}
          <Text style={styles.introParagraph}>
            Practice tests help you get familiar with the test format, question types, and timing.
            Follow the steps below to get started.
          </Text>

          {/* Steps List */}
          <View style={styles.stepsContainer}>
            {STEPS.map((step, idx) => {
              const isLast = idx === STEPS.length - 1;

              return (
                <View key={step.number}>
                  <View style={styles.stepRow}>
                    {/* Number Badge */}
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>{step.number}</Text>
                    </View>

                    {/* Action Icon */}
                    <View style={styles.stepIconContainer}>{renderIcon(step)}</View>

                    {/* Step Texts */}
                    <View style={styles.stepTextContainer}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                  </View>

                  {!isLast && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={19} color="#7C3AED" />
              <Text style={styles.tipsTitle}>Tips</Text>
            </View>

            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                •  Find a quiet place with a stable internet connection.
              </Text>
              <Text style={styles.tipItem}>
                •  Use practice tests to track your progress.
              </Text>
              <Text style={styles.tipItem}>
                •  Review your results to identify weak areas.
              </Text>
            </View>
          </View>

          {/* Bottom Divider */}
          <View style={styles.bottomDivider} />

          {/* Was this article helpful? */}
          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackPrompt}>Was this article helpful?</Text>

            <View style={styles.feedbackButtonsGroup}>
              <TouchableOpacity
                style={[
                  styles.feedbackBtn,
                  feedback === 'yes' && styles.feedbackBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => handleFeedback('yes')}
              >
                <Feather
                  name="thumbs-up"
                  size={16}
                  color={feedback === 'yes' ? '#7C3AED' : '#4B5563'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.feedbackBtnText,
                    feedback === 'yes' && styles.feedbackBtnTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackBtn,
                  feedback === 'no' && styles.feedbackBtnActive,
                ]}
                activeOpacity={0.7}
                onPress={() => handleFeedback('no')}
              >
                <Feather
                  name="thumbs-down"
                  size={16}
                  color={feedback === 'no' ? '#E11D48' : '#4B5563'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.feedbackBtnText,
                    feedback === 'no' && { color: '#E11D48', fontWeight: '700' },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  introParagraph: {
    fontSize: 13.5,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 20,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  stepIconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 3,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 84,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },

  // Feedback section
  bottomDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  feedbackPrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  feedbackButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  feedbackBtnActive: {
    backgroundColor: '#EDE9FE',
  },
  feedbackBtnText: {
    fontSize: 13.5,
    color: '#4B5563',
    fontWeight: '500',
  },
  feedbackBtnTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
});
