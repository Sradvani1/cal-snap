import { GoogleGenAI } from '@google/genai';
import { AppConstants } from '@/lib/constants';
import { buildMealAnalysisPrompt } from '@/lib/gemini/meal-analysis-prompt';
import { mealAnalysisJsonSchema } from '@/lib/gemini/meal-analysis-schema';
import { normalizedJSONData } from '@/lib/gemini/meal-analysis-parser';
import {
  safeParseMealAnalysisResponse,
} from '@/lib/gemini/meal-analysis-zod';
import type { MealAnalysisResponse } from '@/lib/gemini/meal-analysis-types';

export type GeminiAnalysisErrorCode =
  | 'emptyResponse'
  | 'invalidJSON'
  | 'validationFailed'
  | 'requestFailed';

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
  imageBytes: Buffer;
  mimeType: string;
  description?: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiAnalysisError('requestFailed', 'GEMINI_API_KEY missing');
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeMealImage(
  input: AnalyzeMealImageInput,
): Promise<MealAnalysisResponse> {
  const client = getGeminiClient();
  const prompt = buildMealAnalysisPrompt(input.description);

  let text: string;
  let finishReason: string | undefined;
  try {
    const response = await client.models.generateContent({
      model: AppConstants.Gemini.model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBytes.toString('base64'),
              },
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: AppConstants.Gemini.maxTokens,
        responseMimeType: 'application/json',
        // Match iOS GeminiRESTClient — pass OpenAPI JSON Schema verbatim.
        responseJsonSchema: mealAnalysisJsonSchema(),
      },
    });

    text = response.text?.trim() ?? '';
    finishReason = response.candidates?.[0]?.finishReason;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini request failed';
    throw new GeminiAnalysisError('requestFailed', message);
  }

  if (!text) {
    throw new GeminiAnalysisError('emptyResponse');
  }

  const raw = normalizedJSONData(text);
  if (raw === null) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[analyze-meal] invalid JSON', {
        finishReason,
        textPreview: text.slice(0, 500),
        textLength: text.length,
      });
    }
    throw new GeminiAnalysisError('invalidJSON', 'Could not extract JSON from model response');
  }

  const parsed = safeParseMealAnalysisResponse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[analyze-meal] validation failed', parsed.error.flatten());
    }
    throw new GeminiAnalysisError('validationFailed', parsed.error.message);
  }

  return parsed.data;
}
