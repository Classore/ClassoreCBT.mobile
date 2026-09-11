import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { api } from '@/services/api';

export default function NotificationPreferencesScreen() {
  const router = useRouter();

  // Test & Practice
  const [testReminders, setTestReminders] = useState(true);
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [testResults, setTestResults] = useState(true);
  const [performanceUpdates, setPerformanceUpdates] = useState(true);

  // Learning
  const [weakTopicReminders, setWeakTopicReminders] = useState(true);
  const [dailyPracticeReminder, setDailyPracticeReminder] = useState(true);
  const [newStudyRecs, setNewStudyRecs] = useState(false);

  // Account
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [announcements, setAnnouncements] = useState(true);

  useEffect(() => {
    api.get('/api/user/preferences/me/')
      .then(res => {
        const data = res.data;
        if (data?.notification_settings) {
          const ns = data.notification_settings;
          if (ns.test_reminders !== undefined) setTestReminders(Boolean(ns.test_reminders));
          if (ns.practice_reminders !== undefined) setPracticeReminders(Boolean(ns.practice_reminders));
          if (ns.test_results !== undefined) setTestResults(Boolean(ns.test_results));
          if (ns.performance_updates !== undefined) setPerformanceUpdates(Boolean(ns.performance_updates));
          if (ns.weak_topic_reminders !== undefined) setWeakTopicReminders(Boolean(ns.weak_topic_reminders));
          if (ns.daily_practice_reminder !== undefined) setDailyPracticeReminder(Boolean(ns.daily_practice_reminder));
          if (ns.new_study_recommendations !== undefined) setNewStudyRecs(Boolean(ns.new_study_recommendations));
          if (ns.security_alerts !== undefined) setSecurityAlerts(Boolean(ns.security_alerts));
          if (ns.announcements !== undefined) setAnnouncements(Boolean(ns.announcements));
        }
      })
      .catch(() => {});
  }, []);

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await api.patch('/api/user/preferences/me/', {
        notification_settings: {
          [key]: value,
        },
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Notification Preferences</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconBox}>
              <Feather name="bell" size={20} color="#6D28D9" />
            </View>
            <View style={styles.bannerTextContainer}>
              <AppText style={styles.bannerTitle}>Stay updated your way</AppText>
              <AppText style={styles.bannerSubtitle}>
                Choose what notifications you want to receive.
              </AppText>
            </View>
          </View>

          {/* Section: Test & Practice */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Test & Practice</AppText>
            <View style={styles.cardGroup}>
              {/* Row 1: Test reminders */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="bell" size={18} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Test reminders</AppText>
                <Switch
                  value={testReminders}
                  onValueChange={val => {
                    setTestReminders(val);
                    saveSetting('test_reminders', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 2: Practice reminders */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="bell" size={18} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Practice reminders</AppText>
                <Switch
                  value={practiceReminders}
                  onValueChange={val => {
                    setPracticeReminders(val);
                    saveSetting('practice_reminders', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 3: Test results */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="check-circle" size={18} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Test results</AppText>
                <Switch
                  value={testResults}
                  onValueChange={val => {
                    setTestResults(val);
                    saveSetting('test_results', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 4: Performance updates */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="bell" size={18} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Performance updates</AppText>
                <Switch
                  value={performanceUpdates}
                  onValueChange={val => {
                    setPerformanceUpdates(val);
                    saveSetting('performance_updates', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </View>

          {/* Section: Learning */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Learning</AppText>
            <View style={styles.cardGroup}>
              {/* Row 1: Weak-topic reminders */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons name="target" size={20} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Weak-topic reminders</AppText>
                <Switch
                  value={weakTopicReminders}
                  onValueChange={val => {
                    setWeakTopicReminders(val);
                    saveSetting('weak_topic_reminders', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 2: Daily practice reminder */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <Feather name="calendar" size={18} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Daily practice reminder</AppText>
                <Switch
                  value={dailyPracticeReminder}
                  onValueChange={val => {
                    setDailyPracticeReminder(val);
                    saveSetting('daily_practice_reminder', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 3: New study recommendations */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>New study recommendations</AppText>
                <Switch
                  value={newStudyRecs}
                  onValueChange={val => {
                    setNewStudyRecs(val);
                    saveSetting('new_study_recommendations', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </View>

          {/* Section: Account */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Account</AppText>
            <View style={styles.cardGroup}>
              {/* Row 1: Account / security alerts */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Account / security alerts</AppText>
                <Switch
                  value={securityAlerts}
                  onValueChange={val => {
                    setSecurityAlerts(val);
                    saveSetting('security_alerts', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              <View style={styles.divider} />

              {/* Row 2: Announcements */}
              <View style={styles.rowItem}>
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#6D28D9" />
                </View>
                <AppText style={styles.rowTitle}>Announcements</AppText>
                <Switch
                  value={announcements}
                  onValueChange={val => {
                    setAnnouncements(val);
                    saveSetting('announcements', val);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#6D28D9' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          </View>

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
    fontFamily: 'PlusJakartaSans-Bold',
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
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans-Bold',
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
    paddingVertical: 18,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 54,
  },
});
