import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Dimensions,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface GuestAuthModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  showContinueAsGuest?: boolean;
}

export const GuestAuthModal: React.FC<GuestAuthModalProps> = ({
  visible,
  onClose,
  title = "Log in to experience the platform better",
  subtitle = "Get full access to personalised features, track your progress, save your results and more.",
  showContinueAsGuest = true,
}) => {
  const router = useRouter();

  if (!visible) return null;

  const handleLogin = () => {
    onClose();
    router.push('/auth/login' as any);
  };

  const handleSignup = () => {
    onClose();
    router.push('/(auth)/signup' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="x" size={20} color="#1E293B" />
              </TouchableOpacity>

              {/* Padlock Illustration */}
              <View style={styles.imageContainer}>
                <Image
                  source={require('../../assets/images/guest-lock-illustration.png')}
                  style={styles.lockImage}
                  contentFit="contain"
                />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              {/* Primary: Log In */}
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Log In</Text>
                <Feather name="arrow-right" size={17} color="#FFFFFF" style={styles.buttonIcon} />
              </TouchableOpacity>

              {/* Secondary: Create Account */}
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleSignup}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>

              {/* Tertiary: Continue as guest */}
              {showContinueAsGuest && (
                <TouchableOpacity 
                  style={styles.tertiaryButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tertiaryButtonText}>Continue as guest →</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: Math.min(width - 48, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    zIndex: 10,
  },
  imageContainer: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  lockImage: {
    width: 110,
    height: 95,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
    paddingHorizontal: 8,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18.5,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#581C87',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 6,
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#581C87',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  secondaryButtonText: {
    color: '#581C87',
    fontSize: 15,
    fontWeight: '700',
  },
  tertiaryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tertiaryButtonText: {
    color: '#581C87',
    fontSize: 14,
    fontWeight: '700',
  },
});
