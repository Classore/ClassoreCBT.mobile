import React, { useState, useEffect } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { contestService, Contest } from '@/services/contest';

export default function ContestPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    school?: string;
    referralCode?: string;
  }>();
  const { user, refreshUser } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const data = await contestService.getContestById(params.id || 1);
        setContest(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
  }, [params.id]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const contestId = Number(params.id || 1);
      await contestService.joinContest(contestId);
      if (refreshUser) {
        refreshUser().catch(() => {});
      }
      router.replace({
        pathname: '/(tabs)/contest/success',
        params: { id: String(contestId) },
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.message || 'Could not complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !contest) {
    return (
      <AppSafeArea style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      </AppSafeArea>
    );
  }

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
          <AppText style={styles.headerTitle}>Registration details</AppText>
          <View style={styles.streakBadge}>
            <AppText style={{ fontSize: 13, marginRight: 4 }}>🔥</AppText>
            <AppText style={styles.streakText}>{user?.streak ?? 0}</AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Card */}
          <LinearGradient
            colors={['#43188F', '#581C87', '#6B21A8']}
            style={styles.bannerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerContent}>
              <AppText style={styles.bannerTitle}>{contest.title}</AppText>
              <View style={styles.bannerMetaRow}>
                <View style={styles.bannerMetaItem}>
                  <Feather name="users" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <AppText style={styles.bannerMetaText}>
                    {contest.participants_count ? `${Number(contest.participants_count).toLocaleString()}+ Students` : '0 Students'}
                  </AppText>
                </View>
                <View style={styles.bannerMetaItem}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <AppText style={styles.bannerMetaText}>{contest.target_audience || 'All Students'}</AppText>
                </View>
              </View>
              <AppText style={styles.bannerFeeText}>
                Entry Fee - {contest.entry_fee_formatted || (contest.entry_fee_tokens ? `#${contest.entry_fee_tokens.toLocaleString()}` : 'Free')}
              </AppText>
            </View>

            <View style={styles.bannerTrophyContainer}>
              <Image
                source={require('../../../../assets/images/contest-hero-trophy.png')}
                style={styles.bannerTrophyImage}
                contentFit="contain"
              />
            </View>
          </LinearGradient>

          {/* Payment Method Header */}
          <AppText style={styles.sectionTitle}>Payment Method</AppText>

          {/* Wallet Balance Card */}
          <TouchableOpacity style={styles.walletCard} activeOpacity={0.9}>
            <View style={styles.walletIconBox}>
              <Ionicons name="wallet" size={24} color="#5B21B6" />
            </View>
            <View style={styles.walletInfo}>
              <AppText style={styles.walletTitle}>Wallet Balance</AppText>
              <AppText style={styles.walletSub}>
                {user?.token_balance !== undefined
                  ? `${user.token_balance.toLocaleString()} Tokens`
                  : 'Updating balance...'}
              </AppText>
            </View>
            <View style={styles.checkRadioCircle}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Confirm & Register Button */}
          <TouchableOpacity
            style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            disabled={submitting}
            onPress={handleConfirm}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <AppText style={styles.primaryButtonText}>Confirm & Register</AppText>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 8,
  },
  bannerCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    minHeight: 140,
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
    paddingRight: 70,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  bannerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerMetaText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bannerFeeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bannerTrophyContainer: {
    position: 'absolute',
    right: 6,
    bottom: -4,
    width: 105,
    height: 115,
    zIndex: 1,
  },
  bannerTrophyImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 32,
  },
  walletIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  walletSub: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkRadioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
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
