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

  const adminAuth = getAdminAuth();

  try {
    const decoded = await adminAuth.verifySessionCookie(token, true);
    if (!decoded.uid) {
      return null;
    }
    return { uid: decoded.uid };
  } catch {
    // Emulator stores raw ID tokens; legacy pre-migration cookies may still hold ID tokens (~1h).
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (!decoded.uid) {
        return null;
      }
      return { uid: decoded.uid };
    } catch {
      return null;
    }
  }
}
