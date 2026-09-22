import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { paymentService, ServiceBundle, BundleServiceItem } from '@/services/payment';

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
  const [loadingBundle, setLoadingBundle] = useState<boolean>(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const isCompulsoryService = (serviceName: string, actionId?: string) => {
    const combined = `${serviceName} ${actionId || ''}`.toLowerCase();
    return combined.includes('english') || combined.includes('use of english');
  };

  useEffect(() => {
    const initBundle = async () => {
      let currentBundle: ServiceBundle | null = null;
      if (params.bundle_data) {
        try {
          currentBundle = JSON.parse(params.bundle_data);
          setBundle(currentBundle);
        } catch (e) {
          console.warn('Could not parse bundle_data:', e);
        }
      }

      const bundleId = params.bundle_id ? Number(params.bundle_id) : currentBundle?.id;

      // If we don't have included_services, fetch full bundle details from API
      if (bundleId && (!currentBundle?.included_services || currentBundle.included_services.length === 0)) {
        try {
          setLoadingBundle(true);
          const fetched = await paymentService.getServiceBundleById(bundleId);
          if (fetched) {
            currentBundle = fetched;
            setBundle(fetched);
          }
        } catch (err) {
          console.warn('Could not fetch bundle by id:', err);
        } finally {
          setLoadingBundle(false);
        }
      }

      // Initialize selectedServiceIds for customizable bundle
      if (currentBundle?.is_customizable && currentBundle.included_services && currentBundle.included_services.length > 0) {
        const limit = currentBundle.customization_limit || 4;
        const services = currentBundle.included_services;

        // Find compulsory services (e.g. English)
        const compulsoryIds = services
          .filter(item => isCompulsoryService(item.service.name, item.service.action_identifier))
          .map(item => item.service.id);

        // Find other services
        const otherIds = services
          .filter(item => !compulsoryIds.includes(item.service.id))
          .map(item => item.service.id);

        // Pick up to limit
        const initialSelected = [...compulsoryIds, ...otherIds].slice(0, limit);
        setSelectedServiceIds(initialSelected);
      }
    };

    initBundle();
  }, [params.bundle_data, params.bundle_id]);

  const bundleName = params.bundle_name || bundle?.name || 'IELTS Bundle';
  const tokenCost = params.token_cost ? Number(params.token_cost) : (bundle?.token_cost || 100);
  const billingType = params.billing_type || bundle?.billing_type || 'monthly';
  const isJamb = bundleName.toLowerCase().includes('jamb');
  const walletBalance = user?.token_balance ?? 0;

  const isCustomizable = Boolean(bundle?.is_customizable);
  const customizationLimit = bundle?.customization_limit || 4;
  const isSelectionComplete = !isCustomizable || selectedServiceIds.length === customizationLimit;

  const handleToggleService = (serviceId: number, serviceName: string, actionId?: string) => {
    if (!isCustomizable) return;

    const isReq = isCompulsoryService(serviceName, actionId);
    if (isReq) {
      Alert.alert(
        'Compulsory Subject',
        `${serviceName} is mandatory for JAMB and cannot be removed from your subject combination.`
      );
      return;
    }

    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(prev => prev.filter(id => id !== serviceId));
    } else {
      if (selectedServiceIds.length >= customizationLimit) {
        Alert.alert(
          'Subject Limit Reached',
          `This bundle requires exactly ${customizationLimit} subjects. Please uncheck one of your selected subjects first before choosing ${serviceName}.`
        );
        return;
      }
      setSelectedServiceIds(prev => [...prev, serviceId]);
    }
  };

  const handleContinue = () => {
    if (isCustomizable && selectedServiceIds.length !== customizationLimit) {
      Alert.alert(
        'Incomplete Subject Selection',
        `Please select exactly ${customizationLimit} subjects to proceed. You currently have ${selectedServiceIds.length} selected.`
      );
      return;
    }

    router.push({
      pathname: '/(tabs)/bundles/payment',
      params: {
        bundle_id: String(bundle?.id || params.bundle_id || '18'),
        bundle_name: bundleName,
        token_cost: String(tokenCost),
        billing_type: billingType,
        bundle_data: JSON.stringify(bundle),
        selected_service_ids: JSON.stringify(selectedServiceIds),
      }
    });
  };

  const renderServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('english')) return <Feather name="book" size={18} color="#2563EB" />;
    if (lower.includes('math')) return <Ionicons name="calculator-outline" size={18} color="#10B981" />;
    if (lower.includes('bio')) return <Feather name="activity" size={18} color="#059669" />;
    if (lower.includes('chem')) return <Ionicons name="flask-outline" size={18} color="#D97706" />;
    if (lower.includes('phys')) return <Feather name="zap" size={18} color="#7C3AED" />;
    if (lower.includes('listen')) return <Feather name="headphones" size={18} color="#2563EB" />;
    if (lower.includes('read')) return <Ionicons name="book-outline" size={18} color="#10B981" />;
    if (lower.includes('speak')) return <Feather name="mic" size={18} color="#E11D48" />;
    if (lower.includes('writ')) return <Feather name="edit-2" size={18} color="#7C3AED" />;
    return <Feather name="layers" size={18} color="#6D28D9" />;
  };

  const getServiceIconBg = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('english')) return '#DBEAFE';
    if (lower.includes('math')) return '#DCFCE7';
    if (lower.includes('bio')) return '#D1FAE5';
    if (lower.includes('chem')) return '#FEF3C7';
    if (lower.includes('phys')) return '#EDE9FE';
    if (lower.includes('listen')) return '#DBEAFE';
    if (lower.includes('read')) return '#DCFCE7';
    if (lower.includes('speak')) return '#FFE4E6';
    if (lower.includes('writ')) return '#EDE9FE';
    return '#F3E8FF';
  };

  return (
    <AppSafeArea style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Bundle Details</Text>
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

          {/* Subject Customization or What's Included Card */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>
                {isCustomizable ? 'Select Your Subjects' : "What's included"}
              </Text>
              {isCustomizable && (
                <View
                  style={[
                    styles.counterBadge,
                    selectedServiceIds.length === customizationLimit
                      ? styles.counterBadgeSuccess
                      : styles.counterBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.counterBadgeText,
                      selectedServiceIds.length === customizationLimit
                        ? styles.counterBadgeTextSuccess
                        : styles.counterBadgeTextPending,
                    ]}
                  >
                    {selectedServiceIds.length} of {customizationLimit} selected
                  </Text>
                </View>
              )}
            </View>

            {isCustomizable && (
              <Text style={styles.customizableSubtitle}>
                English is compulsory for JAMB. Select your other 3 subjects to complete your 4-subject combination.
              </Text>
            )}

            {loadingBundle ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6D28D9" />
                <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 13 }}>Loading available subjects...</Text>
              </View>
            ) : isCustomizable && bundle?.included_services && bundle.included_services.length > 0 ? (
              bundle.included_services.map((item) => {
                const isSelected = selectedServiceIds.includes(item.service.id);
                const isCompulsory = isCompulsoryService(item.service.name, item.service.action_identifier);

                return (
                  <TouchableOpacity
                    key={item.service.id}
                    style={[
                      styles.selectableItemRow,
                      isSelected && styles.selectableItemRowSelected,
                    ]}
                    onPress={() => handleToggleService(item.service.id, item.service.name, item.service.action_identifier)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconBox, { backgroundColor: getServiceIconBg(item.service.name) }]}>
                      {renderServiceIcon(item.service.name)}
                    </View>

                    <View style={styles.itemTextBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={[styles.itemTitle, isSelected && { color: '#1E1B4B' }]}>
                          {item.service.name}
                        </Text>
                        {isCompulsory && (
                          <View style={styles.compulsoryBadge}>
                            <Text style={styles.compulsoryBadgeText}>Compulsory</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemSubtitle}>
                        {item.is_unlimited_override || item.service.is_unlimited
                          ? 'Unlimited practice'
                          : `${item.max_usage_override || item.service.max_usage || 1} assessments`}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                        isCompulsory && styles.checkboxCompulsory,
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : bundle?.included_services && bundle.included_services.length > 0 ? (
              bundle.included_services.map((item) => (
                <View key={item.service.id} style={styles.includedItemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: getServiceIconBg(item.service.name) }]}>
                    {renderServiceIcon(item.service.name)}
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={styles.itemTitle}>{item.service.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {item.is_unlimited_override || item.service.is_unlimited
                        ? 'Unlimited practice'
                        : `Up to ${item.max_usage_override || item.service.max_usage || 1} assessments`}
                    </Text>
                  </View>
                  {item.is_unlimited_override || item.service.is_unlimited ? (
                    <Text style={styles.infinityText}>∞</Text>
                  ) : (
                    <Text style={styles.leftCountText}>
                      {item.max_usage_override || item.service.max_usage || 1} left
                    </Text>
                  )}
                </View>
              ))
            ) : isJamb ? (
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
              <Text style={styles.infoValue}>
                {billingType === 'yearly' ? 'Yearly' : 'Monthly'}
              </Text>
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
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky Continue CTA */}
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isSelectionComplete && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isSelectionComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>
              {isCustomizable && selectedServiceIds.length < customizationLimit
                ? `Select ${customizationLimit - selectedServiceIds.length} More Subject${
                    customizationLimit - selectedServiceIds.length > 1 ? 's' : ''
                  }`
                : 'Continue'}
            </Text>
            {isSelectionComplete && (
              <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        </View>
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  counterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  counterBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  counterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  counterBadgeTextSuccess: {
    color: '#15803D',
  },
  counterBadgeTextPending: {
    color: '#B45309',
  },
  customizableSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  selectableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  selectableItemRowSelected: {
    borderColor: '#6D28D9',
    backgroundColor: '#F5F3FF',
  },
  compulsoryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  compulsoryBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxSelected: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
    borderWidth: 1.5,
  },
  checkboxUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1.5,
  },
  checkboxCompulsory: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
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
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
