import React from 'react';
import {
  View,
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
import { handleHelpBack, navigateWithFrom } from '@/utils/helpNavigation';
import { useAuth } from '@/context/AuthContext';
import { downloadCertificate } from '@/services/certificateService';
import { AppText } from '@/components/AppText';
import { QRCodeView } from '@/components/QRCodeView';

export default function CertificateDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    certId?: string;
    examName?: string;
    grade?: string;
    score?: string;
    totalScore?: string;
    percentage?: string;
    earnedDate?: string;
    certificateNo?: string;
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
  const grade =
    params.grade ||
    (Number(percentage) >= 90
      ? 'Distinction'
      : Number(percentage) >= 80
      ? 'Merit'
      : 'Pass');
  const [isDownloading, setIsDownloading] = React.useState(false);

  const serialNo =
    params.certificateNo ||
    `CLS-CERT-2026-${String(params.certId || '1').padStart(5, '0')}`;

  const verificationUrl = `https://classore.com/verify-certificate?ref=${encodeURIComponent(serialNo)}`;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadCertificate({
      id: params.certId || '1',
      recipientName,
      examName,
      grade,
      score,
      totalScore,
      percentage,
      earnedDate,
      certificateNo: serialNo,
      verificationUrl,
    });
    setIsDownloading(false);
  };

  const handleOpenVerification = () => {
    navigateWithFrom('/verify-certificate', '/(tabs)/certificate-detail', {
      ref: serialNo,
      recipientName,
      examName,
      grade,
      score,
      totalScore,
      percentage,
      earnedDate,
    });
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
          <AppText style={styles.headerTitle}>Certificate</AppText>
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
              <AppText style={styles.scoreBadgeLabel}>Score</AppText>
              <AppText style={styles.scoreBadgeValue}>
                {score}/{totalScore}
              </AppText>
            </View>

            {/* Center Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <View style={styles.logoInner}>
                  <AppText style={styles.logoLetter}>C</AppText>
                  <View style={styles.logoStar}>
                    <Ionicons name="sparkles" size={10} color="#F59E0B" />
                  </View>
                </View>
              </View>
            </View>

            {/* Certificate Titles */}
            <AppText style={styles.certMainTitle}>Certificate</AppText>
            <AppText style={styles.certMainSubtitle}>of Achievement</AppText>

            {/* Grade Tier Ribbon */}
            <View style={[
              styles.gradeSeal,
              grade.toLowerCase().includes('distinction') ? styles.gradeSealDistinction :
              grade.toLowerCase().includes('merit') ? styles.gradeSealMerit : styles.gradeSealPass
            ]}>
              <Ionicons
                name={grade.toLowerCase().includes('distinction') ? "sparkles" : (grade.toLowerCase().includes('merit') ? "star" : "checkmark-circle")}
                size={13}
                color={grade.toLowerCase().includes('distinction') ? "#B45309" : (grade.toLowerCase().includes('merit') ? "#7C3AED" : "#059669")}
              />
              <AppText style={[
                styles.gradeSealText,
                { color: grade.toLowerCase().includes('distinction') ? "#B45309" : (grade.toLowerCase().includes('merit') ? "#7C3AED" : "#059669") }
              ]}>
                GRADE: {grade.toUpperCase()}
              </AppText>
            </View>

            <AppText style={styles.certCertifyText}>This is to certify that</AppText>
            <AppText style={styles.certRecipientName}>{recipientName}</AppText>
            <AppText style={styles.certCompletedText}>has successfully completed</AppText>
            <AppText style={styles.certExamName}>{examName}</AppText>
            <AppText style={styles.certPerformanceText}>
              and demonstrated excellent performance.
            </AppText>

            {/* Dotted Line */}
            <View style={styles.dottedDivider} />

            {/* Card Footer: Earned Date, Ribbon Medal & QR Code */}
            <View style={styles.cardFooter}>
              <View>
                <View style={styles.earnedDateRow}>
                  <AppText style={{ fontSize: 13, marginRight: 4 }}>🗓️</AppText>
                  <AppText style={styles.earnedLabel}>Earned On</AppText>
                </View>
                <AppText style={styles.earnedValue}>{earnedDate}</AppText>
              </View>

              <TouchableOpacity
                style={styles.cardQrTouchable}
                activeOpacity={0.8}
                onPress={handleOpenVerification}
              >
                <View style={styles.cardQrBox}>
                  <QRCodeView value={verificationUrl} size={48} margin={1} color="#4C1D95" />
                </View>
                <AppText style={styles.cardQrLabel}>Scan / Tap</AppText>
              </TouchableOpacity>

              <View style={styles.medalWrapper}>
                <MaterialCommunityIcons name="medal" size={38} color="#EAB308" />
              </View>
            </View>

            {/* Bottom Right Purple Corner Triangle Accent */}
            <View style={styles.bottomRightCorner} />
          </View>

          {/* QR Code Verification Banner Card */}
          <View style={styles.qrBannerCard}>
            <View style={styles.qrBannerLeft}>
              <View style={styles.qrCodeWrapper}>
                <QRCodeView value={verificationUrl} size={84} margin={1} color="#3B0764" />
              </View>
            </View>
            <View style={styles.qrBannerRight}>
              <View style={styles.qrHeaderRow}>
                <Feather name="shield" size={15} color="#7C3AED" style={{ marginRight: 5 }} />
                <AppText style={styles.qrBannerBadge}>Digital Verification</AppText>
              </View>
              <AppText style={styles.qrBannerTitle}>Official Certificate QR Code</AppText>
              <AppText style={styles.qrBannerText}>
                Scan with any mobile camera to verify this credential's authenticity.
              </AppText>
              <TouchableOpacity
                style={styles.verifyLinkButton}
                activeOpacity={0.7}
                onPress={handleOpenVerification}
              >
                <AppText style={styles.verifyLinkText}>Verify Credential Now</AppText>
                <Feather name="arrow-right" size={14} color="#6D28D9" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Certificate Details Section */}
          <View style={styles.detailsHeader}>
            <AppText style={styles.detailsTitle}>Certificate Details</AppText>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={13} color="#10B981" style={{ marginRight: 2 }} />
              <AppText style={styles.verifiedText}>Verified</AppText>
            </View>
          </View>

          <View style={styles.detailsCard}>
            {/* Row 0: Serial Number / Ref */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="hash" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <AppText style={styles.detailLabel}>Certificate ID</AppText>
                <AppText style={styles.detailValue}>{serialNo}</AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 1: Exam */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="clipboard" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <AppText style={styles.detailLabel}>Exam</AppText>
                <AppText style={styles.detailValue}>{examName}</AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 2: Score */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <AppText style={styles.detailLabel}>Score</AppText>
                <AppText style={styles.detailValue}>
                  {score} out of {totalScore}
                </AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 3: Percentage */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="bar-chart-2" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <AppText style={styles.detailLabel}>Percentage</AppText>
                <AppText style={styles.detailValue}>{percentage}%</AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 3b: Grade Tier */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="ribbon-outline" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <AppText style={styles.detailLabel}>Grade Tier</AppText>
                <AppText style={styles.detailValue}>
                  {grade} ({Number(percentage) >= 90 ? '90% - 100%' : Number(percentage) >= 80 ? '80% - 89%' : '70% - 79%'})
                </AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            {/* Row 4: Earned On */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="calendar" size={18} color="#7C3AED" />
              </View>
              <View style={styles.detailTextContainer}>
                <AppText style={styles.detailLabel}>Earned On</AppText>
                <AppText style={styles.detailValue}>{earnedDate}</AppText>
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
                <AppText style={styles.downloadButtonText}>Download Certificate PDF</AppText>
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
    marginBottom: 16,
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
  cardQrTouchable: {
    alignItems: 'center',
  },
  cardQrBox: {
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardQrLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  medalWrapper: {
    marginRight: 20,
  },

  // QR Banner Card
  qrBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    padding: 16,
    marginBottom: 20,
  },
  qrBannerLeft: {
    marginRight: 14,
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  qrBannerRight: {
    flex: 1,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  qrBannerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qrBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  qrBannerText: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  verifyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6D28D9',
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
    marginBottom: 20,
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
  gradeSeal: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  gradeSealDistinction: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  gradeSealMerit: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
  },
  gradeSealPass: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  gradeSealText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
