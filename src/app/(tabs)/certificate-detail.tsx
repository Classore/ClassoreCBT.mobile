import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleHelpBack } from '@/utils/helpNavigation';
import { useAuth } from '@/context/AuthContext';
import { downloadCertificate } from '@/services/certificateService';

export default function CertificateDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    certId?: string;
    examName?: string;
    score?: string;
    totalScore?: string;
    percentage?: string;
    earnedDate?: string;
  }>();

  const { user } = useAuth();

  const recipientName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : (user?.username || 'Daniel Adekunle');

  const examName = params.examName || 'JAMB UTME Practice Exam';
  const score = params.score || '382';
  const totalScore = params.totalScore || '400';
  const percentage = params.percentage || '96.5';
  const earnedDate = params.earnedDate || 'May 10, 2026';
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadCertificate({
      id: params.certId || '1',
      recipientName,
      examName,
      score,
      totalScore,
      percentage,
      earnedDate,
    });
    setIsDownloading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleHelpBack(params.from, '/(tabs)/certificates')}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
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
        >
          {/* Certificate of Achievement Card */}
          <View style={styles.certCard}>
            {/* Top Left Purple Corner Triangle Accent */}
            <View style={styles.topLeftCorner} />

            {/* Top Right Score Badge */}
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeLabel}>Score</Text>
              <Text style={styles.scoreBadgeValue}>
                {score}/{totalScore}
              </Text>
            </View>

            {/* Center Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <View style={styles.logoInner}>
                  <Text style={styles.logoLetter}>C</Text>
                  <View style={styles.logoStar}>
                    <Ionicons name="sparkles" size={10} color="#F59E0B" />
                  </View>
                </View>
              </View>
            </View>

            {/* Certificate Titles */}
            <Text style={styles.certMainTitle}>Certificate</Text>
            <Text style={styles.certMainSubtitle}>of Achievement</Text>

            <Text style={styles.certCertifyText}>This is to certify that</Text>
            <Text style={styles.certRecipientName}>{recipientName}</Text>
            <Text style={styles.certCompletedText}>has successfully completed</Text>
            <Text style={styles.certExamName}>{examName}</Text>
            <Text style={styles.certPerformanceText}>
              and demonstrated excellent performance.
            </Text>

            {/* Dotted Line */}
            <View style={styles.dottedDivider} />

            {/* Card Footer: Earned Date & Ribbon Medal */}
            <View style={styles.cardFooter}>
              <View>
                <View style={styles.earnedDateRow}>
                  <Text style={{ fontSize: 13, marginRight: 4 }}>🗓️</Text>
                  <Text style={styles.earnedLabel}>Earned On</Text>
                </View>
                <Text style={styles.earnedValue}>{earnedDate}</Text>
              </View>

              <View style={styles.medalWrapper}>
                <MaterialCommunityIcons name="medal" size={38} color="#EAB308" />
              </View>
            </View>

            {/* Bottom Right Purple Corner Triangle Accent */}
            <View style={styles.bottomRightCorner} />
          </View>

          {/* Certificate Details Section */}
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Certificate Details</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={13} color="#10B981" style={{ marginRight: 2 }} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            {/* Row 1: Exam */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="clipboard" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Exam</Text>
                <Text style={styles.detailValue}>{examName}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 2: Score */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Score</Text>
                <Text style={styles.detailValue}>
                  {score} out of {totalScore}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 3: Percentage */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="bar-chart-2" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Percentage</Text>
                <Text style={styles.detailValue}>{percentage}%</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 4: Earned On */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="calendar" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Earned On</Text>
                <Text style={styles.detailValue}>{earnedDate}</Text>
              </View>
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity
            style={[styles.downloadButton, isDownloading && { opacity: 0.85 }]}
            activeOpacity={0.85}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.downloadButtonText}>Download Certificate</Text>
              </View>
            )}
          </TouchableOpacity>

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
    paddingTop: 12,
  },

  // Certificate Card
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  topLeftCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 60,
    borderTopColor: '#6D28D9',
    borderRightWidth: 60,
    borderRightColor: 'transparent',
  },
  bottomRightCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    borderBottomWidth: 60,
    borderBottomColor: '#6D28D9',
    borderLeftWidth: 60,
    borderLeftColor: 'transparent',
  },
  scoreBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: '#F3E8FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  scoreBadgeLabel: {
    fontSize: 9.5,
    color: '#7C3AED',
    fontWeight: '600',
  },
  scoreBadgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoInner: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6D28D9',
  },
  logoStar: {
    position: 'absolute',
    top: 6,
    right: -4,
  },
  certMainTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 25,
  },
  certMainSubtitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 12,
  },
  certCertifyText: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  certRecipientName: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#6D28D9',
    textAlign: 'center',
    marginBottom: 6,
  },
  certCompletedText: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  certExamName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  certPerformanceText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  earnedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  earnedLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  earnedValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  medalWrapper: {
    marginRight: 40,
  },

  // Details Section
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  downloadButton: {
    backgroundColor: '#4C1D95',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
