import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { Platform } from 'react-native';

// `getReactNativePersistence` is shipped by firebase/auth at runtime in the
// React Native bundle but is absent in the web bundle. Cast the namespace to
// access it without TS complaints; we guard with Platform.OS before calling.
const { getAuth, initializeAuth, getReactNativePersistence } = FirebaseAuth as unknown as {
  getAuth: (app: FirebaseApp) => Auth;
  initializeAuth: (app: FirebaseApp, deps: { persistence: unknown }) => Auth;
  getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
};

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function ensureApp(): FirebaseApp {
  if (app) return app;
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Firebase config missing. Populate EXPO_PUBLIC_FIREBASE_* env vars in mobile/.env.',
    );
  }
  const existing = getApps()[0];
  app = existing ?? initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const a = ensureApp();
  if (Platform.OS === 'web' || !getReactNativePersistence) {
    // Em web o Firebase usa localStorage automaticamente.
    auth = getAuth(a);
    return auth;
  }
  try {
    auth = initializeAuth(a, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // fallback se já foi inicializado em outro hot-reload
    auth = getAuth(a);
  }
  return auth;
}
