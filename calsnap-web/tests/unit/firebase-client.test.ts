import { beforeEach, describe, expect, it, vi } from 'vitest';

const FIREBASE_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-calsnap.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-calsnap',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-calsnap.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:1234567890:web:abcdef',
} as const;

describe('firebase client', () => {
  beforeEach(() => {
    vi.resetModules();
    for (const [key, value] of Object.entries(FIREBASE_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  it('initializes Firebase client exports without throwing', async () => {
    const {
      getFirebaseApp,
      getFirebaseAuth,
      getFirestoreDb,
      getFirebaseStorage,
    } = await import('@/lib/firebase/client');

    const app = getFirebaseApp();
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
    expect(getFirebaseAuth()).toBeDefined();
    expect(getFirestoreDb()).toBeDefined();
    expect(getFirebaseStorage()).toBeDefined();
  });

  it('uses demo config when emulator mode is enabled without env vars', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('NEXT_PUBLIC_USE_FIREBASE_EMULATOR', 'true');
    const { getFirebaseApp } = await import('@/lib/firebase/client');
    expect(getFirebaseApp().options.projectId).toBe('demo-calsnap');
  });
});
