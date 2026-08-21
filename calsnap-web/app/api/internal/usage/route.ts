import { NextRequest, NextResponse } from 'next/server';
import { verifyInternalAnalyticsToken } from '@/lib/auth/verify-bearer-token';
import { copy } from '@/lib/copy';
import { getUsageSummary } from '@/lib/usage/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await verifyInternalAnalyticsToken(request);
  if (!session) {
    return NextResponse.json({ error: copy('api.usage.forbidden') }, { status: 403 });
  }

  try {
    return NextResponse.json(await getUsageSummary());
  } catch {
    return NextResponse.json({ error: copy('api.usage.dataUnavailable') }, { status: 503 });
  }
}
