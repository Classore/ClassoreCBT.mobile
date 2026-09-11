import React, { useState, useEffect } from 'react';
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
import { ServiceBundle } from '@/services/payment';

export default function BundleDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bundle_id?: string;
    bundle_name?: string;
    token_cost?: string;
    billing_type?: string;
    bundle_data?: string;
    is_individual_service?: string;
  }>();
  const { user } = useAuth();

  const [bundle, setBundle] = useState<ServiceBundle | null>(null);

  useEffect(() => {
    if (params.bundle_data) {
      try {
        setBundle(JSON.parse(params.bundle_data));
      } catch (e) {
        console.warn('Could not parse bundle_data:', e);
      }
    }
  }, [params.bundle_data]);

  const bundleName = params.bundle_name || bundle?.name || 'IELTS Bundle';
  const tokenCost = params.token_cost ? Number(params.token_cost) : (bundle?.token_cost || 100);
  const billingType = params.billing_type || bundle?.billing_type || 'monthly';
  const isJamb = bundleName.toLowerCase().includes('jamb');
  const walletBalance = user?.token_balance ?? 0;

  const handleContinue = () => {
    router.push({
      pathname: '/(tabs)/bundles/payment',
      params: {
        bundle_id: params.bundle_id || '2',
        bundle_name: bundleName,
        token_cost: String(tokenCost),
        billing_type: billingType,
        bundle_data: params.bundle_data,
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/bundles' as any))}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bundles</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak ?? 0}</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Hero Bundle Card */}
          <View style={[styles.heroCard, isJamb ? styles.jambHeroCard : styles.ieltsHeroCard]}>
            <View style={styles.heroLeftRow}>
              <View style={[styles.iconBox, isJamb ? styles.jambIconBox : styles.ieltsIconBox]}>
                <Image
                  source={
                    isJamb
                      ? require('../../../../assets/images/jamb-logo.png')
                      : require('../../../../assets/images/ielts-logo.png')
                  }
                  style={styles.heroLogo}
                  contentFit="contain"
                />
              </View>
              <View>
                <Text style={styles.heroBundleTitle}>{bundleName}</Text>
                <Text style={styles.heroBundleCost}>
                  {tokenCost} tokens / {billingType === 'yearly' ? 'year' : 'month'}
                </Text>
              </View>
            </View>

            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
          </View>

          {/* What's Included Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>What's included</Text>

            {isJamb ? (
              <>
                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <Feather name="book" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>English Language</Text>
                    <Text style={styles.itemSubtitle}>Unlimited practice</Text>
                  </View>
                  <Text style={styles.infinityText}>∞</Text>
                </View>

                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="calculator-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>Mathematics</Text>
                    <Text style={styles.itemSubtitle}>Unlimited practice</Text>
                  </View>
                  <Text style={styles.infinityText}>∞</Text>
                </View>

                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="activity" size={18} color="#D97706" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>Biology & Chemistry</Text>
                    <Text style={styles.itemSubtitle}>Unlimited practice</Text>
                  </View>
                  <Text style={styles.infinityText}>∞</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <Feather name="headphones" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>Listening</Text>
                    <Text style={styles.itemSubtitle}>Unlimited practice</Text>
                  </View>
                  <Text style={styles.infinityText}>∞</Text>
                </View>

                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="book-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>Reading</Text>
                    <Text style={styles.itemSubtitle}>Unlimited practice</Text>
                  </View>
                  <Text style={styles.infinityText}>∞</Text>
                </View>

                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#FFE4E6' }]}>
                    <Feather name="mic" size={18} color="#E11D48" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>Speaking</Text>
                    <Text style={styles.itemSubtitle}>Up to 3 assessments</Text>
                  </View>
                  <Text style={styles.leftCountText}>4 left</Text>
                </View>

                <View style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: '#EDE9FE' }]}>
                    <Feather name="edit-2" size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>Writing</Text>
                    <Text style={styles.itemSubtitle}>Up to 3 assessments</Text>
                  </View>
                  <Text style={styles.leftCountText}>4 left</Text>
                </View>
              </>
            )}
          </View>

          {/* Duration Info Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>Duration Info</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>30 Days</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Billing Type</Text>
              <Text style={styles.infoValue}>Monthly</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Auto-renewal</Text>
              <Text style={styles.infoValue}>Yes</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.infoLabel}>Tokens Required</Text>
              <View style={styles.tokensValueRow}>
                <Text style={styles.infoValue}>{tokenCost}</Text>
                <View style={styles.tokenCoin}>
                  <Text style={styles.tokenCoinSymbol}>₦</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Your Wallet Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletLeft}>
              <View style={styles.walletIconBox}>
                <Ionicons name="wallet" size={20} color="#6D28D9" />
              </View>
              <Text style={styles.walletTitle}>Your Wallet</Text>
            </View>
            <Text style={styles.walletBalanceText}>{walletBalance} tokens available</Text>
          </View>

          {/* Spacing for button */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Sticky Continue CTA */}
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
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
    paddingTop: 8,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  ieltsHeroCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  jambHeroCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  heroLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ieltsIconBox: {
    backgroundColor: '#FFE4E6',
  },
  jambIconBox: {
    backgroundColor: '#DCFCE7',
  },
  heroLogo: {
    width: 32,
    height: 32,
  },
  heroBundleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  heroBundleCost: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  bestValueBadge: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  includedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infinityText: {
    fontSize: 22,
    color: '#7C3AED',
    fontWeight: '600',
  },
  leftCountText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  tokensValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenCoin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FBBF24',
    borderWidth: 1,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tokenCoinSymbol: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconBox: {
    marginRight: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  walletBalanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 70 : 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  continueButton: {
    backgroundColor: '#5B21B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
