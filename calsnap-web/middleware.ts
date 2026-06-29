import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from '@/lib/auth/session-edge';

const AUTH_PATHS = ['/login', '/signup'];
const PUBLIC_PATHS = ['/privacy'];
const ONBOARDING_PATH = '/onboarding';
const APP_PATHS = ['/dashboard', '/log', '/scan', '/progress', '/analytics', '/settings'];

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

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname === ONBOARDING_PATH || APP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (!sessionValid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/onboarding',
    '/dashboard',
    '/dashboard/:path*',
    '/log',
    '/log/:path*',
    '/scan',
    '/scan/:path*',
    '/progress',
    '/progress/:path*',
    '/analytics',
    '/analytics/:path*',
    '/settings',
    '/settings/:path*',
    '/privacy',
  ],
};
