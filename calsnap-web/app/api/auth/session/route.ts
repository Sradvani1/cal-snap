import { NextResponse, type NextRequest } from 'next/server';
import { ApiErrorCode } from '@/lib/api/error-codes';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-edge';
import { copy, type CopyKey } from '@/lib/copy';
import { getAdminAuth } from '@/lib/firebase/admin';
import { shouldUseFirebaseEmulator } from '@/lib/firebase/emulator';

const SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

function isAuthEmulator(): boolean {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) || shouldUseFirebaseEmulator();
}

function apiError(copyKey: CopyKey, code: (typeof ApiErrorCode)[keyof typeof ApiErrorCode], status: number) {
  return NextResponse.json({ error: copy(copyKey), code }, { status });
}

function isAuthServiceUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('credential') ||
    message.includes('could not load the default credentials') ||
    message.includes('enoent') ||
    message.includes('econnrefused')
  );
}

function mapSessionError(error: unknown): {
  copyKey: CopyKey;
  code: (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
  status: number;
} {
  if (isAuthServiceUnavailable(error)) {
    return {
      copyKey: 'api.session.unavailable',
      code: ApiErrorCode.AuthUnavailable,
      status: 503,
    };
  }
  return {
    copyKey: 'api.session.creationFailed',
    code: ApiErrorCode.SessionCreationFailed,
    status: 401,
  };
}

export async function POST(request: NextRequest) {
  let body: { idToken?: string };
  try {
    body = (await request.json()) as { idToken?: string };
  } catch {
    return apiError('api.session.invalidJson', ApiErrorCode.InvalidJsonBody, 400);
  }

  const idToken = body.idToken;
  if (!idToken) {
    return apiError('api.session.missingIdToken', ApiErrorCode.MissingIdToken, 400);
  }

  try {
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
    const { copyKey, code, status } = mapSessionError(error);
    return apiError(copyKey, code, status);
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
