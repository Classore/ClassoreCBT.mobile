import React, { useState } from 'react';
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

interface NotificationItem {
  id: string;
  type: 'test' | 'achievement' | 'streak' | 'contest' | 'token' | 'ai' | 'system';
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  section: 'Today' | 'Earlier';
  icon: string;
  iconBg: string;
  iconColor: string;
  iconFamily: 'feather' | 'ionicons' | 'material';
}

const NOTIFICATIONS_DATA: NotificationItem[] = [
  {
    id: '1',
    type: 'test',
    title: 'Test Completed',
    message: "Great job! You've completed JAMB UTME...",
    time: '10:30 AM',
    isUnread: true,
    section: 'Today',
    icon: 'clipboard',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    iconFamily: 'feather',
  },
  {
    id: '2',
    type: 'achievement',
    title: 'New Achievement',
    message: 'Congratulations! You earned the "Consistent Learner" badge.',
    time: '09:15 AM',
    isUnread: true,
    section: 'Today',
    icon: 'medal-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    iconFamily: 'material',
  },
  {
    id: '3',
    type: 'streak',
    title: 'Streak Reminder',
    message: 'Keep it up! Your 7-day streak is active. Don...',
    time: '08:00 AM',
    isUnread: true,
    section: 'Today',
    icon: 'fire',
    iconBg: '#FFE4E6',
    iconColor: '#E11D48',
    iconFamily: 'material',
  },
  {
    id: '4',
    type: 'contest',
    title: 'Contest Update',
    message: 'Math Challenge results are out. Check your ranking now!',
    time: 'Yesterday',
    isUnread: false,
    section: 'Today',
    icon: 'trophy-outline',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    iconFamily: 'ionicons',
  },
  {
    id: '5',
    type: 'token',
    title: 'Token Purchase Successful',
    message: 'You have successfully purchased 1,000 tokens.',
    time: 'Yesterday',
    isUnread: false,
    section: 'Today',
    icon: 'cube-outline',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    iconFamily: 'ionicons',
  },
  {
    id: '6',
    type: 'ai',
    title: 'AI Assessment Completed',
    message: 'Your AI Writing Assessment is ready. View your results now.',
    time: 'Yesterday',
    isUnread: false,
    section: 'Today',
    icon: 'auto-fix',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    iconFamily: 'material',
  },
  {
    id: '7',
    type: 'system',
    title: 'System Maintenance',
    message: 'We will be performing scheduled maintenance on Aug 8 2026.',
    time: 'Aug, 8',
    isUnread: false,
    section: 'Earlier',
    icon: 'settings',
    iconBg: '#F3F4F6',
    iconColor: '#6B7280',
    iconFamily: 'feather',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'Unread') return item.isUnread;
    return true;
  });

  const todayItems = filteredNotifications.filter(item => item.section === 'Today');
  const earlierItems = filteredNotifications.filter(item => item.section === 'Earlier');

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const renderIcon = (item: NotificationItem) => {
    if (item.iconFamily === 'material') {
      return <MaterialCommunityIcons name={item.icon as any} size={20} color={item.iconColor} />;
    }
    if (item.iconFamily === 'ionicons') {
      return <Ionicons name={item.icon as any} size={20} color={item.iconColor} />;
    }
    return <Feather name={item.icon as any} size={18} color={item.iconColor} />;
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <Feather name="settings" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterPill, filter === 'All' && styles.filterPillActive]}
              onPress={() => setFilter('All')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterPill, filter === 'Unread' && styles.filterPillActive]}
              onPress={() => setFilter('Unread')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === 'Unread' && styles.filterTextActive]}>
                Unread
              </Text>
            </TouchableOpacity>
          </View>

          {/* Today Section */}
          {todayItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today</Text>
              <View style={styles.cardsList}>
                {todayItems.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.notificationCard} activeOpacity={0.7}>
                    <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    <View style={styles.contentWrapper}>
                      <View style={styles.topLine}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={styles.timeRow}>
                          <Text style={styles.timeText}>{item.time}</Text>
                          {item.isUnread && <View style={styles.unreadDot} />}
                        </View>
                      </View>
                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Earlier Section */}
          {earlierItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earlier</Text>
              <View style={styles.cardsList}>
                {earlierItems.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.notificationCard} activeOpacity={0.7}>
                    <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    <View style={styles.contentWrapper}>
                      <View style={styles.topLine}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={styles.timeRow}>
                          <Text style={styles.timeText}>{item.time}</Text>
                          {item.isUnread && <View style={styles.unreadDot} />}
                        </View>
                      </View>
                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Mark all as read */}
          <TouchableOpacity 
            style={styles.markReadButton} 
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Feather name="check" size={16} color="#6D28D9" style={{ marginRight: 6 }} />
            <Text style={styles.markReadText}>Mark all as read</Text>
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
    backgroundColor: '#F8FAFC',
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

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#4C1D95',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  cardsList: {
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6D28D9',
    marginLeft: 6,
  },
  itemMessage: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // Mark all as read
  markReadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D28D9',
  },
});
