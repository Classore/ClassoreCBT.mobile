import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateQRSvgString } from '@/utils/qrCode';

export interface CertificateData {
  id?: number | string;
  recipientName: string;
  examName: string;
  grade?: string;
  score?: string | number;
  totalScore?: string | number;
  percentage?: string | number;
  earnedDate: string;
  issuer?: string;
  certificateNo?: string;
  verificationUrl?: string;
}

export function generateCertificateHtml(data: CertificateData): string {
  const serialNo =
    data.certificateNo ||
    `CLS-CERT-${new Date().getFullYear()}-${String(data.id || Math.floor(1000 + Math.random() * 9000)).padStart(5, '0')}`;

  const gradeVal =
    data.grade ||
    (Number(data.percentage) >= 90
      ? 'Distinction'
      : Number(data.percentage) >= 80
      ? 'Merit'
      : 'Pass');

  const scoreDisplay =
    data.score && data.totalScore
      ? `${data.score} / ${data.totalScore}`
      : data.score
      ? `${data.score}`
      : 'Passed';

  const percentageDisplay = data.percentage ? `(${data.percentage}%)` : '';

  const verificationUrl =
    data.verificationUrl ||
    `https://classore.com/verify-certificate?ref=${encodeURIComponent(serialNo)}`;

  const qrSvg = generateQRSvgString(verificationUrl, {
    size: 72,
    color: '#3B0764',
    bgColor: '#FFFFFF',
    margin: 1,
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Achievement - Classore CBT</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      background-color: #F8FAFC;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cert-outer {
      width: 92vw;
      height: 90vh;
      max-width: 1050px;
      max-height: 720px;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 24px;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      border: 3px solid #7E57C2;
    }
    .cert-inner {
      width: 100%;
      height: 100%;
      border: 2px dashed #E2E8F0;
      border-radius: 12px;
      padding: 32px 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      position: relative;
      background: radial-gradient(circle at top right, rgba(126,87,194,0.04), transparent 60%);
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      font-size: 8rem;
      font-weight: 900;
      color: rgba(126, 87, 194, 0.03);
      letter-spacing: 12px;
      pointer-events: none;
      text-transform: uppercase;
      user-select: none;
    }
    .header-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #7E57C2, #5E35B1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 24px;
      box-shadow: 0 4px 10px rgba(126, 87, 194, 0.3);
    }
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      color: #1E293B;
      letter-spacing: 0.5px;
    }
    .cert-title {
      font-size: 28px;
      font-weight: 800;
      color: #6D28D9;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-top: 6px;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748B;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .recipient-section {
      margin: 12px 0;
    }
    .recipient-label {
      font-size: 14px;
      color: #64748B;
      font-style: italic;
    }
    .recipient-name {
      font-size: 34px;
      font-weight: 800;
      color: #0F172A;
      margin: 6px 0;
      border-bottom: 2px solid #7E57C2;
      display: inline-block;
      padding-bottom: 4px;
      padding-left: 20px;
      padding-right: 20px;
    }
    .achievement-text {
      font-size: 15px;
      color: #334155;
      max-width: 650px;
      line-height: 1.5;
    }
    .exam-name {
      font-size: 20px;
      font-weight: 700;
      color: #6D28D9;
      margin-top: 4px;
    }
    .metrics-row {
      display: flex;
      gap: 24px;
      margin: 12px 0;
    }
    .metric-badge {
      background: #F1F5F9;
      border-radius: 20px;
      padding: 6px 18px;
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      border: 1px solid #E2E8F0;
    }
    .grade-badge-distinction {
      background: #FEF3C7;
      color: #92400E;
      border: 1.5px solid #F59E0B;
    }
    .grade-badge-merit {
      background: #F3E8FF;
      color: #6B21A8;
      border: 1.5px solid #A855F7;
    }
    .grade-badge-pass {
      background: #ECFDF5;
      color: #065F46;
      border: 1.5px solid #10B981;
    }
    .footer-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #F1F5F9;
    }
    .signature-block {
      text-align: center;
      width: 180px;
    }
    .signature-line {
      font-family: 'Brush Script MT', cursive, sans-serif;
      font-size: 22px;
      color: #1E293B;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .signature-title {
      font-size: 11px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .seal-badge {
      width: 68px;
      height: 68px;
      border-radius: 34px;
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
      border: 3px solid #FEF3C7;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      padding: 6px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .qr-label {
      font-size: 8px;
      color: #64748B;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 3px;
    }
    .serial-number {
      font-size: 11px;
      color: #64748B;
      font-family: monospace;
      margin-top: 6px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="cert-outer">
    <div class="cert-inner">
      <div class="watermark">Classore</div>

      <div class="header-badge">
        <div class="brand-logo">C</div>
        <div class="brand-name">Classore CBT</div>
      </div>

      <div>
        <div class="cert-title">Certificate of Achievement</div>
        <div class="subtitle">Official Verification of Educational Excellence</div>
      </div>

      <div class="recipient-section">
        <div class="recipient-label">This is proudly presented to</div>
        <div class="recipient-name">${data.recipientName}</div>
      </div>

      <div class="achievement-text">
        for successfully completing the official computer-based assessment in
        <div class="exam-name">${data.examName}</div>
      </div>

      <div class="metrics-row">
        <div class="metric-badge grade-badge-${gradeVal.toLowerCase()}">Grade: ${gradeVal}</div>
        <div class="metric-badge">Score: ${scoreDisplay} ${percentageDisplay}</div>
        <div class="metric-badge">Date: ${data.earnedDate}</div>
      </div>

      <div class="footer-row">
        <div class="signature-block">
          <div class="signature-line">Adekunle O.</div>
          <div class="signature-title">Director of Assessment</div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="qr-container">
            ${qrSvg}
            <div class="qr-label">Scan to Verify</div>
          </div>

          <div style="text-align: center;">
            <div class="seal-badge">
              <span style="font-size: 15px;">★</span>
              <span>VERIFIED</span>
            </div>
            <div class="serial-number">Ref: ${serialNo}</div>
          </div>
        </div>

        <div class="signature-block">
          <div class="signature-line">Classore Board</div>
          <div class="signature-title">Academic Committee</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function downloadCertificate(data: CertificateData): Promise<boolean> {
  try {
    const html = generateCertificateHtml(data);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    }

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${data.examName} Certificate`,
        UTI: 'com.adobe.pdf',
      });
      return true;
    } else {
      Alert.alert(
        'Certificate Generated',
        `Your certificate PDF has been saved at:\n${uri}`,
        [{ text: 'OK' }]
      );
      return true;
    }
  } catch (error: any) {
    console.error('Failed to download certificate PDF:', error);
    Alert.alert(
      'Download Failed',
      error?.message || 'Unable to generate certificate PDF. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
}
