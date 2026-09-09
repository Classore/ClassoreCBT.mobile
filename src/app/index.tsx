import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import { Onboarding } from '@/components/Onboarding';
import { useAuth } from '@/context/AuthContext';

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const handleSplashComplete = () => {
    if (!isLoading && token) {
      router.replace('/(tabs)');
    } else {
      setShowSplash(false);
    }
  };

  useEffect(() => {
    if (!showSplash && !isLoading && token) {
      router.replace('/(tabs)');
    }
  }, [showSplash, isLoading, token, router]);

  if (showSplash) {
    return <CustomSplashScreen onComplete={handleSplashComplete} />;
  }

  if (token) {
    return null;
  }

  return <Onboarding />;
}

