import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel } from '@google/genai';
import { AppConstants } from '@/lib/constants';
import { buildMealAnalysisPrompt, MEAL_ANALYSIS_SYSTEM_INSTRUCTION } from '@/lib/gemini/meal-analysis-prompt';
import { mealAnalysisJsonSchema } from '@/lib/gemini/meal-analysis-schema';
import { normalizedJSONData } from '@/lib/gemini/meal-analysis-parser';
import {
  safeParseMealAnalysisResponse,
} from '@/lib/gemini/meal-analysis-zod';
import { withRetry } from '@/lib/gemini/retry';
import type { MealAnalysisResponse } from '@/lib/gemini/meal-analysis-types';

const ANALYSIS_TIMEOUT_MS = 30_000;

export type GeminiAnalysisErrorCode =
  | 'emptyResponse'
  | 'invalidJSON'
  | 'validationFailed'
  | 'requestFailed'
  | 'safetyBlocked';

export class GeminiAnalysisError extends Error {
  constructor(
    public readonly code: GeminiAnalysisErrorCode,
    message?: string,
    public readonly status?: number,
  ) {
    super(message ?? code);
    this.name = 'GeminiAnalysisError';
  }
}

export interface AnalyzeMealImageInput {
  imageBytes?: Buffer;
  mimeType?: string;
  description?: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiAnalysisError('requestFailed', 'GEMINI_API_KEY missing');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: 'v1',
      timeout: 30_000,
      retryOptions: { attempts: 1 },
    },
  });
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const candidate = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof candidate.status === 'number') {
    return candidate.status;
  }
  return typeof candidate.response?.status === 'number'
    ? candidate.response.status
    : undefined;
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function isRetryableAnalysisError(error: unknown): boolean {
  if (error instanceof GeminiAnalysisError) {
    if (error.code === 'emptyResponse' || error.code === 'invalidJSON') {
      return true;
    }
    if (error.code === 'requestFailed') {
      if (error.status !== undefined) {
        return error.status === 429 || error.status >= 500;
      }
      const msg = error.message.toLowerCase();
      if (msg.includes('api key') || msg.includes('api_key') || msg.includes('unauthenticated')) {
        return false;
      }
      return true;
    }
    return false;
  }
  return true;
}

export async function analyzeMealImage(
  input: AnalyzeMealImageInput,
): Promise<MealAnalysisResponse> {
  const client = getGeminiClient();
  const deadline = Date.now() + ANALYSIS_TIMEOUT_MS;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), ANALYSIS_TIMEOUT_MS);
  const imageBase64 = input.imageBytes?.toString('base64');
  const prompt = buildMealAnalysisPrompt({
    hasImage: Boolean(input.imageBytes),
    description: input.description,
  });

  try {
    return await withRetry(
      async () => {
        let text: string;
        let finishReason: string | undefined;

        const parts: Array<
          { text: string } | { inlineData: { mimeType: string; data: string } }
        > = [{ text: prompt }];

        if (imageBase64 !== undefined) {
          parts.push({
            inlineData: {
              mimeType: input.mimeType ?? 'image/jpeg',
              data: imageBase64,
            },
          });
        }

        try {
          const response = await client.models.generateContent({
            model: AppConstants.Gemini.model,
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            config: {
              abortSignal: abortController.signal,
              systemInstruction: MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
              maxOutputTokens: AppConstants.Gemini.maxTokens,
              responseMimeType: 'application/json',
              responseJsonSchema: mealAnalysisJsonSchema(),
              safetySettings: SAFETY_SETTINGS,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            },
          });

          finishReason = response.candidates?.[0]?.finishReason;
          text = response.text?.trim() ?? '';
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Gemini request failed';
          throw new GeminiAnalysisError('requestFailed', message, errorStatus(error));
        }

        if (finishReason === 'SAFETY') {
          throw new GeminiAnalysisError('safetyBlocked', 'Response blocked by safety filter');
        }

        if (!text) {
          throw new GeminiAnalysisError('emptyResponse');
        }

        const raw = normalizedJSONData(text);
        if (raw === null) {
          console.error('[analyze-meal] invalid JSON', {
            finishReason,
            textPreview: text.slice(0, 500),
            textLength: text.length,
          });
          throw new GeminiAnalysisError(
            'invalidJSON',
            'Could not extract JSON from model response',
          );
        }

        const parsed = safeParseMealAnalysisResponse(raw);
        if (!parsed.success) {
          console.error('[analyze-meal] validation failed', parsed.error.flatten());
          throw new GeminiAnalysisError('validationFailed', parsed.error.message);
        }

        return parsed.data;
      },
      {
        label: 'analyzeMeal',
        deadline,
        shouldRetry: isRetryableAnalysisError,
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
