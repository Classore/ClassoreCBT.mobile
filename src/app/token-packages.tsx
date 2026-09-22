import {
  paymentService,
  TokenPackage } from '@/services/payment';
import { useNotifications } from '@/context/NotificationContext';
import { AppSafeArea } from '@/components/AppSafeArea';
import { Feather,
  Ionicons } from '@expo/vector-icons';
import { useRouter,
  useLocalSearchParams } from 'expo-router';
import { useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TokenPackagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    return_to?: string;
    for_bundle?: string;
    auto_deduct?: string;
    bundle_id?: string;
    bundle_name?: string;
    token_cost?: string;
    billing_type?: string;
    bundle_data?: string;
    selected_service_ids?: string;
  }>();
  const { hasUnread } = useNotifications();
  const [activeTab, setActiveTab] = useState<'Popular' | 'Best Value'>('Popular');
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await paymentService.getTokenPackages();
        setPackages(data.filter(p => p.is_active));
      } catch (error) {
        console.error('Error fetching token packages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSelectPackage = (pack: TokenPackage) => {
    setSelectedPackId(pack.id);
    router.push({
      pathname: '/buy-tokens',
      params: { 
        packId: String(pack.id),
        packName: pack.name, 
        tokens: `${pack.base_tokens.toLocaleString()} Tokens`, 
        price: `${pack.currency}${parseFloat(pack.price).toLocaleString()}`,
        ...(params.return_to
          ? {
              return_to: params.return_to,
              for_bundle: params.for_bundle,
              auto_deduct: params.auto_deduct || 'true',
              bundle_id: params.bundle_id,
              bundle_name: params.bundle_name,
              token_cost: params.token_cost,
              billing_type: params.billing_type,
              bundle_data: params.bundle_data,
              selected_service_ids: params.selected_service_ids,
            }
          : {}),
      }
    });
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
          <Text style={styles.headerTitle}>Token Package</Text>
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
          {/* Bundle Context Banner */}
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
                  Choose a package with at least {params.token_cost || 0} tokens. After purchase, you will return to automatically pay and activate your bundle.
                </Text>
              </View>
            </View>
          )}

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterPill, activeTab === 'Popular' && styles.filterPillActive]}
              onPress={() => setActiveTab('Popular')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeTab === 'Popular' && styles.filterTextActive]}>
                Popular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterPill, activeTab === 'Best Value' && styles.filterPillActive]}
              onPress={() => setActiveTab('Best Value')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeTab === 'Best Value' && styles.filterTextActive]}>
                Best Value
              </Text>
            </TouchableOpacity>
          </View>

          {/* Packages List */}
          <View style={styles.packagesList}>
            {loading ? (
              <ActivityIndicator size="large" color="#4C1D95" style={{ marginVertical: 40 }} />
            ) : (
              packages.map((pack) => {
                const isSelected = pack.id === selectedPackId;
                const isPopular = pack.name.toLowerCase().includes('student'); // Example logic
                const hasBonus = pack.bonus_tokens > 0;
                const targetCost = params.token_cost ? Number(params.token_cost) : 0;
                const coversBundle = params.for_bundle === 'true' && targetCost > 0 && pack.base_tokens >= targetCost;
                
                return (
                  <View key={pack.id} style={styles.packageWrapper}>
                    {coversBundle ? (
                      <View style={[styles.popularBadge, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.popularBadgeText}>✓ Covers Bundle</Text>
                      </View>
                    ) : isPopular ? (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Most Popular</Text>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.packageCard,
                        isSelected && styles.packageCardSelected,
                        coversBundle && { borderColor: '#A7F3D0' },
                      ]}
                      onPress={() => handleSelectPackage(pack)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.walletIconBg, { backgroundColor: '#F3E8FF' }]}>
                        <Ionicons name="wallet-outline" size={22} color="#7C3AED" />
                      </View>
  
                      <View style={styles.packInfo}>
                        <View style={styles.packNameRow}>
                          <Text style={styles.packName}>{pack.name}</Text>
                          {pack.base_tokens <= 500 && <Text style={{ fontSize: 13, marginLeft: 4 }}>⭐</Text>}
                        </View>
                        <Text style={styles.packTokens}>{pack.base_tokens.toLocaleString()} Tokens</Text>
                        {hasBonus && <Text style={styles.packBonus}>Bonus: {pack.bonus_tokens.toLocaleString()} Tokens</Text>}
                      </View>
  
                      <View style={styles.priceCol}>
                        <Text style={styles.packPrice}>{pack.currency}{parseFloat(pack.price).toLocaleString()}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
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

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#4C1D95',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Package Cards
  packagesList: {
    gap: 14,
  },
  packageWrapper: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  packageCardSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
  },
  walletIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  packInfo: {
    flex: 1,
  },
  packNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  packTokens: {
    fontSize: 12.5,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  packBonus: {
    fontSize: 11.5,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  packPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  packOriginalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 2,
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
