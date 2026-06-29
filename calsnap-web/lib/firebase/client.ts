import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
  connectAuthToEmulator,
  connectFirestoreToEmulator,
  connectStorageToEmulator,
  shouldUseFirebaseEmulator,
} from '@/lib/firebase/emulator';
import { resolveAuthDomain } from '@/lib/firebase/resolve-auth-domain';

const EMULATOR_FIREBASE_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-calsnap.firebaseapp.com',
  projectId: 'demo-calsnap',
  storageBucket: 'demo-calsnap.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
} as const;

function resolveFirebaseWebConfig() {
  if (shouldUseFirebaseEmulator()) {
    return EMULATOR_FIREBASE_CONFIG;
  }

  // Static process.env access is required so Next.js inlines NEXT_PUBLIC_* in the client bundle.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = resolveAuthDomain({
    useEmulator: false,
    emulatorAuthDomain: EMULATOR_FIREBASE_CONFIG.authDomain,
    browserHost: typeof window !== 'undefined' ? window.location.host : null,
    envAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: projectId ?? 'calsnap-web',
  });
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const missing = [
    !apiKey && 'NEXT_PUBLIC_FIREBASE_API_KEY',
    !projectId && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    !storageBucket && 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    !messagingSenderId && 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    !appId && 'NEXT_PUBLIC_FIREBASE_APP_ID',
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}`);
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }
  if (getApps().length) {
    app = getApp();
    return app;
  }
  app = initializeApp(resolveFirebaseWebConfig());
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }

  const firebaseApp = getFirebaseApp();
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    auth = getAuth(firebaseApp);
  }

  connectAuthToEmulator(auth);
  return auth;
}

export function getFirestoreDb(): Firestore {
  const db = getFirestore(getFirebaseApp());
  connectFirestoreToEmulator(db);
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  const storage = getStorage(getFirebaseApp());
  connectStorageToEmulator(storage);
  return storage;
}
