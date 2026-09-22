import React, { useState, useEffect, useRef } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { paymentService, ServiceBundle, TokenPackage } from '@/services/payment';

const FALLBACK_TOKEN_PACKAGES: TokenPackage[] = [
  { id: 22, name: 'Starter Pack', price: '1000.00', currency: '₦', base_tokens: 10, bonus_tokens: 0, is_active: true },
  { id: 23, name: 'Value Pack', price: '2500.00', currency: '₦', base_tokens: 25, bonus_tokens: 0, is_active: true },
  { id: 24, name: 'Pro Pack', price: '5000.00', currency: '₦', base_tokens: 50, bonus_tokens: 0, is_active: true },
  { id: 25, name: 'Ultimate Pack', price: '10000.00', currency: '₦', base_tokens: 100, bonus_tokens: 0, is_active: true },
];

export default function BundlePaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bundle_id?: string;
    bundle_name?: string;
    token_cost?: string;
    billing_type?: string;
    bundle_data?: string;
    selected_service_ids?: string;
    auto_deduct?: string;
    from_topup?: string;
  }>();

  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [activatingAutoDeduct, setActivatingAutoDeduct] = useState(false);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>(FALLBACK_TOKEN_PACKAGES);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const autoDeductTriggeredRef = useRef(false);

  let bundle: ServiceBundle | null = null;
  if (params.bundle_data) {
    try {
      bundle = JSON.parse(params.bundle_data);
    } catch (e) {
      console.warn('Could not parse bundle_data in payment screen:', e);
    }
  }

  const selectedServiceIds: number[] = params.selected_service_ids
    ? (() => {
        try {
          return JSON.parse(params.selected_service_ids);
        } catch {
          return [];
        }
      })()
    : [];

  const bundleName = params.bundle_name || bundle?.name || 'IELTS Bundle';
  const tokenCost = params.token_cost ? Number(params.token_cost) : (bundle?.token_cost || 100);
  const billingType = params.billing_type || bundle?.billing_type || 'monthly';
  const isJamb = bundleName.toLowerCase().includes('jamb');

  // Filter selected services from bundle's included_services
  const selectedServices = (bundle?.included_services || [])
    .filter((item) => selectedServiceIds.includes(item.service.id))
    .map((item) => item.service);

  const hasBalance = user?.token_balance !== undefined;
  const walletBalance = user?.token_balance ?? 0;
  const remainingBalance = walletBalance - tokenCost;
  const hasSufficientTokens = hasBalance ? walletBalance >= tokenCost : true;
  const shortfall = Math.max(0, tokenCost - walletBalance);

  // Proactively refresh user balance and pre-fetch token packages on load
  useEffect(() => {
    refreshUser().catch(() => {});

    setLoadingPackages(true);
    paymentService.getTokenPackages()
      .then((packs) => {
        const active = packs.filter((p) => p.is_active);
        if (active.length > 0) {
          setTokenPackages(active);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPackages(false));
  }, []);

  // Handle return from Top-Up: automatically deduct tokens and activate package if requested
  useEffect(() => {
    if (params.auto_deduct === 'true' && !autoDeductTriggeredRef.current) {
      const executeAutoDeduct = async () => {
        const updated = await refreshUser().catch(() => null);
        const currentBal = updated?.token_balance ?? user?.token_balance ?? 0;

        if (currentBal >= tokenCost) {
          autoDeductTriggeredRef.current = true;
          setActivatingAutoDeduct(true);
          try {
            const bundleId = params.bundle_id ? Number(params.bundle_id) : (bundle?.id || 18);
            await paymentService.purchaseBundle(
              bundleId,
              selectedServiceIds.length > 0 ? selectedServiceIds : undefined
            );
            await refreshUser();
            router.replace({
              pathname: '/(tabs)/bundles/success',
              params: {
                bundle_id: String(bundleId),
                bundle_name: bundleName,
                token_cost: String(tokenCost),
                billing_type: billingType,
                bundle_data: params.bundle_data,
                selected_service_ids: params.selected_service_ids,
              },
            });
          } catch (err: any) {
            console.error('Auto-deduct bundle purchase failed:', err);
            const errorMsg =
              err?.response?.data?.error ||
              err?.response?.data?.detail ||
              err?.message ||
              'Your tokens were credited, but activating the bundle encountered an error. Please tap Confirm Purchase below.';
            Alert.alert('Activation Status', errorMsg);
          } finally {
            setActivatingAutoDeduct(false);
          }
        } else if (params.from_topup === 'true') {
          const neededStill = tokenCost - currentBal;
          Alert.alert(
            'Additional Tokens Required',
            `Your wallet now has ${currentBal.toLocaleString()} tokens. You still need ${neededStill.toLocaleString()} more tokens to activate ${bundleName}.`
          );
        }
      };

      executeAutoDeduct();
    }
  }, [params.auto_deduct, user?.token_balance]);

  const handleConfirmPurchase = async () => {
    if (hasBalance && !hasSufficientTokens) {
      setShowTopUpModal(true);
      return;
    }

    // Validate customizable bundle has services
    if (bundle?.is_customizable && bundle.customization_limit) {
      if (selectedServiceIds.length !== bundle.customization_limit) {
        Alert.alert(
          'Missing Subjects',
          `This bundle requires ${bundle.customization_limit} subjects. Please go back and select your subjects.`,
          [{ text: 'Go Back', onPress: () => router.back() }]
        );
        return;
      }
    }

    try {
      setLoading(true);
      const bundleId = params.bundle_id ? Number(params.bundle_id) : (bundle?.id || 18);

      await paymentService.purchaseBundle(
        bundleId,
        selectedServiceIds.length > 0 ? selectedServiceIds : undefined
      );

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
          selected_service_ids: params.selected_service_ids,
        },
      });
    } catch (error: any) {
      console.error('Purchase bundle failed:', error);
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to complete bundle purchase.';
      Alert.alert('Purchase Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToBuyTokens = (pack?: TokenPackage) => {
    setShowTopUpModal(false);
    const bundleId = params.bundle_id ? Number(params.bundle_id) : (bundle?.id || 18);

    // Pick chosen package or find first package covering shortfall
    const chosen =
      pack ||
      (tokenPackages.length > 0
        ? tokenPackages.find((p) => p.base_tokens >= shortfall) || tokenPackages[tokenPackages.length - 1]
        : FALLBACK_TOKEN_PACKAGES[0]);

    router.push({
      pathname: '/buy-tokens',
      params: {
        packId: String(chosen.id),
        packName: chosen.name,
        tokens: `${chosen.base_tokens.toLocaleString()} Tokens`,
        price: `${chosen.currency}${parseFloat(chosen.price).toLocaleString()}`,
        return_to: '/(tabs)/bundles/payment',
        for_bundle: 'true',
        auto_deduct: 'true',
        bundle_id: String(bundleId),
        bundle_name: bundleName,
        token_cost: String(tokenCost),
        billing_type: billingType,
        bundle_data: params.bundle_data,
        selected_service_ids: params.selected_service_ids,
      },
    });
  };

  const handleBrowseAllPackages = () => {
    setShowTopUpModal(false);
    const bundleId = params.bundle_id ? Number(params.bundle_id) : (bundle?.id || 18);
    router.push({
      pathname: '/token-packages',
      params: {
        return_to: '/(tabs)/bundles/payment',
        for_bundle: 'true',
        auto_deduct: 'true',
        bundle_id: String(bundleId),
        bundle_name: bundleName,
        token_cost: String(tokenCost),
        billing_type: billingType,
        bundle_data: params.bundle_data,
        selected_service_ids: params.selected_service_ids,
      },
    });
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bundles' as any);
    }
  };

  const renderServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('english')) return <Feather name="book" size={16} color="#2563EB" />;
    if (lower.includes('math')) return <Ionicons name="calculator-outline" size={16} color="#10B981" />;
    if (lower.includes('bio')) return <Feather name="activity" size={16} color="#059669" />;
    if (lower.includes('chem')) return <Ionicons name="flask-outline" size={16} color="#D97706" />;
    if (lower.includes('phys')) return <Feather name="zap" size={16} color="#7C3AED" />;
    return <Feather name="layers" size={16} color="#6D28D9" />;
  };

  const getServiceIconBg = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('english')) return '#DBEAFE';
    if (lower.includes('math')) return '#DCFCE7';
    if (lower.includes('bio')) return '#D1FAE5';
    if (lower.includes('chem')) return '#FEF3C7';
    if (lower.includes('phys')) return '#EDE9FE';
    return '#F3E8FF';
  };

  return (
    <AppSafeArea style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Confirm Payment</Text>
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

          {/* Insufficient Balance Notice Card */}
          {!hasSufficientTokens && (
            <View style={styles.insufficientCard}>
              <View style={styles.insufficientHeaderRow}>
                <View style={styles.insufficientIconBox}>
                  <Feather name="alert-triangle" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insufficientTitle}>Insufficient Token Balance</Text>
                  <Text style={styles.insufficientSubtitle}>
                    You have <Text style={{ fontWeight: '700', color: '#111827' }}>{walletBalance.toLocaleString()}</Text> tokens, but need <Text style={{ fontWeight: '700', color: '#111827' }}>{tokenCost.toLocaleString()}</Text> tokens. You need <Text style={{ fontWeight: '700', color: '#B45309' }}>{shortfall.toLocaleString()} more tokens</Text> to activate this bundle.
                  </Text>
                </View>
              </View>

              {/* 2-Step Flow Indicator */}
              <View style={styles.stepsContainer}>
                <View style={[styles.stepPill, styles.stepPillActive]}>
                  <Text style={styles.stepPillNumberActive}>1</Text>
                  <Text style={styles.stepPillTextActive}>Top Up ({shortfall} tokens)</Text>
                </View>
                <Feather name="arrow-right" size={14} color="#9CA3AF" style={{ marginHorizontal: 6 }} />
                <View style={styles.stepPill}>
                  <Text style={styles.stepPillNumber}>2</Text>
                  <Text style={styles.stepPillText}>Pay & Activate Bundle</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.insufficientActionBtn}
                onPress={() => setShowTopUpModal(true)}
                activeOpacity={0.85}
              >
                <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.insufficientActionBtnText}>
                  Top Up Tokens to Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Subjects Card (for customizable bundles) */}
          {bundle?.is_customizable && selectedServices.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Selected Subjects</Text>
                <View style={styles.counterBadgeSuccess}>
                  <Text style={styles.counterBadgeTextSuccess}>
                    {selectedServices.length} Selected
                  </Text>
                </View>
              </View>

              {selectedServices.map((service) => (
                <View key={service.id} style={styles.selectedSubjectRow}>
                  <View
                    style={[
                      styles.subjectIconBox,
                      { backgroundColor: getServiceIconBg(service.name) },
                    ]}
                  >
                    {renderServiceIcon(service.name)}
                  </View>
                  <Text style={styles.selectedSubjectName}>{service.name}</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              ))}
            </View>
          )}

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
              <Text style={styles.summaryValue}>
                {hasBalance ? walletBalance.toLocaleString() : '...'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', color: '#111827' }]}>
                You will pay
              </Text>
              <Text style={styles.youPayValue}>-{tokenCost.toLocaleString()}</Text>
            </View>

            <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', color: '#111827' }]}>
                Remaining Balance
              </Text>
              {hasSufficientTokens ? (
                <Text style={styles.remainingBalanceValue}>
                  {hasBalance ? remainingBalance.toLocaleString() : '...'}
                </Text>
              ) : (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.remainingBalanceValue, { color: '#EF4444' }]}>
                    {shortfall.toLocaleString()} short
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTopUpModal(true)}
                    activeOpacity={0.7}
                    style={styles.topUpLinkPill}
                  >
                    <Text style={styles.topUpLinkPillText}>+ Top Up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            <View style={[styles.paymentMethodCard, !hasSufficientTokens && styles.paymentMethodCardWarning]}>
              <View style={styles.paymentMethodLeft}>
                <View style={[styles.methodIconBox, !hasSufficientTokens && { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="wallet" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.methodTitle}>
                    Wallet Balance {!hasSufficientTokens && '(Insufficient)'}
                  </Text>
                  <Text style={[styles.methodSubtitle, !hasSufficientTokens && { color: '#B45309', fontWeight: '500' }]}>
                    {hasBalance
                      ? hasSufficientTokens
                        ? `${walletBalance.toLocaleString()} tokens available`
                        : `${walletBalance.toLocaleString()} available • Need ${shortfall.toLocaleString()} more`
                      : 'Updating balance...'}
                  </Text>
                </View>
              </View>

              {hasSufficientTokens ? (
                <Ionicons name="checkmark-circle" size={24} color="#5B21B6" />
              ) : (
                <TouchableOpacity
                  style={styles.topUpSmallBtn}
                  onPress={() => setShowTopUpModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.topUpSmallBtnText}>Top Up</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Info Notice Box */}
          <View
            style={[
              styles.infoNoticeBox,
              !hasSufficientTokens && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
            ]}
          >
            <View
              style={[
                styles.infoIconCircle,
                !hasSufficientTokens && { backgroundColor: '#D97706' },
              ]}
            >
              <Feather name={hasSufficientTokens ? "info" : "alert-circle"} size={16} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.infoNoticeText,
                !hasSufficientTokens && { color: '#92400E' },
              ]}
            >
              {hasSufficientTokens
                ? 'Tokens will be deducted from your wallet instantly to activate this bundle.'
                : `Top up your tokens first. Once topped up, ${tokenCost} tokens will be deducted to activate your bundle.`}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !hasSufficientTokens && styles.topUpPrimaryButton,
                loading && { opacity: 0.7 },
              ]}
              onPress={hasSufficientTokens ? handleConfirmPurchase : () => setShowTopUpModal(true)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : hasSufficientTokens ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="plus-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmButtonText}>
                    Buy Tokens First ({shortfall.toLocaleString()} needed)
                  </Text>
                </View>
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

      {/* Quick Top-Up Selection Modal */}
      <Modal
        visible={showTopUpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTopUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Top Up Tokens</Text>
                <Text style={styles.modalSubtitle}>
                  Choose a package to get tokens for {bundleName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTopUpModal(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Shortfall Banner in Modal */}
            <View style={styles.modalShortfallCard}>
              <View style={styles.modalShortfallLeft}>
                <Text style={styles.modalShortfallLabel}>Needed Tokens</Text>
                <Text style={styles.modalShortfallAmount}>{shortfall.toLocaleString()} Tokens</Text>
              </View>
              <View style={styles.modalShortfallRight}>
                <Text style={styles.modalShortfallSub}>
                  Bundle Cost: {tokenCost} • Balance: {walletBalance}
                </Text>
              </View>
            </View>

            {/* Packages List */}
            <ScrollView style={styles.modalPackagesScroll} showsVerticalScrollIndicator={false}>
              {loadingPackages ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                </View>
              ) : (
                tokenPackages.map((pack) => {
                  const isRecommended =
                    pack.base_tokens >= shortfall &&
                    !tokenPackages.some(
                      (p) => p.base_tokens >= shortfall && p.base_tokens < pack.base_tokens
                    );

                  return (
                    <TouchableOpacity
                      key={pack.id}
                      style={[
                        styles.modalPackItem,
                        isRecommended && styles.modalPackItemRecommended,
                      ]}
                      onPress={() => handleProceedToBuyTokens(pack)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.modalPackIconBox}>
                        <Ionicons name="wallet-outline" size={22} color="#7C3AED" />
                      </View>

                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.modalPackName}>{pack.name}</Text>
                          {isRecommended && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedBadgeText}>Recommended</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.modalPackTokens}>
                          {pack.base_tokens.toLocaleString()} Tokens
                          {pack.bonus_tokens > 0 && ` (+${pack.bonus_tokens} bonus)`}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.modalPackPrice}>
                          {pack.currency}
                          {parseFloat(pack.price).toLocaleString()}
                        </Text>
                        <View style={styles.selectArrowPill}>
                          <Text style={styles.selectArrowText}>Select</Text>
                          <Feather name="chevron-right" size={14} color="#7C3AED" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Browse all packages button */}
            <TouchableOpacity
              style={styles.browseAllBtn}
              onPress={handleBrowseAllPackages}
              activeOpacity={0.8}
            >
              <Text style={styles.browseAllBtnText}>Browse All Token Packages</Text>
              <Feather name="arrow-right" size={16} color="#7C3AED" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Activating Bundle Overlay Modal */}
      <Modal visible={activatingAutoDeduct} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#7C3AED" style={{ marginBottom: 16 }} />
            <Text style={styles.loadingTitle}>Tokens Credited!</Text>
            <Text style={styles.loadingSubtitle}>
              Deducting {tokenCost} tokens to activate {bundleName}...
            </Text>
          </View>
        </View>
      </Modal>
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
  insufficientCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  insufficientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insufficientIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insufficientTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  insufficientSubtitle: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepPillActive: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepPillNumberActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 5,
  },
  stepPillTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  stepPillNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginRight: 5,
  },
  stepPillText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  insufficientActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
  },
  insufficientActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  counterBadgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  counterBadgeTextSuccess: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  subjectIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedSubjectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
  topUpLinkPill: {
    marginTop: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topUpLinkPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
  paymentMethodCardWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  topUpSmallBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  topUpSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  topUpPrimaryButton: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalShortfallCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  modalShortfallLeft: {
    flex: 1,
  },
  modalShortfallLabel: {
    fontSize: 12,
    color: '#6D28D9',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalShortfallAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5B21B6',
    marginTop: 2,
  },
  modalShortfallRight: {
    alignItems: 'flex-end',
  },
  modalShortfallSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalPackagesScroll: {
    maxHeight: 320,
    marginBottom: 14,
  },
  modalPackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  modalPackItemRecommended: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  modalPackIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalPackName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  recommendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  modalPackTokens: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  modalPackPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  selectArrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  selectArrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  browseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  browseAllBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  // Full screen loading overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
});
