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

interface TransactionItem {
  id: string;
  title: string;
  date: string;
  amount: string;
  balance: string;
  isPositive: boolean;
  section: 'Today' | 'Yesterday' | 'May 8, 2026';
  icon: string;
  iconBg: string;
  iconColor: string;
  type: 'sent' | 'received' | 'purchase';
}

const TRANSACTIONS_DATA: TransactionItem[] = [
  {
    id: '1',
    title: 'Practice Test - JAMB UTME',
    date: 'AUG 12, 2026 • 10:30 AM',
    amount: '-300',
    balance: 'Balance: 2,450',
    isPositive: false,
    section: 'Today',
    icon: 'file-text',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    type: 'sent',
  },
  {
    id: '2',
    title: 'AI Writing Assessment',
    date: 'AUG 12, 2026 • 09:15 AM',
    amount: '-1000',
    balance: 'Balance: 3,450',
    isPositive: false,
    section: 'Today',
    icon: 'auto-fix',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    type: 'sent',
  },
  {
    id: '3',
    title: 'Token Purchase',
    date: 'AUG 11, 2026 • 10:30 AM',
    amount: '+1,000',
    balance: 'Balance: 2,450',
    isPositive: true,
    section: 'Yesterday',
    icon: 'file-text',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    type: 'purchase',
  },
  {
    id: '4',
    title: 'Streak Bonus (7 days)',
    date: 'AUG 11, 2026 • 09:15 AM',
    amount: '+1,000',
    balance: 'Balance: 3,450',
    isPositive: true,
    section: 'Yesterday',
    icon: 'fire',
    iconBg: '#FFE4E6',
    iconColor: '#E11D48',
    type: 'received',
  },
  {
    id: '5',
    title: 'Referral Bonus',
    date: 'AUG 11, 2026 • 10:30 AM',
    amount: '+100',
    balance: 'Balance: 2,450',
    isPositive: true,
    section: 'May 8, 2026',
    icon: 'gift',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    type: 'received',
  },
  {
    id: '6',
    title: 'Streak Bonus (7 days)',
    date: 'AUG 11, 2026 • 09:15 AM',
    amount: '+1,000',
    balance: 'Balance: 3,450',
    isPositive: true,
    section: 'May 8, 2026',
    icon: 'fire',
    iconBg: '#FFE4E6',
    iconColor: '#E11D48',
    type: 'received',
  },
];

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Sent' | 'Received' | 'Purchase'>('All');

  const filters: ('All' | 'Sent' | 'Received' | 'Purchase')[] = ['All', 'Sent', 'Received', 'Purchase'];

  const filteredData = TRANSACTIONS_DATA.filter(item => {
    if (activeFilter === 'Sent') return item.type === 'sent';
    if (activeFilter === 'Received') return item.type === 'received';
    if (activeFilter === 'Purchase') return item.type === 'purchase';
    return true;
  });

  const todayItems = filteredData.filter(item => item.section === 'Today');
  const yesterdayItems = filteredData.filter(item => item.section === 'Yesterday');
  const may8Items = filteredData.filter(item => item.section === 'May 8, 2026');

  const renderIcon = (item: TransactionItem) => {
    if (item.icon === 'fire') {
      return <MaterialCommunityIcons name="fire" size={20} color={item.iconColor} />;
    }
    if (item.icon === 'gift') {
      return <Feather name="gift" size={18} color={item.iconColor} />;
    }
    if (item.icon === 'auto-fix') {
      return <MaterialCommunityIcons name="auto-fix" size={18} color={item.iconColor} />;
    }
    return <Feather name="file-text" size={18} color={item.iconColor} />;
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
          <Text style={styles.headerTitle}>Transaction History</Text>
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
            {filters.map((f) => {
              const isActive = activeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setActiveFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today Section */}
          {todayItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today</Text>
              <View style={styles.cardsList}>
                {todayItems.map((item) => (
                  <View key={item.id} style={styles.transactionCard}>
                    <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDate}>{item.date}</Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={[styles.amountText, { color: item.isPositive ? '#2563EB' : '#EF4444' }]}>
                        {item.amount}
                      </Text>
                      <Text style={styles.balanceText}>{item.balance}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Yesterday Section */}
          {yesterdayItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yesterday</Text>
              <View style={styles.cardsList}>
                {yesterdayItems.map((item) => (
                  <View key={item.id} style={styles.transactionCard}>
                    <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDate}>{item.date}</Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={[styles.amountText, { color: item.isPositive ? '#2563EB' : '#EF4444' }]}>
                        {item.amount}
                      </Text>
                      <Text style={styles.balanceText}>{item.balance}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* May 8 Section */}
          {may8Items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>May 8, 2026</Text>
              <View style={styles.cardsList}>
                {may8Items.map((item) => (
                  <View key={item.id} style={styles.transactionCard}>
                    <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDate}>{item.date}</Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={[styles.amountText, { color: item.isPositive ? '#2563EB' : '#EF4444' }]}>
                        {item.amount}
                      </Text>
                      <Text style={styles.balanceText}>{item.balance}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#4C1D95',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 2,
  },
  cardsList: {
    gap: 10,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
