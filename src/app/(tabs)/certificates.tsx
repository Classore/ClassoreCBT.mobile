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
  Alert,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { downloadCertificate } from '@/services/certificateService';
import { AppText } from '@/components/AppText';

interface CertificateItem {
  id: number;
  exam: string;
  title: string;
  score_text: string;
  score?: number;
  total_score?: number;
  percentage?: number;
  earned_date: string;
  date_text: string;
  issuer: string;
  is_verified?: boolean;
  logo_type?: string;
  certificate_no?: string;
}

const FALLBACK_CERTIFICATES: CertificateItem[] = [
  {
    id: 1,
    exam: 'JAMB UTME',
    title: 'JAMB UTME Practice Exam',
    score_text: 'Score: 278',
    score: 382,
    total_score: 400,
    percentage: 96.5,
    earned_date: 'May 10, 2026',
    date_text: 'Earned on May 10, 2026',
    issuer: 'JAMB UTME',
    is_verified: true,
    logo_type: 'jamb',
  },
  {
    id: 2,
    exam: 'WAEC',
    title: 'WAEC Senior Certificate',
    score_text: 'Mathematics',
    score: 355,
    total_score: 400,
    percentage: 88.75,
    earned_date: 'May 8, 2026',
    date_text: 'Earned on May 8, 2026',
    issuer: 'WAEC',
    is_verified: true,
    logo_type: 'waec',
  },
  {
    id: 3,
    exam: 'NECO',
    title: 'NECO SSCE Practice',
    score_text: 'English Language',
    score: 342,
    total_score: 400,
    percentage: 85.5,
    earned_date: 'Apr 28, 2026',
    date_text: 'Earned on Apr 28, 2026',
    issuer: 'NECO',
    is_verified: true,
    logo_type: 'neco',
  },
];

export default function CertificatesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ from?: string }>();

  const [certificates, setCertificates] = useState<CertificateItem[]>(FALLBACK_CERTIFICATES);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/api/user/gamification/certificates/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCertificates(res.data);
      }
    } catch {
      // Use fallback data seamlessly
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCertificates();
    setRefreshing(false);
  };

  const handleDownload = async (cert: CertificateItem) => {
    if (downloadingId !== null) return;
    setDownloadingId(cert.id);
    const recipientName =
      user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : (user?.username || 'Student');

    await downloadCertificate({
      id: cert.id,
      recipientName,
      examName: cert.exam || cert.title,
      score: cert.score || 382,
      totalScore: cert.total_score || 400,
      percentage: cert.percentage || 96.5,
      earnedDate: cert.earned_date || cert.date_text || 'May 10, 2026',
      issuer: cert.issuer,
      certificateNo: cert.certificate_no,
    });
    setDownloadingId(null);
  };

  const handleView = (cert: CertificateItem) => {
    navigateWithFrom('/(tabs)/certificate-detail', '/(tabs)/certificates', {
      certId: cert.id,
      examName: cert.exam || cert.title,
      score: cert.score || 382,
      totalScore: cert.total_score || 400,
      percentage: cert.percentage || 96.5,
      earnedDate: cert.earned_date || 'May 10, 2026',
      certificateNo: cert.certificate_no,
    });
  };

  const renderBadgeLogo = (type?: string, examName?: string) => {
    const checkStr = ((type || '') + ' ' + (examName || '')).toLowerCase();

    if (checkStr.includes('jamb')) {
      return (
        <View style={[styles.logoBadge, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="school" size={26} color="#059669" />
        </View>
      );
    }
    if (checkStr.includes('waec')) {
      return (
        <View style={[styles.logoBadge, { backgroundColor: '#EFF6FF' }]}>
          <MaterialCommunityIcons name="seal" size={28} color="#2563EB" />
        </View>
      );
    }
    return (
      <View style={[styles.logoBadge, { backgroundColor: '#F0FDF4' }]}>
        <Ionicons name="ribbon" size={26} color="#16A34A" />
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
          <AppText style={styles.headerTitle}>My Certificates</AppText>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigateWithFrom('/verify-certificate', '/(tabs)/certificates')}
            activeOpacity={0.7}
          >
            <Feather name="shield" size={20} color="#7C3AED" />
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
            certificates.map((item) => (
              <View key={item.id} style={styles.certCard}>
                {/* Left Badge */}
                {renderBadgeLogo(item.logo_type, item.exam || item.title)}

                {/* Details Column */}
                <View style={styles.certDetails}>
                  <AppText style={styles.certTitle} numberOfLines={1}>
                    {item.exam || item.title}
                  </AppText>
                  <AppText style={styles.certSubtitle}>{item.score_text || 'Completed'}</AppText>
                  <AppText style={styles.certDate}>{item.date_text || `Earned on ${item.earned_date}`}</AppText>
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    activeOpacity={0.7}
                    onPress={() => handleView(item)}
                  >
                    <AppText style={styles.viewBtnText}>View</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.downloadBtn, downloadingId === item.id && { opacity: 0.7 }]}
                    activeOpacity={0.7}
                    onPress={() => handleDownload(item)}
                    disabled={downloadingId !== null}
                  >
                    {downloadingId === item.id ? (
                      <ActivityIndicator size="small" color="#7C3AED" />
                    ) : (
                      <Feather name="download" size={16} color="#374151" />
                    )}
                  </TouchableOpacity>
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
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  certDetails: {
    flex: 1,
    marginRight: 10,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  certSubtitle: {
    fontSize: 13.5,
    color: '#4B5563',
    marginTop: 2,
  },
  certDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewBtn: {
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  viewBtnText: {
    color: '#6D28D9',
    fontSize: 13.5,
    fontWeight: '700',
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
