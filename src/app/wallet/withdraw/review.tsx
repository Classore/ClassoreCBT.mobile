import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { walletService } from '@/services/wallet';
import { useNotifications } from '@/context/NotificationContext';

export default function ReviewDetailsScreen() {
  const router = useRouter();
  const { hasUnread } = useNotifications();
  const { amount, bank_id, bank_name, account_number, account_name } = useLocalSearchParams<{
    amount: string;
    bank_id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
  }>();

  const [submitting, setSubmitting] = useState(false);

  const rawAmount = amount ? Number(amount) : 0;
  const fee = 100;
  const receiveAmount = rawAmount - fee;

  const handleSubmit = async () => {
    if (!bank_id || !rawAmount) return;
    try {
      setSubmitting(true);
      await walletService.requestWithdrawal(rawAmount, Number(bank_id));
      Alert.alert(
        "Withdrawal Successful",
        "Your withdrawal request has been submitted successfully.",
        [{ text: "OK", onPress: () => router.replace('/wallet') }]
      );
    } catch (error: any) {
      Alert.alert(
        "Withdrawal Failed",
        error.response?.data?.error || "Could not process withdrawal request at this time."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Review Details</AppText>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
          <Feather name="bell" size={20} color="#111827" />
          {hasUnread && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <AppText style={styles.pageTitle}>Review Details</AppText>
        
        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Method</AppText>
            <AppText style={styles.detailValue}>Bank Transfer</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Amount</AppText>
            <AppText style={styles.detailValue}>₦{rawAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Fee</AppText>
            <AppText style={styles.detailValue}>₦{fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, styles.highlightText]}>You Will Receive</AppText>
            <AppText style={[styles.detailValue, styles.highlightText]}>₦{receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</AppText>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Bank</AppText>
            <AppText style={styles.detailValue}>{bank_name}</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Account Number</AppText>
            <AppText style={styles.detailValue}>{account_number}</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Account Name</AppText>
            <AppText style={styles.detailValue}>{account_name}</AppText>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Feather name="info" size={16} color="#6D28D9" style={{ marginTop: 2 }} />
          <AppText style={styles.infoText}>Please review your details carefully before submitting your request.</AppText>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
             <ActivityIndicator color="#FFF" />
          ) : (
             <AppText style={styles.primaryBtnText}>Submit Request <Feather name="check" size={16} color="#FFF" style={{ marginLeft: 4 }} /></AppText>
          )}
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
  
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 },

  detailsCard: { backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  highlightText: { color: '#6D28D9', fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },

  infoBox: { flexDirection: 'row', backgroundColor: '#F5F3FF', padding: 16, borderRadius: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 13, color: '#6D28D9', marginLeft: 12, lineHeight: 20 },

  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  primaryBtn: { backgroundColor: '#4C1D95', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
