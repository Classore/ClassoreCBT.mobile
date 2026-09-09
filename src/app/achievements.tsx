import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

export default function AchievementsScreen() {
  const router = useRouter();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/user/gamification/achievements/')
      .then(res => setAchievements(res.data))
      .catch(err => console.warn(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements & Badges</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
      ) : achievements.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="star" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>You haven't unlocked any badges yet.</Text>
        </View>
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconBg}>
                <Feather name={item.icon || 'star'} size={24} color="#F59E0B" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 16, color: '#6B7280' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  iconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  cardContent: { marginLeft: 16, flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#6B7280', marginTop: 4 }
});
