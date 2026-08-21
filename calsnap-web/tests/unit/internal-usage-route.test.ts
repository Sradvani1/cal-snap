import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/verify-bearer-token', () => ({
  verifyInternalAnalyticsToken: vi.fn(),
}));

vi.mock('@/lib/usage/server', () => ({
  getUsageSummary: vi.fn(),
}));

import { verifyInternalAnalyticsToken } from '@/lib/auth/verify-bearer-token';
import { getUsageSummary } from '@/lib/usage/server';
import { GET } from '@/app/api/internal/usage/route';

const mockedVerify = vi.mocked(verifyInternalAnalyticsToken);
const mockedSummary = vi.mocked(getUsageSummary);
const request = new NextRequest('http://localhost/api/internal/usage', { method: 'GET' });

describe('GET /api/internal/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects users without the internal claim', async () => {
    mockedVerify.mockResolvedValue(null);
    expect((await GET(request)).status).toBe(403);
  });

  it('returns aggregate-only usage data to an internal operator', async () => {
    mockedVerify.mockResolvedValue({ uid: 'operator', internalAnalytics: true });
    mockedSummary.mockResolvedValue({
      days: [{ date: '2026-08-20', activeUsers: 2, eventCounts: { meal_saved: 3 } }],
      totals: { activeUsers: 2, eventCounts: { meal_saved: 3 } },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      days: [{ date: '2026-08-20', activeUsers: 2, eventCounts: { meal_saved: 3 } }],
      totals: { activeUsers: 2, eventCounts: { meal_saved: 3 } },
    });
  });
});
