import React, { useState } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentService } from '@/services/payment';
import { useAuth } from '@/context/AuthContext';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { RNIap } from '@/utils/iap';
import { Modal } from 'react-native';
import { useNotifications } from '@/context/NotificationContext';

export default function BuyTokensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    packId?: string;
    packName?: string;
    tokens?: string;
    price?: string;
    return_to?: string;
    for_bundle?: string;
    auto_deduct?: string;
    bundle_id?: string;
    bundle_name?: string;
    token_cost?: string;
    billing_type?: string;
    bundle_data?: string;
    selected_service_ids?: string;
    from_topup?: string;
  }>();
  const { user, refreshUser } = useAuth();
  const { hasUnread } = useNotifications();

  const [selectedPayment, setSelectedPayment] = useState<'paystack' | 'applepay'>(
    Platform.OS === 'ios' ? 'applepay' : 'paystack'
  );
  const [customAmount, setCustomAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState('₦1,000');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const navigateAfterSuccess = async () => {
    await refreshUser().catch(() => {});
    if (params.return_to) {
      router.replace({
        pathname: params.return_to as any,
        params: {
          auto_deduct: params.auto_deduct || 'true',
          bundle_id: params.bundle_id,
          bundle_name: params.bundle_name,
          token_cost: params.token_cost,
          billing_type: params.billing_type,
          bundle_data: params.bundle_data,
          selected_service_ids: params.selected_service_ids,
          from_topup: 'true',
        },
      });
    } else {
      router.replace('/wallet');
    }
  };

  // If packId wasn't passed directly, auto-resolve package based on needed tokens
  React.useEffect(() => {
    if (!params.packId) {
      paymentService.getTokenPackages().then((packs) => {
        const active = packs.filter((p) => p.is_active);
        if (active.length > 0) {
          const needed = params.token_cost ? Number(params.token_cost) : 0;
          const matched =
            (needed > 0 ? active.find((p) => p.base_tokens >= needed) : null) || active[0];
          router.setParams({
            packId: String(matched.id),
            packName: matched.name,
            tokens: `${matched.base_tokens.toLocaleString()} Tokens`,
            price: `${matched.currency}${parseFloat(matched.price).toLocaleString()}`,
          });
        }
      }).catch(console.warn);
    }
  }, [params.packId, params.token_cost]);

  React.useEffect(() => {
    // Proactively refresh latest token balance
    refreshUser().catch(console.warn);

    if (Platform.OS !== 'ios') {
      return;
    }

    // Initialize IAP connection on iOS
    RNIap.initConnection().catch(console.warn);

    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase: any) => {
      try {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          setLoading(true);
          const data = await paymentService.verifyAppleIAP(purchase.transactionId || receipt);
          Alert.alert(
            'Success',
            params.return_to
              ? 'Token purchase successful! Returning to activate your bundle...'
              : data.message || 'Token purchase completed successfully!',
            [
              {
                text: params.return_to ? 'Activate Bundle' : 'View Wallet',
                onPress: () => {
                  navigateAfterSuccess();
                },
              },
            ]
          );
          await RNIap.finishTransaction({ purchase, isConsumable: true });
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to verify purchase.');
      } finally {
        setLoading(false);
      }
    });

    const purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
      console.log('purchaseErrorListener', error);
      if (error?.code !== 'E_USER_CANCELLED') {
        setErrorMessage(error.message || 'Purchase error occurred.');
      }
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
      RNIap.endConnection();
    };
  }, []);

  const quickAmounts = ['₦1,000', '₦2,500', '₦5,000', '₦10,000'];

  const handleProceed = async () => {
    setErrorMessage(null);
    if (!params.packId) {
      setErrorMessage('Please select a package first.');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'ios') {
        const productId = `com.classorecbt.tokens.${params.packId}`;
        const products = await (RNIap as any).getProducts({ skus: [productId] });
        if (products && products.length > 0) {
          await (RNIap as any).requestPurchase({ sku: productId });
        } else {
          setErrorMessage('Product not found on the App Store.');
        }
      } else {
        // Paystack on Android and Web
        const data = await paymentService.initializePaystack(Number(params.packId));
        if (data.authorization_url) {
          setPaymentUrl(data.authorization_url);
          if (Platform.OS === 'web') {
            try {
              window.open(data.authorization_url, '_blank');
            } catch {
              await WebBrowser.openBrowserAsync(data.authorization_url);
            }
          }
          setShowWebView(true);
        } else {
          setErrorMessage('No authorization URL returned from server.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to initialize payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebPaymentDone = async () => {
    setLoading(true);
    try {
      await refreshUser();
      setShowWebView(false);
      navigateAfterSuccess();
    } catch (err: any) {
      console.error(err);
      setShowWebView(false);
      navigateAfterSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleReopenPayment = async () => {
    if (paymentUrl) {
      if (Platform.OS === 'web') {
        try {
          window.open(paymentUrl, '_blank');
        } catch {
          await WebBrowser.openBrowserAsync(paymentUrl);
        }
      } else {
        Linking.openURL(paymentUrl);
      }
    }
  };

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
          <Text style={styles.headerTitle}>Buy Token</Text>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color="#111827" />
            {hasUnread && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top-up Context Banner when purchasing for a bundle */}
          {params.for_bundle === 'true' && (
            <View style={styles.bundleContextCard}>
              <View style={styles.bundleContextIcon}>
                <Feather name="shopping-bag" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bundleContextTitle}>
                  Top-Up for {params.bundle_name || 'Bundle'}
                </Text>
                <Text style={styles.bundleContextSubtitle}>
                  You need {params.token_cost || 0} tokens. After purchase, you will return directly to activate your bundle.
                </Text>
              </View>
            </View>
          )}

          {/* Current Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <View style={styles.balanceRow}>
              <Image 
                source={require('../../assets/images/naira-token-coin.png')} 
                style={styles.coinImageSmall} 
                contentFit="contain" 
              />
              {user?.token_balance !== undefined ? (
                <Text style={styles.balanceNumber}>{user.token_balance.toLocaleString()}</Text>
              ) : (
                <ActivityIndicator size="small" color="#6D28D9" style={{ marginHorizontal: 8 }} />
              )}
            </View>
          </View>

          {/* 1. Choose a Token Package */}
          <Text style={styles.sectionHeader}>1. Choose a Token Package</Text>
          <TouchableOpacity 
            style={styles.packageSelectorCard}
            onPress={() =>
              router.push({
                pathname: '/token-packages',
                params: params.return_to
                  ? {
                      return_to: params.return_to,
                      for_bundle: params.for_bundle,
                      auto_deduct: params.auto_deduct,
                      bundle_id: params.bundle_id,
                      bundle_name: params.bundle_name,
                      token_cost: params.token_cost,
                      billing_type: params.billing_type,
                      bundle_data: params.bundle_data,
                      selected_service_ids: params.selected_service_ids,
                    }
                  : {},
              })
            }
            activeOpacity={0.8}
          >
            <View style={styles.packageIconBg}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.packageInfo}>
              <Text style={styles.packageName}>{(params.packName as string) || 'Starter Pack'}</Text>
              <Text style={styles.packageTokens}>{(params.tokens as string) || '10 Tokens'}</Text>
            </View>
            <View style={styles.packagePriceRow}>
              <Text style={styles.packagePrice}>{(params.price as string) || '₦1,000'}</Text>
              <Feather name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* 2. Select Payment Method */}
          <Text style={styles.sectionHeader}>2. Select Payment Method</Text>
          <View style={styles.paymentMethodsList}>
            {Platform.OS === 'ios' ? (
              /* Apple In-App Purchase (iOS only) */
              <TouchableOpacity 
                style={[
                  styles.paymentOptionCard, 
                  styles.paymentOptionCardSelected
                ]}
                onPress={() => setSelectedPayment('applepay')}
                activeOpacity={0.8}
              >
                <Image 
                  source={require('../../assets/images/apple-pay-logo.png')} 
                  style={styles.paymentLogoImage} 
                  contentFit="contain" 
                />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>
                    Apple In-App Purchase <Text style={styles.paymentSub}>(Apple Pay, App Store)</Text>
                  </Text>
                </View>
                <View style={[styles.radioCircle, styles.radioCircleSelected]}>
                  <View style={styles.radioDot} />
                </View>
              </TouchableOpacity>
            ) : (
              /* Paystack (Android & Web) */
              <TouchableOpacity 
                style={[
                  styles.paymentOptionCard, 
                  styles.paymentOptionCardSelected
                ]}
                onPress={() => setSelectedPayment('paystack')}
                activeOpacity={0.8}
              >
                <Image 
                  source={require('../../assets/images/paystack-logo.png')} 
                  style={styles.paymentLogoImage} 
                  contentFit="contain" 
                />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>
                    Paystack <Text style={styles.paymentSub}>(Cards, Bank Transfer, USSD)</Text>
                  </Text>
                </View>
                <View style={[styles.radioCircle, styles.radioCircleSelected]}>
                  <View style={styles.radioDot} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. Enter Amount (Optional) - Temporarily commented out
          <Text style={styles.sectionHeader}>3. Enter Amount (Optional)</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount in ₦"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
          </View>

          <View style={styles.quickAmountsRow}>
            {quickAmounts.map((amt) => {
              const isSelected = selectedQuickAmount === amt && !customAmount;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmountPill, isSelected && styles.quickAmountPillSelected]}
                  onPress={() => {
                    setSelectedQuickAmount(amt);
                    setCustomAmount('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                    {amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          */}

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>You will receive</Text>
              <View style={styles.receiveValueRow}>
                <Image 
                  source={require('../../assets/images/naira-token-coin.png')} 
                  style={styles.coinImageTiny} 
                  contentFit="contain" 
                />
                <Text style={styles.receiveTokensText}>{(params.tokens as string) || '1,000 Tokens'}</Text>
              </View>
            </View>

            <View style={[styles.summaryCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.totalAmountText}>{(params.price as string) || '₦1,000.00'}</Text>
            </View>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Proceed Button */}
          <TouchableOpacity 
            style={styles.proceedButton}
            onPress={handleProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Payment WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <AppSafeArea style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowWebView(false)}>
              <Feather name="x" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {Platform.OS === 'web' ? (
            <View style={styles.webPaymentWrapper}>
              <View style={styles.webPaymentCard}>
                <View style={styles.webPaymentIconCircle}>
                  <Feather name="external-link" size={36} color="#7C3AED" />
                </View>
                <Text style={styles.webPaymentHeading}>Payment Window Opened</Text>
                <Text style={styles.webPaymentSubheading}>
                  We opened the payment gateway in a separate tab or window. Once you have completed the transaction there, click below to verify and return to your wallet.
                </Text>

                <TouchableOpacity
                  style={styles.webConfirmButton}
                  onPress={handleWebPaymentDone}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.webConfirmButtonText}>I Have Completed Payment</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.webReopenButton}
                  onPress={handleReopenPayment}
                  activeOpacity={0.8}
                >
                  <Feather name="external-link" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                  <Text style={styles.webReopenButtonText}>Reopen Payment Window</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.webCancelButton}
                  onPress={() => setShowWebView(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.webCancelButtonText}>Cancel Transaction</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={(navState) => {
                if (navState.url.includes('/success') || navState.url.includes('/verify') || navState.url.includes('/callback')) {
                  // If it hits a success callback URL
                  setShowWebView(false);
                  Alert.alert(
                    'Success',
                    params.return_to
                      ? 'Token purchase completed! Returning to activate your bundle...'
                      : 'Payment completed successfully!',
                    [
                      {
                        text: params.return_to ? 'Activate Bundle' : 'View Wallet',
                        onPress: () => {
                          navigateAfterSuccess();
                        },
                      },
                    ]
                  );
                } else if (navState.url.includes('/cancel')) {
                  setShowWebView(false);
                  Alert.alert('Cancelled', 'Payment was cancelled.');
                }
              }}
              startInLoadingState={true}
              renderLoading={() => <ActivityIndicator size="large" color="#7C3AED" style={{ flex: 1, justifyContent: 'center' }} />}
            />
          )}
        </AppSafeArea>
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
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Balance Card
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImageSmall: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  coinImageTiny: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  balanceNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    marginTop: 4,
  },

  // 1. Package Selector
  packageSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    marginBottom: 20,
  },
  packageIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  packageTokens: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },

  // 2. Payment Methods
  paymentMethodsList: {
    gap: 10,
    marginBottom: 20,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  paymentOptionCardSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
  },
  paymentLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  paymentSub: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#7C3AED',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },

  // 3. Amount Inputs
  amountInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  amountInput: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAmountPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  quickAmountPillSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  quickAmountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  quickAmountTextSelected: {
    color: '#7C3AED',
  },

  // Summary Box
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  receiveValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiveTokensText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  totalAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },

  // Proceed Button
  proceedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
  },
  proceedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Web Payment Modal Styles
  webPaymentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  webPaymentCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  webPaymentIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  webPaymentHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  webPaymentSubheading: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  webConfirmButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  webConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  webReopenButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 16,
  },
  webReopenButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  webCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  webCancelButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  bundleContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bundleContextIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bundleContextTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 2,
  },
  bundleContextSubtitle: {
    fontSize: 13,
    color: '#6D28D9',
    lineHeight: 18,
  },
});
