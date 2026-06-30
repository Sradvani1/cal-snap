import { describe, expect, it } from 'vitest';
import { resolveAuthDomain } from '@/lib/firebase/resolve-auth-domain';

describe('resolveAuthDomain', () => {
  it('uses emulator auth domain in emulator mode', () => {
    expect(
      resolveAuthDomain({
        useEmulator: true,
        emulatorAuthDomain: 'demo-calsnap.firebaseapp.com',
        browserHost: 'calsnap-web.vercel.app',
        envAuthDomain: undefined,
        projectId: 'calsnap-web',
      }),
    ).toBe('demo-calsnap.firebaseapp.com');
  });

  it('prefers the browser host in production', () => {
    expect(
      resolveAuthDomain({
        useEmulator: false,
        emulatorAuthDomain: 'demo-calsnap.firebaseapp.com',
        browserHost: 'calsnap-web.vercel.app',
        envAuthDomain: 'calsnap-web.firebaseapp.com',
        projectId: 'calsnap-web',
      }),
    ).toBe('calsnap-web.vercel.app');
  });

  it('falls back to env auth domain without a browser host', () => {
    expect(
      resolveAuthDomain({
        useEmulator: false,
        emulatorAuthDomain: 'demo-calsnap.firebaseapp.com',
        browserHost: null,
        envAuthDomain: 'calsnap-web.firebaseapp.com',
        projectId: 'calsnap-web',
      }),
    ).toBe('calsnap-web.firebaseapp.com');
  });

  it('uses firebaseapp.com on localhost because dev server is HTTP-only', () => {
    expect(
      resolveAuthDomain({
        useEmulator: false,
        emulatorAuthDomain: 'demo-calsnap.firebaseapp.com',
        browserHost: 'localhost:3000',
        envAuthDomain: 'calsnap-web.firebaseapp.com',
        projectId: 'calsnap-web',
      }),
    ).toBe('calsnap-web.firebaseapp.com');
  });
});
