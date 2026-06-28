import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-edge';
import { getAdminAuth } from '@/lib/firebase/admin';

export interface VerifiedApiSession {
  uid: string;
}

export async function verifyApiSession(
  request: NextRequest,
): Promise<VerifiedApiSession | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (!decoded.uid) {
      return null;
    }
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
