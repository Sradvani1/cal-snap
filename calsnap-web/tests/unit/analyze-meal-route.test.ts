import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/verify-bearer-token', () => ({
  verifyBearerToken: vi.fn(),
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

import { verifyBearerToken } from '@/lib/auth/verify-bearer-token';
import { analyzeMealImage, GeminiAnalysisError } from '@/lib/gemini/analyze-meal';
import { copy } from '@/lib/copy';
import { ApiErrorCode } from '@/lib/api/error-codes';
import { POST } from '@/app/api/analyze-meal/route';

const mockedVerify = vi.mocked(verifyBearerToken);
const mockedAnalyze = vi.mocked(analyzeMealImage);

function makeRequest(options: {
  bearerToken?: string;
  formData?: FormData;
}): NextRequest {
  const headers = new Headers();
  if (options.bearerToken) {
    headers.set('Authorization', `Bearer ${options.bearerToken}`);
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

  it('returns 401 without valid bearer token', async () => {
    mockedVerify.mockResolvedValue(null);
    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(401);
  });

  it('returns 400 when neither image nor description provided', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const formData = new FormData();
    const response = await POST(makeRequest({ formData }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.error).toBe(copy('api.analyze.missingInput'));
    expect(body.code).toBe(ApiErrorCode.MissingInput);
  });

  it('returns 200 with description only (no image)', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedAnalyze.mockResolvedValue({
      items: [
        {
          name: 'Eggs and toast',
          estimatedWeightG: 300,
          calories: 450,
          proteinG: 22,
          carbsG: 40,
          fatG: 18,
          saturatedFatG: 6,
          unsaturatedFatG: 12,
          fiberG: 3,
          confidence: 0.6,
        },
      ],
      mealTotal: { calories: 450, proteinG: 22, carbsG: 40, fatG: 18, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 3 },
      flaggedItems: [],
      estimationNotes: 'Estimated from description.',
    });

    const formData = new FormData();
    formData.set('description', '2 eggs, 2 slices toast, coffee with milk');

    const response = await POST(makeRequest({ formData }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: Array<{ name: string }> };
    expect(body.items[0]?.name).toBe('Eggs and toast');
    expect(mockedAnalyze).toHaveBeenCalledOnce();
    expect(mockedAnalyze).toHaveBeenCalledWith({
      imageBytes: undefined,
      mimeType: 'image/jpeg',
      description: '2 eggs, 2 slices toast, coffee with milk',
    });
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    process.env.GEMINI_API_KEY = '';
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.error).toBe(copy('api.analyze.unavailable'));
    expect(body.code).toBe(ApiErrorCode.AnalysisUnavailable);
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
          saturatedFatG: 3,
          unsaturatedFatG: 7,
          fiberG: 0,
          confidence: 0.9,
        },
      ],
      mealTotal: {
        calories: 250,
        proteinG: 30,
        carbsG: 0,
        fatG: 10,
        saturatedFatG: 0,
        unsaturatedFatG: 0,
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
      mealTotal: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
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
          saturatedFatG: 2,
          unsaturatedFatG: 6,
          fiberG: 4,
          confidence: 0.85,
        },
      ],
      mealTotal: {
        calories: 150,
        proteinG: 5,
        carbsG: 10,
        fatG: 8,
        saturatedFatG: 0,
        unsaturatedFatG: 0,
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

  it('returns parse_failed code when Gemini validation fails', async () => {
    mockedVerify.mockResolvedValue({ uid: 'user-1' });
    mockedAnalyze.mockRejectedValue(new GeminiAnalysisError('validationFailed'));

    const response = await POST(makeRequest({ formData: makeFormDataWithImage() }));
    expect(response.status).toBe(502);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.error).toBe(copy('api.analyze.parseFailed'));
    expect(body.code).toBe(ApiErrorCode.AnalysisParseFailed);
  });
});
