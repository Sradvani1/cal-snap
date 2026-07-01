import { NextRequest, NextResponse } from 'next/server';
import { ApiErrorCode } from '@/lib/api/error-codes';
import { verifyBearerToken } from '@/lib/auth/verify-bearer-token';
import { copy, type CopyKey } from '@/lib/copy';
import {
  generateAnalyticsInsight,
  GeminiInsightError,
} from '@/lib/gemini/generate-insight';
import { parseAnalyticsInsightPayload } from '@/lib/gemini/analytics-insight-zod';

function apiError(copyKey: CopyKey, code: (typeof ApiErrorCode)[keyof typeof ApiErrorCode], status: number) {
  return NextResponse.json({ error: copy(copyKey), code }, { status });
}

export async function POST(request: NextRequest) {
  const session = await verifyBearerToken(request);
  if (!session) {
    return apiError('api.error.unauthorized', ApiErrorCode.Unauthorized, 401);
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return apiError('api.insight.unavailable', ApiErrorCode.InsightUnavailable, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('api.insight.invalidJson', ApiErrorCode.InvalidJsonBody, 400);
  }

  const parsed = parseAnalyticsInsightPayload(body);
  if (!parsed.success) {
    return apiError('api.insight.invalidPayload', ApiErrorCode.InvalidPayload, 400);
  }

  if (parsed.data.loggedDayCount < 3) {
    return apiError('api.insight.insufficientDays', ApiErrorCode.InsufficientLoggedDays, 400);
  }

  try {
    const insight = await generateAnalyticsInsight(parsed.data);
    return NextResponse.json({ insight });
  } catch (error) {
    if (error instanceof GeminiInsightError) {
      if (error.code === 'emptyResponse') {
        return apiError('api.insight.emptyResponse', ApiErrorCode.EmptyInsightResponse, 502);
      }
      return apiError('api.insight.failed', ApiErrorCode.InsightGenerationFailed, 502);
    }
    return apiError('api.insight.failed', ApiErrorCode.InsightGenerationFailed, 502);
  }
}
