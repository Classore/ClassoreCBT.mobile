import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { downloadCertificate } from '@/services/certificateService';
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

interface CertificateItem {
  id: number;
  exam: string;
  title: string;
  grade?: 'Pass' | 'Merit' | 'Distinction' | string;
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

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/api/user/gamification/certificates/');
      if (Array.isArray(res.data)) {
        setCertificates(res.data);
      }
    } catch {
      // Keep empty if network fails
    } finally {
      setLoading(false);
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
      grade: cert.grade || 'Pass',
      score: cert.score || 0,
      totalScore: cert.total_score || 0,
      percentage: cert.percentage || 0,
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
      grade: cert.grade || 'Pass',
      score: cert.score || 0,
      totalScore: cert.total_score || 0,
      percentage: cert.percentage || 0,
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

  const renderGradeBadge = (grade?: string) => {
    const g = (grade || 'Pass').toLowerCase();
    if (g.includes('distinction')) {
      return (
        <View style={[styles.gradePill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <Ionicons name="sparkles" size={11} color="#D97706" />
          <AppText style={[styles.gradePillText, { color: '#B45309' }]}>Distinction</AppText>
        </View>
      );
    }
    if (g.includes('merit')) {
      return (
        <View style={[styles.gradePill, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
          <Ionicons name="star" size={11} color="#7C3AED" />
          <AppText style={[styles.gradePillText, { color: '#7C3AED' }]}>Merit</AppText>
        </View>
      );
    }
    return (
      <View style={[styles.gradePill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
        <Ionicons name="checkmark-circle" size={11} color="#059669" />
        <AppText style={[styles.gradePillText, { color: '#059669' }]}>Pass</AppText>
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
          ) : certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="ribbon-outline" size={48} color="#7C3AED" />
              </View>
              <AppText style={styles.emptyTitle}>No Certificates Yet</AppText>
              <AppText style={styles.emptyText}>
                Complete any standard CBT exam and score 70% or higher to earn your official Certificate of Achievement.
              </AppText>

              {/* Tier Requirements Card */}
              <View style={styles.tierInfoCard}>
                <AppText style={styles.tierInfoTitle}>Certificate Grade Criteria</AppText>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#059669' }]} />
                  <AppText style={styles.tierLabel}>70% - 79%:</AppText>
                  <AppText style={styles.tierGrade}>Pass</AppText>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#7C3AED' }]} />
                  <AppText style={styles.tierLabel}>80% - 89%:</AppText>
                  <AppText style={styles.tierGrade}>Merit</AppText>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#D97706' }]} />
                  <AppText style={styles.tierLabel}>90% - 100%:</AppText>
                  <AppText style={styles.tierGrade}>Distinction</AppText>
                </View>
                <AppText style={styles.tierFootnote}>
                  💡 Take the exam again anytime—scoring higher automatically upgrades your certificate!
                </AppText>
              </View>

              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/practice')}
                activeOpacity={0.85}
              >
                <AppText style={styles.exploreBtnText}>Take an Exam</AppText>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
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
                  <View style={styles.gradeScoreRow}>
                    {renderGradeBadge(item.grade)}
                    {item.percentage !== undefined && (
                      <AppText style={styles.percentageText}>{item.percentage}%</AppText>
                    )}
                  </View>
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
  gradeScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  gradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  tierInfoCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  tierInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tierLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
    width: 90,
  },
  tierGrade: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  tierFootnote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 17,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6D28D9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
