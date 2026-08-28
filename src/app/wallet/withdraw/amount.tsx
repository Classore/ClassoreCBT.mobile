import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WithdrawAmountScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('2,450.00');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Withdraw Amount</AppText>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="bell" size={20} color="#111827" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <AppText style={styles.balanceLabel}>Available Balance</AppText>
          <AppText style={styles.balanceValue}>₦2,450.00</AppText>
        </View>

        <AppText style={styles.sectionTitle}>Enter Amount</AppText>
        
        <View style={styles.inputContainer}>
          <AppText style={styles.currencySymbol}>₦</AppText>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
          />
          {amount.length > 0 && (
            <TouchableOpacity onPress={() => setAmount('')} style={styles.clearBtn}>
              <Feather name="x" size={14} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
        <AppText style={styles.minText}>Minimum withdrawal: ₦100.00</AppText>
      </View>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/wallet/withdraw/bank-details')}>
          <AppText style={styles.primaryBtnText}>Continue <Feather name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 4 }} /></AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? 40 : 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  
  container: { flex: 1, paddingHorizontal: 16 },
  
  balanceCard: { backgroundColor: '#F5F3FF', borderRadius: 16, padding: 20, marginBottom: 24 },
  balanceLabel: { color: '#6B7280', fontSize: 14, marginBottom: 8 },
  balanceValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#6D28D9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 },
  currencySymbol: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginRight: 8 },
  input: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#111827', padding: 0 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  
  minText: { fontSize: 13, color: '#6B7280' },

  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  primaryBtn: { backgroundColor: '#4C1D95', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
