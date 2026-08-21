import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockVerifyIdToken = vi.fn();

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

import { verifyBearerToken, verifyInternalAnalyticsToken } from '@/lib/auth/verify-bearer-token';

function makeRequest(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }
  return new NextRequest('http://localhost/api/test', { method: 'POST', headers });
}

describe('verifyBearerToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null without Authorization header', async () => {
    expect(await verifyBearerToken(makeRequest())).toBeNull();
  });

  it('returns null for non-Bearer scheme', async () => {
    expect(await verifyBearerToken(makeRequest('Basic abc'))).toBeNull();
  });

  it('returns null for empty Bearer token', async () => {
    expect(await verifyBearerToken(makeRequest('Bearer '))).toBeNull();
  });

  it('returns uid when verifyIdToken succeeds', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user-1' });
    const result = await verifyBearerToken(makeRequest('Bearer valid-token'));
    expect(result).toEqual({ uid: 'user-1' });
    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token', true);
  });

  it('returns null when verifyIdToken throws', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid'));
    expect(await verifyBearerToken(makeRequest('Bearer bad-token'))).toBeNull();
  });

  it('requires the internal analytics custom claim', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'operator', internalAnalytics: true });
    await expect(verifyInternalAnalyticsToken(makeRequest('Bearer valid-token'))).resolves.toEqual({
      uid: 'operator',
      internalAnalytics: true,
    });

    mockVerifyIdToken.mockResolvedValue({ uid: 'user-1' });
    await expect(verifyInternalAnalyticsToken(makeRequest('Bearer valid-token'))).resolves.toBeNull();
  });
});
