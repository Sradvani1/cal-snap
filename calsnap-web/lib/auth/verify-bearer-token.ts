import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export interface VerifiedBearerToken {
  uid: string;
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
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
