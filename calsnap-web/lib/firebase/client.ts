import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
  connectAuthToEmulator,
  connectFirestoreToEmulator,
  connectStorageToEmulator,
  shouldUseFirebaseEmulator,
} from '@/lib/firebase/emulator';

const EMULATOR_FIREBASE_CONFIG = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-calsnap.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-calsnap',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-calsnap.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:1234567890:web:abcdef',
} as const;

function requireEnv(name: keyof typeof EMULATOR_FIREBASE_CONFIG): string {
  const value = process.env[name];
  if (value) {
    return value;
  }
  if (shouldUseFirebaseEmulator()) {
    return EMULATOR_FIREBASE_CONFIG[name];
  }
  throw new Error(`Missing ${name}`);
}

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }
  if (getApps().length) {
    app = getApp();
    return app;
  }
  app = initializeApp({
    apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  });
  return app;
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
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
