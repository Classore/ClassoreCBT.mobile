import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from 'expo-router';
import { paymentService, MyBundle, getBundleStatus, isBundleActive, BundleStatus } from '@/services/payment';
import { walletService } from '@/services/wallet';
import { guestService, WalletPreviewData } from '@/services/guest';

export default function WalletScreen() {
  const router = useRouter();
  const { hasUnread } = useNotifications();
  const { user, token, refreshUser, isRefreshingUser, isLoading } = useAuth();
  const isGuest = !token;
  const hasBalance = user?.token_balance !== undefined;
  const tokenBalance = user?.token_balance ?? 0;

  const [myBundles, setMyBundles] = useState<MyBundle[]>([]);
  const [bundleFilter, setBundleFilter] = useState<'active' | 'past'>('active');
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [walletPreview, setWalletPreview] = useState<WalletPreviewData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatBundleDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const activeBundles = myBundles.filter(b => isBundleActive(b));
  const pastBundles = myBundles.filter(b => !isBundleActive(b));
  const displayedBundles = bundleFilter === 'active' ? activeBundles : pastBundles;

  const getStatusBadgeStyle = (status: BundleStatus) => {
    switch (status) {
      case 'active':
        return styles.statusBadge_active;
      case 'exhausted':
        return styles.statusBadge_exhausted;
      case 'expired':
        return styles.statusBadge_expired;
      default:
        return styles.statusBadge_inactive;
    }
  };

  const getStatusBadgeTextStyle = (status: BundleStatus) => {
    switch (status) {
      case 'active':
        return styles.statusBadgeText_active;
      case 'exhausted':
        return styles.statusBadgeText_exhausted;
      case 'expired':
        return styles.statusBadgeText_expired;
      default:
        return styles.statusBadgeText_inactive;
    }
  };

  const fetchBundles = async () => {
    if (isGuest) {
      setLoadingBundles(false);
      return;
    }
    try {
      const bundles = await paymentService.getMyBundles();
      if (Array.isArray(bundles)) {
        setMyBundles(bundles);
      } else if (bundles && Array.isArray((bundles as any).results)) {
        setMyBundles((bundles as any).results);
      } else {
        setMyBundles([]);
      }
    } catch (error) {
      console.error('Error fetching bundles', error);
    } finally {
      setLoadingBundles(false);
    }
  };

  const fetchWalletPreview = async () => {
    try {
      const preview = await guestService.getWalletPreview();
      setWalletPreview(preview);
    } catch (err) {
      console.warn('Failed to fetch wallet preview:', err);
    }
  };

  const fetchRecentTransactions = async () => {
    if (isGuest) {
      setLoadingTransactions(false);
      setRecentTransactions([]);
      return;
    }
    try {
      setLoadingTransactions(true);
      const data = await walletService.getTransactions({ type: 'All' });
      if (Array.isArray(data)) {
        setRecentTransactions(data.slice(0, 5));
      } else {
        setRecentTransactions([]);
      }
    } catch (err) {
      console.warn('Failed to fetch recent transactions in wallet:', err);
      setRecentTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      fetchWalletPreview();
      setLoadingBundles(false);
      setLoadingTransactions(false);
    } else {
      fetchBundles();
      fetchRecentTransactions();
      refreshUser().catch(err => console.warn('Wallet refreshUser error:', err));
    }
  }, [isGuest]);

  const promptGuestSignUp = (actionName: string) => {
    Alert.alert(
      'Sign Up Required',
      `Create a free account to ${actionName}, purchase tokens, and activate bundles!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register / Sign In', onPress: () => router.push('/(auth)/signup') },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isGuest) {
      await fetchWalletPreview();
    } else {
      await Promise.allSettled([refreshUser(), fetchBundles(), fetchRecentTransactions()]);
    }
    setRefreshing(false);
  }, [isGuest, refreshUser]);

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Wallet</Text>
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
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#FFFFFF" 
              colors={['#6D28D9']} 
            />
          }
        >
          {/* Hero Balance Card */}
          <LinearGradient
            colors={['#4C1D95', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopSection}>
              <View style={styles.heroLeft}>
                <Text style={styles.balanceLabel}>My Token Balance</Text>
                <View style={styles.balanceValueRow}>
                  <Image 
                    source={require('../../assets/images/naira-token-coin.png')} 
                    style={styles.coinImage} 
                    contentFit="contain" 
                  />
                  {isGuest ? (
                    <Text style={styles.balanceNumber}>0 (Guest)</Text>
                  ) : hasBalance ? (
                    <Text style={styles.balanceNumber}>{tokenBalance.toLocaleString()}</Text>
                  ) : (
                    <View style={styles.balanceLoaderContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {isGuest ? (
                  <Text style={styles.nairaEquivalent}>Guest Mode Wallet Preview</Text>
                ) : hasBalance ? (
                  <Text style={styles.nairaEquivalent}>≈ ₦{tokenBalance.toLocaleString()}.00</Text>
                ) : (
                  <Text style={styles.nairaEquivalent}>Updating balance...</Text>
                )}
              </View>

              <View style={styles.heroRight}>
                <Image 
                  source={require('../../assets/images/wallet-3d-cards.png')} 
                  style={styles.wallet3dImage} 
                  contentFit="contain" 
                />
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroBottomRow}>
              <Text style={styles.walletIdText}>{isGuest ? 'Guest Preview' : `Wallet ID: CT-${(user?.id || 0).toString().padStart(6, '0')}`}</Text>
              <TouchableOpacity 
                style={styles.addTokensButton}
                onPress={() => isGuest ? promptGuestSignUp('buy tokens') : router.push('/buy-tokens')}
                activeOpacity={0.8}
              >
                <Text style={styles.addTokensText}>+ Add Tokens</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 4 Action Buttons Row */}
          <View style={styles.actionsRow}>
            {/* Buy Tokens */}
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => isGuest ? promptGuestSignUp('buy tokens') : router.push('/buy-tokens')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="plus" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.actionItemText}>Buy{'\n'}Tokens</Text>
            </TouchableOpacity>

            {/* Token Packages */}
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => router.push('/token-packages')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#DBEAFE' }]}>
                <Feather name="gift" size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionItemText}>Token{'\n'}Packages</Text>
            </TouchableOpacity>

            {/* History */}
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => isGuest ? promptGuestSignUp('view transaction history') : router.push('/transaction-history')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                <Feather name="clock" size={22} color="#059669" />
              </View>
              <Text style={styles.actionItemText}>History</Text>
            </TouchableOpacity>

            {/* Withdraw */}
            <TouchableOpacity 
              style={[styles.actionItem, { opacity: 0.85 }]} 
              activeOpacity={0.8} 
              onPress={() => Alert.alert('Coming Soon 🚀', 'The withdrawal feature will be available in an upcoming update. Stay tuned!')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#F1F5F9' }]}>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>Soon</Text>
                </View>
                <Feather name="upload" size={22} color="#94A3B8" />
              </View>
              <Text style={[styles.actionItemText, { color: '#94A3B8' }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* My Active Bundles Card */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.cardSectionTitle, { marginBottom: 0 }]}>
                {bundleFilter === 'active' ? 'My Active Bundles' : 'Past / Inactive Bundles'}
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/bundles' as any)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#7C3AED' }}>Explore Bundles</Text>
                <Feather name="chevron-right" size={14} color="#7C3AED" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

            {/* Filter Toggle if user has both active and past/inactive bundles */}
            {myBundles.length > 0 && pastBundles.length > 0 && (
              <View style={styles.bundleTabRow}>
                <TouchableOpacity
                  style={[styles.bundleTab, bundleFilter === 'active' && styles.bundleTabSelected]}
                  onPress={() => setBundleFilter('active')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bundleTabText, bundleFilter === 'active' && styles.bundleTabTextSelected]}>
                    Active ({activeBundles.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bundleTab, bundleFilter === 'past' && styles.bundleTabSelected]}
                  onPress={() => setBundleFilter('past')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bundleTabText, bundleFilter === 'past' && styles.bundleTabTextSelected]}>
                    Past / Inactive ({pastBundles.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.summaryList}>
              {loadingBundles ? (
                <Text style={{ padding: 10, color: '#6B7280' }}>Loading bundles...</Text>
              ) : displayedBundles.length === 0 ? (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>
                    {bundleFilter === 'active' ? 'No active bundles.' : 'No past bundles.'}
                  </Text>
                  {bundleFilter === 'active' && (
                    <TouchableOpacity
                      onPress={() => router.push('/(tabs)/bundles' as any)}
                      style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                    >
                      <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 13 }}>Browse Available Bundles</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                displayedBundles.filter(Boolean).map((b, index) => {
                  const bundleName = b.bundle?.name || (b as any)?.bundle_name || (b as any)?.name || 'Bundle';
                  const status: BundleStatus = getBundleStatus(b);
                  const expiryFormatted = formatBundleDate(b.expiry_date || b.expires_at || b.end_date);
                  let subtext = '';
                  if (status === 'active' && expiryFormatted) {
                    subtext = `Expires ${expiryFormatted}`;
                  } else if (status === 'expired') {
                    subtext = expiryFormatted ? `Expired on ${expiryFormatted}` : 'Subscription expired';
                  } else if (status === 'exhausted') {
                    subtext = 'Usage limit reached';
                  }

                  const badgeLabels: Record<BundleStatus, string> = {
                    active: 'Active',
                    exhausted: 'Exhausted',
                    expired: 'Expired',
                    inactive: 'Inactive',
                  };

                  return (
                    <View key={b.id || index} style={[styles.summaryRow, index === displayedBundles.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[
                        styles.summaryIconCircle,
                        { backgroundColor: status === 'active' ? '#E0F2FE' : status === 'exhausted' ? '#FEF3C7' : '#F3F4F6' }
                      ]}>
                        <MaterialCommunityIcons 
                          name="ticket-outline" 
                          size={16} 
                          color={status === 'active' ? '#0284C7' : status === 'exhausted' ? '#D97706' : '#9CA3AF'} 
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.summaryRowLabel}>{bundleName}</Text>
                        {subtext ? <Text style={styles.summaryRowSubtext}>{subtext}</Text> : null}
                      </View>
                      <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                        <Text style={[styles.statusBadgeText, getStatusBadgeTextStyle(status)]}>
                          {badgeLabels[status] || status}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* Get More with Premium Banner */}
          <LinearGradient
            colors={['#2E1065', '#3B0764']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumCard}
          >
            <View style={styles.premiumLeft}>
              <Text style={styles.premiumTitle}>Get More with Premium</Text>
              <Text style={styles.premiumSubtitle}>
                Unlock unlimited practice, AI assessments and exclusive features.
              </Text>
              <TouchableOpacity 
                style={styles.viewPlansButton}
                onPress={() => router.push('/token-packages')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewPlansText}>View Plans</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.premiumRight}>
              <Image 
                source={require('../../assets/images/premium-gold-trophy.png')} 
                style={styles.premiumTrophy} 
                contentFit="contain" 
              />
            </View>
          </LinearGradient>

          {/* Recent Transactions Section */}
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => isGuest ? promptGuestSignUp('view transaction history') : router.push('/transaction-history')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {loadingTransactions ? (
            <View style={styles.transactionLoaderContainer}>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text style={styles.transactionLoaderText}>Loading transactions...</Text>
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyTransactionCard}>
              <Feather name="inbox" size={22} color="#9CA3AF" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyTransactionText}>
                {isGuest ? 'Sign up to view your recent wallet transactions.' : 'No recent transactions found.'}
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx, idx) => {
              const isPos = tx.transaction_type === 'CREDIT' || Number(tx.amount) > 0;
              const d = new Date(tx.created_at || Date.now());
              const dateStr = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
              const title = tx.description || (isPos ? 'Deposit / Token Credit' : 'Token Purchase / Usage');
              const amountStr = isPos ? `+${Number(tx.amount).toLocaleString()}` : `-${Math.abs(Number(tx.amount)).toLocaleString()}`;
              const balanceStr = tx.balance_after !== undefined && tx.balance_after !== null ? `Balance: ${Number(tx.balance_after).toLocaleString()}` : '';

              return (
                <View key={tx.id || idx} style={[styles.transactionCard, idx > 0 && { marginTop: 10 }]}>
                  <View style={[styles.transactionIconBg, { backgroundColor: isPos ? '#EDE9FE' : '#FFE4E6' }]}>
                    <Feather name={isPos ? 'gift' : 'file-text'} size={18} color={isPos ? '#7C3AED' : '#E11D48'} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.transactionDate}>{dateStr}</Text>
                  </View>
                  <View style={styles.transactionAmountContainer}>
                    <Text style={[styles.transactionSpent, { color: isPos ? '#2563EB' : '#EF4444' }]}>{amountStr}</Text>
                    {!!balanceStr && <Text style={styles.transactionBalance}>{balanceStr}</Text>}
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
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

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#E9D5FF',
    marginBottom: 6,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  balanceNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  balanceLoaderContainer: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  nairaEquivalent: {
    fontSize: 12,
    color: '#DDD6FE',
    marginTop: 4,
  },
  heroRight: {
    width: 100,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallet3dImage: {
    width: 95,
    height: 85,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 14,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletIdText: {
    fontSize: 12,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  addTokensButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
  },
  addTokensText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // 4 Action Buttons
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: 76,
  },
  actionIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  actionItemText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Token Summary Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  bundleTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  bundleTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  bundleTabSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bundleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  bundleTabTextSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  summaryList: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryRowSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  summaryRowValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge_active: {
    backgroundColor: '#ECFDF5',
  },
  statusBadge_exhausted: {
    backgroundColor: '#FFFBEB',
  },
  statusBadge_expired: {
    backgroundColor: '#FEF2F2',
  },
  statusBadge_inactive: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeText_active: {
    color: '#059669',
  },
  statusBadgeText_exhausted: {
    color: '#D97706',
  },
  statusBadgeText_expired: {
    color: '#DC2626',
  },
  statusBadgeText_inactive: {
    color: '#6B7280',
  },

  // Premium Banner
  premiumCard: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    alignItems: 'center',
  },
  premiumLeft: {
    flex: 1,
    paddingRight: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 11.5,
    color: '#C7D2FE',
    lineHeight: 16,
    marginBottom: 12,
  },
  viewPlansButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewPlansText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4C1D95',
  },
  premiumRight: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTrophy: {
    width: 85,
    height: 85,
  },

  // Transactions
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6D28D9',
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transactionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionSpent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 2,
  },
  transactionBalance: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    zIndex: 10,
  },
  comingSoonBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  transactionLoaderContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  transactionLoaderText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyTransactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTransactionText: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
  },
});
