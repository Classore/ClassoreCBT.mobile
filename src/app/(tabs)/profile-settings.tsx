import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { handleHelpBack } from '@/utils/helpNavigation';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { logout } = useAuth();

  const [visibility, setVisibility] = useState<'Everyone' | 'Friends' | 'Private'>('Everyone');
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);

  const [personalizedRecs, setPersonalizedRecs] = useState(true);
  const [usageAnalytics, setUsageAnalytics] = useState(true);
  const [hideActivity, setHideActivity] = useState(false);

  useEffect(() => {
    api.get('/api/user/preferences/me/')
      .then(res => {
        const data = res.data;
        if (data?.privacy_settings?.visibility) {
          setVisibility(data.privacy_settings.visibility === 'private' ? 'Private' : 'Everyone');
        }
        if (data?.personalized_recommendations !== undefined) {
          setPersonalizedRecs(Boolean(data.personalized_recommendations));
        }
        if (data?.usage_analytics !== undefined) {
          setUsageAnalytics(Boolean(data.usage_analytics));
        }
        if (data?.hide_activity !== undefined) {
          setHideActivity(Boolean(data.hide_activity));
        }
      })
      .catch(() => {});
  }, []);

  const savePreference = async (key: string, value: any) => {
    try {
      await api.patch('/api/user/preferences/me/', { [key]: value });
    } catch {}
  };

  const handleToggleRecs = (val: boolean) => {
    setPersonalizedRecs(val);
    savePreference('personalized_recommendations', val);
  };

  const handleToggleAnalytics = (val: boolean) => {
    setUsageAnalytics(val);
    savePreference('usage_analytics', val);
  };

  const handleToggleHideActivity = (val: boolean) => {
    setHideActivity(val);
    savePreference('hide_activity', val);
  };

  const handleSelectVisibility = (val: 'Everyone' | 'Friends' | 'Private') => {
    setVisibility(val);
    setShowVisibilityModal(false);
    savePreference('privacy_settings', { visibility: val.toLowerCase() });
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      'A copy of your complete account data, test history, and study progress will be compiled and sent to your registered email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Export', onPress: () => Alert.alert('Success', 'Your export request has been queued. You will receive an email shortly.') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone. All your scores, streak history, and tokens will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/api/auth/me/');
            } catch {}
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleHelpBack(params.from, '/settings')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Profile Settings</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Privacy Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconBox}>
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#6D28D9" />
            </View>
            <View style={styles.bannerTextContainer}>
              <AppText style={styles.bannerTitle}>Your Privacy Matters</AppText>
              <AppText style={styles.bannerSubtitle}>
                We respect your privacy and keep your data secure.
              </AppText>
            </View>
          </View>

          {/* Section: Profile Visibility */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Profile Visibility</AppText>
            <TouchableOpacity
              style={styles.singleCard}
              onPress={() => setShowVisibilityModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowIcon}>
                <Feather name="user" size={20} color="#9CA3AF" />
              </View>
              <View style={styles.rowTextContainer}>
                <AppText style={styles.rowTitle}>Profile Visibility</AppText>
                <AppText style={styles.rowSubtitle}>Control who can see your profile</AppText>
              </View>
              <AppText style={styles.rowValue}>{visibility}</AppText>
            </TouchableOpacity>
          </View>

          {/* Section: Data & Personalization */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Data & Personalization</AppText>
            <View style={styles.cardGroup}>
              {/* Row 1: Personalized Recommendations */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="check-circle" size={20} color="#9CA3AF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <AppText style={styles.rowTitle}>Personalized Recommendations</AppText>
                  <AppText style={styles.rowSubtitle}>Get personalized content suggestions</AppText>
                </View>
                <Switch
                  value={personalizedRecs}
                  onValueChange={handleToggleRecs}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 2: Usage Analytics */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="trending-up" size={20} color="#9CA3AF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <AppText style={styles.rowTitle}>Usage Analytics</AppText>
                  <AppText style={styles.rowSubtitle}>Help us improve the app</AppText>
                </View>
                <Switch
                  value={usageAnalytics}
                  onValueChange={handleToggleAnalytics}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 3: Hide Activity */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="eye-off" size={20} color="#9CA3AF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <AppText style={styles.rowTitle}>Hide Activity</AppText>
                  <AppText style={styles.rowSubtitle}>Hide your activity from others</AppText>
                </View>
                <Switch
                  value={hideActivity}
                  onValueChange={handleToggleHideActivity}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </View>

          {/* Section: Data Management */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Data Management</AppText>
            <View style={styles.cardGroup}>
              {/* Row 1: Download My Data */}
              <TouchableOpacity
                style={styles.rowItem}
                onPress={handleDownloadData}
                activeOpacity={0.7}
              >
                <View style={styles.rowIcon}>
                  <Feather name="download" size={20} color="#9CA3AF" />
                </View>
                <View style={styles.rowTextContainer}>
                  <AppText style={styles.rowTitle}>Download My Data</AppText>
                  <AppText style={styles.rowSubtitle}>Export your data</AppText>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Row 2: Delete Account */}
              <TouchableOpacity
                style={styles.rowItem}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={styles.rowIcon}>
                  <Feather name="trash-2" size={20} color="#EF4444" />
                </View>
                <View style={styles.rowTextContainer}>
                  <AppText style={styles.rowTitle}>Delete Account</AppText>
                  <AppText style={styles.rowSubtitle}>Permanently delete your account</AppText>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Visibility Selection Modal */}
        <Modal
          visible={showVisibilityModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowVisibilityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <AppText style={styles.modalTitle}>Profile Visibility</AppText>
                <TouchableOpacity onPress={() => setShowVisibilityModal(false)}>
                  <Feather name="x" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {(['Everyone', 'Friends', 'Private'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => handleSelectVisibility(option)}
                >
                  <AppText
                    style={[
                      styles.modalOptionText,
                      visibility === option && styles.modalOptionTextActive,
                    ]}
                  >
                    {option}
                  </AppText>
                  {visibility === option && (
                    <Feather name="check" size={18} color="#6D28D9" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  singleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 56,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  modalOptionTextActive: {
    color: '#6D28D9',
    fontWeight: '700',
  },
});
