import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<any>({});

  useEffect(() => {
    api.get('/api/user/preferences/me/')
       .then(res => setPreferences(res.data))
       .catch(err => console.warn(err));
  }, []);

  const updatePref = async (key: string, value: any) => {
    try {
      setPreferences((prev: any) => ({ ...prev, [key]: value }));
      await api.patch('/api/user/preferences/me/', { [key]: value });
    } catch(err) {
      console.warn(err);
    }
  };

  const handleSecurity = () => {
    const isEnabled = preferences?.two_factor_auth || false;
    Alert.alert('Security (2FA)', 'Toggle Two-Factor Authentication?', [
      { text: 'Cancel', style: 'cancel' },
      { text: isEnabled ? 'Disable' : 'Enable', onPress: () => updatePref('two_factor_auth', !isEnabled) }
    ]);
  };

  const handleAppearance = () => {
    Alert.alert('Appearance', 'Select Theme', [
      { text: 'Light Mode', onPress: () => updatePref('appearance', 'light') },
      { text: 'Dark Mode', onPress: () => updatePref('appearance', 'dark') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Select Language', [
      { text: 'English', onPress: () => updatePref('language', 'en') },
      { text: 'French', onPress: () => updatePref('language', 'fr') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Settings', 'Your profile visibility', [
      { text: 'Public', onPress: () => updatePref('privacy_settings', { visibility: 'public' }) },
      { text: 'Private', onPress: () => updatePref('privacy_settings', { visibility: 'private' }) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleDataUsage = () => {
    Alert.alert('Data Usage', 'Select Data Saver mode', [
      { text: 'Standard', onPress: () => updatePref('data_usage', 'standard') },
      { text: 'Data Saver', onPress: () => updatePref('data_usage', 'saver') },
      { text: 'Cancel', style: 'cancel' }
    ]);
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section: Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="user" size={18} color="#3B82F6" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Account Information</Text>
                  <Text style={styles.itemSubtitle}>View and manage your account</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => router.push('/auth/reset-password')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="lock" size={18} color="#3B82F6" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Change Password</Text>
                  <Text style={styles.itemSubtitle}>Update your password</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleSecurity}>
                <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Feather name="shield" size={18} color="#10B981" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Security</Text>
                  <Text style={styles.itemSubtitle}>{preferences?.two_factor_auth ? '2FA is Enabled' : 'Manage 2FA and active devices'}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBg, { backgroundColor: '#EDE9FE' }]}>
                  <Feather name="bell" size={18} color="#7C3AED" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Notification Preferences</Text>
                  <Text style={styles.itemSubtitle}>Customize your notifications</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleAppearance}>
                <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="sun" size={18} color="#F59E0B" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Appearance</Text>
                  <Text style={styles.itemSubtitle}>{preferences?.appearance === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleLanguage}>
                <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="globe" size={18} color="#3B82F6" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Language</Text>
                  <Text style={styles.itemSubtitle}>{preferences?.language === 'fr' ? 'French' : 'English'}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Privacy & Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
            <View style={styles.cardGroup}>
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handlePrivacy}>
                <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Privacy Settings</Text>
                  <Text style={styles.itemSubtitle}>{preferences?.privacy_settings?.visibility === 'public' ? 'Public Profile' : 'Private Profile'}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleDataUsage}>
                <View style={[styles.iconBg, { backgroundColor: '#EDE9FE' }]}>
                  <Feather name="hard-drive" size={18} color="#7C3AED" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Data Usage</Text>
                  <Text style={styles.itemSubtitle}>{preferences?.data_usage === 'saver' ? 'Data Saver Mode On' : 'Standard Data Usage'}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 12, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  headerButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14.5, fontWeight: '800', color: '#111827', marginBottom: 10, marginLeft: 4 },
  cardGroup: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  iconBg: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  itemTextContainer: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  itemSubtitle: { fontSize: 11.5, color: '#6B7280' },
});
