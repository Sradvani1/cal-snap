import { GoogleGenAI } from '@google/genai';
import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';
import { AppConstants } from '@/lib/constants';
import { buildAnalyticsInsightPrompt } from '@/lib/gemini/analytics-insight-prompt';

export type GeminiInsightErrorCode = 'emptyResponse' | 'requestFailed';

export class GeminiInsightError extends Error {
  constructor(
    public readonly code: GeminiInsightErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'GeminiInsightError';
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiInsightError('requestFailed', 'GEMINI_API_KEY missing');
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateAnalyticsInsight(
  payload: AnalyticsInsightPayload,
): Promise<string> {
  const client = getGeminiClient();
  const prompt = buildAnalyticsInsightPrompt(payload);

  let text: string;
  try {
    const response = await client.models.generateContent({
      model: AppConstants.Gemini.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: AppConstants.Gemini.maxTokens,
      },
    });

    text = response.text?.trim() ?? '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini request failed';
    throw new GeminiInsightError('requestFailed', message);
  }

  if (!text) {
    throw new GeminiInsightError('emptyResponse');
  }

  return text;
}
