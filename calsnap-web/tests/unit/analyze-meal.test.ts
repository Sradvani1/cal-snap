import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { MockGoogleGenAI, mockGenerateContent } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const MockGoogleGenAI = vi.fn(function (this: {
    models: { generateContent: typeof mockGenerateContent };
  }) {
    this.models = { generateContent: mockGenerateContent };
  });
  return { MockGoogleGenAI, mockGenerateContent };
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI,
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'harassment',
    HARM_CATEGORY_HATE_SPEECH: 'hateSpeech',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'sexuallyExplicit',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'dangerousContent',
  },
  HarmBlockThreshold: { BLOCK_NONE: 'blockNone' },
  ThinkingLevel: { LOW: 'low' },
}));

import { analyzeMealImage, GeminiAnalysisError } from '@/lib/gemini/analyze-meal';

function successResponse() {
  return {
    candidates: [{ finishReason: 'STOP' }],
    text: JSON.stringify({
      items: [
        {
          name: 'Rice',
          estimated_weight_g: 100,
          protein_g: 2,
          carbs_g: 30,
          saturated_fat_g: 0,
          unsaturated_fat_g: 0,
          fiber_g: 1,
          confidence: 0.9,
        },
      ],
      flagged_items: [],
      estimation_notes: '',
    }),
  };
}

describe('analyzeMealImage retry configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('disables SDK retries and passes a request abort signal', async () => {
    mockGenerateContent.mockResolvedValue(successResponse());

    await analyzeMealImage({ description: 'rice' });

    expect(MockGoogleGenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      httpOptions: {
        apiVersion: 'v1',
        timeout: 30_000,
        retryOptions: { attempts: 1 },
      },
    });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          abortSignal: expect.any(AbortSignal),
          thinkingConfig: { thinkingLevel: 'low' },
        }),
      }),
    );
  });

  it('retries HTTP 429 and 5xx failures', async () => {
    vi.useFakeTimers();
    mockGenerateContent
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockRejectedValueOnce(Object.assign(new Error('server error'), { status: 503 }))
      .mockResolvedValueOnce(successResponse());

    const resultPromise = analyzeMealImage({ description: 'rice' });
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(resultPromise).resolves.toMatchObject({ items: [{ name: 'Rice' }] });
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable HTTP 4xx failure', async () => {
    mockGenerateContent.mockRejectedValue(
      Object.assign(new Error('invalid request'), { status: 400 }),
    );

    await expect(analyzeMealImage({ description: 'rice' })).rejects.toBeInstanceOf(
      GeminiAnalysisError,
    );
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });
});
