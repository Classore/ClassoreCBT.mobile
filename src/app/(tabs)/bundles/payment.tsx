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
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/payment';

export default function BundlePaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bundle_id?: string;
    bundle_name?: string;
    token_cost?: string;
    billing_type?: string;
    bundle_data?: string;
  }>();

  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const bundleName = params.bundle_name || 'IELTS Bundle';
  const tokenCost = params.token_cost ? Number(params.token_cost) : 100;
  const billingType = params.billing_type || 'monthly';
  const isJamb = bundleName.toLowerCase().includes('jamb');

  const hasBalance = user?.token_balance !== undefined;
  const walletBalance = user?.token_balance ?? 0;
  const remainingBalance = walletBalance - tokenCost;
  const hasSufficientTokens = hasBalance ? walletBalance >= tokenCost : true;

  const handleConfirmPurchase = async () => {
    if (hasBalance && !hasSufficientTokens) {
      Alert.alert(
        'Insufficient Tokens',
        `You need ${tokenCost} tokens to activate this bundle, but your current balance is ${walletBalance} tokens. Would you like to buy more tokens?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Tokens', onPress: () => router.push('/buy-tokens') }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      const bundleId = params.bundle_id ? Number(params.bundle_id) : 2;
      const res = await paymentService.purchaseBundle(bundleId);
      
      // Refresh user to update token_balance across the app
      await refreshUser();

      // Navigate to Payment Successful screen
      router.replace({
        pathname: '/(tabs)/bundles/success',
        params: {
          bundle_id: String(bundleId),
          bundle_name: bundleName,
          token_cost: String(tokenCost),
          billing_type: billingType,
          bundle_data: params.bundle_data,
        }
      });
    } catch (error: any) {
      console.error('Purchase bundle failed:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to complete bundle purchase.';
      Alert.alert('Purchase Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bundles' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🔥</Text>
            <Text style={styles.streakText}>{user?.streak ?? 0}</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Bundle Summary Card */}
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
          </View>

          {/* Payment Summary Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>Payment Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bundle Price</Text>
              <View style={styles.tokensValueRow}>
                <Text style={styles.summaryValue}>{tokenCost}</Text>
                <View style={styles.tokenCoin}>
                  <Text style={styles.tokenCoinSymbol}>₦</Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Your Wallet Balance</Text>
              <Text style={styles.summaryValue}>{hasBalance ? walletBalance.toLocaleString() : '...'}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', color: '#111827' }]}>You will pay</Text>
              <Text style={styles.youPayValue}>-{tokenCost.toLocaleString()}</Text>
            </View>

            <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', color: '#111827' }]}>Remaining Balance</Text>
              <Text style={[styles.remainingBalanceValue, remainingBalance < 0 && { color: '#EF4444' }]}>
                {hasBalance ? remainingBalance.toLocaleString() : '...'}
              </Text>
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodLeft}>
                <View style={styles.methodIconBox}>
                  <Ionicons name="wallet" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.methodTitle}>Wallet Balance</Text>
                  <Text style={styles.methodSubtitle}>
                    {hasBalance ? `${walletBalance.toLocaleString()} tokens available` : 'Updating balance...'}
                  </Text>
                </View>
              </View>

              <Ionicons name="checkmark-circle" size={24} color="#5B21B6" />
            </View>
          </View>

          {/* Info Notice Box */}
          <View style={styles.infoNoticeBox}>
            <View style={styles.infoIconCircle}>
              <Feather name="info" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.infoNoticeText}>
              Tokens will be deducted from your wallet instantly to activate this bundle.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, loading && { opacity: 0.7 }]}
              onPress={handleConfirmPurchase}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Clearance for tab bar */}
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
    paddingTop: 8,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  youPayValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  remainingBalanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5B21B6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  infoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5B21B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#5B21B6',
    lineHeight: 18,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  confirmButton: {
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
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5B21B6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#5B21B6',
    fontSize: 16,
    fontWeight: '700',
  },
});
