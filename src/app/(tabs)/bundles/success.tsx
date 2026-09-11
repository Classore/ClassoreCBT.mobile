import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function BundleSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bundle_id?: string;
    bundle_name?: string;
    token_cost?: string;
    billing_type?: string;
  }>();
  const { user } = useAuth();

  const bundleName = params.bundle_name || 'IELTS Bundle';
  const isJamb = bundleName.toLowerCase().includes('jamb');

  // Compute 30 days expiration date
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const formattedExpiry = expires.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleStartPractice = () => {
    router.replace('/(tabs)/practice');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/bundles' as any)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Successful</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak ?? 0}</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Concentric Glow Circle Checkmark */}
          <View style={styles.celebrationCenter}>
            <View style={styles.outerGlowCircle}>
              <View style={styles.middleGlowCircle}>
                <View style={styles.innerCheckCircle}>
                  <Feather name="check" size={36} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <Text style={styles.successHeading}>Subscription Activated!</Text>
            <Text style={styles.successSubheading}>
              Your {bundleName} is now active.
            </Text>
          </View>

          {/* Entitlement Summary Card */}
          <View style={[styles.entitlementCard, isJamb ? styles.jambCardBg : styles.ieltsCardBg]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, isJamb ? styles.jambIconBox : styles.ieltsIconBox]}>
                <Image
                  source={
                    isJamb
                      ? require('../../../../assets/images/jamb-logo.png')
                      : require('../../../../assets/images/ielts-logo.png')
                  }
                  style={styles.cardLogo}
                  contentFit="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardBundleName}>{bundleName}</Text>
                <Text style={styles.cardValidityText}>Valid for 30 Days</Text>
                <Text style={styles.cardExpiresText}>Expires on {formattedExpiry}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Included Skills / Features */}
            {isJamb ? (
              <View style={styles.skillsList}>
                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <Feather name="book" size={16} color="#2563EB" />
                  </View>
                  <Text style={styles.skillNameText}>English Language</Text>
                  <Text style={styles.skillLimitText}>Unlimited</Text>
                </View>

                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="calculator-outline" size={16} color="#10B981" />
                  </View>
                  <Text style={styles.skillNameText}>Mathematics</Text>
                  <Text style={styles.skillLimitText}>Unlimited</Text>
                </View>

                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="activity" size={16} color="#D97706" />
                  </View>
                  <Text style={styles.skillNameText}>Biology</Text>
                  <Text style={styles.skillLimitText}>Unlimited</Text>
                </View>

                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="flask-outline" size={16} color="#7C3AED" />
                  </View>
                  <Text style={styles.skillNameText}>Chemistry</Text>
                  <Text style={styles.skillLimitText}>Unlimited</Text>
                </View>
              </View>
            ) : (
              <View style={styles.skillsList}>
                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <Feather name="headphones" size={16} color="#2563EB" />
                  </View>
                  <Text style={styles.skillNameText}>Listening</Text>
                  <Text style={styles.skillLimitText}>Unlimited</Text>
                </View>

                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="book-outline" size={16} color="#10B981" />
                  </View>
                  <Text style={styles.skillNameText}>Reading</Text>
                  <Text style={styles.skillLimitText}>Unlimited</Text>
                </View>

                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#FFE4E6' }]}>
                    <Feather name="mic" size={16} color="#E11D48" />
                  </View>
                  <Text style={styles.skillNameText}>Speaking</Text>
                  <Text style={styles.skillLimitText}>4 assessments</Text>
                </View>

                <View style={styles.skillItemRow}>
                  <View style={[styles.skillIconBox, { backgroundColor: '#EDE9FE' }]}>
                    <Feather name="edit-2" size={16} color="#7C3AED" />
                  </View>
                  <Text style={styles.skillNameText}>Writing</Text>
                  <Text style={styles.skillLimitText}>4 assessments</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.startPracticeButton}
            onPress={handleStartPractice}
            activeOpacity={0.85}
          >
            <Text style={styles.startPracticeButtonText}>Start Practice</Text>
          </TouchableOpacity>

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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#F3E8FF',
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
    paddingTop: 16,
  },
  celebrationCenter: {
    alignItems: 'center',
    marginVertical: 20,
  },
  outerGlowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(209, 250, 229, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleGlowCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(167, 243, 208, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCheckCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 22,
    textAlign: 'center',
  },
  successSubheading: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  entitlementCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  ieltsCardBg: {
    backgroundColor: '#FFF7F8',
    borderColor: '#FFE4E6',
  },
  jambCardBg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  ieltsIconBox: {
    backgroundColor: '#FFE4E6',
  },
  jambIconBox: {
    backgroundColor: '#DCFCE7',
  },
  cardLogo: {
    width: 32,
    height: 32,
  },
  cardBundleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardValidityText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardExpiresText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  skillsList: {
    gap: 14,
  },
  skillItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  skillNameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  skillLimitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  startPracticeButton: {
    backgroundColor: '#5B21B6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startPracticeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
