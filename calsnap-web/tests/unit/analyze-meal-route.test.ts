import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-edge';

vi.mock('@/lib/auth/verify-api-session', () => ({
  verifyApiSession: vi.fn(),
}));

vi.mock('@/lib/gemini/analyze-meal', () => ({
  analyzeMealImage: vi.fn(),
  GeminiAnalysisError: class GeminiAnalysisError extends Error {
    constructor(
      public code: string,
      message?: string,
    ) {
      super(message ?? code);
    }
  },
}));

import { verifyApiSession } from '@/lib/auth/verify-api-session';
import { analyzeMealImage } from '@/lib/gemini/analyze-meal';
import { POST } from '@/app/api/analyze-meal/route';

const mockedVerify = vi.mocked(verifyApiSession);
const mockedAnalyze = vi.mocked(analyzeMealImage);

function makeRequest(options: {
  cookie?: string;
  formData?: FormData;
}): NextRequest {
  const headers = new Headers();
  if (options.cookie) {
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${options.cookie}`);
  }
  return new NextRequest('http://localhost/api/analyze-meal', {
    method: 'POST',
    headers,
    body: options.formData,
  });
}

function makeFormDataWithImage(size = 100): FormData {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(size)], { type: 'image/jpeg' });
  formData.set('image', blob, 'photo.jpg');
  return formData;
}

describe('POST /api/analyze-meal', () => {
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
    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(401);
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Analysis unavailable');
  });

  it('returns 200 with mocked analysis response', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedAnalyze.mockResolvedValue({
      items: [
        {
          name: 'Chicken',
          estimatedWeightG: 150,
          calories: 250,
          proteinG: 30,
          carbsG: 0,
          fatG: 10,
          fiberG: 0,
          confidence: 0.9,
        },
      ],
      mealTotal: {
        calories: 250,
        proteinG: 30,
        carbsG: 0,
        fatG: 10,
        fiberG: 0,
      },
      flaggedItems: [],
      estimationNotes: 'Looks like grilled chicken.',
    });

    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: Array<{ name: string }> };
    expect(body.items[0]?.name).toBe('Chicken');
    expect(mockedAnalyze).toHaveBeenCalledOnce();
  });

  it('returns 422 when analysis has no items', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedAnalyze.mockResolvedValue({
      items: [],
      mealTotal: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      flaggedItems: [],
      estimationNotes: '',
    });

    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(422);
  });

  it('accepts image with empty MIME type (mobile gallery picks)', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedAnalyze.mockResolvedValue({
      items: [
        {
          name: 'Salad',
          estimatedWeightG: 200,
          calories: 150,
          proteinG: 5,
          carbsG: 10,
          fatG: 8,
          fiberG: 4,
          confidence: 0.85,
        },
      ],
      mealTotal: {
        calories: 150,
        proteinG: 5,
        carbsG: 10,
        fatG: 8,
        fiberG: 4,
      },
      flaggedItems: [],
      estimationNotes: 'ok',
    });

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(100)], { type: '' });
    formData.set('image', blob, 'photo.jpg');

    const response = await POST(makeRequest({ formData }));
    expect(response.status).toBe(200);
  });
});
