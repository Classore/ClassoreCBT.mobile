import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Platform, TextInput, ScrollView } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BankDetailsScreen() {
  const router = useRouter();
  const [isAddingNew, setIsAddingNew] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (isAddingNew) {
            setIsAddingNew(false);
          } else {
            router.back();
          }
        }} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Bank Details</AppText>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="bell" size={20} color="#111827" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <AppText style={styles.pageTitle}>Enter Bank Details</AppText>
        
        {!isAddingNew ? (
          <>
            <AppText style={styles.pageSubtitle}>Use a saved account or add a new one</AppText>

            <View style={styles.accountsCard}>
              <TouchableOpacity style={styles.savedAccountRow}>
                <View style={styles.bankIconBg}>
                  <FontAwesome5 name="university" size={16} color="#4C1D95" />
                </View>
                <View style={styles.savedAccountInfo}>
                  <AppText style={styles.bankName}>Access Bank</AppText>
                  <AppText style={styles.accountNumber}>1234567890 · John Doe</AppText>
                </View>
                <View style={styles.defaultBadge}>
                  <AppText style={styles.defaultBadgeText}>Default</AppText>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.addAccountRow} onPress={() => setIsAddingNew(true)}>
                <View style={styles.addIconBg}>
                  <Feather name="plus" size={16} color="#4C1D95" />
                </View>
                <AppText style={styles.addAccountText}>Add New Bank Account</AppText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.formGroup}>
              <AppText style={styles.label}>Bank Name</AppText>
              <TouchableOpacity style={styles.dropdownInput}>
                <AppText style={styles.dropdownPlaceholder}>Select Bank</AppText>
                <Feather name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <AppText style={styles.label}>Account Number</AppText>
              <View style={styles.textInputContainer}>
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter account number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <AppText style={styles.label}>Account Name</AppText>
              <View style={styles.textInputContainer}>
                <TextInput 
                  style={styles.textInput}
                  placeholder="Enter account name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color="#6D28D9" style={{ marginTop: 2 }} />
          <AppText style={styles.infoText}>Make sure your account details are correct. Funds will be sent to this account.</AppText>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/wallet/withdraw/review')}>
          <AppText style={styles.primaryBtnText}>{isAddingNew ? 'Continue' : 'Next'} <Feather name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 4 }} /></AppText>
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
  
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: '#4B5563', marginBottom: 24 },

  accountsCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  savedAccountRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  bankIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  savedAccountInfo: { flex: 1 },
  bankName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  accountNumber: { fontSize: 13, color: '#6B7280' },
  defaultBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  defaultBadgeText: { color: '#4C1D95', fontSize: 11, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  
  addAccountRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  addIconBg: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#4C1D95', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  addAccountText: { fontSize: 14, fontWeight: '600', color: '#4C1D95' },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  dropdownInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  textInputContainer: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  textInput: { fontSize: 14, color: '#111827', padding: 0 },

  infoBox: { flexDirection: 'row', backgroundColor: '#F5F3FF', padding: 16, borderRadius: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 13, color: '#6D28D9', marginLeft: 12, lineHeight: 20 },

  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  primaryBtn: { backgroundColor: '#4C1D95', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
