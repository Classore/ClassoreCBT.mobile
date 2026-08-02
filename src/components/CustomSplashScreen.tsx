import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

export function CustomSplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    async function prepare() {
      try {
        // Minimum native splash time before hiding
        await new Promise(resolve => setTimeout(resolve, 500)); 
        await SplashScreen.hideAsync();
        // Show custom splash for an additional 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        onComplete();
      } catch (e) {
        console.warn(e);
        onComplete();
      }
    }
    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6C47C6', '#5C38B0', '#4A2A94', '#EAE6F9']}
        locations={[0, 0.6, 0.9, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.contentContainer}>
        <Image 
          source={require('../../assets/images/Classore Logo.png')} 
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.brandName}>Classore</Text>
        <Text style={styles.brandSubtitle}>Test Center</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6C47C6',
    zIndex: 999,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandSubtitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '400',
  }
});
