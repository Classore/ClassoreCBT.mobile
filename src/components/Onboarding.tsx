import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, useWindowDimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const slides = [
  {
    id: 1,
    image: require('../../assets/images/Onboarding Illustration.svg'),
    title: 'Welcome to Classore\nTest Center',
    subtitle: 'Take practice tests across multiple\nsubjects and track your performance in\nreal-time.',
  },
  {
    id: 2,
    image: require('../../assets/images/Onboarding Illustration 2.svg'),
    title: 'Prepare Smarter\nfor Every Exam',
    subtitle: 'Get instant explanations, personalized\nrecommendations, writing evaluation, and\nspeaking assessment.',
  },
  {
    id: 3,
    image: require('../../assets/images/Onboarding Illustration 3.svg'),
    title: 'Start Exploring',
    subtitle: 'Browse and explore the app. Sign in\nto unlock full access and\npersonalized features.',
  }
];

export function Onboarding() {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  
  // Calculate a responsive image size, capped at a maximum of 400px so it doesn't dominate large screens
  const imageSize = Math.min(width * 0.8, height * 0.4, 400);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    setCurrentIndex(slides.length - 1);
  };

  const navigateToHome = () => {
    router.replace('/(tabs)');
  };

  const navigateToAuth = () => {
    router.push('/(auth)/signup');
  };

  const navigateToSignIn = () => {
    router.push('/auth/login');
  };

  const currentSlide = slides[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.pageIndicator}>
          <AppText style={styles.pageIndicatorBold}>{currentIndex + 1}</AppText>/3
        </AppText>
        {currentIndex < 2 && (
          <TouchableOpacity onPress={handleSkip}>
            <AppText style={styles.skipText}>Skip</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
          <Image 
            source={currentSlide.image}
            style={styles.image}
            contentFit="contain"
          />
        </View>
        <AppText style={styles.title}>{currentSlide.title}</AppText>
        <AppText style={styles.subtitle}>{currentSlide.subtitle}</AppText>
      </View>

      {/* Footer */}
      {currentIndex < 2 ? (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.footerButton, currentIndex === 0 && { opacity: 0 }]} 
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <AppText style={styles.footerButtonTextPrev}>Prev</AppText>
          </TouchableOpacity>

          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  currentIndex === index && styles.dotActive
                ]} 
              />
            ))}
          </View>

          <TouchableOpacity style={styles.footerButton} onPress={handleNext}>
            <AppText style={styles.footerButtonTextNext}>Next</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.finalFooter}>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToHome}>
            <AppText style={styles.primaryButtonText}>Continue as Guest</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToAuth}>
            <AppText style={styles.secondaryButtonText}>Create an Account</AppText>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <AppText style={styles.loginText}>Already have an account? </AppText>
            <TouchableOpacity onPress={navigateToSignIn}>
              <AppText style={styles.loginLink}>Sign in</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    height: 40,
  },
  pageIndicator: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '500',
  },
  pageIndicatorBold: {
    color: '#000000',
    fontWeight: '700',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  imageContainer: {
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  footerButton: {
    width: 60,
  },
  footerButtonTextPrev: {
    fontSize: 16,
    color: '#B3B3B3',
    fontWeight: '600',
  },
  footerButtonTextNext: {
    fontSize: 16,
    color: '#6C47C6',
    fontWeight: '600',
    textAlign: 'right',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#6C47C6',
  },
  finalFooter: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#6C47C6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6C47C6',
  },
  secondaryButtonText: {
    color: '#6C47C6',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#666666',
    fontSize: 14,
  },
  loginLink: {
    color: '#F47B4A',
    fontSize: 14,
    fontWeight: '600',
  },
});

