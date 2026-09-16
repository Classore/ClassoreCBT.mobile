import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';

interface DeviceItem {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  type: 'phone' | 'laptop' | 'tablet';
}

export default function SecurityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { logout } = useAuth();

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: 'dev-1',
      name: 'iPhone 14 Pro',
      location: 'Lagos, Nigeria',
      lastActive: 'This device',
      isCurrent: true,
      type: 'phone',
    },
    {
      id: 'dev-2',
      name: 'Chrome / Windows',
      location: 'Lagos, Nigeria',
      lastActive: '2 months ago',
      isCurrent: false,
      type: 'laptop',
    },
    {
      id: 'dev-3',
      name: 'iPad (5th Gen)',
      location: 'Ibadan, Nigeria',
      lastActive: '3 months ago',
      isCurrent: false,
      type: 'tablet',
    },
  ]);

  useEffect(() => {
    api.get('/api/user/preferences/me/')
      .then(res => {
        const data = res.data;
        if (data?.biometric_login !== undefined) {
          setBiometricEnabled(Boolean(data.biometric_login));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleBiometric = async (val: boolean) => {
    setBiometricEnabled(val);
    try {
      await api.patch('/api/user/preferences/me/', { biometric_login: val });
    } catch {}
  };

  const handleDeviceMenu = (device: DeviceItem) => {
    Alert.alert(
      device.name,
      `Location: ${device.location}\nStatus: ${device.isCurrent ? 'Current active session' : device.lastActive}`,
      [
        ...(device.isCurrent
          ? []
          : [
              {
                text: 'Revoke Access',
                style: 'destructive' as const,
                onPress: () => {
                  setDevices(prev => prev.filter(d => d.id !== device.id));
                  Alert.alert('Access Revoked', `${device.name} has been signed out.`);
                },
              },
            ]),
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleLogoutThisDevice = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const renderDeviceIcon = (type: DeviceItem['type']) => {
    switch (type) {
      case 'phone':
        return <Feather name="smartphone" size={20} color="#6D28D9" />;
      case 'laptop':
        return <MaterialCommunityIcons name="google-chrome" size={20} color="#6B7280" />;
      case 'tablet':
        return <Feather name="tablet" size={20} color="#6D28D9" />;
      default:
        return <Feather name="hard-drive" size={20} color="#6D28D9" />;
    }
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
          <AppText style={styles.headerTitle}>Security</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Account Security */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Account Security</AppText>

            {/* Card 1: Biometrics */}
            <View style={styles.securityCard}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="face-recognition" size={22} color="#6D28D9" />
              </View>
              <View style={styles.infoContainer}>
                <AppText style={styles.cardTitle}>Face ID / Biometric Login</AppText>
                <AppText style={styles.cardSubtitle}>Use biometrics to log in</AppText>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Card 2: Change Password */}
            <TouchableOpacity
              style={styles.securityCard}
              onPress={() => navigateWithFrom('/(tabs)/change-password', '/(tabs)/security')}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="key-outline" size={22} color="#6D28D9" />
              </View>
              <View style={styles.infoContainer}>
                <AppText style={styles.cardTitle}>Change Password</AppText>
                <AppText style={styles.cardSubtitle}>Update your password regularly</AppText>
              </View>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Section: List of device used */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>List of device used</AppText>
            <View style={styles.devicesCardGroup}>
              {devices.map((device, index) => (
                <React.Fragment key={device.id}>
                  <View style={styles.deviceRow}>
                    <View style={styles.deviceIconBox}>
                      {renderDeviceIcon(device.type)}
                    </View>
                    <View style={styles.deviceInfo}>
                      <AppText style={styles.deviceName}>{device.name}</AppText>
                      <View style={styles.deviceLocationRow}>
                        <AppText style={styles.deviceLocation}>{device.location} • </AppText>
                        <AppText
                          style={[
                            styles.deviceStatus,
                            device.isCurrent && styles.deviceStatusCurrent,
                          ]}
                        >
                          {device.lastActive}
                        </AppText>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => handleDeviceMenu(device)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Feather name="more-vertical" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  {index < devices.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Bottom Action: Log out of this device */}
          <TouchableOpacity
            style={styles.logoutCard}
            onPress={handleLogoutThisDevice}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={20} color="#DC2626" style={{ marginRight: 10 }} />
            <AppText style={styles.logoutText}>Log out of this device</AppText>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  iconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  devicesCardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  deviceIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  deviceLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  deviceLocation: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  deviceStatus: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  deviceStatusCurrent: {
    color: '#10B981',
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 58,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
