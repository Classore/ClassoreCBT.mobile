import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function WalletScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.back()}
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
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
                  <Text style={styles.balanceNumber}>2,450</Text>
                </View>
                <Text style={styles.nairaEquivalent}>≈ ₦2,450.00</Text>
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
              <Text style={styles.walletIdText}>Wallet ID: CT-983726</Text>
              <TouchableOpacity 
                style={styles.addTokensButton}
                onPress={() => router.push('/buy-tokens')}
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
              onPress={() => router.push('/buy-tokens')}
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
              onPress={() => router.push('/transaction-history')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                <Feather name="clock" size={22} color="#059669" />
              </View>
              <Text style={styles.actionItemText}>History</Text>
            </TouchableOpacity>

            {/* Withdraw */}
            <TouchableOpacity style={styles.actionItem} activeOpacity={0.75}>
              <View style={[styles.actionIconWrapper, { backgroundColor: '#FFEDD5' }]}>
                <Feather name="upload" size={22} color="#EA580C" />
              </View>
              <Text style={styles.actionItemText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Token Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Token Summary</Text>
            
            <View style={styles.summaryList}>
              {/* Total Earned */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIconCircle, { backgroundColor: '#D1FAE5' }]}>
                  <Feather name="dollar-sign" size={16} color="#059669" />
                </View>
                <Text style={styles.summaryRowLabel}>Total Earned</Text>
                <Text style={styles.summaryRowValue}>5,600</Text>
              </View>

              {/* Total Spent */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIconCircle, { backgroundColor: '#FFE4E6' }]}>
                  <Feather name="dollar-sign" size={16} color="#E11D48" />
                </View>
                <Text style={styles.summaryRowLabel}>Total Spent</Text>
                <Text style={styles.summaryRowValue}>3,150</Text>
              </View>

              {/* Bonus Tokens */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="circle-multiple-outline" size={16} color="#7C3AED" />
                </View>
                <Text style={styles.summaryRowLabel}>Bonus Tokens</Text>
                <Text style={styles.summaryRowValue}>350</Text>
              </View>

              {/* Active Passes */}
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.summaryIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <MaterialCommunityIcons name="ticket-outline" size={16} color="#0284C7" />
                </View>
                <Text style={styles.summaryRowLabel}>Active Passes</Text>
                <Text style={styles.summaryRowValue}>2</Text>
              </View>
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
            <TouchableOpacity onPress={() => router.push('/transaction-history')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionCard}>
            <View style={styles.transactionIconBg}>
              <Feather name="file-text" size={18} color="#7C3AED" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>Practice Test - JAMB UTME</Text>
              <Text style={styles.transactionDate}>AUG 12, 2026 • 10:30 AM</Text>
            </View>
            <View style={styles.transactionAmountContainer}>
              <Text style={styles.transactionSpent}>-300</Text>
              <Text style={styles.transactionBalance}>Balance: 2,450</Text>
            </View>
          </View>

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
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  summaryRowValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
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
});
