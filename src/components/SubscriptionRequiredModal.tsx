import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';

export function isSubscriptionError(error: any): boolean {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const msg = (
    (typeof data === 'string' ? data : '') ||
    data?.error ||
    data?.detail ||
    data?.message ||
    error?.message ||
    ''
  ).toLowerCase();

  return (
    status === 402 ||
    status === 403 ||
    msg.includes('subscription') ||
    msg.includes('bundle') ||
    msg.includes('token') ||
    msg.includes('payment required') ||
    msg.includes('exhausted') ||
    msg.includes('upgrade') ||
    msg.includes('limit')
  );
}

export function getSubscriptionErrorMessage(error: any, fallback?: string): string {
  const data = error?.response?.data;
  const msg =
    (typeof data === 'string' ? data : '') ||
    data?.error ||
    data?.detail ||
    data?.message ||
    error?.message;
  return msg || fallback || 'You do not have an active subscription or bundle to access this content.';
}

import { subscriptionRedirect, PendingTestRedirect } from '@/services/subscriptionRedirect';

export interface SubscriptionRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  subjectName?: string;
  topicName?: string;
  examName?: string;
  customMessage?: string;
  onViewBundles?: () => void;
  pendingRedirect?: PendingTestRedirect;
}

export const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = ({
  visible,
  onClose,
  subjectName,
  topicName,
  examName,
  customMessage,
  onViewBundles,
  pendingRedirect,
}) => {
  const router = useRouter();

  const handleViewBundles = () => {
    if (pendingRedirect) {
      subscriptionRedirect.setPendingRedirect(pendingRedirect);
    }
    onClose();
    if (onViewBundles) {
      onViewBundles();
    } else {
      router.push('/(tabs)/bundles' as any);
    }
  };

  let targetDescription = 'this content';
  if (subjectName && topicName) {
    targetDescription = `${subjectName} \u2013 ${topicName}`;
  } else if (subjectName) {
    targetDescription = subjectName;
  } else if (examName) {
    targetDescription = examName;
  }

  const message = customMessage || `You need an active subscription for ${targetDescription} to start this test.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            activeOpacity={0.7}
          >
            <Feather name="x" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 3D Illustration container */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../assets/images/test-instructions-3d.png')}
              style={styles.illustrationImage}
              contentFit="contain"
            />
            <View style={styles.lockBadge}>
              <MaterialCommunityIcons name="lock" size={22} color="#7E57C2" />
            </View>
          </View>

          {/* Title */}
          <AppText style={styles.title}>Subscription Required</AppText>

          {/* Description */}
          <AppText style={styles.description}>
            {message}
          </AppText>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewBundles}
              activeOpacity={0.85}
            >
              <AppText style={styles.primaryButtonText}>View Bundles</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <AppText style={styles.secondaryButtonText}>Go Back</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  illustrationContainer: {
    width: 120,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  illustrationImage: {
    width: 100,
    height: 100,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 2,
    right: 14,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#7E57C2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
