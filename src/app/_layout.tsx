import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { DevMenu } from '@/components/DevMenu';
import { NotificationProvider } from '@/context/NotificationContext';
import { useFonts } from 'expo-font';
import { 
  Inter_400Regular, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.otf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.otf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.otf'),
    'Geist-Bold': require('../../assets/fonts/Geist-Bold.otf'),
    Inter_400Regular,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(exam)" />
          </Stack>
          <DevMenu />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
