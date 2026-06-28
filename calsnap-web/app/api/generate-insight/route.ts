import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/verify-api-session';
import {
  generateAnalyticsInsight,
  GeminiInsightError,
} from '@/lib/gemini/generate-insight';
import { parseAnalyticsInsightPayload } from '@/lib/gemini/analytics-insight-zod';

export async function POST(request: NextRequest) {
  const session = await verifyApiSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json({ error: 'Insight unavailable' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseAnalyticsInsightPayload(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (parsed.data.loggedDayCount < 3) {
    return NextResponse.json({ error: 'Insufficient logged days' }, { status: 400 });
  }

  try {
    const insight = await generateAnalyticsInsight(parsed.data);
    return NextResponse.json({ insight });
  } catch (error) {
    if (error instanceof GeminiInsightError) {
      if (error.code === 'emptyResponse') {
        return NextResponse.json({ error: 'Empty insight response' }, { status: 502 });
      }
      return NextResponse.json({ error: 'Insight generation failed' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Insight generation failed' }, { status: 502 });
  }
}
