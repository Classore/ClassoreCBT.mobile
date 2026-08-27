import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

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
              {/* Account Information */}
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

              {/* Change Password */}
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

              {/* Security */}
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Feather name="shield" size={18} color="#10B981" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Security</Text>
                  <Text style={styles.itemSubtitle}>Manage 2FA and active devices</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.cardGroup}>
              {/* Notification Preferences */}
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

              {/* Appearance */}
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="sun" size={18} color="#F59E0B" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Appearance</Text>
                  <Text style={styles.itemSubtitle}>Light mode</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Language */}
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="globe" size={18} color="#3B82F6" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Language</Text>
                  <Text style={styles.itemSubtitle}>English</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Privacy & Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
            <View style={styles.cardGroup}>
              {/* Privacy Settings */}
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Privacy Settings</Text>
                  <Text style={styles.itemSubtitle}>Control your privacy and data</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Data Usage */}
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                <View style={[styles.iconBg, { backgroundColor: '#EDE9FE' }]}>
                  <Feather name="hard-drive" size={18} color="#7C3AED" />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Data Usage</Text>
                  <Text style={styles.itemSubtitle}>Manage your storage and data</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
  },
});
