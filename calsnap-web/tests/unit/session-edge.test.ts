import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { JWTPayload } from 'jose';

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    jwtVerify: vi.fn(),
  };
});

import { jwtVerify } from 'jose';
import {
  verifySessionCookieValue,
  verifySessionToken,
} from '@/lib/auth/session-edge';

const mockedJwtVerify = vi.mocked(jwtVerify);

function makeEmulatorJwt(
  payload: Partial<JWTPayload>,
  projectId: string,
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
    'base64url',
  );
  const body = Buffer.from(
    JSON.stringify({
      sub: 'user-1',
      ...payload,
      aud: projectId,
      iss: `https://securetoken.google.com/${projectId}`,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('session-edge verification', () => {
  const originalEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR;
  const originalProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-calsnap';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = originalEmulator;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = originalProjectId;
  });

  describe('emulator mode', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
    });

    it('verifySessionToken decodes emulator ID token', async () => {
      const token = makeEmulatorJwt({ uid: 'user-1' }, 'demo-calsnap');
      const payload = await verifySessionToken(token);
      expect(payload?.sub).toBe('user-1');
    });

    it('verifySessionCookieValue decodes emulator ID token', async () => {
      const token = makeEmulatorJwt({ uid: 'user-1' }, 'demo-calsnap');
      const payload = await verifySessionCookieValue(token);
      expect(payload?.sub).toBe('user-1');
    });

    it('rejects expired emulator token', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
        'base64url',
      );
      const body = Buffer.from(
        JSON.stringify({
          sub: 'user-1',
          aud: 'demo-calsnap',
          iss: 'https://securetoken.google.com/demo-calsnap',
          exp: Math.floor(Date.now() / 1000) - 60,
        }),
      ).toString('base64url');
      const token = `${header}.${body}.sig`;
      expect(await verifySessionToken(token)).toBeNull();
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';
    });

    it('verifySessionCookieValue tries session-cookie issuer then ID token', async () => {
      mockedJwtVerify
        .mockRejectedValueOnce(new Error('wrong issuer'))
        .mockResolvedValueOnce({
          payload: { sub: 'user-1', aud: 'demo-calsnap' },
          protectedHeader: { alg: 'RS256' },
        });

      const payload = await verifySessionCookieValue('session-jwt');
      expect(payload?.sub).toBe('user-1');
      expect(mockedJwtVerify).toHaveBeenCalledTimes(2);
      expect(mockedJwtVerify.mock.calls[0]?.[2]).toMatchObject({
        issuer: 'https://session.firebase.google.com/demo-calsnap',
        audience: 'demo-calsnap',
      });
      expect(mockedJwtVerify.mock.calls[1]?.[2]).toMatchObject({
        issuer: 'https://securetoken.google.com/demo-calsnap',
        audience: 'demo-calsnap',
      });
    });

    it('verifySessionCookieValue returns session JWT when first verify succeeds', async () => {
      mockedJwtVerify.mockResolvedValueOnce({
        payload: { sub: 'user-2' },
        protectedHeader: { alg: 'RS256' },
      });

      const payload = await verifySessionCookieValue('session-jwt');
      expect(payload?.sub).toBe('user-2');
      expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
    });

    it('verifySessionToken verifies ID token issuer only', async () => {
      mockedJwtVerify.mockResolvedValueOnce({
        payload: { sub: 'user-3' },
        protectedHeader: { alg: 'RS256' },
      });

      const payload = await verifySessionToken('id-token');
      expect(payload?.sub).toBe('user-3');
      expect(mockedJwtVerify.mock.calls[0]?.[2]).toMatchObject({
        issuer: 'https://securetoken.google.com/demo-calsnap',
      });
    });
  });
});
