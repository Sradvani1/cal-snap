import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/verify-bearer-token', () => ({
  verifyBearerToken: vi.fn(),
}));

vi.mock('@/lib/usage/server', () => ({
  recordUsageEvent: vi.fn(),
}));

import { verifyBearerToken } from '@/lib/auth/verify-bearer-token';
import { recordUsageEvent } from '@/lib/usage/server';
import { POST } from '@/app/api/usage-event/route';

const mockedVerify = vi.mocked(verifyBearerToken);
const mockedRecord = vi.mocked(recordUsageEvent);

function request(body: unknown, contentLength?: number): NextRequest {
  return requestText(JSON.stringify(body), contentLength);
}

function requestText(body: string, contentLength?: number): NextRequest {
  const headers = new Headers({
    Authorization: 'Bearer token',
    'Content-Type': 'application/json',
  });
  if (contentLength !== undefined) {
    headers.set('content-length', String(contentLength));
  }
  return new NextRequest('http://localhost/api/usage-event', {
    method: 'POST',
    headers,
    body,
  });
}

describe('POST /api/usage-event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    mockedVerify.mockResolvedValue(null);
    expect((await POST(request({ event: 'app_opened' }))).status).toBe(401);
  });

  it('rejects events outside the allowlist', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    expect((await POST(request({ event: 'meal contents' }))).status).toBe(400);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it('rejects unexpectedly large telemetry payloads', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    expect(
      (await POST(request({ event: 'app_opened', padding: 'x'.repeat(300) }, 257))).status,
    ).toBe(400);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it('enforces the size limit when Content-Length is absent or incorrect', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const largeBody = JSON.stringify({ event: 'app_opened', padding: 'x'.repeat(300) });

    expect((await POST(requestText(largeBody))).status).toBe(400);
    expect((await POST(requestText(largeBody, 1))).status).toBe(400);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it.each(['null', '[]', '"app_opened"', '1'])('rejects non-object JSON body %s', async (body) => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    expect((await POST(requestText(body))).status).toBe(400);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it('records an allowlisted event for the verified account', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedRecord.mockResolvedValue(true);
    expect((await POST(request({ event: 'meal_saved' }))).status).toBe(204);
    expect(mockedRecord).toHaveBeenCalledWith('user-1', 'meal_saved');
  });
});
