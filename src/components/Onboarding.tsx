import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

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
    router.replace('/home');
  };

  const navigateToAuth = () => {
    router.replace('/auth');
  };

  const currentSlide = slides[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorBold}>{currentIndex + 1}</Text>/3
        </Text>
        {currentIndex < 2 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={currentSlide.image}
            style={styles.image}
            contentFit="contain"
          />
        </View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
      </View>

      {/* Footer */}
      {currentIndex < 2 ? (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.footerButton, currentIndex === 0 && { opacity: 0 }]} 
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.footerButtonTextPrev}>Prev</Text>
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
            <Text style={styles.footerButtonTextNext}>Next</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.finalFooter}>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToHome}>
            <Text style={styles.primaryButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToAuth}>
            <Text style={styles.secondaryButtonText}>Create an Account</Text>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToAuth}>
              <Text style={styles.loginLink}>Sign in</Text>
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
    width: width * 0.8,
    height: width * 0.8,
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
