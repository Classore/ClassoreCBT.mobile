import { Platform } from 'react-native';

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '224829194037-d80b2mbsnku9r93m2r3283o7o6anrk31.apps.googleusercontent.com';

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;

let isNativeConfigured = false;
let gsiScriptPromise: Promise<void> | null = null;

/**
 * Configure Google Sign-In for native platforms (Android / iOS).
 * Never called on Web to prevent the "@react-native-google-signin/google-signin" web sponsor error.
 */
export const initGoogleAuth = () => {
  if (Platform.OS === 'web') return;

  if (!isNativeConfigured) {
    try {
      // Dynamic require ensures no web code executes this module
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
      });
      isNativeConfigured = true;
    } catch (e) {
      console.warn('Failed to configure native GoogleSignin:', e);
    }
  }
};

/**
 * Perform native Google Sign-In using Google Play Services (Android) or iOS SDK.
 */
export const performNativeGoogleSignIn = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    throw new Error('performNativeGoogleSignIn cannot be called on web.');
  }

  initGoogleAuth();

  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = require('@react-native-google-signin/google-signin');

  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token returned by Google.');
      }
      return idToken;
    }
    return null;
  } catch (error: any) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          throw new Error('Google Sign-In is already in progress.');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services is not available or outdated on this device.');
        case statusCodes.SIGN_IN_CANCELLED:
          return null;
        default:
          throw new Error(error.message || 'Google Sign-In failed.');
      }
    }
    throw error;
  }
};

/**
 * Loads the official Google Identity Services (GIS) JavaScript SDK on the web.
 */
export const loadGsiScript = (): Promise<void> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve();
  }

  if ((window as any).google?.accounts?.id) {
    return Promise.resolve();
  }

  if (gsiScriptPromise) {
    return gsiScriptPromise;
  }

  gsiScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      if ((window as any).google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services SDK.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK. Check your internet connection or ad-blocker.'));
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
};

/**
 * Initialize Google Identity Services for web authentication.
 */
export const initGoogleWebAuth = async (
  onCredentialReceived: (idToken: string) => void
): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  try {
    await loadGsiScript();

    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_WEB_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            onCredentialReceived(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Google Web Auth initialization warning:', err);
    return false;
  }
};

/**
 * Renders the official Google Sign-In button on the web inside the given container.
 */
export const renderGoogleWebButton = (
  container: HTMLElement,
  options?: {
    width?: number;
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with';
  }
) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !container) return;

  if ((window as any).google?.accounts?.id) {
    try {
      container.innerHTML = '';
      (window as any).google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: options?.theme || 'outline',
        size: options?.size || 'large',
        text: options?.text || 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: options?.width || 320,
      });
    } catch (e) {
      console.warn('Failed to render Google web button:', e);
    }
  }
};

/**
 * Triggers Google One-Tap prompt on the web if available.
 */
export const promptGoogleOneTap = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  if ((window as any).google?.accounts?.id) {
    (window as any).google.accounts.id.prompt();
  }
};

/**
 * Exchange Google ID token with the Classore backend to get an authenticated session token.
 */
export const exchangeGoogleTokenWithBackend = async (idToken: string): Promise<string> => {
  let apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    apiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
  }
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');

  const res = await fetch(`${cleanApiUrl}/api/auth/google/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Google authentication failed with server.');
  }

  const data = await res.json();
  const token = data.token || data.key || data.access;
  if (!token) {
    throw new Error('No authentication token received from server.');
  }

  return token;
};
