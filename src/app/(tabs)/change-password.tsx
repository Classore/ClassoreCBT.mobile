import React, { useState, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';
import { api } from '@/services/api';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Criteria validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (hasUppercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    return score;
  }, [newPassword, hasUppercase, hasNumber, hasSpecial]);

  const strengthInfo = useMemo(() => {
    if (!newPassword) return { label: 'Empty', color: '#9CA3AF' };
    if (strengthScore <= 2) return { label: 'Weak', color: '#EF4444' };
    if (strengthScore === 3) return { label: 'Fair', color: '#F59E0B' };
    if (strengthScore === 4) return { label: 'Strong', color: '#10B981' };
    return { label: 'Very Strong', color: '#059669' };
  }, [newPassword, strengthScore]);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleUpdatePassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      const msg = 'Please enter your current password.';
      setErrorMessage(msg);
      showAlert('Required', msg);
      return;
    }
    if (!newPassword) {
      const msg = 'Please enter your new password.';
      setErrorMessage(msg);
      showAlert('Required', msg);
      return;
    }
    if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecial) {
      const msg = 'Please satisfy all required password security conditions (8+ characters, 1 uppercase, 1 number, 1 special character).';
      setErrorMessage(msg);
      showAlert('Password Criteria', msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = 'New password and confirmation do not match.';
      setErrorMessage(msg);
      showAlert('Mismatch', msg);
      return;
    }

    setUpdating(true);
    try {
      await api.post('/api/auth/change-password/', {
        old_password: currentPassword,
        new_password: newPassword,
      });

      const msg = 'Your password has been successfully updated.';
      setSuccessMessage(msg);
      showAlert('Password Changed', msg, () => handleHelpBack(params.from, '/settings'));
    } catch (error: any) {
      const data = error?.response?.data;
      let errMsg = 'Failed to change password. Please check your current password and try again.';
      if (data) {
        if (typeof data === 'string') {
          errMsg = data;
        } else if (data.message) {
          errMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else if (data.detail) {
          errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data.old_password && Array.isArray(data.old_password)) {
          errMsg = data.old_password[0];
        } else if (data.new_password && Array.isArray(data.new_password)) {
          errMsg = data.new_password[0];
        } else if (error.message) {
          errMsg = error.message;
        }
      }
      setErrorMessage(errMsg);
      showAlert('Update Failed', errMsg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/settings')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconBox}>
              <Feather name="lock" size={18} color="#7C3AED" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Ensure your password is strong</Text>
              <Text style={styles.bannerSubtitle}>
                Use a combination of letters, numbers and special characters.
              </Text>
            </View>
          </View>

          {/* Current Password Field */}
          <Text style={styles.fieldLabel}>Current Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity
              onPress={() => setShowCurrent(!showCurrent)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={showCurrent ? 'eye' : 'eye-off'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* New Password Field */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNew(!showNew)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={showNew ? 'eye' : 'eye-off'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Password Strength Meter */}
          <View style={styles.strengthRow}>
            <Text style={styles.strengthLabelText}>Password Strength: </Text>
            <Text style={[styles.strengthValueText, { color: strengthInfo.color }]}>
              {strengthInfo.label}
            </Text>
          </View>

          <View style={styles.meterContainer}>
            {[1, 2, 3, 4, 5].map((seg) => {
              const isFilled = strengthScore >= seg;
              return (
                <View
                  key={seg}
                  style={[
                    styles.meterSegment,
                    {
                      backgroundColor: isFilled ? strengthInfo.color : '#E5E7EB',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Confirm New Password Field */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Confirm New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name={showConfirm ? 'eye' : 'eye-off'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Checklist Card */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Password must contain:</Text>

            <View style={styles.checklistItem}>
              <Ionicons
                name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={hasMinLength ? '#10B981' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.checklistText,
                  hasMinLength && styles.checklistTextSuccess,
                ]}
              >
                At least 8 characters
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons
                name={hasUppercase ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={hasUppercase ? '#10B981' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.checklistText,
                  hasUppercase && styles.checklistTextSuccess,
                ]}
              >
                One uppercase letter
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons
                name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={hasNumber ? '#10B981' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.checklistText,
                  hasNumber && styles.checklistTextSuccess,
                ]}
              >
                One number
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons
                name={hasSpecial ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={hasSpecial ? '#10B981' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.checklistText,
                  hasSpecial && styles.checklistTextSuccess,
                ]}
              >
                One special character
              </Text>
            </View>
          </View>

          {/* Error & Success Banners */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBanner}>
              <Feather name="check-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, updating && { opacity: 0.8 }]}
            activeOpacity={0.85}
            onPress={handleUpdatePassword}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>

          {/* Switch to Add Password */}
          <TouchableOpacity
            style={styles.switchRow}
            activeOpacity={0.7}
            onPress={() => navigateWithFrom('/(tabs)/add-password', '/(tabs)/change-password')}
          >
            <Text style={styles.switchText}>
              Signed in with Google or social login?{' '}
              <Text style={styles.switchTextBold}>Set / Add Password</Text>
            </Text>
          </TouchableOpacity>

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 110 }} />
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
    backgroundColor: '#FFFFFF',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Banner
  bannerCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
  },

  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#111827',
  },

  // Strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  strengthLabelText: {
    fontSize: 13,
    color: '#6B7280',
  },
  strengthValueText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  meterContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  meterSegment: {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
  },

  // Checklist
  checklistCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B21B6',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  checklistText: {
    fontSize: 13.5,
    color: '#4B5563',
    marginLeft: 10,
    fontWeight: '500',
  },
  checklistTextSuccess: {
    color: '#111827',
    fontWeight: '600',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  errorBannerText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13.5,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  successBannerText: {
    flex: 1,
    color: '#065F46',
    fontSize: 13.5,
    fontWeight: '600',
  },

  updateButton: {
    backgroundColor: '#4C1D95',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  switchTextBold: {
    color: '#6D28D9',
    fontWeight: '700',
  },
});
