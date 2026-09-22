import {
  AppText } from '@/components/AppText';
import React,
  { useState,
  useEffect } from 'react';
import { View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { AppSafeArea } from '@/components/AppSafeArea';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { walletService, BankAccount, SupportedBank } from '@/services/wallet';
import { useNotifications } from '@/context/NotificationContext';

export default function BankDetailsScreen() {
  const router = useRouter();
  const { hasUnread } = useNotifications();
  const { amount } = useLocalSearchParams<{ amount: string }>();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Add new state
  const [supportedBanks, setSupportedBanks] = useState<SupportedBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<SupportedBank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isBankModalVisible, setBankModalVisible] = useState(false);
  
  useEffect(() => {
    fetchAccounts();
    fetchSupportedBanks();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await walletService.getSavedBankAccounts();
      setSavedAccounts(accounts);
      if (accounts.length > 0) {
        const defaultAcc = accounts.find(a => a.is_default) || accounts[0];
        if (defaultAcc.id) setSelectedAccountId(defaultAcc.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportedBanks = async () => {
    try {
      const banks = await walletService.getSupportedBanks();
      setSupportedBanks(banks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyAccount = async (acctNum: string) => {
    setAccountNumber(acctNum);
    if (acctNum.length === 10 && selectedBank) {
      try {
        setVerifying(true);
        setAccountName('');
        const res = await walletService.verifyBankAccount(selectedBank.code, acctNum);
        setAccountName(res.account_name);
      } catch (e: any) {
        Alert.alert("Verification Failed", e.response?.data?.error || "Could not verify account number");
      } finally {
        setVerifying(false);
      }
    } else {
      setAccountName('');
    }
  };

  const handleSaveAccount = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      Alert.alert("Incomplete", "Please complete all fields to save bank details");
      return;
    }
    try {
      setSaving(true);
      await walletService.saveBankAccount({
        bank_name: selectedBank.name,
        account_number: accountNumber,
        account_name: accountName,
        is_default: savedAccounts.length === 0 // Make default if first
      });
      setIsAddingNew(false);
      setSelectedBank(null);
      setAccountNumber('');
      setAccountName('');
      fetchAccounts();
    } catch (e) {
      Alert.alert("Error", "Could not save bank account");
    } finally {
      setSaving(false);
    }
  };

  const selectBank = (bank: SupportedBank) => {
    setSelectedBank(bank);
    setBankModalVisible(false);
    if (accountNumber.length === 10) {
      // Re-trigger verification if 10 digits already typed
      handleVerifyAccount(accountNumber);
    }
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (isAddingNew && savedAccounts.length > 0) {
            setIsAddingNew(false);
          } else {
            (router.canGoBack() ? router.back() : router.replace('/'));
          }
        }} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Bank Details</AppText>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
          <Feather name="bell" size={20} color="#111827" />
          {hasUnread && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <AppText style={styles.pageTitle}>Enter Bank Details</AppText>
        
        {loading ? (
          <ActivityIndicator size="large" color="#4C1D95" style={{ marginTop: 40 }} />
        ) : !isAddingNew && savedAccounts.length > 0 ? (
          <>
            <AppText style={styles.pageSubtitle}>Use a saved account or add a new one</AppText>

            <View style={styles.accountsCard}>
              {savedAccounts.map((account, idx) => (
                <View key={account.id}>
                  <TouchableOpacity 
                    style={[styles.savedAccountRow, selectedAccountId === account.id && { backgroundColor: '#F5F3FF' }]}
                    onPress={() => account.id && setSelectedAccountId(account.id)}
                  >
                    <View style={styles.bankIconBg}>
                      <FontAwesome5 name="university" size={16} color="#4C1D95" />
                    </View>
                    <View style={styles.savedAccountInfo}>
                      <AppText style={styles.bankName}>{account.bank_name}</AppText>
                      <AppText style={styles.accountNumber}>{account.account_number} · {account.account_name}</AppText>
                    </View>
                    {account.is_default && (
                      <View style={styles.defaultBadge}>
                        <AppText style={styles.defaultBadgeText}>Default</AppText>
                      </View>
                    )}
                    {selectedAccountId === account.id ? (
                      <Feather name="check-circle" size={20} color="#4C1D95" style={{ marginLeft: 8 }} />
                    ) : (
                      <Feather name="circle" size={20} color="#D1D5DB" style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                  {idx < savedAccounts.length - 1 && <View style={styles.divider} />}
                </View>
              ))}

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
            <AppText style={styles.pageSubtitle}>Link a Nigerian bank account for withdrawals.</AppText>
            
            <View style={styles.formGroup}>
              <AppText style={styles.label}>Bank Name</AppText>
              <TouchableOpacity style={styles.dropdownInput} onPress={() => setBankModalVisible(true)}>
                <AppText style={[styles.dropdownPlaceholder, selectedBank && { color: '#111827' }]}>
                  {selectedBank ? selectedBank.name : 'Select Bank'}
                </AppText>
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
                  maxLength={10}
                  value={accountNumber}
                  onChangeText={handleVerifyAccount}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <AppText style={styles.label}>Account Name</AppText>
              <View style={[styles.textInputContainer, { backgroundColor: '#F9FAFB' }]}>
                {verifying ? (
                  <ActivityIndicator size="small" color="#4C1D95" style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <TextInput 
                    style={[styles.textInput, { color: '#6B7280' }]}
                    placeholder="Account name will appear here"
                    placeholderTextColor="#9CA3AF"
                    value={accountName}
                    editable={false}
                  />
                )}
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
        <TouchableOpacity 
          style={[styles.primaryBtn, (isAddingNew && (!accountName || saving)) && { opacity: 0.7 }, (!isAddingNew && !selectedAccountId) && { opacity: 0.7 }]} 
          onPress={() => {
            if (isAddingNew) {
              handleSaveAccount();
            } else {
              if (!selectedAccountId) return;
              const account = savedAccounts.find(a => a.id === selectedAccountId);
              if (account) {
                router.push({
                  pathname: '/wallet/withdraw/review',
                  params: {
                    amount,
                    bank_id: account.id,
                    bank_name: account.bank_name,
                    account_number: account.account_number,
                    account_name: account.account_name
                  }
                });
              }
            }
          }}
          disabled={isAddingNew ? (!accountName || saving) : !selectedAccountId}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <AppText style={styles.primaryBtnText}>{isAddingNew ? 'Save Bank Account' : 'Next'} <Feather name={isAddingNew ? "check" : "arrow-right"} size={16} color="#FFF" style={{ marginLeft: 4 }} /></AppText>
          )}
        </TouchableOpacity>
      </View>

      {/* Bank Selection Modal */}
      <Modal visible={isBankModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Select Bank</AppText>
              <TouchableOpacity onPress={() => setBankModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={supportedBanks}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.bankItem} onPress={() => selectBank(item)}>
                  <AppText style={styles.bankItemText}>{item.name}</AppText>
                  {selectedBank?.code === item.code && <Feather name="check" size={20} color="#4C1D95" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF', paddingTop: 16 },
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
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  closeBtn: { padding: 4 },
  bankItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  bankItemText: { fontSize: 16, color: '#111827' },
});
