import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-edge';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(),
}));

vi.mock('@/lib/firebase/emulator', () => ({
  shouldUseFirebaseEmulator: vi.fn(),
}));

import { getAdminAuth } from '@/lib/firebase/admin';
import { shouldUseFirebaseEmulator } from '@/lib/firebase/emulator';
import { POST } from '@/app/api/auth/session/route';
import { verifyApiSession } from '@/lib/auth/verify-api-session';

const mockedGetAdminAuth = vi.mocked(getAdminAuth);
const mockedShouldUseEmulator = vi.mocked(shouldUseFirebaseEmulator);

const mockVerifyIdToken = vi.fn();
const mockCreateSessionCookie = vi.fn();
const mockVerifySessionCookie = vi.fn();

function makePostRequest(idToken: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

describe('POST /api/auth/session', () => {
  const originalAuthEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    mockedGetAdminAuth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
      createSessionCookie: mockCreateSessionCookie,
    } as unknown as ReturnType<typeof getAdminAuth>);
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-1' });
  });

  afterEach(() => {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = originalAuthEmulatorHost;
  });

  it('stores raw ID token in emulator mode', async () => {
    mockedShouldUseEmulator.mockReturnValue(true);
    const response = await POST(makePostRequest('emulator-id-token'));
    expect(response.status).toBe(200);
    expect(mockCreateSessionCookie).not.toHaveBeenCalled();
    const cookie = response.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe('emulator-id-token');
  });

  it('creates session cookie in production mode', async () => {
    mockedShouldUseEmulator.mockReturnValue(false);
    mockCreateSessionCookie.mockResolvedValue('prod-session-cookie');
    const response = await POST(makePostRequest('prod-id-token'));
    expect(response.status).toBe(200);
    expect(mockCreateSessionCookie).toHaveBeenCalledWith('prod-id-token', {
      expiresIn: 5 * 24 * 60 * 60 * 1000,
    });
    const cookie = response.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe('prod-session-cookie');
  });

  it('uses emulator path when FIREBASE_AUTH_EMULATOR_HOST is set', async () => {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    mockedShouldUseEmulator.mockReturnValue(false);
    const response = await POST(makePostRequest('emulator-id-token'));
    expect(mockCreateSessionCookie).not.toHaveBeenCalled();
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('emulator-id-token');
  });
});

describe('verifyApiSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAdminAuth.mockReturnValue({
      verifySessionCookie: mockVerifySessionCookie,
      verifyIdToken: mockVerifyIdToken,
    } as unknown as ReturnType<typeof getAdminAuth>);
  });

  it('verifies session cookie with checkRevoked true', async () => {
    mockVerifySessionCookie.mockResolvedValue({ uid: 'user-1' });
    const request = new NextRequest('http://localhost/api/test', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=session-value` },
    });
    const session = await verifyApiSession(request);
    expect(session).toEqual({ uid: 'user-1' });
    expect(mockVerifySessionCookie).toHaveBeenCalledWith('session-value', true);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('falls back to verifyIdToken for emulator raw ID token', async () => {
    mockVerifySessionCookie.mockRejectedValue(new Error('not a session cookie'));
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-2' });
    const request = new NextRequest('http://localhost/api/test', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=id-token` },
    });
    const session = await verifyApiSession(request);
    expect(session).toEqual({ uid: 'user-2' });
    expect(mockVerifyIdToken).toHaveBeenCalledWith('id-token');
  });

  it('returns null when both verifications fail', async () => {
    mockVerifySessionCookie.mockRejectedValue(new Error('invalid'));
    mockVerifyIdToken.mockRejectedValue(new Error('invalid'));
    const request = new NextRequest('http://localhost/api/test', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=bad` },
    });
    expect(await verifyApiSession(request)).toBeNull();
  });
});
