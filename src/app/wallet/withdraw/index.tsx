import { AppText } from '@/components/AppText';
import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/context/NotificationContext';

export default function BankTransferScreen() {
  const router = useRouter();
  const { hasUnread } = useNotifications();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Bank Transfer</AppText>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
          <Feather name="bell" size={20} color="#111827" />
          {hasUnread && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Token Balance Card */}
        <LinearGradient colors={['#5b21b6', '#7c3aed']} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.balanceContent}>
            <AppText style={styles.balanceLabel}>My Token Balance</AppText>
            <View style={styles.balanceRow}>
              <Image source={require('../../../../assets/images/naira-token-coin.png')} style={styles.tokenIcon} contentFit="contain" />
              <AppText style={styles.balanceValue}>2,450</AppText>
            </View>
            <AppText style={styles.fiatValue}>≈ ₦2,450.00</AppText>
          </View>
          <View style={styles.walletImageContainer}>
            <Image source={require('../../../../assets/images/wallet-3d-cards.png')} style={styles.walletImage} contentFit="contain" />
          </View>
        </LinearGradient>

        <AppText style={styles.sectionTitle}>Choose Withdrawal Method</AppText>

        {/* Method Option */}
        <TouchableOpacity style={styles.methodCard} activeOpacity={0.7} onPress={() => router.push('/wallet/withdraw/amount')}>
          <View style={styles.methodIconBg}>
            <FontAwesome5 name="university" size={20} color="#4C1D95" />
          </View>
          <View style={styles.methodContent}>
            <AppText style={styles.methodTitle}>Bank Transfer</AppText>
            <AppText style={styles.methodDesc}>Withdraw directly to your bank account</AppText>
          </View>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/wallet/withdraw/amount')}>
          <AppText style={styles.primaryBtnText}>Next <Feather name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 4 }} /></AppText>
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
  
  balanceCard: { borderRadius: 20, padding: 24, marginBottom: 32, overflow: 'hidden', flexDirection: 'row', position: 'relative' },
  balanceContent: { flex: 1, zIndex: 2 },
  balanceLabel: { color: '#E0E7FF', fontSize: 14, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tokenIcon: { width: 24, height: 24, marginRight: 8 },
  balanceValue: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  fiatValue: { color: '#E0E7FF', fontSize: 14 },
  walletImageContainer: { position: 'absolute', right: -10, top: 0, width: 140, height: 140, zIndex: 1 },
  walletImage: { width: '100%', height: '100%' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#6D28D9' },
  methodIconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  methodContent: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  methodDesc: { fontSize: 13, color: '#6B7280' },

  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  primaryBtn: { backgroundColor: '#4C1D95', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
