import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { walletService } from '@/services/wallet';

interface TransactionItem {
  id: string;
  title: string;
  date: string;
  amount: string;
  balance: string;
  isPositive: boolean;
  section: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  type: 'sent' | 'received' | 'purchase';
}

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Sent' | 'Received' | 'Purchase'>('All');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      // Fetch matching filter directly, or filter on client
      const data = await walletService.getTransactions({ type: activeFilter });
      
      const mapped = data.map((item: any, index: number) => {
        const isPos = item.transaction_type === 'CREDIT' || Number(item.amount) > 0;
        const d = new Date(item.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let sectionName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        if (d.toDateString() === today.toDateString()) {
          sectionName = 'Today';
        } else if (d.toDateString() === yesterday.toDateString()) {
          sectionName = 'Yesterday';
        }

        let typeStr: 'sent' | 'received' | 'purchase' = isPos ? 'received' : 'sent';
        if (item.description?.toLowerCase().includes('purchase')) typeStr = 'purchase';

        return {
          id: String(item.id || index),
          title: item.description || (isPos ? 'Deposit' : 'Withdrawal'),
          date: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
          amount: isPos ? `+${Number(item.amount).toLocaleString()}` : `-${Math.abs(Number(item.amount)).toLocaleString()}`,
          balance: item.balance_after ? `Balance: ${Number(item.balance_after).toLocaleString()}` : '',
          isPositive: isPos,
          section: sectionName,
          icon: isPos ? 'gift' : 'file-text',
          iconBg: isPos ? '#EDE9FE' : '#FFE4E6',
          iconColor: isPos ? '#7C3AED' : '#E11D48',
          type: typeStr,
        };
      });
      setTransactions(mapped);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeFilter]);

  const filters: ('All' | 'Sent' | 'Received' | 'Purchase')[] = ['All', 'Sent', 'Received', 'Purchase'];

  // Group by section
  const sectionsObj = transactions.reduce((acc, curr) => {
    if (!acc[curr.section]) acc[curr.section] = [];
    acc[curr.section].push(curr);
    return acc;
  }, {} as Record<string, TransactionItem[]>);

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
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
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

          {isLoading ? (
            <ActivityIndicator size="large" color="#4C1D95" style={{ marginVertical: 40 }} />
          ) : Object.keys(sectionsObj).length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>No transactions found.</Text>
          ) : (
            Object.keys(sectionsObj).map(sectionTitle => (
              <View key={sectionTitle} style={styles.section}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <View style={styles.cardsList}>
                  {sectionsObj[sectionTitle].map((item) => (
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
                        {!!item.balance && <Text style={styles.balanceText}>{item.balance}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
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
