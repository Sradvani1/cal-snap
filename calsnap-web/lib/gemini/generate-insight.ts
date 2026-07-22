import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel } from '@google/genai';
import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';
import { AppConstants } from '@/lib/constants';
import { buildAnalyticsInsightPrompt, ANALYTICS_INSIGHT_SYSTEM_INSTRUCTION } from '@/lib/gemini/analytics-insight-prompt';
import { withRetry } from '@/lib/gemini/retry';

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

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function isRetryableInsightError(error: unknown): boolean {
  if (error instanceof GeminiInsightError) {
    if (error.code === 'emptyResponse') {
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

export async function generateAnalyticsInsight(
  payload: AnalyticsInsightPayload,
): Promise<string> {
  const client = getGeminiClient();
  const prompt = buildAnalyticsInsightPrompt(payload);

  return withRetry(
    async () => {
      let text: string;
      try {
        const response = await client.models.generateContent({
          model: AppConstants.Gemini.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: ANALYTICS_INSIGHT_SYSTEM_INSTRUCTION,
            maxOutputTokens: AppConstants.Gemini.maxTokens,
            safetySettings: SAFETY_SETTINGS,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
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
    },
    {
      label: 'generateInsight',
      shouldRetry: isRetryableInsightError,
    },
  );
}
