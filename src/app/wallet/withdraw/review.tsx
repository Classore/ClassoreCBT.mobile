import { AppText } from '@/components/AppText';
import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReviewDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Review Details</AppText>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="bell" size={20} color="#111827" />
          <View style={styles.notificationDot} />
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
            <AppText style={styles.detailValue}>₦2,450.00</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Fee</AppText>
            <AppText style={styles.detailValue}>₦100.00</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, styles.highlightText]}>You Will Receive</AppText>
            <AppText style={[styles.detailValue, styles.highlightText]}>₦2,350.00</AppText>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Bank</AppText>
            <AppText style={styles.detailValue}>Access Bank</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Account Number</AppText>
            <AppText style={styles.detailValue}>1234567890</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <AppText style={styles.detailLabel}>Account Name</AppText>
            <AppText style={styles.detailValue}>John Doe</AppText>
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
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/wallet')}>
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
