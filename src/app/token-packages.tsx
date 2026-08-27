import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';

interface TokenPackageItem {
  id: string;
  name: string;
  tokens: string;
  bonus: string;
  price: string;
  originalPrice: string;
  iconBg: string;
  iconColor: string;
  isPopular?: boolean;
  star?: boolean;
}

const TOKEN_PACKAGES: TokenPackageItem[] = [
  {
    id: '1',
    name: 'Starter Pack',
    star: true,
    tokens: '500 Tokens',
    bonus: 'Bonus: 50 Tokens',
    price: '₦600',
    originalPrice: '₦750',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
  },
  {
    id: '2',
    name: 'Student Pack',
    isPopular: true,
    tokens: '1,000 Tokens',
    bonus: 'Bonus: 100 Tokens',
    price: '₦1,000',
    originalPrice: '₦1,250',
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  {
    id: '3',
    name: 'Premium Pack',
    tokens: '2,500 Tokens',
    bonus: 'Bonus: 300 Tokens',
    price: '₦2,500',
    originalPrice: '₦3,200',
    iconBg: '#FFFBEB',
    iconColor: '#F59E0B',
  },
  {
    id: '4',
    name: 'Mega Pack',
    tokens: '5,000 Tokens',
    bonus: 'Bonus: 750 Tokens',
    price: '₦5,000',
    originalPrice: '₦6,600',
    iconBg: '#FEF2F2',
    iconColor: '#EF4444',
  },
  {
    id: '5',
    name: 'Ultimate Pack',
    tokens: '10,000 Tokens',
    bonus: 'Bonus: 2,000 Tokens',
    price: '₦10,000',
    originalPrice: '₦12,500',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
  },
];

export default function TokenPackagesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Popular' | 'Best Value'>('Popular');
  const [selectedPackId, setSelectedPackId] = useState('2');

  const handleSelectPackage = (pack: TokenPackageItem) => {
    setSelectedPackId(pack.id);
    router.push({
      pathname: '/buy-tokens',
      params: { packName: pack.name, tokens: pack.tokens, price: pack.price }
    });
  };

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
          <Text style={styles.headerTitle}>Token Package</Text>
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
            {TOKEN_PACKAGES.map((pack) => {
              const isSelected = pack.id === selectedPackId || pack.isPopular;
              return (
                <View key={pack.id} style={styles.packageWrapper}>
                  {pack.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Most Popular</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => handleSelectPackage(pack)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.walletIconBg, { backgroundColor: pack.iconBg }]}>
                      <Ionicons name="wallet-outline" size={22} color={pack.iconColor} />
                    </View>

                    <View style={styles.packInfo}>
                      <View style={styles.packNameRow}>
                        <Text style={styles.packName}>{pack.name}</Text>
                        {pack.star && <Text style={{ fontSize: 13, marginLeft: 4 }}>⭐</Text>}
                      </View>
                      <Text style={styles.packTokens}>{pack.tokens}</Text>
                      <Text style={styles.packBonus}>{pack.bonus}</Text>
                    </View>

                    <View style={styles.priceCol}>
                      <Text style={styles.packPrice}>{pack.price}</Text>
                      <Text style={styles.packOriginalPrice}>{pack.originalPrice}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
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
});
