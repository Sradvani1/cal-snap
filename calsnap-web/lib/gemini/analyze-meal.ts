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
        responseSchema: mealAnalysisJsonSchema(),
      },
    });

    text = response.text?.trim() ?? '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini request failed';
    throw new GeminiAnalysisError('requestFailed', message);
  }

  if (!text) {
    throw new GeminiAnalysisError('emptyResponse');
  }

  const raw = normalizedJSONData(text);
  if (raw === null) {
    throw new GeminiAnalysisError('invalidJSON', 'Could not extract JSON from model response');
  }

  const parsed = safeParseMealAnalysisResponse(raw);
  if (!parsed.success) {
    throw new GeminiAnalysisError('validationFailed', parsed.error.message);
  }

  return parsed.data;
}
