import React, { useState } from 'react';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import { Onboarding } from '@/components/Onboarding';

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <CustomSplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <Onboarding />;
}
