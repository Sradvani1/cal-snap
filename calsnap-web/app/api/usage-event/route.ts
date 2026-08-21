import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerToken } from '@/lib/auth/verify-bearer-token';
import { copy } from '@/lib/copy';
import { isUsageEventName } from '@/lib/usage/events';
import { recordUsageEvent } from '@/lib/usage/server';

export const runtime = 'nodejs';
const MAX_REQUEST_BYTES = 256;

function isEventBody(value: unknown): value is { event?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readEventBody(request: NextRequest): Promise<{ event?: unknown } | null> {
  if (!request.body) {
    return null;
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }

    const body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
    return isEventBody(body) ? body : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyBearerToken(request);
  if (!session) {
    return NextResponse.json({ error: copy('api.error.unauthorized') }, { status: 401 });
  }

  const body = await readEventBody(request);
  if (!body) {
    return NextResponse.json({ error: copy('api.usage.invalidRequest') }, { status: 400 });
  }

  if (!isUsageEventName(body.event)) {
    return NextResponse.json({ error: copy('api.usage.invalidEvent') }, { status: 400 });
  }

  try {
    await recordUsageEvent(session.uid, body.event);
    return new NextResponse(null, { status: 204 });
  } catch {
    console.error('[usage-event] record failed');
    return NextResponse.json({ error: copy('api.usage.unavailable') }, { status: 503 });
  }
}
