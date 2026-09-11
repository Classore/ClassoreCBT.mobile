import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleHelpBack } from '@/utils/helpNavigation';
import { api } from '@/services/api';

interface AchievementItem {
  id: number;
  title: string;
  description: string;
  earned_date: string;
  icon?: string;
  icon_type?: string;
}

const FALLBACK_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 1,
    title: '7 Days Study Streak',
    description: 'Studied for 7 consecutive days',
    earned_date: 'May 15, 2026',
    icon_type: 'fire',
  },
  {
    id: 2,
    title: 'Practice Master',
    description: 'Completed 100 practice questions',
    earned_date: 'May 12, 2026',
    icon_type: 'practice',
  },
  {
    id: 3,
    title: 'High Performer',
    description: 'Scored above 80% in 5 tests',
    earned_date: 'May 10, 2026',
    icon_type: 'chart',
  },
  {
    id: 4,
    title: 'Early Bird',
    description: 'Completed a practice before 8 AM',
    earned_date: 'May 9, 2026',
    icon_type: 'sun',
  },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();

  const [achievements, setAchievements] = useState<AchievementItem[]>(FALLBACK_ACHIEVEMENTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAchievements = async () => {
    try {
      const res = await api.get('/api/user/gamification/achievements/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAchievements(res.data);
      }
    } catch {
      // Use fallback
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  };

  const renderIcon = (type?: string, iconName?: string) => {
    const key = (type || iconName || '').toLowerCase();

    if (key.includes('fire') || key.includes('streak')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}>
          <Text style={{ fontSize: 22 }}>🔥</Text>
        </View>
      );
    }
    if (key.includes('practice') || key.includes('master')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#10B981" />
        </View>
      );
    }
    if (key.includes('chart') || key.includes('performer')) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
          <Feather name="bar-chart-2" size={22} color="#F59E0B" />
        </View>
      );
    }
    return (
      <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
        <Feather name="sun" size={22} color="#3B82F6" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievement</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6D28D9" />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color="#6D28D9" style={{ marginTop: 40 }} />
          ) : (
            achievements.map((item) => (
              <View key={item.id} style={styles.card}>
                {renderIcon(item.icon_type, item.icon)}

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.description}</Text>
                  <Text style={styles.cardDate}>
                    Earned on {item.earned_date}
                  </Text>
                </View>
              </View>
            ))
          )}

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
    paddingTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
});
