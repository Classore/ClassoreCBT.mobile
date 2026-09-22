import React, { useState, useEffect } from 'react';
import { AppSafeArea } from '@/components/AppSafeArea';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { paymentService, ServiceBundle, ServiceConfig } from '@/services/payment';

export default function BundlesDirectoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [individualServices, setIndividualServices] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bundleList, serviceList] = await Promise.all([
          paymentService.getServiceBundles(),
          paymentService.getServiceConfigs()
        ]);
        setBundles(bundleList);
        setIndividualServices(serviceList);
        if (bundleList.length > 0) {
          // Default selection to IELTS Bundle or first popular
          const popular = bundleList.find(b => b.name.toLowerCase().includes('ielts')) || bundleList[0];
          setSelectedBundleId(popular.id);
        }
      } catch (err) {
        console.error('Failed to load bundle directory data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleViewBundle = (bundle: ServiceBundle) => {
    setSelectedBundleId(bundle.id);
    router.push({
      pathname: '/(tabs)/bundles/details',
      params: {
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        token_cost: bundle.token_cost,
        billing_type: bundle.billing_type,
        bundle_data: JSON.stringify(bundle)
      }
    });
  };

  const handleContinue = () => {
    const targetBundle = bundles.find(b => b.id === selectedBundleId) || bundles[0];
    if (targetBundle) {
      handleViewBundle(targetBundle);
    }
  };

  const renderExamIcon = (bundleName: string) => {
    const lower = bundleName.toLowerCase();
    if (lower.includes('jamb')) {
      return (
        <View style={styles.jambIconBox}>
          <Image
            source={require('../../../../assets/images/jamb-logo.png')}
            style={styles.bundleIcon}
            contentFit="contain"
          />
        </View>
      );
    }
    return (
      <View style={styles.ieltsIconBox}>
        <Image
          source={require('../../../../assets/images/ielts-logo.png')}
          style={styles.bundleIcon}
          contentFit="contain"
        />
      </View>
    );
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/wallet'))}
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
          <Text style={styles.subtitleText}>
            Use tokens in your wallet to unlock exams, subjects and assessments.
          </Text>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6D28D9" />
              <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading bundles...</Text>
            </View>
          ) : (
            <>
              {/* Popular Bundles Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Popular Bundles</Text>

                {bundles.map((bundle) => {
                  const isJamb = bundle.name.toLowerCase().includes('jamb');
                  const isSelected = selectedBundleId === bundle.id;

                  return (
                    <TouchableOpacity
                      key={bundle.id}
                      style={[
                        styles.bundleCard,
                        isJamb ? styles.jambCardBg : styles.ieltsCardBg,
                        isSelected && styles.bundleCardSelected,
                      ]}
                      onPress={() => setSelectedBundleId(bundle.id)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.bundleTopRow}>
                        {renderExamIcon(bundle.name)}
                        <View style={styles.bundleInfo}>
                          <View style={styles.bundleTitleRow}>
                            <Text style={styles.bundleTitle}>{bundle.name}</Text>
                            {bundle.tag ? (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>{bundle.tag}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.bundleDescription}>
                            {bundle.description || 'Access full exam materials and tests.'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bundleBottomRow}>
                        <Text style={styles.tokenPriceText}>
                          {bundle.token_cost} tokens / {bundle.billing_type === 'yearly' ? 'year' : 'month'}
                        </Text>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewBundle(bundle)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.viewButtonText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Individual Services Section */}
              <View style={[styles.sectionContainer, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Individual Services</Text>

                {individualServices.map((service, idx) => {
                  const isMath = service.name.toLowerCase().includes('math');
                  const isSpeaking = service.name.toLowerCase().includes('speaking');

                  let iconBg = '#DBEAFE';
                  let iconColor = '#2563EB';
                  let iconName: any = 'edit-2';

                  if (isMath) {
                    iconBg = '#DCFCE7';
                    iconColor = '#10B981';
                    iconName = 'book';
                  } else if (isSpeaking) {
                    iconBg = '#FFE4E6';
                    iconColor = '#E11D48';
                    iconName = 'mic';
                  }

                  const subtitle = isMath
                    ? 'Unlimited practice'
                    : `${service.max_usage || 1} assessment`;

                  const costText = isMath
                    ? `${service.token_cost} tokens / month`
                    : `${service.token_cost} tokens`;

                  return (
                    <TouchableOpacity
                      key={service.id || idx}
                      style={styles.serviceItemCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        // Navigate to payment or detail for individual service
                        router.push({
                          pathname: '/(tabs)/bundles/details',
                          params: {
                            bundle_id: service.id,
                            bundle_name: service.name,
                            token_cost: service.token_cost,
                            billing_type: service.billing_type,
                            is_individual_service: 'true'
                          }
                        });
                      }}
                    >
                      <View style={[styles.serviceIconContainer, { backgroundColor: iconBg }]}>
                        <Feather name={iconName} size={18} color={iconColor} />
                      </View>

                      <View style={styles.serviceTextContainer}>
                        <Text style={styles.serviceTitle}>{service.name}</Text>
                        <Text style={styles.serviceSubtitle}>{subtitle}</Text>
                      </View>

                      <View style={styles.serviceCostRow}>
                        <Text style={styles.serviceCostText}>{costText}</Text>
                        <Feather name="chevron-right" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Spacing for floating button & tabs */}
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
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bundleCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  bundleCardSelected: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  jambCardBg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  ieltsCardBg: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  bundleTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jambIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ieltsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bundleIcon: {
    width: 30,
    height: 30,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bundleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  popularBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularBadgeText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '600',
  },
  bundleDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  bundleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
  },
  tokenPriceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  viewButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 26,
  },
  viewButtonText: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '700',
  },
  serviceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  serviceCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceCostText: {
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
