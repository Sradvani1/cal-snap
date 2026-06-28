import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from '@/lib/auth/session-edge';

const AUTH_PATHS = ['/login', '/signup'];
const ONBOARDING_PATH = '/onboarding';

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!session) {
    return false;
  }
  const payload = await verifySessionCookieValue(session);
  return payload !== null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionValid = await hasValidSession(request);

  if (pathname === '/') {
    if (!sessionValid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (AUTH_PATHS.includes(pathname)) {
    if (sessionValid) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === ONBOARDING_PATH || pathname.startsWith('/dashboard')) {
    if (!sessionValid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/onboarding', '/dashboard', '/dashboard/:path*'],
};
