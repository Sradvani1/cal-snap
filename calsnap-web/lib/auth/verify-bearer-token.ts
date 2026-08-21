import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export interface VerifiedBearerToken {
  uid: string;
  internalAnalytics?: true;
}

export async function verifyBearerToken(
  request: NextRequest,
): Promise<VerifiedBearerToken | null> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    if (!decoded.uid) {
      return null;
    }
    return {
      uid: decoded.uid,
      ...(decoded.internalAnalytics === true ? { internalAnalytics: true as const } : {}),
    };
  } catch {
    return null;
  }
}

export async function verifyInternalAnalyticsToken(
  request: NextRequest,
): Promise<VerifiedBearerToken | null> {
  const session = await verifyBearerToken(request);
  return session?.internalAnalytics ? session : null;
}
