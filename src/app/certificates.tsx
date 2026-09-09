import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';

export default function CertificatesScreen() {
  const router = useRouter();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/user/gamification/certificates/')
      .then(res => setCerts(res.data))
      .catch(err => console.warn(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Certificates</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
      ) : certs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="certificate-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>You haven't earned any certificates yet.</Text>
        </View>
      ) : (
        <FlatList
          data={certs}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <MaterialCommunityIcons name="certificate" size={32} color="#F59E0B" />
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{new Date(item.issued_date).toDateString()}</Text>
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
  cardContent: { marginLeft: 16 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 4 }
});
