import React from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function IELTSInstructionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const instructions = [
    {
      id: '1',
      text: 'Follow the instructions and time limits for each section.',
      icon: 'clock',
      iconFamily: 'feather',
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
    },
    {
      id: '2',
      text: 'Once a section is completed, you cannot return to it.',
      icon: 'refresh-cw',
      iconFamily: 'feather',
      iconBg: '#FFE4E6',
      iconColor: '#E11D48',
    },
    {
      id: '3',
      text: 'Answers are auto-saved as you go. Your progress is safe.',
      icon: 'check-square',
      iconFamily: 'feather',
      iconBg: '#D1FAE5',
      iconColor: '#059669',
    },
    {
      id: '4',
      text: 'Ensure a stable internet connection throughout the test.',
      icon: 'wifi',
      iconFamily: 'feather',
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
    },
    {
      id: '5',
      text: 'You cannot pause and restart a completed section.',
      icon: 'clock-outline',
      iconFamily: 'material',
      iconBg: '#FFEDD5',
      iconColor: '#EA580C',
    },
  ];

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
          <Text style={styles.headerTitle}>Test Instructions</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak ?? 0}</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 3D Book Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../../assets/images/ielts-book-illustration.png')}
              style={styles.instructionBookImage}
              contentFit="contain"
            />
          </View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.mainHeading}>
              Everything you need to know before starting the complete test
            </Text>
            <Text style={styles.subHeading}>
              These instructions are important for a smooth testing experience.
            </Text>
          </View>

          {/* Instructions List */}
          <View style={styles.instructionsList}>
            {instructions.map((item) => (
              <View key={item.id} style={styles.instructionCard}>
                <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                  {item.iconFamily === 'material' ? (
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.iconColor} />
                  ) : (
                    <Feather name={item.icon as any} size={18} color={item.iconColor} />
                  )}
                </View>
                <Text style={styles.instructionText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => {
              const firstSection = (params.section_name as string) || 
                (params.section_names ? (params.section_names as string).split(',')[0] : 'Reading');
              
              const isListening = firstSection.toLowerCase().includes('listening');
              const isSpeaking = firstSection.toLowerCase().includes('speaking');

              if (isListening) {
                router.push({
                  pathname: '/(exam)/ielts-listening-instructions',
                  params: {
                    ...params,
                    section_name: firstSection,
                    exam_name: params.exam_name || 'IELTS Academic',
                  }
                });
              } else if (isSpeaking) {
                router.push({
                  pathname: '/(exam)/ielts-speaking-instructions',
                  params: {
                    ...params,
                    section_name: firstSection,
                    exam_name: params.exam_name || 'IELTS Academic',
                  }
                });
              } else {
                router.push({
                  pathname: '/(exam)/ielts-section-instructions',
                  params: {
                    ...params,
                    section_name: firstSection,
                    exam_name: params.exam_name || 'IELTS Academic',
                  }
                });
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
    paddingTop: 10,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  instructionBookImage: {
    width: 160,
    height: 150,
  },

  // Heading
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Instructions List
  instructionsList: {
    gap: 10,
    marginBottom: 24,
  },
  instructionCard: {
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
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
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
