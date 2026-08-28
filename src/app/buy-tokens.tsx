import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentService } from '@/services/payment';
import { useAuth } from '@/context/AuthContext';

export default function BuyTokensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, refreshUser } = useAuth();

  const [selectedPack, setSelectedPack] = useState(
    (params.packName as string) || 'Student Pack'
  );
  const [selectedPayment, setSelectedPayment] = useState<'paystack' | 'flutterwave' | 'applepay'>('paystack');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState('₦1,000');
  const [loading, setLoading] = useState(false);

  const quickAmounts = ['₦1,000', '₦2,500', '₦5,000', '₦10,000'];

  const handleProceed = async () => {
    if (!params.packId) {
      Alert.alert('Error', 'Please select a package first.');
      return;
    }

    Alert.alert(
      'Payment Confirmation',
      `Proceeding to pay with ${selectedPayment.toUpperCase()} for ${selectedPack}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: async () => {
            setLoading(true);
            try {
              if (selectedPayment === 'paystack') {
                const data = await paymentService.initializePaystack(Number(params.packId));
                if (data.authorization_url) {
                  await Linking.openURL(data.authorization_url);
                  // Optionally refresh user balance when returning
                  setTimeout(() => refreshUser(), 5000);
                } else {
                  Alert.alert('Error', 'No authorization URL returned.');
                }
              } else if (selectedPayment === 'applepay') {
                // Mock StoreKit 2 transaction verification
                const data = await paymentService.verifyAppleIAP('mock_tx_id_12345');
                Alert.alert('Success', data.message || 'Token purchase completed successfully!', [
                  { text: 'View Wallet', onPress: () => { refreshUser(); router.replace('/wallet'); } }
                ]);
              } else {
                Alert.alert('Notice', 'Payment method not yet implemented.');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to initialize payment.');
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
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
          <Text style={styles.headerTitle}>Buy Token</Text>
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
          {/* Current Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <View style={styles.balanceRow}>
              <Image 
                source={require('../../assets/images/naira-token-coin.png')} 
                style={styles.coinImageSmall} 
                contentFit="contain" 
              />
              <Text style={styles.balanceNumber}>2,450</Text>
            </View>
          </View>

          {/* 1. Choose a Token Package */}
          <Text style={styles.sectionHeader}>1. Choose a Token Package</Text>
          <TouchableOpacity 
            style={styles.packageSelectorCard}
            onPress={() => router.push('/token-packages')}
            activeOpacity={0.8}
          >
            <View style={styles.packageIconBg}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.packageInfo}>
              <Text style={styles.packageName}>{selectedPack}</Text>
              <Text style={styles.packageTokens}>1,000 Tokens</Text>
            </View>
            <View style={styles.packagePriceRow}>
              <Text style={styles.packagePrice}>₦1,000</Text>
              <Feather name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* 2. Select Payment Method */}
          <Text style={styles.sectionHeader}>2. Select Payment Method</Text>
          <View style={styles.paymentMethodsList}>
            {/* Paystack */}
            <TouchableOpacity 
              style={[
                styles.paymentOptionCard, 
                selectedPayment === 'paystack' && styles.paymentOptionCardSelected
              ]}
              onPress={() => setSelectedPayment('paystack')}
              activeOpacity={0.8}
            >
              <Image 
                source={require('../../assets/images/paystack-logo.png')} 
                style={styles.paymentLogoImage} 
                contentFit="contain" 
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>
                  Paystack <Text style={styles.paymentSub}>(Cards, Bank Transfer)</Text>
                </Text>
              </View>
              <View style={[
                styles.radioCircle, 
                selectedPayment === 'paystack' && styles.radioCircleSelected
              ]}>
                {selectedPayment === 'paystack' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Flutterwave */}
            <TouchableOpacity 
              style={[
                styles.paymentOptionCard, 
                selectedPayment === 'flutterwave' && styles.paymentOptionCardSelected
              ]}
              onPress={() => setSelectedPayment('flutterwave')}
              activeOpacity={0.8}
            >
              <Image 
                source={require('../../assets/images/flutterwave-logo.png')} 
                style={styles.paymentLogoImage} 
                contentFit="contain" 
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>
                  Flutterwave <Text style={styles.paymentSub}>(Cards, Bank Transfer)</Text>
                </Text>
              </View>
              <View style={[
                styles.radioCircle, 
                selectedPayment === 'flutterwave' && styles.radioCircleSelected
              ]}>
                {selectedPayment === 'flutterwave' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Apple Pay */}
            <TouchableOpacity 
              style={[
                styles.paymentOptionCard, 
                selectedPayment === 'applepay' && styles.paymentOptionCardSelected
              ]}
              onPress={() => setSelectedPayment('applepay')}
              activeOpacity={0.8}
            >
              <Image 
                source={require('../../assets/images/apple-pay-logo.png')} 
                style={styles.paymentLogoImage} 
                contentFit="contain" 
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>Apple Pay</Text>
              </View>
              <View style={[
                styles.radioCircle, 
                selectedPayment === 'applepay' && styles.radioCircleSelected
              ]}>
                {selectedPayment === 'applepay' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* 3. Enter Amount (Optional) */}
          <Text style={styles.sectionHeader}>3. Enter Amount (Optional)</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount in ₦"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmountsRow}>
            {quickAmounts.map((amt) => {
              const isSelected = selectedQuickAmount === amt && !customAmount;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmountPill, isSelected && styles.quickAmountPillSelected]}
                  onPress={() => {
                    setSelectedQuickAmount(amt);
                    setCustomAmount('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                    {amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>You will receive</Text>
              <View style={styles.receiveValueRow}>
                <Image 
                  source={require('../../assets/images/naira-token-coin.png')} 
                  style={styles.coinImageTiny} 
                  contentFit="contain" 
                />
                <Text style={styles.receiveTokensText}>1,000 Tokens</Text>
              </View>
            </View>

            <View style={[styles.summaryCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.totalAmountText}>₦1,000.00</Text>
            </View>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity 
            style={styles.proceedButton}
            onPress={handleProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

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

  // Balance Card
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImageSmall: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  coinImageTiny: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  balanceNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    marginTop: 4,
  },

  // 1. Package Selector
  packageSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    marginBottom: 20,
  },
  packageIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  packageTokens: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },

  // 2. Payment Methods
  paymentMethodsList: {
    gap: 10,
    marginBottom: 20,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  paymentOptionCardSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
  },
  paymentLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  paymentSub: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#7C3AED',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },

  // 3. Amount Inputs
  amountInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  amountInput: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAmountPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  quickAmountPillSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  quickAmountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  quickAmountTextSelected: {
    color: '#7C3AED',
  },

  // Summary Box
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  receiveValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiveTokensText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  totalAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  // Proceed Button
  proceedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4C1D95',
    borderRadius: 16,
    paddingVertical: 16,
  },
  proceedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
