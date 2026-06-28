import { connectAuthEmulator, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const STORAGE_HOST = '127.0.0.1';
const STORAGE_PORT = 9199;

let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;
let storageEmulatorConnected = false;

export function shouldUseFirebaseEmulator(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
}

export function connectAuthToEmulator(auth: Auth): void {
  if (!shouldUseFirebaseEmulator() || authEmulatorConnected) {
    return;
  }
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  authEmulatorConnected = true;
}

export function connectFirestoreToEmulator(db: Firestore): void {
  if (!shouldUseFirebaseEmulator() || firestoreEmulatorConnected) {
    return;
  }
  connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
  firestoreEmulatorConnected = true;
}

export function connectStorageToEmulator(storage: FirebaseStorage): void {
  if (!shouldUseFirebaseEmulator() || storageEmulatorConnected) {
    return;
  }
  connectStorageEmulator(storage, STORAGE_HOST, STORAGE_PORT);
  storageEmulatorConnected = true;
}
