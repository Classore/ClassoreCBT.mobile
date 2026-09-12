import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Alert, StyleProp, ViewStyle } from 'react-native';
import { CustomButton } from './CustomButton';
import { GoogleIcon } from './GoogleIcon';
import {
  initGoogleAuth,
  initGoogleWebAuth,
  renderGoogleWebButton,
  promptGoogleOneTap,
  performNativeGoogleSignIn,
  exchangeGoogleTokenWithBackend,
} from '@/services/googleAuth';

interface GoogleSignInButtonProps {
  onSuccess: (token: string) => Promise<void> | void;
  onError?: (error: any) => void;
  text?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'Continue with Google',
  style,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isWebReady, setIsWebReady] = useState(false);
  const webBtnContainerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    if (Platform.OS === 'web') {
      initGoogleWebAuth(async (idToken) => {
        try {
          setIsLoading(true);
          const authToken = await exchangeGoogleTokenWithBackend(idToken);
          await onSuccess(authToken);
        } catch (err: any) {
          console.error('Google web token exchange error:', err);
          if (onError) {
            onError(err);
          } else {
            Alert.alert('Google Sign-In Failed', err.message || 'Could not complete Google Sign-In.');
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }).then((ready) => {
        if (isMounted && ready && webBtnContainerRef.current) {
          const measuredWidth = webBtnContainerRef.current?.offsetWidth || 340;
          const buttonWidth = Math.min(Math.max(measuredWidth, 200), 400);
          renderGoogleWebButton(webBtnContainerRef.current, {
            width: buttonWidth,
            text: 'continue_with',
          });
          setIsWebReady(true);
        }
      });
    } else {
      initGoogleAuth();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePress = async () => {
    if (disabled || isLoading) return;

    if (Platform.OS === 'web') {
      promptGoogleOneTap();
      return;
    }

    // Native flow
    try {
      setIsLoading(true);
      const idToken = await performNativeGoogleSignIn();
      if (idToken) {
        const authToken = await exchangeGoogleTokenWithBackend(idToken);
        await onSuccess(authToken);
      }
    } catch (err: any) {
      console.error('Google native sign in error:', err);
      if (onError) {
        onError(err);
      } else {
        Alert.alert('Google Sign-In Error', err.message || 'An error occurred during Google Sign-In.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    const flattened = StyleSheet.flatten([styles.container, style]) || {};
    const containerLayout = {
      width: (flattened as any).width || '100%',
      marginTop: (flattened as any).marginTop,
      marginBottom: (flattened as any).marginBottom ?? 16,
      marginVertical: (flattened as any).marginVertical,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    return (
      <View style={containerLayout}>
        <div
          ref={webBtnContainerRef}
          style={{
            display: isWebReady ? 'flex' : 'none',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            minHeight: 44,
          }}
        />
        {!isWebReady && (
          <CustomButton
            title={text}
            variant="secondary"
            loading={isLoading}
            onPress={handlePress}
            disabled={disabled}
            icon={<View style={{ marginRight: 10 }}><GoogleIcon size={20} /></View>}
            style={style}
          />
        )}
      </View>
    );
  }

  return (
    <CustomButton
      title={text}
      variant="secondary"
      loading={isLoading}
      onPress={handlePress}
      disabled={disabled}
      icon={<View style={{ marginRight: 10 }}><GoogleIcon size={20} /></View>}
      style={[styles.nativeButton, style]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  nativeButton: {
    width: '100%',
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  fallbackButton: {
    width: '100%',
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
});
