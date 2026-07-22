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
  return new GoogleGenAI({ apiKey });
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function isRetryableAnalysisError(error: unknown): boolean {
  if (error instanceof GeminiAnalysisError) {
    if (error.code === 'emptyResponse' || error.code === 'invalidJSON' || error.code === 'safetyBlocked') {
      return true;
    }
    if (error.code === 'requestFailed') {
      const msg = error.message.toLowerCase();
      if (msg.includes('api key') || msg.includes('api_key') || msg.includes('unauthenticated')) {
        return false;
      }
    }
    return false;
  }
  return true;
}

export async function analyzeMealImage(
  input: AnalyzeMealImageInput,
): Promise<MealAnalysisResponse> {
  const client = getGeminiClient();
  const prompt = buildMealAnalysisPrompt({
    hasImage: Boolean(input.imageBytes),
    description: input.description,
  });

  return withRetry(
    async () => {
      let text: string;
      let finishReason: string | undefined;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: prompt },
      ];

      if (input.imageBytes) {
        parts.push({
          inlineData: {
            mimeType: input.mimeType ?? 'image/jpeg',
            data: input.imageBytes.toString('base64'),
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
        throw new GeminiAnalysisError('requestFailed', message);
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
        throw new GeminiAnalysisError('invalidJSON', 'Could not extract JSON from model response');
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
      shouldRetry: isRetryableAnalysisError,
    },
  );
}
