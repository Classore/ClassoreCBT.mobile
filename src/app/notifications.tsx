import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { notificationService, NotificationItem } from '@/services/notification';

export default function NotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_unread: false })));
    } catch (e) {
      console.error(e);
    }
  };

  const getStyleForType = (type: string) => {
    switch (type) {
      case 'test': return { icon: 'clipboard', iconBg: '#EDE9FE', iconColor: '#7C3AED', family: 'feather' };
      case 'achievement': return { icon: 'medal-outline', iconBg: '#FEF3C7', iconColor: '#D97706', family: 'material' };
      case 'streak': return { icon: 'fire', iconBg: '#FFE4E6', iconColor: '#E11D48', family: 'material' };
      case 'contest': return { icon: 'trophy-outline', iconBg: '#D1FAE5', iconColor: '#059669', family: 'ionicons' };
      case 'token': return { icon: 'cube-outline', iconBg: '#DBEAFE', iconColor: '#2563EB', family: 'ionicons' };
      case 'ai': return { icon: 'auto-fix', iconBg: '#EDE9FE', iconColor: '#7C3AED', family: 'material' };
      default: return { icon: 'settings', iconBg: '#F3F4F6', iconColor: '#6B7280', family: 'feather' };
    }
  };

  const renderIcon = (type: string) => {
    const style = getStyleForType(type);
    if (style.family === 'material') {
      return <MaterialCommunityIcons name={style.icon as any} size={20} color={style.iconColor} />;
    }
    if (style.family === 'ionicons') {
      return <Ionicons name={style.icon as any} size={20} color={style.iconColor} />;
    }
    return <Feather name={style.icon as any} size={18} color={style.iconColor} />;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isToday = (dateStr: string) => {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  };

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'Unread') return item.is_unread;
    return true;
  });

  const todayItems = filteredNotifications.filter(item => isToday(item.created_at));
  const earlierItems = filteredNotifications.filter(item => !isToday(item.created_at));

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

          {loading ? (
            <ActivityIndicator size="large" color="#4C1D95" style={{ marginVertical: 40 }} />
          ) : filteredNotifications.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#64748B', marginVertical: 20 }}>No notifications found.</Text>
          ) : (
            <>
              {/* Today Section */}
              {todayItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  <View style={styles.cardsList}>
                    {todayItems.map((item) => (
                      <TouchableOpacity key={item.id} style={styles.notificationCard} activeOpacity={0.7}>
                        <View style={[styles.iconWrapper, { backgroundColor: getStyleForType(item.notification_type).iconBg }]}>
                          {renderIcon(item.notification_type)}
                        </View>
                        <View style={styles.contentWrapper}>
                          <View style={styles.topLine}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <View style={styles.timeRow}>
                              <Text style={styles.timeText}>{formatDateLabel(item.created_at)}</Text>
                              {item.is_unread && <View style={styles.unreadDot} />}
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
                        <View style={[styles.iconWrapper, { backgroundColor: getStyleForType(item.notification_type).iconBg }]}>
                          {renderIcon(item.notification_type)}
                        </View>
                        <View style={styles.contentWrapper}>
                          <View style={styles.topLine}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <View style={styles.timeRow}>
                              <Text style={styles.timeText}>{formatDateLabel(item.created_at)}</Text>
                              {item.is_unread && <View style={styles.unreadDot} />}
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
              {notifications.some(n => n.is_unread) && (
                <TouchableOpacity 
                  style={styles.markReadButton} 
                  onPress={markAllAsRead}
                  activeOpacity={0.7}
                >
                  <Feather name="check" size={16} color="#6D28D9" style={{ marginRight: 6 }} />
                  <Text style={styles.markReadText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </>
          )}

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
