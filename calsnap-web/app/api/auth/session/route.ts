import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-edge';
import { getAdminAuth } from '@/lib/firebase/admin';
import { shouldUseFirebaseEmulator } from '@/lib/firebase/emulator';

const SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

function isAuthEmulator(): boolean {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) || shouldUseFirebaseEmulator();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    await adminAuth.verifyIdToken(idToken);

    const cookieValue = isAuthEmulator()
      ? idToken
      : await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRY_MS });

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_MS / 1000,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session creation failed';
    const status = message.includes('Missing') || message.includes('credential') ? 503 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
