import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { contestService, Contest } from '@/services/contest';

export default function ContestSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const data = await contestService.getContestById(params.id || 1);
        setContest(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContest();
  }, [params.id]);

  const contestName = contest?.title || 'Contest';

  const handleBackToContest = () => {
    router.replace({
      pathname: '/(tabs)/contest/details',
      params: { id: params.id || '1', registered: 'true' },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackToContest}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Successful</AppText>
          <View style={styles.streakBadge}>
            <AppText style={{ fontSize: 13, marginRight: 4 }}>🔥</AppText>
            <AppText style={styles.streakText}>{user?.streak ?? 0}</AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Concentric Glow Checkmark */}
          <View style={styles.glowContainer}>
            <View style={styles.outerGlow}>
              <View style={styles.middleGlow}>
                <View style={styles.innerCircle}>
                  <Feather name="check" size={42} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>

          {/* Titles */}
          <AppText style={styles.heading}>Registration Successful!</AppText>
          <AppText style={styles.subheading}>
            You've successfully registered for {contestName}.
          </AppText>

          {/* Status & Countdown Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusCol}>
              <AppText style={styles.statusLabel}>Status</AppText>
              <View style={styles.statusValueRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#10B981"
                  style={{ marginRight: 6 }}
                />
                <AppText style={styles.statusValueBold}>Approved</AppText>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.statusCol}>
              <AppText style={styles.statusLabel}>Contest Starts In</AppText>
              <View style={styles.statusValueRow}>
                <View style={styles.greenDot} />
                <AppText style={styles.statusValueBold}>
                  {contest?.starts_in || '--'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Subtext info */}
          <AppText style={styles.notificationText}>
            You will be notified when the contest begins.
          </AppText>

          {/* Back to Contest Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleBackToContest}
          >
            <AppText style={styles.primaryButtonText}>Back to Contest</AppText>
          </TouchableOpacity>

          <View style={{ height: 110 }} />
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
    paddingTop: 36,
    alignItems: 'center',
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  outerGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(209, 250, 229, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleGlow: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(167, 243, 208, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statusCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 6,
  },
  statusValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  cardDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  notificationText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 36,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4C1D95',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
