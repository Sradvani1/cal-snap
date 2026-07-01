import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-edge';

vi.mock('@/lib/auth/verify-api-session', () => ({
  verifyApiSession: vi.fn(),
}));

vi.mock('@/lib/gemini/generate-insight', () => ({
  generateAnalyticsInsight: vi.fn(),
  GeminiInsightError: class GeminiInsightError extends Error {
    constructor(
      public code: string,
      message?: string,
    ) {
      super(message ?? code);
    }
  },
}));

import { verifyApiSession } from '@/lib/auth/verify-api-session';
import { generateAnalyticsInsight } from '@/lib/gemini/generate-insight';
import { copy } from '@/lib/copy';
import { POST } from '@/app/api/generate-insight/route';

const mockedVerify = vi.mocked(verifyApiSession);
const mockedGenerate = vi.mocked(generateAnalyticsInsight);

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    timeframeLabel: '7D',
    loggedDayCount: 5,
    averageDailyCalories: 1950,
    calorieTarget: 2000,
    adherencePercent: 60,
    actualMacroSplit: { proteinPct: 30, carbsPct: 45, fatPct: 25 },
    targetMacroSplit: { proteinPct: 28, carbsPct: 47, fatPct: 25 },
    averageDailyFiberG: 22,
    fiberTargetG: 28,
    weekendAverageCalories: 2100,
    weekdayAverageCalories: 1850,
    topFoods: [{ name: 'Chicken', count: 4, avgCalories: 200 }],
    weightChangeKg: null,
    ...overrides,
  };
}

function makeRequest(options: {
  cookie?: string;
  body?: unknown;
}): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (options.cookie) {
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${options.cookie}`);
  }
  return new NextRequest('http://localhost/api/generate-insight', {
    method: 'POST',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

describe('POST /api/generate-insight', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('returns 401 without valid session', async () => {
    mockedVerify.mockResolvedValue(null);
    const response = await POST(makeRequest({ body: makePayload() }));
    expect(response.status).toBe(401);
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const response = await POST(makeRequest({ body: makePayload() }));
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.error).toBe(copy('api.insight.unavailable'));
    expect(body.code).toBe('insight_unavailable');
  });

  it('returns 400 for invalid payload', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const response = await POST(makeRequest({ body: { loggedDayCount: 'bad' } }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when loggedDayCount is less than 3', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const response = await POST(
      makeRequest({ body: makePayload({ loggedDayCount: 2 }) }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 200 with mocked insight response', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedGenerate.mockResolvedValue('You are doing well on protein. Try more fiber at lunch.');

    const response = await POST(makeRequest({ body: makePayload() }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { insight: string };
    expect(body.insight).toContain('protein');
    expect(mockedGenerate).toHaveBeenCalledOnce();
  });
});
