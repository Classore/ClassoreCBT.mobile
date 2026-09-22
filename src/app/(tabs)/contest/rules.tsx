import React, { useState } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';

export default function ContestRulesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; registered?: string }>();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(true);

  const isAlreadyRegistered = params.registered === 'true';

  const rulesList = [
    {
      id: 1,
      iconType: 'feather',
      iconName: 'credit-card',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      text: '100 multiple choice questions',
    },
    {
      id: 2,
      iconType: 'feather',
      iconName: 'clock',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      text: 'Duration: 90 minutes',
    },
    {
      id: 3,
      iconType: 'feather',
      iconName: 'x-circle',
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      text: 'No negative marking',
    },
    {
      id: 4,
      iconType: 'feather',
      iconName: 'layout',
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      text: 'Do not switch tabs or exit full screen',
    },
    {
      id: 5,
      iconType: 'feather',
      iconName: 'target',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      text: 'Multiple choice single and multi select',
    },
    {
      id: 6,
      iconType: 'feather',
      iconName: 'alert-triangle',
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      text: 'Cheating will lead to de disqualification',
    },
    {
      id: 7,
      iconType: 'feather',
      iconName: 'file-text',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      text: 'Results will be published after contest',
    },
  ];

  const handleContinue = () => {
    if (isAlreadyRegistered) {
      router.back();
    } else {
      router.push({
        pathname: '/(tabs)/contest/register',
        params: { id: params.id || '1' },
      });
    }
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Rules & Instructions</AppText>
          <View style={styles.streakBadge}>
            <AppText style={{ fontSize: 13, marginRight: 4 }}>🔥</AppText>
            <AppText style={styles.streakText}>{user?.streak ?? 0}</AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Rules Cards List */}
          <View style={styles.rulesContainer}>
            {rulesList.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={[styles.ruleIconCircle, { backgroundColor: rule.iconBg }]}>
                  <Feather name={rule.iconName as any} size={18} color={rule.iconColor} />
                </View>
                <AppText style={styles.ruleText}>{rule.text}</AppText>
              </View>
            ))}

            {/* Agreement Card */}
            <TouchableOpacity
              style={[styles.ruleCard, styles.agreementCard]}
              activeOpacity={0.8}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={styles.checkboxCircle}>
                <Ionicons
                  name={agreed ? 'checkbox' : 'square-outline'}
                  size={22}
                  color="#7C3AED"
                />
              </View>
              <AppText style={styles.agreementText}>
                I have read and agree to the rules
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.primaryButton, !agreed && styles.buttonDisabled]}
            activeOpacity={0.85}
            disabled={!agreed}
            onPress={handleContinue}
          >
            <AppText style={styles.primaryButtonText}>
              {isAlreadyRegistered ? 'Close' : 'Continue'}
            </AppText>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  iconButton: {
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
    fontWeight: '700',
    color: '#111827',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  rulesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ruleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  ruleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  agreementCard: {
    borderColor: '#E0E7FF',
    marginTop: 4,
  },
  checkboxCircle: {
    marginRight: 14,
  },
  agreementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
